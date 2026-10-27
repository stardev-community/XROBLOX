'use strict';
/*
 * luavm.js - interpreter Lua 5.1 mini (tree-walking, berbasis generator supaya
 * task.wait / coroutine bisa yield). HANYA untuk pengujian di Node; tidak dipakai di web.
 */

/* ------------------------------------------------------------------ nilai */
class LuaError extends Error { constructor(value, tb) { super(typeof value === 'string' ? value : 'lua error'); this.value = value; this.tb = tb; } }
let _id = 0;
class LuaTable {
  constructor() { this.map = new Map(); this.meta = undefined; this.n = 0; this.id = ++_id; }
  static key(k) { return (typeof k === 'number' && k === Math.floor(k) && !Object.is(k, -0)) ? k : k; }
  get(k) { return this.map.get(k); }
  set(k, v) {
    if (v === undefined) this.map.delete(k); else this.map.set(k, v);
  }
  length() {
    let n = this.n;
    while (this.map.has(n + 1)) n++;
    while (n > 0 && !this.map.has(n)) n--;
    this.n = n;
    return n;
  }
}
class LuaFunc { constructor(node, scope, name) { this.node = node; this.scope = scope; this.name = name; this.id = ++_id; } }
class Native { constructor(name, fn, gen) { this.name = name; this.fn = fn; this.gen = !!gen; this.id = ++_id; } }
class Scope {
  constructor(parent, fr) { this.vars = new Map(); this.parent = parent; this.fr = fr || (parent && parent.fr); }
  find(name) { let s = this; while (s) { if (s.vars.has(name)) return s; s = s.parent; } return null; }
}
const BREAK = { brk: true };

function type(v) {
  if (v === undefined || v === null) return 'nil';
  switch (typeof v) { case 'boolean': return 'boolean'; case 'number': return 'number'; case 'string': return 'string'; }
  if (v instanceof LuaTable) return 'table';
  if (v instanceof LuaFunc || v instanceof Native) return 'function';
  if (v instanceof Thread) return 'thread';
  return 'userdata';
}
function fmtNum(n) {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n === 0 ? 0 : n);
  if (n === Infinity) return 'inf'; if (n === -Infinity) return '-inf'; if (Number.isNaN(n)) return 'nan';
  let s = Number(n.toPrecision(14)).toString();
  if (/e/.test(s)) s = s.replace(/e\+?(-?)(\d)$/, 'e$10$2').replace('e+', 'e+');
  return s;
}
function tonum(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return Number(s);
    if (/^[-+]?0[xX][0-9a-fA-F]+$/.test(s)) return Number(s);
  }
  return undefined;
}

/* ------------------------------------------------------------------ lexer */
const KW = new Set('and break do else elseif end false for function if in local nil not or repeat return then true until while'.split(' '));
function lex(src, chunk) {
  const toks = []; let i = 0, line = 1; const n = src.length;
  const err = (m) => { throw new LuaError(`${chunk}:${line}: ${m}`); };
  const long = (at) => { let j = at + 1, l = 0; while (src[j] === '=') { l++; j++; } return src[j] === '[' ? { l, s: j + 1 } : null; };
  const readLong = (lb) => {
    const close = ']' + '='.repeat(lb.l) + ']'; const e = src.indexOf(close, lb.s); if (e < 0) err('unfinished long string');
    let body = src.slice(lb.s, e); for (const c of body) if (c === '\n') line++;
    i = e + close.length; if (body[0] === '\n') body = body.slice(1); else if (body.startsWith('\r\n')) body = body.slice(2); return body;
  };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '-' && src[i + 1] === '-') {
      i += 2;
      if (src[i] === '[') { const lb = long(i); if (lb) { readLong(lb); continue; } }
      while (i < n && src[i] !== '\n') i++; continue;
    }
    if (/[A-Za-z_]/.test(c)) { let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++; const w = src.slice(i, j); toks.push({ t: KW.has(w) ? 'kw' : 'name', v: w, line }); i = j; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?)/.exec(src.slice(i)); i += m[0].length; toks.push({ t: 'num', v: Number(m[0]), line }); continue;
    }
    if (c === '"' || c === "'") {
      let s = ''; i++;
      for (;;) {
        if (i >= n || src[i] === '\n') err('unfinished string');
        const d = src[i];
        if (d === '\\') {
          const e = src[i + 1]; i += 2;
          const map = { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', f: '\f', v: '\v', '\\': '\\', '"': '"', "'": "'", '\n': '\n' };
          if (e === 'x') { s += String.fromCharCode(parseInt(src.substr(i, 2), 16)); i += 2; }
          else if (e === 'z') { while (/\s/.test(src[i] || '')) { if (src[i] === '\n') line++; i++; } }
          else if (e === 'u') { const cl = src.indexOf('}', i); s += String.fromCodePoint(parseInt(src.slice(i + 1, cl), 16)); i = cl + 1; }
          else if (/[0-9]/.test(e)) { let ds = e; while (ds.length < 3 && /[0-9]/.test(src[i] || '')) { ds += src[i]; i++; } s += String.fromCharCode(parseInt(ds, 10)); }
          else if (e in map) { s += map[e]; if (e === '\n') line++; }
          else err('invalid escape');
        } else if (d === c) { i++; break; } else { s += d; i++; }
      }
      toks.push({ t: 'str', v: s, line }); continue;
    }
    if (c === '[') { const lb = long(i); if (lb) { const startLine = line; const s = readLong(lb); toks.push({ t: 'str', v: s, line: startLine }); continue; } }
    const three = src.substr(i, 3), two = src.substr(i, 2);
    if (three === '...') { toks.push({ t: 'op', v: '...', line }); i += 3; continue; }
    if (three === '..=') { toks.push({ t: 'op', v: '..=', line }); i += 3; continue; }
    if (['==', '~=', '<=', '>=', '..', '+=', '-=', '*=', '/=', '%=', '^=', '::'].includes(two)) { toks.push({ t: 'op', v: two, line }); i += 2; continue; }
    if ('+-*/%^#<>=(){}[];:,.'.includes(c)) { toks.push({ t: 'op', v: c, line }); i++; continue; }
    err(`unexpected symbol '${c}'`);
  }
  toks.push({ t: 'eof', v: '<eof>', line });
  return toks;
}

