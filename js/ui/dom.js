/* dom.js - helper DOM + field terikat ke store */
(function (g) {
  var LSB = g.LSB = g.LSB || {};
  var U = LSB.util;
  var D = LSB.dom = {};

  D.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) D.add(el, arguments[i]);
    return el;
  };
  D.add = function (el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { D.add(el, x); });
    else if (c.nodeType) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  };
  var h = D.h;

  D.adv = function () { return LSB.store.mode === 'adv'; };
  D.cfg = function () { return LSB.store.cfg; };

  // ubah store. silent = tidak render ulang (dipakai saat mengetik)
  D.set = function (fn, meta) { LSB.store.commit(fn, meta || {}); };
  D.act = function (fn, meta) { LSB.store.commit(fn, Object.assign({ structural: true }, meta || {})); };

  D.toast = function (msg, kind) {
    var t = h('div', { class: 'toast ' + (kind || ''), text: msg });
    document.getElementById('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };

  D.modal = function (title, body, buttons) {
    var root = document.getElementById('modal-root');
    var bg = h('div', { class: 'modal-bg' });
    function close() { bg.remove(); }
    var box = h('div', { class: 'modal' },
      h('div', { class: 'row sp' }, h('h2', { text: title }), h('button', { class: 'btn ghost', text: '✕', onclick: close })),
      body,
      buttons ? h('div', { class: 'row', style: 'margin-top:12px;justify-content:flex-end' }, buttons.map(function (b) {
        return h('button', { class: 'btn ' + (b.cls || ''), text: b.text, onclick: function () { if (b.fn && b.fn(close) === false) return; if (!b.keep) close(); } });
      })) : null);
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) close(); });
    bg.appendChild(box); root.appendChild(bg);
    return close;
  };
  D.confirm = function (msg, yes) {
    D.modal('Konfirmasi', h('p', { text: msg }), [{ text: 'Batal' }, { text: 'Ya', cls: 'primary', fn: function () { yes(); } }]);
  };

  D.copy = function (text) {
    function fallback() {
      var ta = h('textarea', { style: 'position:fixed;left:-999px' }); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); D.toast('Disalin', 'ok'); } catch (e) { D.toast('Gagal menyalin', 'err'); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { D.toast('Disalin', 'ok'); }, fallback); else fallback();
  };
  D.download = function (name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- field terikat ---------- */
  var seq = 0;
  function key(obj, k) { return 'f' + (++seq) + (obj && obj.id || '') + k; }

  // text / number / textarea
  D.text = function (obj, k, o) {
    o = o || {};
    var el = o.area ? h('textarea', { rows: o.rows || 3 }) : h('input', { type: o.number ? 'text' : 'text', inputmode: o.number ? 'decimal' : null });
    el.value = obj[k] == null ? '' : obj[k];
    if (o.ph) el.placeholder = o.ph;
    var ck = key(obj, k);
    el.addEventListener('input', function () {
      var v = el.value;
      D.set(function () { obj[k] = o.number ? (v.trim() === '' ? '' : (isFinite(Number(v)) ? Number(v) : v)) : v; if (o.onset) o.onset(obj); }, { silent: !o.render, coalesce: ck });
    });
    return D.field(o.label, el, o.help);
  };
  D.check = function (obj, k, label, o) {
    o = o || {};
    var el = h('input', { type: 'checkbox', checked: !!obj[k] });
    el.addEventListener('change', function () { D.act(function () { obj[k] = el.checked; }); });
    return h('label', { class: 'chk' }, el, label, o.help ? h('span', { class: 'help', text: ' ' + o.help }) : null);
  };
  // select: opts = [[value,label]] atau [value]
  D.select = function (obj, k, opts, o) {
    o = o || {};
    var el = h('select');
    opts.forEach(function (x) { var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; el.appendChild(h('option', { value: v, text: l })); });
    el.value = obj[k] == null ? '' : obj[k];
    if (el.value !== String(obj[k] == null ? '' : obj[k]) && opts.length && !o.keepInvalid) { /* nilai lama tidak ada */ }
    el.addEventListener('change', function () { D.act(function () { obj[k] = el.value; if (o.onset) o.onset(obj, el.value); }); });
    return o.bare ? el : D.field(o.label, el, o.help);
  };
  D.field = function (label, el, help) {
    return h('div', { class: 'f' }, label ? h('label', { text: label }) : null, el, help ? h('div', { class: 'help', text: help }) : null);
  };

  D.cardHead = function (title, icon, btns) {
    return h('div', { class: 'card-h' }, h('div', { class: 't' }, icon ? h('span', { class: 'ico', text: icon }) : null, title), h('div', { class: 'row' }, btns || []));
  };
  D.iconBtn = function (txt, title, fn, cls) { return h('button', { class: 'btn sm ' + (cls || ''), title: title, text: txt, onclick: function (e) { e.stopPropagation(); fn(e); } }); };
  D.move = function (arr, i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; };
  D.empty = function (msg) { return h('div', { class: 'empty', text: msg }); };

  // sorot syntax Lua sederhana
  D.highlight = function (code) {
    var KW = /^(and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)$/;
    var re = /(--\[\[[\s\S]*?\]\]|--[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\[\[[\s\S]*?\]\])|(\b0x[0-9a-fA-F]+\b|\b\d+\.?\d*\b)|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g;
    var out = '', m;
    while ((m = re.exec(code))) {
      if (m[1]) out += '<span class="c">' + U.esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="s">' + U.esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="nu">' + U.esc(m[3]) + '</span>';
      else if (m[4]) out += KW.test(m[4]) ? '<span class="k">' + m[4] + '</span>' : U.esc(m[4]);
      else out += U.esc(m[5]);
    }
    return out;
  };

  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
