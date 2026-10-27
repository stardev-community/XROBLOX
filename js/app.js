/* app.js - boot, navigasi, header */
(function (g) {
  var LSB = g.LSB, D = LSB.dom, h = D.h, store = LSB.store, UI = LSB.ui;
  var app = LSB.app = {};
  var STEPS = [['project', 'Proyek', '1'], ['targets', 'Target', '2'], ['actions', 'Aksi', '3'], ['logic', 'Logic', '4'], ['ui', 'UI', '5'], ['result', 'Hasil', '6']];
  UI.step = 'project';

  function countFor(k, c) { return { targets: c.targets.length, actions: c.actions.length, logic: c.watchers.length + c.rules.length + c.macros.length, ui: LSB.walk.allWidgets(c).length }[k]; }

  app.render = function () {
    var view = document.getElementById('view'), y = g.scrollY;
    view.innerHTML = '';
    try { view.appendChild(LSB.views[UI.step]()); } catch (e) { view.appendChild(h('pre', { class: 'code', text: 'Error tampilan: ' + (e && e.stack || e) })); console.error(e); }
    app.renderSteps(); app.renderTop();
    g.scrollTo(0, y);
  };
  app.renderSteps = function () {
    var c = store.cfg, nav = document.getElementById('steps'); nav.innerHTML = '';
    var bad = UI.lastValidate && UI.lastValidate.errors;
    STEPS.forEach(function (s) {
      var n = countFor(s[0], c);
      nav.appendChild(h('button', { class: UI.step === s[0] ? 'on' : '', 'data-step': s[0], onclick: function () { app.go(s[0]); } }, h('span', { class: 'n', text: s[2] }), s[1], n ? h('span', { class: 'n', text: String(n) }) : null, (s[0] === 'result' && bad) ? h('span', { class: 'dot' }) : null));
    });
  };
  app.renderTop = function () {
    document.getElementById('b-mode').textContent = 'Mode: ' + (store.mode === 'adv' ? 'Lanjut' : 'Mudah');
    document.getElementById('b-undo').disabled = !store.past.length; document.getElementById('b-redo').disabled = !store.future.length;
  };
  app.go = function (step) { UI.step = step; g.scrollTo(0, 0); app.render(); try { location.hash = step; } catch (e) { } };
  app.jump = function (iss) {
    var map = { project: 'project', target: 'targets', action: 'actions', watcher: 'logic', rule: 'logic', macro: 'logic', profile: 'logic', widget: 'ui', tab: 'ui', ui: 'ui' };
    var step = map[iss.kind] || iss.step || 'project';
    if (iss.kind === 'watcher') UI.logicTab = 'watchers'; if (iss.kind === 'rule') UI.logicTab = 'rules'; if (iss.kind === 'macro') UI.logicTab = 'macros'; if (iss.kind === 'profile') UI.logicTab = 'profiles';
    if (iss.id) UI.open[iss.id] = true;
    if (iss.kind === 'widget') { var f = LSB.walk.allWidgets(store.cfg).filter(function (x) { return x.w.id === iss.id; })[0]; if (f) { UI.tab = store.cfg.ui.tabs.indexOf(f.tab); UI.sel = iss.id; } }
    UI.step = step; app.render();
    setTimeout(function () { var el = document.getElementById('item-' + iss.id); if (el) { el.scrollIntoView({ block: 'center' }); el.style.outline = '2px solid var(--warn)'; setTimeout(function () { el.style.outline = ''; }, 1800); } }, 30);
  };

  app.boot = function () {
    document.getElementById('ver').textContent = 'v' + LSB.VERSION;
    store.restore();
    try { store.mode = localStorage.getItem('lsb:mode') || 'easy'; var th = localStorage.getItem('lsb:theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) { }
    store.subscribe(function (cfg, meta) {
      if (meta && meta.silent) { app.renderTop(); return; }
      app.render();
    });
    document.getElementById('b-undo').onclick = function () { store.undo(); };
    document.getElementById('b-redo').onclick = function () { store.redo(); };
    document.getElementById('b-gen').onclick = function () { app.go('result'); };
    document.getElementById('b-mode').onclick = function () { store.mode = store.mode === 'adv' ? 'easy' : 'adv'; try { localStorage.setItem('lsb:mode', store.mode); } catch (e) { } D.toast(store.mode === 'adv' ? 'Mode Lanjut: semua opsi tampil' : 'Mode Mudah: opsi disederhanakan'); app.render(); };
    document.getElementById('b-theme').onclick = function () { var r = document.documentElement, d = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); r.dataset.theme = d ? 'light' : 'dark'; try { localStorage.setItem('lsb:theme', r.dataset.theme); } catch (e) { } };
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) {
        if (e.key === 'z') { e.preventDefault(); store.undo(); } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) { e.preventDefault(); store.redo(); }
      }
    });
    var hs = (location.hash || '').slice(1); if (STEPS.some(function (s) { return s[0] === hs; })) UI.step = hs;
    app.render();
    // string proyek lewat hash: #p=LSB1:...
    if (/^#p=/.test(location.hash)) { try { store.load(LSB.share.decode(decodeURIComponent(location.hash.slice(3)))); D.toast('Proyek dimuat dari tautan', 'ok'); } catch (e) { } }
  };
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', app.boot);
})(typeof window !== 'undefined' ? window : globalThis);