/* ------------------------------------------------------------------ parser -> AST */
function parse(src, chunk) {
  const toks = lex(src, chunk); let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const err = (m, t) => { t = t || peek(); throw new LuaError(`${chunk}:${t.line}: ${m} near '${t.v}'`); };
  const isOp = (v) => peek().t === 'op' && peek().v === v;
  const isKw = (v) => peek().t === 'kw' && peek().v === v;
  const accOp = (v) => isOp(v) ? (p++, true) : false;
  const accKw = (v) => isKw(v) ? (p++, true) : false;
  const expOp = (v) => { if (!accOp(v)) err(`'${v}' expected`); };
  const expKw = (v) => { if (!accKw(v)) err(`'${v}' expected`); };
  const name = () => { if (peek().t !== 'name') err('<name> expected'); return next().v; };
  const blockEnd = () => { const t = peek(); return t.t === 'eof' || (t.t === 'kw' && ['end', 'else', 'elseif', 'until'].includes(t.v)); };

  function block() {
    const stmts = [];
    while (!blockEnd()) {
      if (isKw('return')) {
        const line = next().line; let exprs = [];
        if (!blockEnd() && !isOp(';')) exprs = exprList();
        accOp(';'); stmts.push({ type: 'Return', exprs, line }); break;
      }
      const s = stat(); if (s) stmts.push(s);
    }
    return stmts;
  }
  function stat() {
    const t = peek(), line = t.line;
    if (t.t === 'op' && t.v === ';') { p++; return null; }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'do': { p++; const b = block(); expKw('end'); return { type: 'Do', body: b, line }; }
        case 'while': { p++; const cond = expr(); expKw('do'); const b = block(); expKw('end'); return { type: 'While', cond, body: b, line }; }
        case 'repeat': { p++; const b = block(); expKw('until'); const cond = expr(); return { type: 'Repeat', body: b, cond, line }; }
        case 'if': {
          p++; const clauses = []; const cond = expr(); expKw('then'); clauses.push({ cond, body: block() }); let els = null;
          for (;;) {
            if (accKw('elseif')) { const c2 = expr(); expKw('then'); clauses.push({ cond: c2, body: block() }); }
            else if (accKw('else')) { els = block(); expKw('end'); break; } else { expKw('end'); break; }
          }
          return { type: 'If', clauses, els, line };
        }
        case 'for': {
          p++; const n1 = name();
          if (accOp('=')) { const a = expr(); expOp(','); const b = expr(); const c = accOp(',') ? expr() : null; expKw('do'); const body = block(); expKw('end'); return { type: 'NumFor', v: n1, a, b, c, body, line }; }
          const names = [n1]; while (accOp(',')) names.push(name()); expKw('in'); const exprs = exprList(); expKw('do'); const body = block(); expKw('end');
          return { type: 'GenFor', names, exprs, body, line };
        }
        case 'function': {
          p++; let target = { type: 'Name', name: name(), line }; let fname = target.name; let isMethod = false;
          while (isOp('.') || isOp(':')) { const colon = next().v === ':'; const k = name(); fname += (colon ? ':' : '.') + k; target = { type: 'Index', obj: target, key: { type: 'String', value: k }, line }; if (colon) { isMethod = true; break; } }
          const f = funcBody(isMethod, line, fname); return { type: 'Assign', targets: [target], exprs: [f], line };
        }
        case 'local': {
          p++;
          if (accKw('function')) { const nm = name(); const f = funcBody(false, line, nm); return { type: 'LocalFunction', name: nm, func: f, line }; }
          const names = [name()]; while (accOp(',')) names.push(name());
          let exprs = []; if (accOp('=')) exprs = exprList();
          return { type: 'Local', names, exprs, line };
        }
        case 'break': p++; return { type: 'Break', line };
        case 'return': err('unexpected return');
      }
    }
    const e = suffixed();
    const tk = peek();
    if (tk.t === 'op' && (tk.v === '=' || tk.v === ',')) {
      const targets = [e]; while (accOp(',')) targets.push(suffixed()); expOp('='); const exprs = exprList();
      for (const tg of targets) if (tg.type !== 'Name' && tg.type !== 'Index') err('cannot assign');
      return { type: 'Assign', targets, exprs, line };
    }
    if (tk.t === 'op' && ['+=', '-=', '*=', '/=', '%=', '^=', '..='].includes(tk.v)) {
      p++; const rhs = expr(); const op = tk.v.slice(0, -1);
      return { type: 'Assign', targets: [e], exprs: [{ type: 'Binop', op, l: e, r: rhs, line }], line };
    }
    if (e.type !== 'Call' && e.type !== 'MethodCall') err('syntax error');
    return { type: 'CallStat', call: e, line };
  }
  function funcBody(isMethod, line, fname) {
    expOp('('); const params = isMethod ? ['self'] : []; let vararg = false;
    if (!isOp(')')) { do { if (accOp('...')) { vararg = true; break; } params.push(name()); } while (accOp(',')); }
    expOp(')'); const body = block(); expKw('end');
    return { type: 'Function', params, vararg, body, line, name: fname };
  }
  function exprList() { const l = [expr()]; while (accOp(',')) l.push(expr()); return l; }
  function primary() {
    const t = peek();
    if (t.t === 'name') { p++; return { type: 'Name', name: t.v, line: t.line }; }
    if (t.t === 'op' && t.v === '(') { p++; const e = expr(); expOp(')'); return { type: 'Paren', e, line: t.line }; }
    err('unexpected symbol');
  }
  function suffixed() {
    let e = primary();
    for (;;) {
      const t = peek();
      if (t.t === 'op' && t.v === '.') { p++; e = { type: 'Index', obj: e, key: { type: 'String', value: name() }, line: t.line }; }
      else if (t.t === 'op' && t.v === '[') { p++; const k = expr(); expOp(']'); e = { type: 'Index', obj: e, key: k, line: t.line }; }
      else if (t.t === 'op' && t.v === ':') { p++; const m = name(); const args = callArgs(); e = { type: 'MethodCall', obj: e, method: m, args, line: t.line }; }
      else if ((t.t === 'op' && (t.v === '(' || t.v === '{')) || t.t === 'str') { e = { type: 'Call', fn: e, args: callArgs(), line: t.line }; }
      else return e;
    }
  }
  function callArgs() {
    const t = peek();
    if (t.t === 'str') { p++; return [{ type: 'String', value: t.v }]; }
    if (t.t === 'op' && t.v === '{') return [tableCons()];
    expOp('('); let args = []; if (!isOp(')')) args = exprList(); expOp(')'); return args;
  }
  function tableCons() {
    const line = peek().line; expOp('{'); const arr = [], hash = [], order = [];
    while (!isOp('}')) {
      if (isOp('[')) { p++; const k = expr(); expOp(']'); expOp('='); order.push({ k, v: expr() }); }
      else if (peek().t === 'name' && toks[p + 1].t === 'op' && toks[p + 1].v === '=') { const k = next().v; p++; order.push({ k: { type: 'String', value: k }, v: expr() }); }
      else order.push({ pos: true, v: expr() });
      if (!accOp(',') && !accOp(';')) break;
    }
    expOp('}'); return { type: 'Table', items: order, line };
  }
  function simple() {
    const t = peek();
    if (t.t === 'num') { p++; return { type: 'Number', value: t.v }; }
    if (t.t === 'str') { p++; return { type: 'String', value: t.v }; }
    if (t.t === 'kw') {
      if (t.v === 'nil') { p++; return { type: 'Nil' }; } if (t.v === 'true') { p++; return { type: 'True' }; } if (t.v === 'false') { p++; return { type: 'False' }; }
      if (t.v === 'function') { p++; return funcBody(false, t.line, '?'); }
    }
    if (t.t === 'op' && t.v === '...') { p++; return { type: 'Vararg' }; }
    if (t.t === 'op' && t.v === '{') return tableCons();
    return suffixed();
  }
  const PRI = { or: [1, 1], and: [2, 2], '<': [3, 3], '>': [3, 3], '<=': [3, 3], '>=': [3, 3], '~=': [3, 3], '==': [3, 3], '..': [5, 4], '+': [6, 6], '-': [6, 6], '*': [7, 7], '/': [7, 7], '%': [7, 7], '^': [10, 9] };
  function expr(limit) {
    limit = limit || 0; let l; const t = peek();
    if ((t.t === 'kw' && t.v === 'not') || (t.t === 'op' && (t.v === '-' || t.v === '#'))) { p++; l = { type: 'Unop', op: t.v, e: expr(8), line: t.line }; }
    else l = simple();
    for (;;) {
      const o = peek(); const key = (o.t === 'op' || (o.t === 'kw' && (o.v === 'and' || o.v === 'or'))) ? o.v : null; const pr = key && PRI[key];
      if (!pr || pr[0] <= limit) break; p++; const r = expr(pr[1]); l = { type: 'Binop', op: key, l, r, line: o.line };
    }
    return l;
  }
  const body = block(); if (peek().t !== 'eof') err("'<eof>' expected");
  return { type: 'Function', params: [], vararg: true, body, line: 0, name: 'main chunk' };
}

