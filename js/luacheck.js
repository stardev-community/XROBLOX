/*
 * luacheck.js - pemeriksa sintaks Lua/Luau ringan (tokenizer + recursive descent parser).
 * Dipakai untuk memeriksa HASIL generate sebelum diunduh, dan di tes otomatis.
 * Mendukung: Lua 5.1, operator majemuk Luau (+= -= *= /= %= ^= ..=), continue, //-komentar tidak.
 * Tidak mengeksekusi apa pun. Hanya mendeteksi kesalahan sintaks + beberapa lint.
 *
 * API:
 *   LSB.luacheck.check(code)  -> { ok, errors:[{line,col,msg}], globals:[...], unusedLocals:[...] }
 */
(function (g) {
  var LSB = g.LSB = g.LSB || {};

  var KEYWORDS = {};
  ('and break do else elseif end false for function goto if in local nil not or repeat return then true until while continue')
    .split(' ').forEach(function (k) { KEYWORDS[k] = true; });

  function LuaSyntaxError(msg, line, col) { this.msg = msg; this.line = line; this.col = col; }

  /* ------------------------------------------------------------------ tokenizer */
  function tokenize(src) {
    var toks = [], i = 0, n = src.length, line = 1, lineStart = 0;
    function err(m) { throw new LuaSyntaxError(m, line, i - lineStart + 1); }
    function longBracket(at) {
      // at menunjuk '[' ; kembalikan {level, bodyStart} atau null
      var j = at + 1, lvl = 0;
      while (src[j] === '=') { lvl++; j++; }
      if (src[j] === '[') return { level: lvl, start: j + 1 };
      return null;
    }
    function readLong(lb, what) {
      var close = ']' + new Array(lb.level + 1).join('=') + ']';
      var end = src.indexOf(close, lb.start);
      if (end < 0) err('unfinished long ' + what);
      var body = src.slice(lb.start, end);
      for (var k = 0; k < body.length; k++) if (body[k] === '\n') { line++; lineStart = lb.start + k + 1; }
      i = end + close.length;
      return body;
    }
    while (i < n) {
      var c = src[i];
      if (c === '\n') { line++; i++; lineStart = i; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      // komentar
      if (c === '-' && src[i + 1] === '-') {
        i += 2;
        if (src[i] === '[') {
          var lbC = longBracket(i);
          if (lbC) { readLong(lbC, 'comment'); continue; }
        }
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      var startLine = line, startCol = i - lineStart + 1;
      // nama / keyword
      if (/[A-Za-z_]/.test(c)) {
        var j = i + 1;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        var w = src.slice(i, j); i = j;
        toks.push({ t: KEYWORDS[w] ? 'kw' : 'name', v: w, line: startLine, col: startCol });
        continue;
      }
      // angka
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        var m = /^(0[xX][0-9a-fA-F_]+(\.[0-9a-fA-F]*)?([pP][+-]?[0-9]+)?|0[bB][01_]+|[0-9_]*\.?[0-9_]*([eE][+-]?[0-9]+)?)/.exec(src.slice(i));
        if (!m || !m[0]) err('malformed number');
        i += m[0].length;
        toks.push({ t: 'num', v: m[0], line: startLine, col: startCol });
        continue;
      }
      // string
      if (c === '"' || c === "'") {
        var q = c; i++;
        var s = '';
        for (;;) {
          if (i >= n) err('unfinished string');
          var d = src[i];
          if (d === '\n') err('unfinished string');
          if (d === '\\') {
            var e = src[i + 1];
            if (e === '\r' && src[i + 2] === '\n') { i += 3; line++; lineStart = i; continue; }
            if (e === '\n') { i += 2; line++; lineStart = i; continue; }
            if (e === 'x') { i += 4; continue; }
            if (e === 'z') { i += 2; while (/\s/.test(src[i] || '')) { if (src[i] === '\n') { line++; lineStart = i + 1; } i++; } continue; }
            if (e === 'u') { var cl = src.indexOf('}', i); if (cl < 0) err('bad \\u escape'); i = cl + 1; continue; }
            if (/[0-9]/.test(e)) { i += 2; var cnt = 0; while (cnt < 2 && /[0-9]/.test(src[i])) { i++; cnt++; } continue; }
            if (!/[abfnrtv\\"'\n]/.test(e)) err('invalid escape sequence \\' + e);
            i += 2; continue;
          }
          if (d === q) { i++; break; }
          s += d; i++;
        }
        toks.push({ t: 'str', v: s, line: startLine, col: startCol });
        continue;
      }
      // long string
      if (c === '[') {
        var lb = longBracket(i);
        if (lb) { var body = readLong(lb, 'string'); toks.push({ t: 'str', v: body, line: startLine, col: startCol }); continue; }
      }
      // operator
      var three = src.substr(i, 3), two = src.substr(i, 2);
      if (three === '...') { toks.push({ t: 'op', v: '...', line: startLine, col: startCol }); i += 3; continue; }
      if (three === '..=') { toks.push({ t: 'op', v: '..=', line: startLine, col: startCol }); i += 3; continue; }
      var twos = ['==', '~=', '<=', '>=', '..', '+=', '-=', '*=', '/=', '%=', '^=', '::'];
      if (twos.indexOf(two) >= 0) { toks.push({ t: 'op', v: two, line: startLine, col: startCol }); i += 2; continue; }
      if ('+-*/%^#<>=(){}[];:,.'.indexOf(c) >= 0) { toks.push({ t: 'op', v: c, line: startLine, col: startCol }); i++; continue; }
      err("unexpected symbol '" + c + "'");
    }
    toks.push({ t: 'eof', v: '<eof>', line: line, col: i - lineStart + 1 });
    return toks;
  }

  /* ------------------------------------------------------------------ parser */
  var GLOBAL_OK = {};
  ('game workspace script shared _G _VERSION assert collectgarbage error getfenv getmetatable ipairs load loadstring next pairs pcall print rawequal rawget rawset select setfenv setmetatable tonumber tostring type unpack xpcall warn tick time os string table math coroutine debug utf8 bit32 task wait spawn delay typeof Instance Enum Vector3 Vector2 CFrame Color3 UDim UDim2 TweenInfo NumberSequence NumberSequenceKeypoint ColorSequence ColorSequenceKeypoint Rect Ray Random BrickColor Region3 Axes Faces PhysicsService require plugin Drawing getgenv getrenv getreg getgc getrawmetatable setrawmetatable gethui setclipboard writefile readfile isfile isfolder makefolder delfile listfiles fireproximityprompt fireclickdetector firetouchinterest firesignal getconnections hookfunction hookmetamethod newcclosure checkcaller islclosure request http_request syn fluxus identifyexecutor getexecutorname isrbxactive mouse1click setfpscap queue_on_teleport clonefunction cloneref getnamecallmethod decompile Delta')
    .split(' ').forEach(function (k) { GLOBAL_OK[k] = true; });

  function Parser(toks) {
    this.toks = toks; this.p = 0;
    this.scopes = [];
    this.globals = {};
    this.unused = [];
    this.fnDepth = 0;
  }
  var P = Parser.prototype;
  P.peek = function () { return this.toks[this.p]; };
  P.next = function () { return this.toks[this.p++]; };
  P.fail = function (msg, tok) { tok = tok || this.peek(); throw new LuaSyntaxError(msg, tok.line, tok.col); };
  P.isOp = function (v) { var t = this.peek(); return t.t === 'op' && t.v === v; };
  P.isKw = function (v) { var t = this.peek(); return t.t === 'kw' && t.v === v; };
  P.acceptOp = function (v) { if (this.isOp(v)) { this.p++; return true; } return false; };
  P.acceptKw = function (v) { if (this.isKw(v)) { this.p++; return true; } return false; };
  P.expectOp = function (v, ctx) { if (!this.acceptOp(v)) this.fail("'" + v + "' expected near '" + this.peek().v + "'" + (ctx ? ' (' + ctx + ')' : '')); };
  P.expectKw = function (v, opener) {
    if (!this.acceptKw(v)) {
      var t = this.peek();
      this.fail("'" + v + "' expected near '" + t.v + "'" + (opener ? ' (to close ' + opener.kw + ' at line ' + opener.line + ')' : ''));
    }
  };
  P.name = function () { var t = this.peek(); if (t.t !== 'name') this.fail('<name> expected near ' + "'" + t.v + "'"); this.p++; return t; };

  P.pushScope = function () { this.scopes.push({}); };
  P.popScope = function () {
    var s = this.scopes.pop();
    for (var k in s) if (!s[k].used && k !== '_' && k.charAt(0) !== '_' && !s[k].param) this.unused.push({ name: k, line: s[k].line });
  };
  P.declare = function (tok, isParam) { this.scopes[this.scopes.length - 1][tok.v] = { used: false, line: tok.line, param: !!isParam }; };
  P.use = function (tok) {
    for (var i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i][tok.v]) { this.scopes[i][tok.v].used = true; return; }
    }
    if (!GLOBAL_OK[tok.v]) { (this.globals[tok.v] = this.globals[tok.v] || []).push(tok.line); }
  };

  P.chunk = function () {
    this.pushScope();
    this.block();
    if (this.peek().t !== 'eof') this.fail("'<eof>' expected near '" + this.peek().v + "'");
    this.popScope();
  };

  P.blockEnd = function () {
    var t = this.peek();
    if (t.t === 'eof') return true;
    if (t.t === 'kw' && (t.v === 'end' || t.v === 'else' || t.v === 'elseif' || t.v === 'until')) return true;
    return false;
  };

  P.block = function () {
    while (!this.blockEnd()) {
      if (this.isKw('return')) {
        this.next();
        if (!this.blockEnd() && !this.isOp(';')) this.exprlist();
        this.acceptOp(';');
        if (!this.blockEnd()) this.fail("'end' expected near '" + this.peek().v + "' (statement after return)");
        return;
      }
      this.stat();
    }
  };

  P.scoped = function (fn) { this.pushScope(); fn.call(this); this.popScope(); };

  P.stat = function () {
    var t = this.peek();
    if (t.t === 'op' && t.v === ';') { this.next(); return; }
    if (t.t === 'op' && t.v === '::') { this.next(); this.name(); this.expectOp('::'); return; }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'do': this.next(); this.scoped(this.block); this.expectKw('end', { kw: 'do', line: t.line }); return;
        case 'while': this.next(); this.expr(); this.expectKw('do'); this.scoped(this.block); this.expectKw('end', { kw: 'while', line: t.line }); return;
        case 'repeat':
          this.next(); this.pushScope(); this.block(); this.expectKw('until', { kw: 'repeat', line: t.line }); this.expr(); this.popScope(); return;
        case 'if':
          this.next(); this.expr(); this.expectKw('then'); this.scoped(this.block);
          while (this.isKw('elseif')) { this.next(); this.expr(); this.expectKw('then'); this.scoped(this.block); }
          if (this.acceptKw('else')) this.scoped(this.block);
          this.expectKw('end', { kw: 'if', line: t.line }); return;
        case 'for': return this.forStat(t);
        case 'function':
          this.next();
          var fn = this.name(); this.use(fn);
          var isMethod = false;
          while (this.isOp('.') || this.isOp(':')) { var colon = this.isOp(':'); this.next(); this.name(); if (colon) { isMethod = true; break; } }
          this.funcBody(isMethod, t); return;
        case 'local':
          this.next();
          if (this.acceptKw('function')) { var nm = this.name(); this.declare(nm); this.funcBody(false, t); return; }
          var names = [this.name()];
          while (this.acceptOp(',')) names.push(this.name());
          if (this.acceptOp('=')) this.exprlist();
          names.forEach(function (x) { this.declare(x); }, this);
          return;
        case 'break': this.next(); return;
        case 'continue': this.next(); return;
        case 'return': this.fail("unexpected 'return'"); return;
        default: break;
      }
    }
    // exprstat: assignment atau call
    var isCall = this.suffixedExp();
    var tk = this.peek();
    if (tk.t === 'op' && (tk.v === '=' || tk.v === ',' || tk.v === '+=' || tk.v === '-=' || tk.v === '*=' || tk.v === '/=' || tk.v === '%=' || tk.v === '^=' || tk.v === '..=')) {
      if (isCall) this.fail('cannot assign to a function call', tk);
      while (this.acceptOp(',')) { var c2 = this.suffixedExp(); if (c2) this.fail('cannot assign to a function call'); }
      var op = this.next();
      if (op.v !== '=' && op.v.length === 1) this.fail("'=' expected near '" + op.v + "'", op);
      this.exprlist();
    } else if (!isCall) {
      this.fail('syntax error near ' + "'" + tk.v + "'", tk);
    }
  };

  P.forStat = function (t) {
    this.next();
    var n1 = this.name();
    if (this.isOp('=')) {
      this.next(); this.expr(); this.expectOp(','); this.expr();
      if (this.acceptOp(',')) this.expr();
      this.expectKw('do'); this.pushScope(); this.declare(n1, true); this.block(); this.popScope();
      this.expectKw('end', { kw: 'for', line: t.line });
    } else {
      var names = [n1];
      while (this.acceptOp(',')) names.push(this.name());
      this.expectKw('in'); this.exprlist(); this.expectKw('do');
      this.pushScope(); names.forEach(function (x) { this.declare(x, true); }, this); this.block(); this.popScope();
      this.expectKw('end', { kw: 'for', line: t.line });
    }
  };

  P.funcBody = function (isMethod, openTok) {
    this.expectOp('(', 'function parameters');
    this.pushScope();
    if (isMethod) this.scopes[this.scopes.length - 1]['self'] = { used: true, line: 0, param: true };
    if (!this.isOp(')')) {
      do {
        if (this.isOp('...')) { this.next(); break; }
        this.declare(this.name(), true);
      } while (this.acceptOp(','));
    }
    this.expectOp(')');
    this.fnDepth++;
    this.block();
    this.fnDepth--;
    this.expectKw('end', { kw: 'function', line: openTok ? openTok.line : 0 });
    this.popScope();
  };

  P.exprlist = function () { this.expr(); while (this.acceptOp(',')) this.expr(); };

  // kembalikan true bila ekspresi berakhir sebagai pemanggilan
  P.suffixedExp = function () {
    var t = this.peek(), isCall = false;
    if (t.t === 'name') { this.next(); this.use(t); }
    else if (t.t === 'op' && t.v === '(') { this.next(); this.expr(); this.expectOp(')'); }
    else this.fail('unexpected symbol near ' + "'" + t.v + "'");
    for (;;) {
      var s = this.peek();
      if (s.t === 'op' && s.v === '.') { this.next(); this.name(); isCall = false; }
      else if (s.t === 'op' && s.v === '[') { this.next(); this.expr(); this.expectOp(']'); isCall = false; }
      else if (s.t === 'op' && s.v === ':') { this.next(); this.name(); this.callArgs(); isCall = true; }
      else if ((s.t === 'op' && (s.v === '(' || s.v === '{')) || s.t === 'str') { this.callArgs(); isCall = true; }
      else break;
    }
    return isCall;
  };

  P.callArgs = function () {
    var t = this.peek();
    if (t.t === 'str') { this.next(); return; }
    if (t.t === 'op' && t.v === '{') { this.tableCons(); return; }
    this.expectOp('(', 'call arguments');
    if (!this.isOp(')')) this.exprlist();
    this.expectOp(')', 'call arguments');
  };

  P.tableCons = function () {
    var open = this.peek();
    this.expectOp('{');
    while (!this.isOp('}')) {
      if (this.peek().t === 'eof') this.fail("'}' expected (to close '{' at line " + open.line + ')');
      if (this.isOp('[')) { this.next(); this.expr(); this.expectOp(']'); this.expectOp('='); this.expr(); }
      else if (this.peek().t === 'name' && this.toks[this.p + 1].t === 'op' && this.toks[this.p + 1].v === '=') { this.next(); this.next(); this.expr(); }
      else this.expr();
      if (!this.acceptOp(',') && !this.acceptOp(';')) break;
    }
    this.expectOp('}', "to close '{' at line " + open.line);
  };

  var BINPRI = {
    'or': [1, 1], 'and': [2, 2],
    '<': [3, 3], '>': [3, 3], '<=': [3, 3], '>=': [3, 3], '~=': [3, 3], '==': [3, 3],
    '..': [5, 4], '+': [6, 6], '-': [6, 6], '*': [7, 7], '/': [7, 7], '%': [7, 7],
    '^': [10, 9]
  };
  var UNARY_PRI = 8;

  P.expr = function (limit) {
    limit = limit || 0;
    var t = this.peek();
    if ((t.t === 'kw' && t.v === 'not') || (t.t === 'op' && (t.v === '-' || t.v === '#'))) {
      this.next(); this.expr(UNARY_PRI);
    } else this.simpleExp();
    for (;;) {
      var o = this.peek();
      var key = (o.t === 'op' || (o.t === 'kw' && (o.v === 'and' || o.v === 'or'))) ? o.v : null;
      var pri = key && BINPRI[key];
      if (!pri || pri[0] <= limit) break;
      this.next();
      this.expr(pri[1]);
    }
  };

  P.simpleExp = function () {
    var t = this.peek();
    if (t.t === 'num' || t.t === 'str') { this.next(); return; }
    if (t.t === 'kw' && (t.v === 'nil' || t.v === 'true' || t.v === 'false')) { this.next(); return; }
    if (t.t === 'op' && t.v === '...') { this.next(); return; }
    if (t.t === 'op' && t.v === '{') { this.tableCons(); return; }
    if (t.t === 'kw' && t.v === 'function') { this.next(); this.funcBody(false, t); return; }
    this.suffixedExp();
  };

  function check(code) {
    var res = { ok: true, errors: [], globals: [], unusedLocals: [] };
    try {
      var toks = tokenize(code);
      var p = new Parser(toks);
      p.chunk();
      res.globals = Object.keys(p.globals).map(function (k) { return { name: k, lines: p.globals[k].slice(0, 5) }; });
      res.unusedLocals = p.unused;
    } catch (e) {
      if (e instanceof LuaSyntaxError) { res.ok = false; res.errors.push({ line: e.line, col: e.col, msg: e.msg }); }
      else throw e;
    }
    return res;
  }

  LSB.luacheck = { check: check, tokenize: tokenize };
  if (typeof module !== 'undefined') module.exports = LSB.luacheck;
})(typeof window !== 'undefined' ? window : globalThis);
