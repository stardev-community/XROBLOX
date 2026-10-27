/* views.js - tampilan: Proyek, Target, Aksi, Logic */
(function (g) {
  var LSB = g.LSB, D = LSB.dom, h = D.h, M = LSB.META, F = LSB.make, U = LSB.util, W = LSB.walk, E = LSB.ed;
  var V = LSB.views = {};
  var UI = LSB.ui = LSB.ui || { logicTab: 'watchers', open: {} };

  function head(title, lead) { return h('div', null, h('h2', { text: title }), lead ? h('p', { class: 'lead', text: lead }) : null); }
  function toggleOpen(id) { UI.open[id] = !UI.open[id]; LSB.app.render(); }
  function del(arr, i, what, cb) { D.confirm('Hapus ' + what + '?', function () { D.act(function () { arr.splice(i, 1); if (cb) cb(); }); }); }
  function cardId(id) { return 'item-' + id; }

  /* ===================================================== PROYEK */
  V.project = function () {
    var cfg = D.cfg(), P = cfg.project, root = h('div');
    root.appendChild(head('Proyek', 'Atur nama script dan tampilan window. Hasil akhir: satu file <nama>.lua.'));
    var c1 = h('div', { class: 'card' });
    c1.appendChild(h('div', { class: 'grid' },
      D.text(P, 'name', { label: 'Nama script (nama file)', help: 'Menjadi ' + U.fileName(P.name) + '.lua' }),
      D.text(P, 'title', { label: 'Judul window' }),
      D.text(P, 'subtitle', { label: 'Subjudul (opsional)' }),
      D.select(P, 'theme', M.THEME_NAMES.map(function (t) { return [t, t]; }), { label: 'Tema LuluUI' }),
      D.text(P, 'width', { label: 'Lebar window', number: true }), D.text(P, 'height', { label: 'Tinggi window', number: true })));
    c1.appendChild(h('div', { style: 'margin-top:10px' }, D.text(P, 'luluUrl', { label: 'URL Raw LuluUI.lua (GitHub)', help: 'Upload LuluUI.lua dari ZIP ke repo GitHub, buka tombol Raw, salin URL-nya ke sini.' })));
    root.appendChild(c1);

    var c2 = h('div', { class: 'card' }, h('b', { text: 'Opsi' }));
    c2.appendChild(h('div', { class: 'grid', style: 'margin-top:8px' },
      D.check(P, 'autosave', 'Simpan pengaturan widget (writefile)'), D.check(P, 'infoTab', 'Tab Info (Stop Semua, Simpan, Log)'),
      D.check(P, 'skipLoading', 'Lewati layar loading'), D.check(P, 'comments', 'Sertakan komentar di kode'),
      D.check(P, 'debug', 'Mode debug (log lebih rinci)'), D.check(P, 'minify', 'Minify (hapus komentar)')));
    root.appendChild(c2);

    var c3 = h('div', { class: 'card' }, h('b', { text: 'Pembatas game (opsional)' }), h('p', { class: 'help', text: 'Script hanya cocok untuk game tertentu? Isi PlaceId, dipisah koma.' }));
    var pi = h('input', { placeholder: 'contoh: 1234567, 7654321' }); pi.value = (P.placeIds || []).join(', ');
    pi.addEventListener('input', function () { D.set(function () { P.placeIds = pi.value.split(/[,\s]+/).filter(Boolean).map(Number).filter(function (n) { return n > 0 || isNaN(n) === false; }); }, { silent: true, coalesce: 'pid' }); });
    c3.appendChild(h('div', { class: 'grid' }, D.field('PlaceId', pi), D.select(P, 'placeGuard', [['warn', 'Peringatkan saja'], ['stop', 'Hentikan script'], ['hold', 'Tahan (tombol jalankan manual)']], { label: 'Jika game tidak cocok' })));
    root.appendChild(c3);

    if (D.adv()) {
      var c4 = h('div', { class: 'card' }, h('b', { text: 'Lanjutan' }));
      c4.appendChild(h('div', { class: 'grid', style: 'margin-top:8px' },
        D.text(P, 'resolveTimeout', { label: 'Timeout cari path (detik)', number: true }), D.text(P, 'maxActionsPerSecond', { label: 'Batas aksi / detik', number: true }), D.text(P, 'ruleBurst', { label: 'Batas rule burst', number: true }),
        D.text(P, 'loadingTitle', { label: 'Loading: judul' }), D.text(P, 'loadingDesc', { label: 'Loading: deskripsi' }), D.text(P, 'loadingCreator', { label: 'Loading: kreator' })));
      root.appendChild(c4);
    }

    root.appendChild(h('h3', { text: 'Mulai dari template' }));
    root.appendChild(h('p', { class: 'help', text: 'Memilih template mengganti seluruh isi proyek (bisa di-undo).' }));
    root.appendChild(h('div', { class: 'grid' }, LSB.templates.map(function (t) {
      return h('button', { class: 'card tpl', onclick: function () {
        var go = function () { var c = t.build(); c.project.luluUrl = D.cfg().project.luluUrl; c.project.theme = D.cfg().project.theme; LSB.store.load(c); D.toast('Template "' + t.name + '" dimuat', 'ok'); };
        var cur = D.cfg(); if (cur.targets.length || cur.actions.length || cur.rules.length) D.confirm('Ganti isi proyek saat ini dengan template "' + t.name + '"?', go); else go();
      } }, h('span', { class: 'i', text: t.icon }), h('span', null, h('b', { text: t.name }), h('div', { class: 'help', text: t.desc })));
    })));
    return root;
  };

  /* ===================================================== TARGET */
  V.targets = function () {
    var cfg = D.cfg(), root = h('div');
    root.appendChild(head('Target (path)', 'Daftar Remote, Value, objek, dan lainnya yang akan dipakai. Satu target bisa dipakai banyak aksi dan watcher.'));
    root.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn primary', text: '+ Tambah target', onclick: function () { D.act(function (c) { c.targets.push(F.target({ alias: LSB.tools.uniqAlias(c, 'Target') })); }); } }),
      h('button', { class: 'btn', text: '⬇ Impor path / hasil spy', onclick: LSB.tools.importDialog }),
      h('button', { class: 'btn', text: '🔍 Snippet pencari path', onclick: LSB.tools.snippetDialog })));
    if (!cfg.targets.length) root.appendChild(D.empty('Belum ada target. Tambahkan manual, atau pakai snippet pencari path lalu impor hasilnya.'));
    cfg.targets.forEach(function (t, i) {
      var used = cfg.actions.filter(function (a) { return a.targetId === t.id; }).length + cfg.watchers.filter(function (w) { return w.targetId === t.id; }).length;
      var card = h('div', { class: 'card', id: cardId(t.id) });
      card.appendChild(D.cardHead(t.alias || t.path || 'Target ' + (i + 1), '🎯', [
        h('span', { class: 'pill', text: used + ' dipakai' }),
        D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(cfg.targets, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(cfg.targets, i, 1); }); }),
        D.iconBtn('⧉', 'gandakan', function () { D.act(function (c) { var n = U.clone(t); n.id = U.uid('t'); n.alias = LSB.tools.uniqAlias(c, t.alias || 'Target'); c.targets.splice(i + 1, 0, n); }); }),
        D.iconBtn('🗑', 'hapus', function () { del(cfg.targets, i, 'target ini' + (used ? ' (dipakai ' + used + ' item)' : ''), function () { }); }, 'danger')]));
      card.appendChild(h('div', { class: 'grid g2', style: 'margin-top:8px' },
        D.text(t, 'path', { label: 'Path', ph: 'ReplicatedStorage.Remotes.Collect', help: 'Mulai dari service. Pakai "/" sebagai pemisah bila nama mengandung titik.' }),
        D.text(t, 'alias', { label: 'Alias (nama pendek)' }),
        D.select(t, 'type', M.TARGET_TYPES.map(function (x) { return [x.k, x.label]; }), { label: 'Jenis' }),
        D.text(t, 'note', { label: 'Catatan' })));
      root.appendChild(card);
    });
    return root;
  };

  /* ===================================================== AKSI */
  function actionFields(a) {
    var k = M.actionKind(a.kind), box = h('div'), cfg = D.cfg();
    if (!k) return box;
    var g1 = h('div', { class: 'grid g2' });
    if (k.target) g1.appendChild(D.select(a, 'targetId', E.targets(), { label: k.target === 'optional' ? 'Target (opsional)' : 'Target' }));
    if (a.kind === 'get') g1.appendChild(D.select(a, 'mode', [['property', 'Property / Value'], ['attribute', 'Attribute'], ['children', 'Daftar anak (untuk Dropdown)'], ['childCount', 'Jumlah anak'], ['exists', 'Ada / tidak']], { label: 'Yang dibaca' }));
    if (a.kind === 'set') g1.appendChild(D.select(a, 'mode', [['property', 'Property / Value'], ['attribute', 'Attribute']], { label: 'Yang diubah' }));
    if ((a.kind === 'get' && ['property', 'attribute'].indexOf(a.mode) >= 0) || a.kind === 'set') g1.appendChild(D.text(a, 'prop', { label: a.mode === 'attribute' ? 'Nama attribute' : 'Nama property', ph: 'Value' }));
    if (a.kind === 'setwidget') g1.appendChild(D.select(a, 'widgetId', E.widgets(true), { label: 'Widget tujuan' }));
    if (a.kind === 'setvar') g1.appendChild(D.text(a, 'varName', { label: 'Nama variabel' }));
    if (a.kind === 'runrule') g1.appendChild(D.select(a, 'ref', E.rules(), { label: 'Rule' }));
    if (a.kind === 'runmacro') g1.appendChild(D.select(a, 'ref', E.macros(), { label: 'Makro' }));
    if (a.kind === 'log' || a.kind === 'notify') g1.appendChild(D.select(a, 'level', [['info', 'Info'], ['success', 'Sukses'], ['warning', 'Peringatan'], ['error', 'Error']], { label: 'Tingkat' }));
    if (a.kind === 'log') g1.appendChild(D.check(a, 'toNotify', 'Tampilkan juga sebagai notifikasi'));
    if (g1.children.length) box.appendChild(g1);

    if (a.kind === 'custom') box.appendChild(D.text(a, 'code', { area: true, rows: 6, label: 'Kode Lua', help: 'Tersedia: ctx, S (nilai widget), R (hasil aksi), T("id"), LP, Log("pesan"). Jangan membuat UI lain — hanya LuluUI.' }));
    if (a.kind === 'loop') {
      var st = h('div', { class: 'card sub' }, h('b', { text: 'Langkah yang diulang' }));
      (a.steps || []).forEach(function (sid, i) {
        st.appendChild(h('div', { class: 'row', style: 'margin-top:6px' }, D.select(a.steps, i, E.actions().filter(function (x) { return x[0] !== a.id; }), { bare: true }),
          D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(a.steps, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(a.steps, i, 1); }); }), D.iconBtn('✕', 'hapus', function () { D.act(function () { a.steps.splice(i, 1); }); }, 'danger')));
      });
      st.appendChild(h('button', { class: 'btn sm', style: 'margin-top:6px', text: '+ Langkah', onclick: function () { D.act(function () { a.steps.push(''); }); } }));
      box.appendChild(st);
      var un = h('div', { class: 'card sub' }, h('b', { text: 'Berhenti saat kondisi terpenuhi (opsional)' })); un.appendChild(E.cond(a, 'until')); box.appendChild(un);
    }
    if (k.argLabels && k.argLabels.length && a.kind !== 'loop' || a.kind === 'loop') box.appendChild(E.args(a, k.argLabels));
    else if (k.free) box.appendChild(E.args(a, null));
    if (k.needs) box.appendChild(h('div', { class: 'help', text: 'Butuh fungsi executor: ' + k.needs.join(', ') + '.' }));
    if (D.adv()) {
      box.appendChild(h('details', null, h('summary', { text: 'Opsi lanjutan aksi' }), h('div', { class: 'grid' },
        D.text(a, 'retry', { label: 'Ulangi bila gagal (maks 5)', number: true }), D.text(a, 'delay', { label: 'Tunda sebelum jalan (detik)', number: true }),
        D.text(a, 'after', { label: 'Jeda setelah jalan (detik)', number: true }), D.text(a, 'cooldown', { label: 'Cooldown (detik)', number: true }),
        D.check(a, 'ignoreError', 'Abaikan error (jangan hentikan rule)'))));
    }
    return box;
  }

  V.actions = function () {
    var cfg = D.cfg(), root = h('div');
    root.appendChild(head('Aksi', 'Apa yang dilakukan script. Satu target boleh punya banyak aksi, masing-masing dengan argumen sendiri.'));
    var sel = h('select'); sel.appendChild(h('option', { value: '', text: '+ Tambah aksi…' }));
    M.ACTION_KINDS.filter(function (k) { return D.adv() || !k.advanced; }).forEach(function (k) { sel.appendChild(h('option', { value: k.k, text: k.icon + ' ' + k.label })); });
    sel.addEventListener('change', function () { if (!sel.value) return; var kind = sel.value; D.act(function (c) { var a = F.action(kind); if (kind === 'loop') a.args = [F.fixed('1', 'number'), F.fixed('0', 'number')]; c.actions.push(a); UI.open[a.id] = true; }); });
    root.appendChild(h('div', { class: 'row' }, h('div', { style: 'min-width:240px' }, sel)));
    if (!cfg.actions.length) root.appendChild(D.empty('Belum ada aksi. Pilih jenis aksi di atas.'));
    cfg.actions.forEach(function (a, i) {
      var k = M.actionKind(a.kind), tg = W.byId(cfg.targets, a.targetId), open = !!UI.open[a.id];
      var card = h('div', { class: 'card', id: cardId(a.id) });
      card.appendChild(h('div', { class: 'card-h', style: 'cursor:pointer', onclick: function () { toggleOpen(a.id); } },
        h('div', { class: 't' }, h('span', { class: 'ico', text: k ? k.icon : '?' }), h('span', { text: E.actionName(a) }), tg ? h('span', { class: 'pill', text: '→ ' + (tg.alias || tg.path) }) : null),
        h('div', { class: 'row' }, D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(cfg.actions, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(cfg.actions, i, 1); }); }),
          D.iconBtn('⧉', 'gandakan', function () { D.act(function (c) { var n = U.clone(a); n.id = U.uid('a'); n.name = (a.name || '') + ' (salinan)'; c.actions.splice(i + 1, 0, n); }); }),
          D.iconBtn('🗑', 'hapus', function () { del(cfg.actions, i, 'aksi ini'); }, 'danger'), h('span', { text: open ? '▾' : '▸' }))));
      if (open) {
        var b = h('div', { style: 'margin-top:8px' });
        b.appendChild(h('div', { class: 'grid g2' }, D.text(a, 'name', { label: 'Nama aksi', ph: 'contoh: Ambil koin', render: false }), D.select(a, 'kind', M.ACTION_KINDS.filter(function (x) { return D.adv() || !x.advanced || x.k === a.kind; }).map(function (x) { return [x.k, x.icon + ' ' + x.label]; }), { label: 'Jenis' })));
        if (k) b.appendChild(h('div', { class: 'help', text: k.help }));
        b.appendChild(actionFields(a));
        card.appendChild(b);
      }
      root.appendChild(card);
    });
    return root;
  };

  /* ===================================================== LOGIC */
  function watcherFields(w) {
    var k = M.watcherKind(w.kind), box = h('div'), g1 = h('div', { class: 'grid g2' });
    if (k.target) g1.appendChild(D.select(w, 'targetId', E.targets(), { label: 'Target' }));
    var f = k.fields || [];
    if (f.indexOf('attr') >= 0) g1.appendChild(D.text(w, 'attr', { label: 'Nama attribute' }));
    if (f.indexOf('prop') >= 0) g1.appendChild(D.text(w, 'prop', { label: 'Nama property' }));
    if (f.indexOf('nameFilter') >= 0) g1.appendChild(D.text(w, 'nameFilter', { label: 'Filter nama (opsional)' }));
    if (f.indexOf('classFilter') >= 0) g1.appendChild(D.text(w, 'classFilter', { label: 'Filter class (opsional)', ph: 'Part, Model…' }));
    if (f.indexOf('fireExisting') >= 0) g1.appendChild(D.check(w, 'fireExisting', 'Proses juga yang sudah ada saat mulai'));
    if (f.indexOf('radius') >= 0) g1.appendChild(D.text(w, 'radius', { label: 'Radius (stud)', number: true }));
    if (f.indexOf('pollEvery') >= 0) g1.appendChild(D.text(w, 'pollEvery', { label: 'Cek tiap (detik)', number: true }));
    if (f.indexOf('onlyEnter') >= 0) g1.appendChild(D.check(w, 'onlyEnter', 'Hanya saat masuk radius'));
    if (f.indexOf('startDelay') >= 0) g1.appendChild(D.text(w, 'startDelay', { label: 'Tunda awal (detik)', number: true }));
    if (f.indexOf('key') >= 0) g1.appendChild(D.select(w, 'key', M.KEYS.map(function (x) { return [x, x]; }), { label: 'Tombol' }));
    if (f.indexOf('existsOn') >= 0) g1.appendChild(D.select(w, 'existsOn', [['appear', 'Saat muncul'], ['disappear', 'Saat hilang'], ['both', 'Keduanya']], { label: 'Picu' }));
    if (f.indexOf('fireOnStart') >= 0) g1.appendChild(D.check(w, 'fireOnStart', 'Picu juga untuk karakter yang sudah ada'));
    if (g1.children.length) box.appendChild(g1);
    if (f.indexOf('intervalOp') >= 0) box.appendChild(h('div', { class: 'card sub' }, h('b', { text: 'Interval (detik)' }), E.operand(w.intervalOp, { noCast: true })));
    if (f.indexOf('filter') >= 0) {
      var ft = w.filter;
      box.appendChild(h('div', { class: 'card sub' }, D.check(ft, 'enabled', 'Filter argumen dari server'), ft.enabled ? h('div', { class: 'grid' },
        D.text(ft, 'index', { label: 'Argumen ke-', number: true }), D.select(ft, 'op', M.CMP_OPS.map(function (c) { return [c.k, c.label]; }), { label: 'Operator' }), D.text(ft, 'value', { label: 'Nilai' })) : null));
    }
    box.appendChild(h('div', { class: 'help', text: 'Output yang bisa dipakai: ' + ((k.outputs || []).join(', ') || '(tidak ada)') }));
    return box;
  }

  function logicWatchers(root) {
    var cfg = D.cfg();
    var sel = h('select'); sel.appendChild(h('option', { value: '', text: '+ Tambah watcher (apa yang dipantau)…' }));
    M.WATCHER_KINDS.forEach(function (k) { sel.appendChild(h('option', { value: k.k, text: k.icon + ' ' + k.label })); });
    sel.addEventListener('change', function () { if (!sel.value) return; var kind = sel.value; D.act(function (c) { var w = F.watcher(kind); c.watchers.push(w); UI.open[w.id] = true; }); });
    root.appendChild(h('div', { class: 'row' }, h('div', { style: 'min-width:260px' }, sel)));
    root.appendChild(h('p', { class: 'help', text: 'Watcher = pemicu. Ia memantau sesuatu (nilai berubah, objek muncul, timer, tombol…) lalu memicu Rule.' }));
    if (!cfg.watchers.length) root.appendChild(D.empty('Belum ada watcher.'));
    cfg.watchers.forEach(function (w, i) {
      var k = M.watcherKind(w.kind), open = !!UI.open[w.id], uses = cfg.rules.filter(function (r) { return r.when === w.id; }).length;
      var card = h('div', { class: 'card', id: cardId(w.id) });
      card.appendChild(h('div', { class: 'card-h', style: 'cursor:pointer', onclick: function () { toggleOpen(w.id); } },
        h('div', { class: 't' }, h('span', { class: 'ico', text: k.icon }), E.watcherName(w), h('span', { class: 'pill', text: uses + ' rule' })),
        h('div', { class: 'row' }, D.iconBtn('⧉', 'gandakan', function () { D.act(function (c) { var n = U.clone(w); n.id = U.uid('w'); c.watchers.splice(i + 1, 0, n); }); }), D.iconBtn('🗑', 'hapus', function () { del(cfg.watchers, i, 'watcher ini'); }, 'danger'), h('span', { text: open ? '▾' : '▸' }))));
      if (open) {
        card.appendChild(h('div', { style: 'margin-top:8px' }, h('div', { class: 'grid g2' }, D.text(w, 'name', { label: 'Nama watcher' }), D.select(w, 'kind', M.WATCHER_KINDS.map(function (x) { return [x.k, x.icon + ' ' + x.label]; }), { label: 'Jenis' })),
          h('div', { class: 'help', text: k.help }), watcherFields(w), D.check(w, 'enabled', 'Aktif saat script mulai')));
      }
      root.appendChild(card);
    });
  }

  function stepsEditor(r) {
    var box = h('div', { class: 'card sub' }, h('b', { text: 'Aksi yang dijalankan' }));
    (r.steps || []).forEach(function (s, i) {
      box.appendChild(h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'pill', text: String(i + 1) }), h('div', { style: 'flex:1;min-width:160px' }, D.select(s, 'id', E.actions(), { bare: true })),
        h('div', { style: 'width:110px' }, D.text(s, 'delay', { number: true, ph: 'tunda (dtk)' }).querySelector('input')),
        D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(r.steps, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(r.steps, i, 1); }); }), D.iconBtn('✕', 'hapus', function () { D.act(function () { r.steps.splice(i, 1); }); }, 'danger')));
    });
    box.appendChild(h('button', { class: 'btn sm', style: 'margin-top:6px', text: '+ Tambah aksi', onclick: function () { D.act(function () { r.steps.push({ id: '', delay: 0 }); }); } }));
    return box;
  }

  function ruleFlow(r) {
    var cfg = D.cfg(), w = W.byId(cfg.watchers, r.when);
    var fl = h('div', { class: 'flow' }, h('span', { class: 'node', text: '📡 ' + (w ? E.watcherName(w) : '?') }), h('span', { class: 'ar', text: '→' }),
      h('span', { class: 'node', text: '❓ ' + E.condText(r.cond) }), h('span', { class: 'ar', text: '→' }));
    (r.steps || []).forEach(function (s, i) { var a = W.byId(cfg.actions, s.id); if (i) fl.appendChild(h('span', { class: 'ar', text: r.mode === 'parallel' ? '+' : '›' })); fl.appendChild(h('span', { class: 'node', text: a ? E.actionName(a) : '?' })); });
    return fl;
  }

  function logicRules(root) {
    var cfg = D.cfg();
    root.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn primary', text: '+ Tambah rule', onclick: function () { D.act(function (c) { var r = F.rule({ name: 'Rule ' + (c.rules.length + 1), when: c.watchers[0] ? c.watchers[0].id : '' }); c.rules.push(r); UI.open[r.id] = true; }); } })));
    root.appendChild(h('p', { class: 'help', text: 'Rule = "jika watcher memicu DAN kondisi benar, maka jalankan aksi". Kondisi boleh memakai nilai widget, hasil aksi, output watcher, dll.' }));
    if (!cfg.rules.length) root.appendChild(D.empty('Belum ada rule.'));
    cfg.rules.forEach(function (r, i) {
      var open = !!UI.open[r.id];
      var card = h('div', { class: 'card', id: cardId(r.id) });
      card.appendChild(h('div', { class: 'card-h', style: 'cursor:pointer', onclick: function () { toggleOpen(r.id); } }, h('div', { class: 't' }, h('span', { class: 'ico', text: '⚙️' }), r.name || r.id),
        h('div', { class: 'row' }, D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(cfg.rules, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(cfg.rules, i, 1); }); }),
          D.iconBtn('⧉', 'gandakan', function () { D.act(function (c) { var n = U.clone(r); n.id = U.uid('r'); n.name = (r.name || '') + ' (salinan)'; c.rules.splice(i + 1, 0, n); }); }), D.iconBtn('🗑', 'hapus', function () { del(cfg.rules, i, 'rule ini'); }, 'danger'), h('span', { text: open ? '▾' : '▸' }))));
      card.appendChild(ruleFlow(r));
      if (open) {
        var b = h('div', { style: 'margin-top:8px' });
        b.appendChild(h('div', { class: 'grid g2' }, D.text(r, 'name', { label: 'Nama rule' }), D.select(r, 'when', E.watchers(), { label: 'Dipicu oleh (watcher)' })));
        b.appendChild(h('div', { class: 'card sub' }, h('b', { text: 'Kondisi' }), E.cond(r, 'cond')));
        b.appendChild(stepsEditor(r));
        b.appendChild(h('div', { class: 'grid' }, D.text(r, 'cooldown', { label: 'Cooldown (detik)', number: true }), D.text(r, 'maxRuns', { label: 'Maks jalan (0 = tanpa batas)', number: true }),
          D.select(r, 'onFail', [['continue', 'Aksi gagal → lanjut'], ['stop', 'Aksi gagal → berhenti'], ['fallback', 'Aksi gagal → aksi cadangan']], { label: 'Jika aksi gagal' }),
          r.onFail === 'fallback' ? D.select(r, 'fallback', E.actions(), { label: 'Aksi cadangan' }) : null));
        if (D.adv()) b.appendChild(h('div', { class: 'grid' }, D.select(r, 'mode', [['sequence', 'Berurutan'], ['parallel', 'Bersamaan']], { label: 'Cara jalan' }), D.text(r, 'priority', { label: 'Prioritas', number: true }), D.check(r, 'allowOverlap', 'Boleh tumpang tindih')));
        b.appendChild(D.check(r, 'enabled', 'Aktif saat script mulai (jika tidak terhubung Toggle)'));
        card.appendChild(b);
      }
      root.appendChild(card);
    });
  }

  function logicMacros(root) {
    var cfg = D.cfg();
    root.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn primary', text: '+ Tambah makro', onclick: function () { D.act(function (c) { var m = F.macro({ name: 'Makro ' + (c.macros.length + 1) }); c.macros.push(m); UI.open[m.id] = true; }); } })));
    root.appendChild(h('p', { class: 'help', text: 'Makro = urutan aksi dan jeda yang bisa diulang. Hubungkan ke Toggle/Button di UI.' }));
    if (!cfg.macros.length) root.appendChild(D.empty('Belum ada makro.'));
    cfg.macros.forEach(function (m, i) {
      var open = !!UI.open[m.id], card = h('div', { class: 'card', id: cardId(m.id) });
      card.appendChild(h('div', { class: 'card-h', style: 'cursor:pointer', onclick: function () { toggleOpen(m.id); } }, h('div', { class: 't' }, h('span', { class: 'ico', text: '🎬' }), m.name || m.id, h('span', { class: 'pill', text: (m.steps || []).length + ' langkah' })),
        h('div', { class: 'row' }, D.iconBtn('🗑', 'hapus', function () { del(cfg.macros, i, 'makro ini'); }, 'danger'), h('span', { text: open ? '▾' : '▸' }))));
      if (open) {
        var b = h('div', { style: 'margin-top:8px' }, h('div', { class: 'grid' }, D.text(m, 'name', { label: 'Nama makro' }), D.check(m, 'loop', 'Ulangi terus (loop)'), m.loop ? D.text(m, 'interval', { label: 'Jeda antar putaran (detik)', number: true }) : D.text(m, 'count', { label: 'Jumlah putaran', number: true })));
        (m.steps || []).forEach(function (s, j) {
          var isWait = s.wait != null && s.action == null;
          b.appendChild(h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'pill', text: String(j + 1) }),
            isWait ? h('div', { style: 'flex:1;min-width:140px' }, D.text(s, 'wait', { number: true, ph: 'tunggu (detik)' }).querySelector('input')) : h('div', { style: 'flex:1;min-width:160px' }, D.select(s, 'action', E.actions(), { bare: true })),
            h('span', { class: 'pill', text: isWait ? '⏱ tunggu' : '▶ aksi' }),
            D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(m.steps, j, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(m.steps, j, 1); }); }), D.iconBtn('✕', 'hapus', function () { D.act(function () { m.steps.splice(j, 1); }); }, 'danger')));
        });
        b.appendChild(h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn sm', text: '+ Aksi', onclick: function () { D.act(function () { m.steps.push({ action: '' }); }); } }), h('button', { class: 'btn sm', text: '+ Tunggu', onclick: function () { D.act(function () { m.steps.push({ wait: 1 }); }); } })));
        card.appendChild(b);
      }
      root.appendChild(card);
    });
  }

  function logicProfiles(root) {
    var cfg = D.cfg();
    root.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn primary', text: '+ Tambah profil', onclick: function () { D.act(function (c) { var p = F.profile({ name: 'Profil ' + (c.profiles.length + 1) }); c.profiles.push(p); UI.open['prof' + (c.profiles.length - 1)] = true; }); } })));
    root.appendChild(h('p', { class: 'help', text: 'Profil = kumpulan nilai widget siap pakai (contoh: "Santai", "Cepat"). Pilih lewat Dropdown yang diikat ke "Pilih Profil".' }));
    if (!cfg.profiles.length) root.appendChild(D.empty('Belum ada profil.'));
    var vw = W.allWidgets(cfg).filter(function (x) { return M.VALUE_WIDGETS.indexOf(x.w.type) >= 0; });
    cfg.profiles.forEach(function (p, i) {
      var key = 'prof' + i, open = !!UI.open[key], card = h('div', { class: 'card' });
      card.appendChild(h('div', { class: 'card-h', style: 'cursor:pointer', onclick: function () { toggleOpen(key); } }, h('div', { class: 't' }, h('span', { class: 'ico', text: '🎛️' }), p.name), h('div', { class: 'row' }, D.iconBtn('🗑', 'hapus', function () { del(cfg.profiles, i, 'profil ini'); }, 'danger'), h('span', { text: open ? '▾' : '▸' }))));
      if (open) {
        var b = h('div', { style: 'margin-top:8px' }, D.text(p, 'name', { label: 'Nama profil' }));
        if (!vw.length) b.appendChild(D.empty('Belum ada widget bernilai (Toggle, NumberInput, …).'));
        vw.forEach(function (x) {
          var wd = x.w, on = Object.prototype.hasOwnProperty.call(p.values, wd.id);
          var cb = h('input', { type: 'checkbox', checked: on, onchange: function () { D.act(function () { if (cb.checked) p.values[wd.id] = wd.default != null ? wd.default : (wd.type === 'Toggle' ? false : ''); else delete p.values[wd.id]; }); } });
          var ctl = null;
          if (on) {
            if (wd.type === 'Toggle') ctl = D.select(p.values, wd.id, [['false', 'OFF'], ['true', 'ON']], { bare: true, onset: function (o, v) { o[wd.id] = v === 'true'; } }), ctl.value = String(!!p.values[wd.id]);
            else if (wd.type === 'NumberInput') ctl = D.text(p.values, wd.id, { number: true }).querySelector('input');
            else if ((wd.type === 'Dropdown' || wd.type === 'Segment') && (wd.options || []).length) ctl = D.select(p.values, wd.id, wd.options, { bare: true });
            else if (wd.type === 'MultiDropdown') { ctl = h('input', { placeholder: 'pisahkan dengan koma' }); ctl.value = (p.values[wd.id] || []).join(','); ctl.addEventListener('input', function () { D.set(function () { p.values[wd.id] = ctl.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); }, { silent: true, coalesce: 'pm' + wd.id }); }); }
            else ctl = D.text(p.values, wd.id).querySelector('input');
          }
          b.appendChild(h('div', { class: 'row', style: 'margin-top:6px' }, h('label', { class: 'chk', style: 'min-width:200px' }, cb, (wd.label || wd.type)), ctl ? h('div', { style: 'flex:1;min-width:120px' }, ctl) : null));
        });
        card.appendChild(b);
      }
      root.appendChild(card);
    });
  }

  V.logic = function () {
    var cfg = D.cfg(), root = h('div');
    root.appendChild(head('Logic', 'Hubungkan pemicu, kondisi, dan aksi.'));
    var tabs = [['watchers', 'Watcher (' + cfg.watchers.length + ')'], ['rules', 'Rule (' + cfg.rules.length + ')'], ['macros', 'Makro (' + cfg.macros.length + ')'], ['profiles', 'Profil (' + cfg.profiles.length + ')']];
    root.appendChild(h('div', { class: 'tabs' }, tabs.map(function (t) { return h('button', { class: UI.logicTab === t[0] ? 'on' : '', text: t[1], onclick: function () { UI.logicTab = t[0]; LSB.app.render(); } }); })));
    if (UI.logicTab === 'rules') logicRules(root); else if (UI.logicTab === 'macros') logicMacros(root); else if (UI.logicTab === 'profiles') logicProfiles(root); else logicWatchers(root);
    return root;
  };

  if (typeof module !== 'undefined') module.exports = V;
})(typeof window !== 'undefined' ? window : globalThis);