/* ------------------------------------------------------------------ threads */
class Thread { constructor(gen, name) { this.gen = gen; this.status = 'suspended'; this.name = name; this.id = ++_id; this.wake = null; this.waitingSignal = null; } }

/* ------------------------------------------------------------------ VM */
class VM {
  constructor() {
    this.G = new LuaTable(); this.chunk = '?'; this.now = 0; this.seq = 0; this.timers = []; this.out = []; this.errors = [];
    this.stringMeta = new LuaTable(); this.current = null; this.runQueue = [];
    this._stdlib();
  }
  /* ---------- helpers ---------- */
  rt(msg, line) { return new LuaError(`${this.chunk}:${line || '?'}: ${msg}`); }
  tostr(v) {
    if (v === undefined || v === null) return 'nil';
    switch (typeof v) { case 'boolean': return v ? 'true' : 'false'; case 'number': return fmtNum(v); case 'string': return v; }
    if (v instanceof LuaTable) {
      const mm = v.meta && v.meta.get('__tostring'); if (mm !== undefined) { const r = this.callSync(mm, [v]); return String(r[0]); }
      return 'table: 0x' + v.id.toString(16).padStart(8, '0');
    }
    if (v instanceof LuaFunc || v instanceof Native) return 'function: 0x' + v.id.toString(16).padStart(8, '0');
    if (v instanceof Thread) return 'thread: 0x' + v.id.toString(16).padStart(8, '0');
    return String(v);
  }
  truthy(v) { return v !== undefined && v !== null && v !== false; }

