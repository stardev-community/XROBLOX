/* editors.js - editor operand, kondisi, daftar referensi */
(function (g) {
  var LSB = g.LSB, D = LSB.dom, h = D.h, M = LSB.META, F = LSB.make, U = LSB.util, W = LSB.walk;
  var E = LSB.ed = {};

  /* ---------- daftar pilihan referensi ---------- */
  E.targets = function () { return [['', '— pilih target —']].concat(D.cfg().targets.map(function (t) { return [t.id, (t.alias || t.path || t.id)]; })); };
  E.actions = function () { return [['', '— pilih aksi —']].concat(D.cfg().actions.map(function (a) { return [a.id, E.actionName(a)]; })); };
  E.watchers = function () { return [['', '— pilih watcher —']].concat(D.cfg().watchers.map(function (w) { return [w.id, E.watcherName(w)]; })); };
  E.rules = function () { return [['', '— pilih rule —']].concat(D.cfg().rules.map(function (r) { return [r.id, r.name || r.id]; })); };
  E.macros = function () { return [['', '— pilih makro —']].concat(D.cfg().macros.map(function (m) { return [m.id, m.name || m.id]; })); };
  E.widgets = function (onlyValue) {
    var r = [['', '— pilih widget —']];
    W.allWidgets(D.cfg()).forEach(function (x) { if (!onlyValue || M.VALUE_WIDGETS.indexOf(x.w.type) >= 0) r.push([x.w.id, (x.w.label || x.w.type) + '  (' + x.w.type + ')']); });
    return r;
  };
  E.actionName = function (a) { var k = M.actionKind(a.kind); return a.name || ((k ? k.icon + ' ' + k.label : a.kind) + ' · ' + a.id); };
  E.watcherName = function (w) { var k = M.watcherKind(w.kind); return w.name || ((k ? k.icon + ' ' + k.label : w.kind) + ' · ' + w.id); };

  E.srcOptions = function () {
    return M.SRC_KINDS.filter(function (s) { return D.adv() || s.k !== 'expr'; }).map(function (s) { return [s.k, s.label]; });
  };

  /* ---------- operand ---------- */
  // o: {noCast, allow:[src], label}
  E.operand = function (op, o) {
    o = o || {};
    var cfg = D.cfg(), box = h('div');
    var srcs = E.srcOptions(); if (o.allow) srcs = srcs.filter(function (s) { return o.allow.indexOf(s[0]) >= 0; });
    var row = h('div', { class: 'op' });
    row.appendChild(D.select(op, 'src', srcs, { bare: true, onset: function (x, v) { if (v === 'pick' || v === 'rr') x.list = x.list && x.list.length ? x.list : ['a', 'b']; } }));
    var s = op.src;
    if (s === 'fixed') {
      row.appendChild(D.text(op, 'value', { ph: 'nilai (contoh: 5, teks, 1,2,3)' }).querySelector('input'));
    } else if (s === 'widget') row.appendChild(D.select(op, 'ref', E.widgets(true), { bare: true }));
    else if (s === 'action') {
      row.appendChild(D.select(op, 'ref', E.actions(), { bare: true }));
      if (D.adv()) row.appendChild(E.small(D.text(op, 'field', { ph: 'field hasil (opsional)' })));
    } else if (s === 'watcher') {
      row.appendChild(D.select(op, 'ref', E.watchers(), { bare: true }));
      var w = W.byId(cfg.watchers, op.ref), k = w && M.watcherKind(w.kind);
      var outs = (k && k.outputs && k.outputs.length) ? k.outputs : ['value'];
      if (outs.indexOf(op.field) < 0 && !op.field) op.field = outs[0];
      row.appendChild(D.select(op, 'field', outs.map(function (x) { return [x, x]; }), { bare: true }));
    } else if (s === 'event') row.appendChild(E.small(D.text(op, 'field', { ph: 'field (value/a1/name...)' })));
    else if (s === 'random') {
      row.appendChild(E.small(D.text(op, 'min', { ph: 'min' }))); row.appendChild(E.small(D.text(op, 'max', { ph: 'maks' })));
    } else if (s === 'pick' || s === 'rr') {
      var ta = h('textarea', { rows: 3, placeholder: 'satu nilai per baris' }); ta.value = (op.list || []).join('\n');
      ta.addEventListener('input', function () { D.set(function () { op.list = ta.value.split('\n').filter(function (x) { return x.trim() !== ''; }); }, { silent: true, coalesce: 'l' + op.src }); });
      row.appendChild(ta);
    } else if (s === 'target') {
      row.appendChild(D.select(op, 'ref', E.targets(), { bare: true }));
      row.appendChild(D.select(op, 'field', [['instance', 'Instance'], ['position', 'Posisi'], ['cframe', 'CFrame'], ['name', 'Nama'], ['value', '.Value']], { bare: true }));
    } else if (s === 'var') row.appendChild(E.small(D.text(op, 'ref', { ph: 'nama variabel' })));
    else if (s === 'template') row.appendChild(D.text(op, 'tpl', { ph: 'Contoh: Quest {wt:wid.value} dari {w:wid}' }).querySelector('input'));
    else if (s === 'expr') row.appendChild(D.text(op, 'expr', { area: true, rows: 2, ph: 'ekspresi Lua' }).querySelector('textarea'));
    var castable = !o.noCast && ['fixed', 'widget', 'action', 'watcher', 'event', 'var', 'expr'].indexOf(s) >= 0 && (D.adv() || s === 'fixed');
    if (castable) row.appendChild(h('div', { class: 'narrow' }, D.select(op, 'type', M.ARG_TYPES.map(function (t) { return [t, t === 'auto' ? 'tipe: auto' : t]; }), { bare: true })));
    box.appendChild(row);
    return box;
  };
  E.small = function (f) { f.classList.add('narrow'); var i = f.querySelector('input,textarea'); return i || f; };

  // argumen aksi: daftar operand
  E.args = function (a, labels) {
    var wrap = h('div');
    var free = !labels || !labels.length;
    var n = free ? (a.args || []).length : labels.length;
    if (!free) while ((a.args || []).length < n) a.args.push(F.fixed('', 'auto'));
    for (var i = 0; i < n; i++) (function (i) {
      var c = h('div', { class: 'card sub' });
      c.appendChild(h('div', { class: 'row sp' }, h('span', { class: 'lbl', text: free ? 'Argumen ' + (i + 1) : labels[i] }),
        free ? h('span', { class: 'row' }, D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(a.args, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(a.args, i, 1); }); }), D.iconBtn('✕', 'hapus', function () { D.act(function () { a.args.splice(i, 1); }); }, 'danger')) : null));
      c.appendChild(E.operand(a.args[i]));
      wrap.appendChild(c);
    })(i);
    if (free) wrap.appendChild(h('button', { class: 'btn sm', text: '+ Argumen', onclick: function () { D.act(function () { a.args.push(F.fixed('', 'auto')); }); } }));
    return wrap;
  };

  /* ---------- kondisi ---------- */
  E.cond = function (holder, key, o) {
    o = o || {};
    var node = holder[key];
    var wrap = h('div');
    if (!node) {
      wrap.appendChild(h('div', { class: 'row' }, h('span', { class: 'help', text: 'Tanpa kondisi: selalu jalan.' }),
        h('button', { class: 'btn sm', text: '+ Tambah kondisi', onclick: function () { D.act(function () { var g1 = F.condGroup('AND'); g1.items.push(F.cond()); holder[key] = g1; }); } })));
      return wrap;
    }
    wrap.appendChild(E.condGroup(node, function () { D.act(function () { holder[key] = null; }); }, o));
    return wrap;
  };
  E.condGroup = function (grp, onDelete, o) {
    var box = h('div', { class: 'cond' });
    box.appendChild(h('div', { class: 'row' },
      D.select(grp, 'op', [['AND', 'SEMUA benar (AND)'], ['OR', 'SALAH SATU benar (OR)'], ['NOT', 'TIDAK satupun (NOT)']], { bare: true }),
      h('button', { class: 'btn sm', text: '+ Kondisi', onclick: function () { D.act(function () { grp.items.push(F.cond()); }); } }),
      h('button', { class: 'btn sm', text: '+ Grup', onclick: function () { D.act(function () { var gg = F.condGroup('OR'); gg.items.push(F.cond()); grp.items.push(gg); }); } }),
      onDelete ? D.iconBtn('Hapus grup', 'hapus', onDelete, 'danger') : null));
    grp.items.forEach(function (it, i) {
      if (it.cmp) {
        var hideRight = it.cmp === 'exists' || it.cmp === 'isNil';
        box.appendChild(h('div', { class: 'c-row' },
          E.operand(it.left, { noCast: true }),
          D.select(it, 'cmp', M.CMP_OPS.map(function (c) { return [c.k, c.label]; }), { bare: true }),
          hideRight ? h('span', { class: 'help', text: '(tanpa nilai pembanding)' }) : E.operand(it.right, { noCast: true }),
          D.iconBtn('✕', 'hapus', function () { D.act(function () { grp.items.splice(i, 1); }); }, 'danger')));
        if (it.cmp === 'between') box.lastChild.appendChild(h('div', { class: 'help', text: 'Isi nilai pembanding dengan "min,maks" (contoh: 1,10).' }));
      } else box.appendChild(E.condGroup(it, function () { D.act(function () { grp.items.splice(i, 1); }); }, o));
    });
    return box;
  };

  // ringkasan kondisi (teks)
  E.opText = function (o) {
    if (!o) return '?'; var c = D.cfg();
    switch (o.src) {
      case 'fixed': return o.value === '' ? '""' : String(o.value);
      case 'widget': var w = W.widget(c, o.ref); return '[' + (w ? w.label || w.type : '?') + ']';
      case 'action': var a = W.byId(c.actions, o.ref); return 'hasil(' + (a ? E.actionName(a) : '?') + ')';
      case 'watcher': var wt = W.byId(c.watchers, o.ref); return (wt ? E.watcherName(wt) : '?') + '.' + (o.field || 'value');
      case 'target': var t = W.byId(c.targets, o.ref); return (t ? t.alias || t.path : '?') + '.' + (o.field || '');
      default: return o.src;
    }
  };
  E.condText = function (c) {
    if (!c) return 'selalu';
    if (c.cmp) return E.opText(c.left) + ' ' + c.cmp + ' ' + (c.cmp === 'exists' || c.cmp === 'isNil' ? '' : E.opText(c.right));
    var j = c.op === 'OR' ? ' ATAU ' : ' DAN '; var p = (c.items || []).map(E.condText).join(j);
    return c.op === 'NOT' ? 'TIDAK(' + p + ')' : '(' + p + ')';
  };

  if (typeof module !== 'undefined') module.exports = E;
})(typeof window !== 'undefined' ? window : globalThis);