  getmeta(v) { if (v instanceof LuaTable) return v.meta; if (typeof v === 'string') return this.stringMeta; return undefined; }
  *index(o, k, line, desc) {
    if (o instanceof LuaTable) {
      const v = o.get(k); if (v !== undefined) return v;
      if (!o.meta) return undefined;
      const h = o.meta.get('__index'); if (h === undefined) return undefined;
      if (h instanceof LuaFunc || h instanceof Native) { const r = yield* this.call(h, [o, k]); return r[0]; }
      return yield* this.index(h, k, line);
    }
    if (typeof o === 'string') { const h = this.stringMeta.get('__index'); return yield* this.index(h, k, line); }
    throw this.rt(`attempt to index a ${type(o)} value${desc ? ' (' + desc + ')' : ''}`, line);
  }
  *setindex(o, k, v, line, desc) {
    if (o instanceof LuaTable) {
      if (o.meta) {
        const h = o.meta.get('__newindex');
        if (h !== undefined && o.get(k) === undefined) {
          if (h instanceof LuaFunc || h instanceof Native) { yield* this.call(h, [o, k, v]); return; }
          yield* this.setindex(h, k, v, line); return;
        }
      }
      if (k === undefined) throw this.rt('table index is nil', line);
      if (typeof k === 'number' && Number.isNaN(k)) throw this.rt('table index is NaN', line);
      o.set(k, v); return;
    }
    throw this.rt(`attempt to index a ${type(o)} value${desc ? ' (' + desc + ')' : ''}`, line);
  }
  /* ---------- panggilan ---------- */
  *call(f, args, line, desc) {
    if (f instanceof LuaFunc) return yield* this.callLua(f, args);
    if (f instanceof Native) {
      const r = f.gen ? yield* f.fn(args) : f.fn(args);
      return r === undefined ? [] : Array.isArray(r) ? r : [r];
    }
    if (f instanceof LuaTable && f.meta && f.meta.get('__call') !== undefined) return yield* this.call(f.meta.get('__call'), [f, ...args]);
    throw this.rt(`attempt to call a ${type(f)} value${desc ? ' (' + desc + ')' : ''}`, line);
  }
  callSync(f, args) { // untuk __tostring dll (tidak boleh yield)
    const g = this.call(f, args); let r = g.next(); if (!r.done) throw new LuaError('attempt to yield across a metamethod boundary'); return r.value;
  }
  *callLua(f, args) {
    const node = f.node; const sc = new Scope(f.scope, { varargs: args.slice(node.params.length), fn: f });
    for (let i = 0; i < node.params.length; i++) sc.vars.set(node.params[i], args[i]);
    const sig = yield* this.execBlock(node.body, sc);
    if (sig && sig.ret) return sig.ret;
    return [];
  }
  /* ---------- statements ---------- */
  *execBlock(stmts, sc) {
    for (const s of stmts) { const r = yield* this.exec(s, sc); if (r) return r; }
    return undefined;
  }
  *exec(s, sc) {
    switch (s.type) {
      case 'Local': {
        const vals = yield* this.evalList(s.exprs, sc);
        s.names.forEach((n, i) => sc.vars.set(n, vals[i]));
        return;
      }
      case 'Assign': {
        if (s.targets.length === 1 && s.exprs.length === 1) {
          const t = s.targets[0]; const v = (yield* this.evalMulti(s.exprs[0], sc))[0];
          if (t.type === 'Name') { const f = sc.find(t.name); if (f) f.vars.set(t.name, v); else yield* this.setindex(this.G, t.name, v, s.line); }
          else { const o = yield* this.eval(t.obj, sc); const k = yield* this.eval(t.key, sc); yield* this.setindex(o, k, v, s.line, this.descOf(t.obj)); }
          return;
        }
        const vals = yield* this.evalList(s.exprs, sc); const refs = [];
        for (const t of s.targets) refs.push(t.type === 'Index' ? { o: yield* this.eval(t.obj, sc), k: yield* this.eval(t.key, sc), d: this.descOf(t.obj) } : null);
        for (let i = 0; i < s.targets.length; i++) {
          const t = s.targets[i], v = vals[i];
          if (t.type === 'Name') { const f = sc.find(t.name); if (f) f.vars.set(t.name, v); else this.G.set(t.name, v); } else yield* this.setindex(refs[i].o, refs[i].k, v, s.line, refs[i].d);
        }
        return;
      }
      case 'CallStat': yield* this.evalMulti(s.call, sc); return;
      case 'Do': return yield* this.execBlock(s.body, new Scope(sc));
      case 'While': {
        while (this.truthy(yield* this.eval(s.cond, sc))) { const r = yield* this.execBlock(s.body, new Scope(sc)); if (r) { if (r === BREAK) break; return r; } }
        return;
      }
      case 'Repeat': {
        for (;;) {
          const inner = new Scope(sc); const r = yield* this.execBlock(s.body, inner); if (r) { if (r === BREAK) break; return r; }
          if (this.truthy(yield* this.eval(s.cond, inner))) break;
        }
        return;
      }
      case 'If': {
        for (const c of s.clauses) if (this.truthy(yield* this.eval(c.cond, sc))) return yield* this.execBlock(c.body, new Scope(sc));
        if (s.els) return yield* this.execBlock(s.els, new Scope(sc));
        return;
      }
      case 'NumFor': {
        const a = tonum(yield* this.eval(s.a, sc)), b = tonum(yield* this.eval(s.b, sc)), c = s.c ? tonum(yield* this.eval(s.c, sc)) : 1;
        if (a === undefined || b === undefined || c === undefined) throw this.rt("'for' initial value must be a number", s.line);
        if (c === 0) throw this.rt("'for' step is zero", s.line);
        for (let i = a; c > 0 ? i <= b : i >= b; i += c) {
          const inner = new Scope(sc); inner.vars.set(s.v, i); const r = yield* this.execBlock(s.body, inner); if (r) { if (r === BREAK) break; return r; }
        }
        return;
      }
      case 'GenFor': {
        const vals = yield* this.evalList(s.exprs, sc); let [f, st, ctl] = vals;
        for (;;) {
          const rs = yield* this.call(f, [st, ctl], s.line, 'for iterator'); if (rs[0] === undefined) break; ctl = rs[0];
          const inner = new Scope(sc); s.names.forEach((n, i) => inner.vars.set(n, rs[i]));
          const r = yield* this.execBlock(s.body, inner); if (r) { if (r === BREAK) break; return r; }
        }
        return;
      }
      case 'LocalFunction': { sc.vars.set(s.name, undefined); const f = new LuaFunc(s.func, sc, s.name); sc.vars.set(s.name, f); return; }
      case 'Return': return { ret: yield* this.evalList(s.exprs, sc) };
      case 'Break': return BREAK;
    }
    throw new Error('stmt tidak dikenal ' + s.type);
  }
  descOf(n) {
    if (n.type === 'Name') return `${'local/global'} '${n.name}'`.replace('local/global', 'variable');
    if (n.type === 'Index' && n.key.type === 'String') return `field '${n.key.value}'`;
    if (n.type === 'MethodCall') return `method '${n.method}'`;
    return undefined;
  }
  /* ---------- expressions ---------- */
  *evalList(exprs, sc) {
    const out = [];
    for (let i = 0; i < exprs.length; i++) {
      if (i === exprs.length - 1) { const r = yield* this.evalMulti(exprs[i], sc); for (const x of r) out.push(x); }
      else out.push(yield* this.eval(exprs[i], sc));
    }
    return out;
  }
  *evalMulti(n, sc) {
    switch (n.type) {
      case 'Call': {
        const f = yield* this.eval(n.fn, sc); const args = yield* this.evalList(n.args, sc);
        return yield* this.call(f, args, n.line, this.descOf(n.fn));
      }
      case 'MethodCall': {
        const o = yield* this.eval(n.obj, sc); const f = yield* this.index(o, n.method, n.line, this.descOf(n.obj));
        const args = yield* this.evalList(n.args, sc);
        return yield* this.call(f, [o, ...args], n.line, `method '${n.method}'`);
      }
      case 'Vararg': return sc.fr.varargs.slice();
      default: return [yield* this.eval(n, sc)];
    }
  }
  arith(op, a, b, line) {
    const x = tonum(a), y = tonum(b);
    if (x === undefined || y === undefined) {
      for (const [v, o] of [[a, a], [b, b]]) {
        const mm = this.getmeta(v) && this.getmeta(v).get({ '+': '__add', '-': '__sub', '*': '__mul', '/': '__div', '%': '__mod', '^': '__pow' }[op]);
        if (mm !== undefined) return { mm };
      }
      throw this.rt(`attempt to perform arithmetic on a ${type(x === undefined ? a : b)} value`, line);
    }
    switch (op) {
      case '+': return { v: x + y }; case '-': return { v: x - y }; case '*': return { v: x * y }; case '/': return { v: x / y };
      case '%': return { v: y === 0 ? NaN : x - Math.floor(x / y) * y }; case '^': return { v: Math.pow(x, y) };
    }
  }
  *eval(n, sc) {
    switch (n.type) {
      case 'Nil': return undefined; case 'True': return true; case 'False': return false;
      case 'Number': return n.value; case 'String': return n.value;
      case 'Vararg': return sc.fr.varargs[0];
      case 'Function': return new LuaFunc(n, sc, n.name);
      case 'Name': { const f = sc.find(n.name); if (f) return f.vars.get(n.name); return this.G.get(n.name); }
      case 'Paren': return (yield* this.evalMulti(n.e, sc))[0];
      case 'Index': { const o = yield* this.eval(n.obj, sc); const k = yield* this.eval(n.key, sc); return yield* this.index(o, k, n.line, this.descOf(n.obj)); }
      case 'Call': case 'MethodCall': return (yield* this.evalMulti(n, sc))[0];
      case 'Table': {
        const t = new LuaTable(); let pos = 0; const items = n.items;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.pos) {
            if (i === items.length - 1) { const vs = yield* this.evalMulti(it.v, sc); for (const v of vs) t.set(++pos, v); }
            else { const v = yield* this.eval(it.v, sc); pos++; if (v !== undefined) t.set(pos, v); }
          } else { const k = yield* this.eval(it.k, sc); const v = yield* this.eval(it.v, sc); if (k === undefined) throw this.rt('table index is nil', n.line); t.set(k, v); }
        }
        return t;
      }
      case 'Unop': {
        const v = yield* this.eval(n.e, sc);
        if (n.op === 'not') return !this.truthy(v);
        if (n.op === '-') { const x = tonum(v); if (x === undefined) { const mm = this.getmeta(v) && this.getmeta(v).get('__unm'); if (mm) return (yield* this.call(mm, [v, v]))[0]; throw this.rt(`attempt to perform arithmetic on a ${type(v)} value`, n.line); } return -x; }
        if (n.op === '#') {
          if (typeof v === 'string') return v.length;
          if (v instanceof LuaTable) { const mm = v.meta && v.meta.get('__len'); if (mm) return (yield* this.call(mm, [v]))[0]; return v.length(); }
          throw this.rt(`attempt to get length of a ${type(v)} value`, n.line);
        }
        break;
      }
      case 'Binop': {
        const op = n.op;
        if (op === 'and') { const l = yield* this.eval(n.l, sc); return this.truthy(l) ? yield* this.eval(n.r, sc) : l; }
        if (op === 'or') { const l = yield* this.eval(n.l, sc); return this.truthy(l) ? l : yield* this.eval(n.r, sc); }
        const a = yield* this.eval(n.l, sc), b = yield* this.eval(n.r, sc);
        switch (op) {
          case '==': return yield* this.eq(a, b);
          case '~=': return !(yield* this.eq(a, b));
          case '<': case '<=': case '>': case '>=': return yield* this.compare(op, a, b, n.line);
          case '..': {
            if ((typeof a === 'string' || typeof a === 'number') && (typeof b === 'string' || typeof b === 'number')) return this.tostr(a) + this.tostr(b);
            const mm = (this.getmeta(a) && this.getmeta(a).get('__concat')) || (this.getmeta(b) && this.getmeta(b).get('__concat'));
            if (mm) return (yield* this.call(mm, [a, b]))[0];
            throw this.rt(`attempt to concatenate a ${type((typeof a === 'string' || typeof a === 'number') ? b : a)} value${n.l.type === 'Name' || n.r.type === 'Name' ? '' : ''}`, n.line);
          }
          default: {
            const r = this.arith(op, a, b, n.line);
            if (r.mm) return (yield* this.call(r.mm, [a, b]))[0];
            return r.v;
          }
        }
      }
    }
    throw new Error('expr tidak dikenal ' + n.type);
  }
  *eq(a, b) {
    if (a === b) return true;
    if (a instanceof LuaTable && b instanceof LuaTable) {
      const mm = (a.meta && a.meta.get('__eq')) || (b.meta && b.meta.get('__eq'));
      if (mm) return this.truthy((yield* this.call(mm, [a, b]))[0]);
    }
    return false;
  }
  *compare(op, a, b, line) {
    if (typeof a === 'number' && typeof b === 'number') return op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b;
    if (typeof a === 'string' && typeof b === 'string') return op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b;
    const key = op === '<' || op === '>' ? '__lt' : '__le';
    const mm = (this.getmeta(a) && this.getmeta(a).get(key)) || (this.getmeta(b) && this.getmeta(b).get(key));
    if (mm) { const r = this.truthy((yield* this.call(mm, op === '<' || op === '<=' ? [a, b] : [b, a]))[0]); return r; }
    throw this.rt(`attempt to compare ${type(a)} with ${type(b)}`, line);
  }

  /* ---------- API publik ---------- */
  load(src, chunk) { this.chunk = chunk || '?'; const ast = parse(src, chunk || '?'); const f = new LuaFunc(ast, new Scope(null, { varargs: [] }), 'main'); return f; }
  // jalankan fungsi sebagai thread; return Thread
  spawn(fn, args, name) {
    const th = new Thread(this.call(fn, args || []), name); th.status = 'suspended';
    this.resume(th, []); return th;
  }
  resume(th, sendVals) {
    if (th.status === 'dead') return;
    const prev = this.current; this.current = th; th.status = 'running';
    let r;
    try { r = th.gen.next(sendVals); }
    catch (e) {
      th.status = 'dead'; this.current = prev;
      const msg = e instanceof LuaError ? (typeof e.value === 'string' ? e.value : this.tostr(e.value)) : (e && e.stack) || String(e);
      th.error = msg; this.errors.push(msg); return;
    }
    this.current = prev;
    if (r.done) { th.status = 'dead'; th.result = r.value; return; }
    const y = r.value; th.status = 'suspended';
    if (y.kind === 'wait') { th.wake = this.now + Math.max(y.t, 0.001); this.timers.push({ at: th.wake, seq: ++this.seq, th }); }
    else if (y.kind === 'signal') { th.waitingSignal = y.sig; y.sig.waiters.push(th); }
  }
  advance(seconds) {
    const target = this.now + seconds;
    for (;;) {
      this.timers.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const t = this.timers[0];
      if (!t || t.at > target + 1e-9) break;
      this.timers.shift(); this.now = Math.max(this.now, t.at);
      if (t.fn) { try { t.fn(); } catch (e) { this.errors.push(String(e && e.stack || e)); } continue; }
      if (t.th.status === 'dead') continue;
      this.resume(t.th, [this.now - (t.th.startedAt || 0)]);
    }
    this.now = target;
  }
  schedule(afterSec, jsfn) { this.timers.push({ at: this.now + afterSec, seq: ++this.seq, fn: jsfn }); }
  fireSignal(sig, args) { // bangunkan semua waiter + panggil handler (sebagai thread baru)
    for (const h of sig.handlers.slice()) if (h.connected) this.spawn(h.fn, args, 'handler');
    const ws = sig.waiters.splice(0); for (const th of ws) this.resume(th, args);
    for (const o of sig.once.splice(0)) this.spawn(o, args, 'once');
  }
  def(name, fn, gen) { const n = new Native(name, fn, gen); return n; }
  lib(tbl, defs) { for (const k of Object.keys(defs)) tbl.set(k, defs[k] instanceof Native ? defs[k] : new Native(k, defs[k])); return tbl; }
  newTable(obj) { const t = new LuaTable(); if (Array.isArray(obj)) obj.forEach((v, i) => t.set(i + 1, v)); else if (obj) for (const k of Object.keys(obj)) t.set(k, obj[k]); return t; }

  /* ---------- stdlib ---------- */
  _stdlib() {
    const vm = this, G = this.G; const N = (name, fn, gen) => new Native(name, fn, gen);
    const argErr = (i, fname, msg) => new LuaError(`bad argument #${i} to '${fname}' (${msg})`);
    G.set('_G', G); G.set('_VERSION', 'Lua 5.1');
    G.set('print', N('print', (a) => { vm.out.push(a.map(x => vm.tostr(x)).join('\t')); }));
    G.set('warn', N('warn', (a) => { vm.out.push('[warn] ' + a.map(x => vm.tostr(x)).join(' ')); }));
    G.set('type', N('type', (a) => { if (a.length === 0) throw argErr(1, 'type', 'value expected'); return type(a[0]); }));
    G.set('tostring', N('tostring', (a) => vm.tostr(a[0])));
    G.set('tonumber', N('tonumber', (a) => {
      if (a[1] !== undefined) { const v = parseInt(String(a[0]), a[1]); return Number.isNaN(v) ? undefined : v; }
      return tonum(a[0]);
    }));
    G.set('rawget', N('rawget', (a) => a[0].get(a[1]))); G.set('rawset', N('rawset', (a) => { a[0].set(a[1], a[2]); return a[0]; }));
    G.set('rawequal', N('rawequal', (a) => a[0] === a[1])); G.set('rawlen', N('rawlen', (a) => a[0] instanceof LuaTable ? a[0].length() : String(a[0]).length));
    G.set('setmetatable', N('setmetatable', (a) => { a[0].meta = a[1] === undefined ? undefined : a[1]; return a[0]; }));
    G.set('getmetatable', N('getmetatable', (a) => { const m = vm.getmeta(a[0]); if (m && m.get('__metatable') !== undefined) return m.get('__metatable'); return m; }));
    G.set('assert', N('assert', (a) => { if (!vm.truthy(a[0])) throw new LuaError(a[1] !== undefined ? a[1] : 'assertion failed!'); return a; }));
    G.set('error', N('error', (a) => { let v = a[0]; if (typeof v === 'string' && a[1] !== 0) { v = `${vm.chunk}:?: ${v}`; } throw new LuaError(v); }));
    G.set('select', N('select', (a) => { if (a[0] === '#') return a.length - 1; let n = a[0]; if (n < 0) n = a.length + n; return a.slice(n); }));
    const unpack = N('unpack', (a) => { const t = a[0]; const i = a[1] === undefined ? 1 : a[1]; const j = a[2] === undefined ? t.length() : a[2]; const out = []; for (let k = i; k <= j; k++) out.push(t.get(k)); return out; });
    G.set('unpack', unpack);
    G.set('next', N('next', (a) => { const t = a[0]; const keys = [...t.map.keys()]; let idx = a[1] === undefined ? 0 : keys.indexOf(a[1]) + 1; if (idx >= keys.length) return [undefined]; return [keys[idx], t.get(keys[idx])]; }));
    G.set('pairs', N('pairs', (a) => {
      const t = a[0]; const mm = t instanceof LuaTable && t.meta && t.meta.get('__pairs'); if (mm) return vm.callSync(mm, [t]);
      if (!(t instanceof LuaTable)) throw argErr(1, 'pairs', 'table expected, got ' + type(t));
      const keys = [...t.map.keys()]; let i = 0;
      return [N('pairs_iter', () => { while (i < keys.length) { const k = keys[i++]; const v = t.get(k); if (v !== undefined) return [k, v]; } return [undefined]; }), t, undefined];
    }));
    G.set('ipairs', N('ipairs', (a) => {
      const t = a[0]; if (!(t instanceof LuaTable)) throw argErr(1, 'ipairs', 'table expected, got ' + type(t));
      return [N('ipairs_iter', (b) => { const i = b[1] + 1; const v = t.get(i); return v === undefined ? [undefined] : [i, v]; }), t, 0];
    }));
    G.set('pcall', N('pcall', function* (a) {
      try { const r = yield* vm.call(a[0], a.slice(1)); return [true, ...r]; }
      catch (e) { if (e instanceof LuaError) return [false, e.value]; throw e; }
    }, true));
    G.set('xpcall', N('xpcall', function* (a) {
      try { const r = yield* vm.call(a[0], a.slice(2)); return [true, ...r]; }
      catch (e) { if (e instanceof LuaError) { const r = yield* vm.call(a[1], [e.value]); return [false, ...r]; } throw e; }
    }, true));
    G.set('loadstring', N('loadstring', (a) => { try { return [vm.load(a[0], a[1] || 'loadstring')]; } catch (e) { return [undefined, e.value || e.message]; } }));
    G.set('collectgarbage', N('collectgarbage', () => 0));
    G.set('getfenv', N('getfenv', () => G));

    /* ---- string ---- */
    const S = new LuaTable(); G.set('string', S);
    const checkStr = (v, i, f) => { if (typeof v === 'string') return v; if (typeof v === 'number') return fmtNum(v); throw argErr(i, f, 'string expected, got ' + type(v)); };
    const posrel = (pos, len) => pos >= 0 ? pos : (-pos > len ? 0 : len + pos + 1);
    vm.lib(S, {
      len: (a) => checkStr(a[0], 1, 'len').length,
      sub: (a) => { const s = checkStr(a[0], 1, 'sub'); let i = posrel(a[1] === undefined ? 1 : a[1], s.length), j = posrel(a[2] === undefined ? -1 : a[2], s.length); if (i < 1) i = 1; if (j > s.length) j = s.length; return i > j ? '' : s.slice(i - 1, j); },
      upper: (a) => checkStr(a[0], 1, 'upper').toUpperCase(), lower: (a) => checkStr(a[0], 1, 'lower').toLowerCase(),
      rep: (a) => checkStr(a[0], 1, 'rep').repeat(Math.max(0, a[1])), reverse: (a) => [...checkStr(a[0], 1, 'reverse')].reverse().join(''),
      byte: (a) => { const s = checkStr(a[0], 1, 'byte'); const i = posrel(a[1] === undefined ? 1 : a[1], s.length), j = posrel(a[2] === undefined ? i : a[2], s.length); const o = []; for (let k = i; k <= j; k++) o.push(s.charCodeAt(k - 1)); return o; },
      char: (a) => a.map(c => String.fromCharCode(c)).join(''),
      format: (a) => luaFormat(vm, a), find: (a) => strFind(vm, a, true), match: (a) => strFind(vm, a, false),
      gmatch: (a) => { const s = checkStr(a[0], 1, 'gmatch'), pat = checkStr(a[1], 2, 'gmatch'); let pos = 0; return [N('gmatch_iter', () => { while (pos <= s.length) { const ms = new MatchState(s, pat); const e = ms.match(pos, 0); if (e !== -1) { const caps = ms.getCaptures(pos, e, true); pos = e === pos ? e + 1 : e; return caps; } pos++; } return [undefined]; })]; },
      gsub: (a) => strGsub(vm, a),
    });
    vm.stringMeta.set('__index', S);
    /* ---- table ---- */
    const T = new LuaTable(); G.set('table', T);
    vm.lib(T, {
      insert: (a) => { const t = a[0]; if (a.length === 2) { t.set(t.length() + 1, a[1]); } else { const n = t.length(); const pos = a[1]; for (let i = n; i >= pos; i--) t.set(i + 1, t.get(i)); t.set(pos, a[2]); } },
      remove: (a) => { const t = a[0]; const n = t.length(); const pos = a[1] === undefined ? n : a[1]; if (n === 0 && a[1] === undefined) return [undefined]; const v = t.get(pos); for (let i = pos; i < n; i++) t.set(i, t.get(i + 1)); t.set(n, undefined); return [v]; },
      concat: (a) => { const t = a[0], sep = a[1] === undefined ? '' : a[1]; const i = a[2] === undefined ? 1 : a[2], j = a[3] === undefined ? t.length() : a[3]; const o = []; for (let k = i; k <= j; k++) { const v = t.get(k); if (typeof v !== 'string' && typeof v !== 'number') throw new LuaError(`invalid value (at index ${k}) in table for 'concat'`); o.push(vm.tostr(v)); } return o.join(sep); },
      unpack: unpack.fn, getn: (a) => a[0].length(),
      pack: (a) => { const t = new LuaTable(); a.forEach((v, i) => t.set(i + 1, v)); t.set('n', a.length); return t; },
      clear: (a) => { a[0].map.clear(); a[0].n = 0; },
      find: (a) => { const t = a[0]; for (let i = a[2] || 1; i <= t.length(); i++) if (t.get(i) === a[1]) return i; return [undefined]; },
      sort: (a) => {
        const t = a[0], cmp = a[1]; const n = t.length(); const arr = []; for (let i = 1; i <= n; i++) arr.push(t.get(i));
        arr.sort((x, y) => { if (cmp) { if (vm.truthy(vm.callSync(cmp, [x, y])[0])) return -1; if (vm.truthy(vm.callSync(cmp, [y, x])[0])) return 1; return 0; } return x < y ? -1 : x > y ? 1 : 0; });
        arr.forEach((v, i) => t.set(i + 1, v));
      },
    });
    /* ---- math ---- */
    const Mt = new LuaTable(); G.set('math', Mt);
    vm.lib(Mt, {
      floor: (a) => Math.floor(a[0]), ceil: (a) => Math.ceil(a[0]), abs: (a) => Math.abs(a[0]), sqrt: (a) => Math.sqrt(a[0]), sin: (a) => Math.sin(a[0]), cos: (a) => Math.cos(a[0]), tan: (a) => Math.tan(a[0]),
      atan2: (a) => Math.atan2(a[0], a[1]), atan: (a) => Math.atan(a[0]), exp: (a) => Math.exp(a[0]), log: (a) => a[1] ? Math.log(a[0]) / Math.log(a[1]) : Math.log(a[0]), pow: (a) => Math.pow(a[0], a[1]),
      min: (a) => Math.min(...a), max: (a) => Math.max(...a), fmod: (a) => a[0] % a[1], deg: (a) => a[0] * 180 / Math.PI, rad: (a) => a[0] * Math.PI / 180,
      clamp: (a) => Math.min(Math.max(a[0], a[1]), a[2]), sign: (a) => Math.sign(a[0]), round: (a) => Math.round(a[0]),
      random: (a) => { if (a.length === 0) return Math.random(); const lo = a.length === 1 ? 1 : a[0], hi = a.length === 1 ? a[0] : a[1]; if (lo > hi) throw argErr(a.length, 'random', 'interval is empty'); return Math.floor(Math.random() * (hi - lo + 1)) + lo; },
      randomseed: () => { },
    });
    Mt.set('pi', Math.PI); Mt.set('huge', Infinity);
    /* ---- os ---- */
    const O = new LuaTable(); G.set('os', O);
    vm.lib(O, { clock: () => vm.now, time: () => Math.floor(Date.now() / 1000) + Math.floor(vm.now), date: (a) => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return String(a[0] || '').replace('%H', p(d.getHours())).replace('%M', p(d.getMinutes())).replace('%S', p(d.getSeconds())).replace('%Y', d.getFullYear()).replace('%m', p(d.getMonth() + 1)).replace('%d', p(d.getDate())); } });
    G.set('tick', N('tick', () => vm.now)); G.set('time', N('time', () => vm.now));
    /* ---- coroutine ---- */
    const C = new LuaTable(); G.set('coroutine', C);
    C.set('create', N('create', (a) => { const co = new Thread(null, 'co'); co.gen = vm.call(a[0], []); co.status = 'suspended'; co.pendingArgs = null; co.isCo = true; co.fnv = a[0]; return co; }));
    C.set('resume', N('resume', function* (a) {
      const co = a[0]; if (co.status === 'dead') return [false, 'cannot resume dead coroutine'];
      if (!co.started) { co.started = true; co.gen = vm.call(co.fnv, a.slice(1)); }
      return yield* resumeCoGen(vm, co, a.slice(1));
    }, true));
    C.set('yield', N('yield', function* (a) { const v = yield { kind: 'co', vals: a }; return v || []; }, true));
    C.set('status', N('status', (a) => a[0].status));
    C.set('wrap', N('wrap', (a) => { const co = new Thread(null, 'co'); co.fnv = a[0]; co.status = 'suspended'; return [N('wrapped', function* (b) { if (!co.started) { co.started = true; co.gen = vm.call(co.fnv, b); } const r = yield* resumeCoGen(vm, co, b); if (r[0] === false) throw new LuaError(r[1]); return r.slice(1); }, true)]; }));
    C.set('running', N('running', () => vm.current));
    /* ---- task ---- */
    const Tk = new LuaTable(); G.set('task', Tk);
    Tk.set('wait', N('wait', function* (a) { const t = a[0] === undefined ? 0.03 : a[0]; const th = vm.current; if (th) th.startedAt = vm.now; const r = yield { kind: 'wait', t }; return [t, vm.now]; }, true));
    Tk.set('spawn', N('spawn', (a) => { const f = a[0]; const th = vm.spawn(f instanceof Thread ? f.fnv : f, a.slice(1), 'task.spawn'); return th; }));
    Tk.set('defer', N('defer', (a) => { const f = a[0], rest = a.slice(1); vm.schedule(0, () => vm.spawn(f, rest, 'defer')); }));
    Tk.set('delay', N('delay', (a) => { const f = a[1], rest = a.slice(2); vm.schedule(Math.max(a[0], 0), () => vm.spawn(f, rest, 'delay')); }));
    Tk.set('cancel', N('cancel', (a) => { if (a[0] instanceof Thread) a[0].status = 'dead'; }));
  }
}
function* resumeCoGen(vm, co, args) {
  if (co.status === 'dead') return [false, 'cannot resume dead coroutine'];
  co.status = 'running'; let send = args;
  try {
    for (;;) {
      const r = co.gen.next(co.genStarted ? send : undefined); co.genStarted = true;
      if (r.done) { co.status = 'dead'; return [true, ...r.value]; }
      if (r.value && r.value.kind === 'co') { co.status = 'suspended'; return [true, ...r.value.vals]; }
      send = yield r.value;
    }
  } catch (e) { co.status = 'dead'; if (e instanceof LuaError) return [false, e.value]; throw e; }
}

/* ------------------------------------------------------------------ pola Lua (port lstrlib) */
const L_ESC = '%';
class MatchState {
  constructor(src, pat) { this.src = src; this.pat = pat; this.level = 0; this.capture = []; this.depth = 0; }
  classEnd(p) {
    if (p >= this.pat.length) throw new LuaError('malformed pattern (ends with \'%\')');
    const c = this.pat[p++];
    if (c === L_ESC) { if (p >= this.pat.length) throw new LuaError("malformed pattern (ends with '%')"); return p + 1; }
    if (c === '[') {
      if (this.pat[p] === '^') p++;
      do { if (p >= this.pat.length) throw new LuaError("malformed pattern (missing ']')"); const cc = this.pat[p++]; if (cc === L_ESC) p++; } while (this.pat[p] !== ']');
      return p + 1;
    }
    return p;
  }
  singleClass(c, cl) {
    const code = c.charCodeAt(0); let res;
    switch (cl.toLowerCase()) {
      case 'a': res = /[A-Za-z]/.test(c); break; case 'c': res = code < 32 || code === 127; break; case 'd': res = /[0-9]/.test(c); break;
      case 'l': res = /[a-z]/.test(c); break; case 'p': res = /[!-\/:-@\[-`{-~]/.test(c); break; case 's': res = /[ \t\n\r\f\v]/.test(c); break;
      case 'u': res = /[A-Z]/.test(c); break; case 'w': res = /[A-Za-z0-9]/.test(c); break; case 'x': res = /[0-9A-Fa-f]/.test(c); break;
      default: return cl === c;
    }
    if (cl >= 'A' && cl <= 'Z') res = !res;
    return res;
  }
  matchClass(c, p, ep) { // [set] pada pat[p..ep-1]
    let sig = true; p++;
    if (this.pat[p] === '^') { sig = false; p++; }
    const end = ep - 1;
    while (p < end) {
      if (this.pat[p] === L_ESC) { p++; if (this.singleClass(c, this.pat[p])) return sig; p++; }
      else if (this.pat[p + 1] === '-' && p + 2 < end) { if (this.pat[p] <= c && c <= this.pat[p + 2]) return sig; p += 3; }
      else { if (this.pat[p] === c) return sig; p++; }
    }
    return !sig;
  }
  single(s, p, ep) {
    if (s >= this.src.length) return false; const c = this.src[s]; const pc = this.pat[p];
    switch (pc) { case '.': return true; case L_ESC: return this.singleClass(c, this.pat[p + 1]); case '[': return this.matchClass(c, p, ep); default: return pc === c; }
  }
  matchBalance(s, p) {
    if (p + 1 >= this.pat.length) throw new LuaError("unbalanced pattern");
    if (this.src[s] !== this.pat[p]) return -1;
    const b = this.pat[p], e = this.pat[p + 1]; let cont = 1; let i = s + 1;
    while (i < this.src.length) { const c = this.src[i]; if (c === e) { if (--cont === 0) return i + 1; } else if (c === b) cont++; i++; }
    return -1;
  }
  maxExpand(s, p, ep) { let i = 0; while (this.single(s + i, p, ep)) i++; while (i >= 0) { const r = this.match(s + i, ep + 1); if (r !== -1) return r; i--; } return -1; }
  minExpand(s, p, ep) { for (;;) { const r = this.match(s, ep + 1); if (r !== -1) return r; if (this.single(s, p, ep)) s++; else return -1; } }
  startCapture(s, p, what) { this.capture[this.level] = { init: s, len: what }; this.level++; const r = this.match(s, p); if (r === -1) this.level--; return r; }
  endCapture(s, p) { let l = -1; for (let i = this.level - 1; i >= 0; i--) if (this.capture[i].len === -1) { l = i; break; } if (l < 0) throw new LuaError('invalid pattern capture'); this.capture[l].len = s - this.capture[l].init; const r = this.match(s, p); if (r === -1) this.capture[l].len = -1; return r; }
  matchCapture(s, l) { l = l.charCodeAt(0) - 49; const cap = this.capture[l]; if (!cap || cap.len === -1) throw new LuaError('invalid capture index'); const str = this.src.substr(cap.init, cap.len); return this.src.startsWith(str, s) ? s + str.length : -1; }
  match(s, p) {
    if (++this.depth > 200) { this.depth--; throw new LuaError('pattern too complex'); }
    try {
      for (;;) {
        if (p >= this.pat.length) return s;
        const pc = this.pat[p];
        if (pc === '(') { return this.pat[p + 1] === ')' ? this.startCapture(s, p + 2, -2) : this.startCapture(s, p + 1, -1); }
        if (pc === ')') return this.endCapture(s, p + 1);
        if (pc === '$' && p + 1 === this.pat.length) return s === this.src.length ? s : -1;
        if (pc === L_ESC) {
          const nx = this.pat[p + 1];
          if (nx === 'b') { s = this.matchBalance(s, p + 2); if (s !== -1) { p += 4; continue; } return -1; }
          if (nx === 'f') {
            p += 2; if (this.pat[p] !== '[') throw new LuaError("missing '[' after '%f' in pattern"); const ep = this.classEnd(p);
            const prev = s === 0 ? '\0' : this.src[s - 1]; const cur = s < this.src.length ? this.src[s] : '\0';
            if (!this.matchClass(prev, p, ep) && this.matchClass(cur, p, ep)) { p = ep; continue; } return -1;
          }
          if (nx >= '0' && nx <= '9') { s = this.matchCapture(s, nx); if (s !== -1) { p += 2; continue; } return -1; }
        }
        const ep = this.classEnd(p); const epc = this.pat[ep];
        if (epc === '?') { if (this.single(s, p, ep)) { const r = this.match(s + 1, ep + 1); if (r !== -1) return r; } p = ep + 1; continue; }
        if (epc === '+') return this.single(s, p, ep) ? this.maxExpand(s + 1, p, ep) : -1;
        if (epc === '*') return this.maxExpand(s, p, ep);
        if (epc === '-') return this.minExpand(s, p, ep);
        if (!this.single(s, p, ep)) return -1;
        s++; p = ep;
      }
    } finally { this.depth--; }
  }
  getCaptures(s, e, wholeIfNone) {
    const n = (this.level === 0 && wholeIfNone) ? 1 : this.level; const out = [];
    for (let i = 0; i < n; i++) {
      if (i >= this.level) { out.push(this.src.slice(s, e)); continue; }
      const c = this.capture[i]; out.push(c.len === -2 ? c.init + 1 : this.src.substr(c.init, c.len));
    }
    return out;
  }
}
function strFind(vm, a, isFind) {
  const s = String(typeof a[0] === 'number' ? fmtNum(a[0]) : a[0]), pat = String(typeof a[1] === 'number' ? fmtNum(a[1]) : a[1]);
  let init = a[2] === undefined ? 1 : a[2]; if (init < 0) init = Math.max(s.length + init + 1, 1); if (init < 1) init = 1; if (init > s.length + 1) return [undefined];
  if (isFind && (vm.truthy(a[3]) || !/[\^$*+?.()[\]%-]/.test(pat))) { const i = s.indexOf(pat, init - 1); return i < 0 ? [undefined] : [i + 1, i + pat.length]; }
  const anchor = pat[0] === '^'; let si = init - 1;
  do {
    const ms = new MatchState(s, pat); const e = ms.match(si, anchor ? 1 : 0);
    if (e !== -1) return isFind ? [si + 1, e, ...ms.getCaptures(si, e, false)] : ms.getCaptures(si, e, true);
    si++;
  } while (si <= s.length && !anchor);
  return [undefined];
}
function strGsub(vm, a) {
  const src = String(typeof a[0] === 'number' ? fmtNum(a[0]) : a[0]), pat = String(a[1]), repl = a[2]; const maxN = a[3] === undefined ? Infinity : a[3];
  const anchor = pat[0] === '^'; let si = 0, n = 0; let out = '';
  while (n < maxN) {
    const ms = new MatchState(src, pat); const e = ms.match(si, anchor ? 1 : 0);
    if (e !== -1) {
      n++; const whole = src.slice(si, e); const caps = ms.getCaptures(si, e, true); let rv;
      if (typeof repl === 'string' || typeof repl === 'number') {
        rv = String(repl).replace(/%(.)/g, (m, c) => c === '0' ? whole : (c === '%' ? '%' : (/[1-9]/.test(c) ? String(caps[Number(c) - 1] === undefined ? '' : vm.tostr(caps[Number(c) - 1])) : (() => { throw new LuaError("invalid use of '%' in replacement string"); })())));
      } else if (repl instanceof LuaTable) { const v = repl.get(caps[0]); rv = v === undefined || v === false ? whole : vm.tostr(v); }
      else { const r = vm.callSync(repl, caps); const v = r[0]; rv = v === undefined || v === false ? whole : vm.tostr(v); }
      out += rv;
    }
    if (e !== -1 && e > si) si = e;
    else { if (si < src.length) out += src[si]; si++; }
    if (si > src.length || anchor) break;
  }
  if (si < src.length) out += src.slice(si);
  return [out, n];
}
function luaFormat(vm, a) {
  const fmt = String(a[0]); let ai = 1;
  return fmt.replace(/%([-+ #0]*)(\d+)?(?:\.(\d+))?([diouxXeEfgGcsq%])/g, (m, flags, width, prec, conv) => {
    if (conv === '%') return '%';
    const arg = a[ai++]; let s;
    switch (conv) {
      case 'd': case 'i': { const n = tonum(arg); if (n === undefined) throw new LuaError(`bad argument #${ai} to 'format' (number expected, got ${type(arg)})`); s = String(Math.trunc(n)); if (flags.includes('+') && n >= 0) s = '+' + s; break; }
      case 'u': s = String(Math.trunc(tonum(arg))); break;
      case 'x': s = Math.trunc(tonum(arg)).toString(16); break; case 'X': s = Math.trunc(tonum(arg)).toString(16).toUpperCase(); break; case 'o': s = Math.trunc(tonum(arg)).toString(8); break;
      case 'f': { const n = tonum(arg); if (n === undefined) throw new LuaError(`bad argument #${ai} to 'format' (number expected, got ${type(arg)})`); s = n.toFixed(prec === undefined ? 6 : Number(prec)); if (flags.includes('+') && n >= 0) s = '+' + s; break; }
      case 'e': case 'E': s = tonum(arg).toExponential(prec === undefined ? 6 : Number(prec)).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); break;
      case 'g': case 'G': s = fmtNum(tonum(arg)); break;
      case 'c': s = String.fromCharCode(tonum(arg)); break;
      case 's': s = vm.tostr(arg); if (prec !== undefined) s = s.slice(0, Number(prec)); break;
      case 'q': s = '"' + String(arg).replace(/(["\\\n])/g, '\\$1') + '"'; break;
    }
    if (width) { const w = Number(width); if (flags.includes('-')) s = s.padEnd(w); else s = s.padStart(w, flags.includes('0') && conv !== 's' ? '0' : ' '); }
    return s;
  });
}

module.exports = { VM, LuaTable, LuaFunc, Native, LuaError, Thread, parse, lex, type, fmtNum, tonum };
