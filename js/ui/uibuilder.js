/* uibuilder.js - UI builder: tab, widget, binding, pratinjau */
(function (g) {
  var LSB = g.LSB, D = LSB.dom, h = D.h, M = LSB.META, F = LSB.make, U = LSB.util, W = LSB.walk, E = LSB.ed;
  var V = LSB.views, UI = LSB.ui;
  UI.tab = UI.tab || 0; UI.sel = UI.sel || '';

  function bindEditor(wd, bk, type) {
    var b = wd[bk]; if (!b) b = wd[bk] = { kind: 'none', ref: '' };
    var kinds = M.BIND_KINDS[type === 'HalfButtons' ? 'Button' : type];
    if (!kinds) return null;
    var box = h('div', { class: 'grid g2' });
    box.appendChild(D.select(b, 'kind', kinds, { label: type === 'HalfButtons' ? 'Fungsi tombol ' + (bk === 'bind' ? 'A' : 'B') : 'Dihubungkan ke', onset: function (o) { o.ref = ''; } }));
    var list = { rule: E.rules(), watcher: E.watchers(), macro: E.macros(), action: E.actions() }[b.kind];
    if (b.kind === 'refresh') list = E.widgets(false).filter(function (x) { var w = W.widget(D.cfg(), x[0]); return x[0] === '' || (w && w.type === 'Dropdown'); });
    if (list) box.appendChild(D.select(b, 'ref', list, { label: 'Pilih' }));
    return box;
  }

  function widgetFields(wd) {
    var box = h('div'), t = wd.type, cfg = D.cfg();
    var g1 = h('div', { class: 'grid g2' });
    if (t !== 'Divider') g1.appendChild(D.text(wd, 'label', { label: t === 'Label' || t === 'Badge' ? 'Teks' : 'Label' }));
    if (['Toggle', 'Button', 'NumberInput', 'TextInput', 'Dropdown', 'MultiDropdown', 'Segment', 'InfoLabel'].indexOf(t) >= 0) g1.appendChild(D.text(wd, 'subtext', { label: 'Keterangan kecil (opsional)' }));
    if (t === 'Label') { g1.appendChild(D.text(wd, 'size', { label: 'Ukuran font', number: true })); g1.appendChild(D.check(wd, 'bold', 'Tebal')); }
    if (t === 'Badge' || t === 'Button') g1.appendChild(D.text(wd, 'color', { label: 'Warna hex (opsional)', ph: '#ff4466' }));
    if (t === 'HalfButtons') g1.appendChild(D.text(wd, 'label2', { label: 'Label tombol B' }));
    if (t === 'Toggle') g1.appendChild(D.check(wd, 'default', 'Aktif secara default'));
    if (t === 'NumberInput') ['default', 'min', 'max', 'step'].forEach(function (k) { g1.appendChild(D.text(wd, k, { label: { default: 'Nilai awal', min: 'Minimum', max: 'Maksimum', step: 'Langkah' }[k], number: true })); });
    if (t === 'TextInput') { g1.appendChild(D.text(wd, 'default', { label: 'Nilai awal' })); g1.appendChild(D.text(wd, 'placeholder', { label: 'Placeholder' })); }
    if (t === 'ProgressBar') g1.appendChild(D.text(wd, 'max', { label: 'Nilai maksimum', number: true }));
    if (t === 'List') { g1.appendChild(D.text(wd, 'height', { label: 'Tinggi', number: true })); g1.appendChild(D.check(wd, 'isLog', 'Jadikan tujuan log (aksi Log menulis ke sini)')); }
    if (t === 'CopyButton') g1.appendChild(D.text(wd, 'value', { label: 'Teks yang disalin' }));
    if (t === 'Accordion') g1.appendChild(D.check(wd, 'open', 'Terbuka secara default'));
    if (M.VALUE_WIDGETS.indexOf(t) >= 0) g1.appendChild(D.check(wd, 'persist', 'Simpan nilai antar sesi'));
    if (['Toggle', 'Button', 'NumberInput', 'TextInput', 'Dropdown', 'Segment'].indexOf(t) >= 0) g1.appendChild(D.check(wd, 'locked', 'Terkunci (ikon gembok)'));
    box.appendChild(g1);

    if (t === 'Dropdown' || t === 'MultiDropdown' || t === 'Segment') {
      var ta = h('textarea', { rows: 4 }); ta.value = (wd.options || []).join('\n');
      ta.addEventListener('input', function () { D.set(function () { wd.options = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }, { silent: true, coalesce: 'o' + wd.id }); });
      box.appendChild(h('div', { class: 'grid g2', style: 'margin-top:8px' }, D.field('Opsi (satu per baris)', ta),
        h('div', null, t !== 'MultiDropdown' ? D.select(wd, 'default', [['', '(pertama)']].concat((wd.options || []).map(function (o) { return [o, o]; })), { label: 'Nilai awal' }) : null,
          t !== 'Segment' ? D.select(wd, 'optionsFrom', E.actions(), { label: 'Isi opsi dari aksi (Get anak / Invoke)', help: 'Opsional: daftar opsi diisi saat jalan.' }) : null)));
    }
    if (t === 'Toggle') { var be = bindEditor(wd, 'bind', 'Toggle'); box.appendChild(h('div', { class: 'card sub' }, be)); }
    if (t === 'Button') {
      var bb = bindEditor(wd, 'bind', 'Button'); box.appendChild(h('div', { class: 'card sub' }, bb));
      if (!wd.confirm) wd.confirm = { enabled: false, title: 'Konfirmasi', message: 'Lanjutkan aksi ini?' };
      box.appendChild(h('div', { class: 'card sub' }, D.check(wd.confirm, 'enabled', 'Minta konfirmasi sebelum jalan'), wd.confirm.enabled ? h('div', { class: 'grid' }, D.text(wd.confirm, 'title', { label: 'Judul' }), D.text(wd.confirm, 'message', { label: 'Pesan' })) : null));
    }
    if (t === 'HalfButtons') { box.appendChild(h('div', { class: 'card sub' }, bindEditor(wd, 'bind', 'HalfButtons'))); box.appendChild(h('div', { class: 'card sub' }, bindEditor(wd, 'bind2', 'HalfButtons'))); }
    if (t === 'Dropdown') { var pe = h('div', { class: 'card sub' }, D.select(wd.bind || (wd.bind = { kind: 'none', ref: '' }), 'kind', M.BIND_KINDS.Dropdown, { label: 'Fungsi dropdown' })); box.appendChild(pe); }
    if (t === 'InfoLabel' || t === 'ProgressBar') box.appendChild(h('div', { class: 'card sub' }, h('b', { text: 'Nilai yang ditampilkan' }), E.operand(wd.src || (wd.src = F.operand('widget')), { noCast: true })));
    if (t === 'Table') {
      var tr = h('textarea', { rows: 4 }); tr.value = (wd.rows || []).map(function (r) { return r.join(' | '); }).join('\n');
      tr.addEventListener('input', function () { D.set(function () { wd.rows = tr.value.split('\n').filter(Boolean).map(function (l) { return l.split('|').map(function (s) { return s.trim(); }); }); }, { silent: true, coalesce: 'tb' + wd.id }); });
      var hd = h('input'); hd.value = (wd.headers || []).join(' | ');
      hd.addEventListener('input', function () { D.set(function () { wd.headers = hd.value.split('|').map(function (s) { return s.trim(); }); }, { silent: true, coalesce: 'th' + wd.id }); });
      box.appendChild(h('div', { class: 'grid g2' }, D.field('Header (pisah |)', hd), D.field('Baris (satu per baris, kolom pisah |)', tr)));
    }
    if (t === 'Custom') box.appendChild(D.text(wd, 'code', { area: true, rows: 6, label: 'Kode Lua', help: 'Tersedia: container, y, theme. Hanya LuluUI.' }));
    return box;
  }

  function addWidgetModal(list, afterAdd) {
    var body = h('div'); var groups = {};
    M.WIDGET_TYPES.filter(function (x) { return D.adv() || !x.advanced; }).forEach(function (x) { (groups[x.group] = groups[x.group] || []).push(x); });
    var close;
    Object.keys(groups).forEach(function (gn) {
      body.appendChild(h('h3', { text: gn }));
      body.appendChild(h('div', { class: 'grid' }, groups[gn].map(function (x) {
        return h('button', { class: 'card tpl', style: 'margin:0', onclick: function () { D.act(function () { var w = F.widget(x.k); list.push(w); UI.sel = w.id; UI.open[w.id] = true; }); close(); } }, h('span', { class: 'i', text: x.icon }), h('b', { text: x.label }));
      })));
    });
    close = D.modal('Tambah widget', body);
  }

  function widgetList(list, owner) {
    var wrap = h('div'), cfg = D.cfg();
    list.forEach(function (wd, i) {
      var tp = M.widgetType(wd.type) || { icon: '?', label: wd.type };
      var open = !!UI.open[wd.id];
      var card = h('div', { class: 'w-card', id: cardId(wd.id) });
      card.appendChild(h('div', { class: 'w-head', onclick: function () { UI.sel = wd.id; toggleOpenW(wd.id); } },
        h('span', { text: tp.icon }), h('span', { class: 'nm', text: (wd.label || '(tanpa label)') }), h('span', { class: 'pill', text: tp.label }),
        D.iconBtn('↑', 'naik', function () { D.act(function () { D.move(list, i, -1); }); }), D.iconBtn('↓', 'turun', function () { D.act(function () { D.move(list, i, 1); }); }),
        D.iconBtn('⧉', 'gandakan', function () { D.act(function () { var n = U.clone(wd); (function re(x) { x.id = U.uid('w'); (x.children || []).forEach(re); })(n); list.splice(i + 1, 0, n); }); }),
        D.iconBtn('🗑', 'hapus', function () { D.confirm('Hapus widget "' + (wd.label || tp.label) + '"?', function () { D.act(function () { list.splice(i, 1); }); }); }, 'danger'), h('span', { text: open ? '▾' : '▸' })));
      if (open) {
        var b = h('div', { class: 'w-body' }, widgetFields(wd));
        if (wd.type === 'Accordion') {
          b.appendChild(h('h3', { text: 'Isi accordion' })); b.appendChild(widgetList(wd.children, wd));
          b.appendChild(h('button', { class: 'btn sm', text: '+ Widget di dalam grup', onclick: function () { addWidgetModal(wd.children); } }));
        }
        card.appendChild(b);
      }
      wrap.appendChild(card);
    });
    return wrap;
  }
  function toggleOpenW(id) { UI.open[id] = !UI.open[id]; LSB.app.render(); }
  function cardId(id) { return 'item-' + id; }

  /* ---------- pratinjau ---------- */
  function preview(cfg) {
    var P = cfg.project, th = LSB.THEMES[P.theme] || LSB.THEMES.Dark;
    var tab = cfg.ui.tabs[UI.tab] || cfg.ui.tabs[0];
    var win = h('div', { class: 'pv-win', style: 'background:' + th.windowBg + ';color:' + th.text });
    win.appendChild(h('div', { class: 'pv-title', style: 'background:' + th.sidebar + ';color:' + th.textWhite }, h('span', { text: P.title || P.name }), h('span', { text: '— ✕' })));
    var side = h('div', { class: 'pv-side', style: 'background:' + th.sidebarBg + ';color:' + th.textWhite });
    var tabs = cfg.ui.tabs.map(function (t) { return t.name || '?'; }); if (P.infoTab) tabs.push('Info');
    tabs.forEach(function (n, i) { side.appendChild(h('div', { text: n, style: i === UI.tab ? 'background:' + th.accent + ';color:#fff' : '', onclick: function () { if (i < cfg.ui.tabs.length) { UI.tab = i; LSB.app.render(); } } })); });
    var main = h('div', { class: 'pv-main', style: 'background:' + th.contentBg });
    function item(wd) {
      var base = 'background:' + th.windowBg + ';color:' + th.text + ';';
      var sel = UI.sel === wd.id ? ' sel' : '';
      var click = function (e) { e.stopPropagation(); UI.sel = wd.id; UI.open[wd.id] = true; LSB.app.render(); };
      var t = wd.type, lab = wd.label || '';
      switch (t) {
        case 'Label': return h('div', { class: 'pv-item' + sel, style: 'color:' + th.text + ';font-size:' + (wd.size || 12) + 'px;font-weight:' + (wd.bold ? 700 : 400), text: lab, onclick: click });
        case 'Badge': return h('div', { class: 'pv-item' + sel, style: 'background:' + (/^#?[0-9a-f]{6}$/i.test(wd.color || '') ? (wd.color[0] === '#' ? wd.color : '#' + wd.color) : th.accent) + ';color:#fff;width:fit-content;font-size:11px', text: lab, onclick: click });
        case 'Separator': case 'Divider': return h('div', { class: 'pv-item' + sel, style: 'padding:2px;color:' + th.textLight + ';font-size:11px', text: '── ' + lab + ' ──', onclick: click });
        case 'Button': return h('div', { class: 'pv-item pv-btn' + sel, style: 'background:' + (/^#?[0-9a-f]{6}$/i.test(wd.color || '') ? (wd.color[0] === '#' ? wd.color : '#' + wd.color) : th.accent) + ';color:#fff', text: lab, onclick: click });
        case 'HalfButtons': return h('div', { class: 'row' + sel, onclick: click, style: 'gap:6px' }, h('div', { class: 'pv-item pv-btn', style: 'flex:1;background:' + th.accent + ';color:#fff', text: lab }), h('div', { class: 'pv-item pv-btn', style: 'flex:1;background:' + th.accent + ';color:#fff', text: wd.label2 }));
        case 'Toggle': return h('div', { class: 'pv-item' + sel, style: base, onclick: click }, h('span', { text: lab }), h('span', { class: 'pv-sw' + (wd.default ? ' on' : ''), style: 'background:' + (wd.default ? th.toggleOn : th.toggleOff) }));
        case 'Accordion': var a = h('div', { class: 'pv-item' + sel, style: 'background:' + th.accordionBg + ';color:' + th.accordionTxt + ';flex-direction:column;align-items:stretch', onclick: click }, h('div', { text: '▾ ' + lab })); (wd.children || []).forEach(function (c) { a.appendChild(item(c)); }); return a;
        case 'ProgressBar': return h('div', { class: 'pv-item' + sel, style: base + 'flex-direction:column;align-items:stretch', onclick: click }, h('span', { text: lab }), h('div', { style: 'height:6px;border-radius:3px;background:' + th.toggleOff }, h('div', { style: 'width:40%;height:6px;border-radius:3px;background:' + th.accent })));
        case 'List': return h('div', { class: 'pv-item' + sel, style: base + 'height:' + Math.min(80, wd.height || 60) + 'px;font-size:11px;color:' + th.textLight, text: '☰ ' + lab, onclick: click });
        case 'Table': return h('div', { class: 'pv-item' + sel, style: base + 'font-size:11px', text: '▦ ' + (wd.headers || []).join(' | '), onclick: click });
        default:
          var val = t === 'NumberInput' ? String(wd.default) : t === 'InfoLabel' ? '—' : (t === 'Dropdown' || t === 'Segment') ? (wd.default || (wd.options || [])[0] || '') : t === 'MultiDropdown' ? '…' : t === 'TextInput' ? (wd.default || wd.placeholder || '') : '';
          return h('div', { class: 'pv-item' + sel, style: base, onclick: click }, h('span', { text: lab || t }), val ? h('span', { style: 'color:' + th.textLight, text: val }) : null);
      }
    }
    if (UI.tab < cfg.ui.tabs.length) { tab.widgets.forEach(function (wd) { main.appendChild(item(wd)); }); if (!tab.widgets.length) main.appendChild(h('div', { style: 'color:' + th.textLight + ';text-align:center;padding:30px 0', text: 'Tab kosong' })); }
    else main.appendChild(h('div', { style: 'color:' + th.textLight, text: 'Tab Info bawaan (Stop Semua, Simpan, Log).' }));
    win.appendChild(h('div', { class: 'pv-body' }, side, main));
    return win;
  }

  V.ui = function () {
    var cfg = D.cfg(), root = h('div'), tabs = cfg.ui.tabs;
    if (UI.tab >= tabs.length) UI.tab = 0;
    root.appendChild(h('div', null, h('h2', { text: 'Tampilan (UI)' }), h('p', { class: 'lead', text: 'Susun widget LuluUI lalu hubungkan ke logic. Klik widget di pratinjau untuk mengeditnya.' })));
    var left = h('div'), right = h('div', { class: 'pv' });
    left.appendChild(h('div', { class: 'tabs' }, tabs.map(function (t, i) { return h('button', { class: i === UI.tab ? 'on' : '', text: t.name || 'Tab ' + (i + 1), onclick: function () { UI.tab = i; LSB.app.render(); } }); }),
      h('button', { text: '+ Tab', onclick: function () { D.act(function (c) { c.ui.tabs.push({ id: U.uid('tab'), name: 'Tab ' + (c.ui.tabs.length + 1), widgets: [] }); UI.tab = c.ui.tabs.length - 1; }); } })));
    var tab = tabs[UI.tab];
    left.appendChild(h('div', { class: 'card' }, h('div', { class: 'grid' }, D.text(tab, 'name', { label: 'Nama tab' }),
      h('div', { class: 'row', style: 'align-items:flex-end' }, D.iconBtn('← geser', 'kiri', function () { D.act(function () { D.move(tabs, UI.tab, -1); UI.tab = Math.max(0, UI.tab - 1); }); }), D.iconBtn('geser →', 'kanan', function () { D.act(function () { D.move(tabs, UI.tab, 1); UI.tab = Math.min(tabs.length - 1, UI.tab + 1); }); }),
        tabs.length > 1 ? D.iconBtn('Hapus tab', 'hapus', function () { D.confirm('Hapus tab "' + tab.name + '" beserta isinya?', function () { D.act(function () { tabs.splice(UI.tab, 1); UI.tab = 0; }); }); }, 'danger') : null))));
    left.appendChild(h('button', { class: 'btn primary', text: '+ Tambah widget', onclick: function () { addWidgetModal(tab.widgets); } }));
    left.appendChild(tab.widgets.length ? widgetList(tab.widgets) : D.empty('Tab ini masih kosong. Tambahkan widget.'));

    var pn = h('div', { class: 'card' }, h('b', { text: 'Panel tambahan (di tab Info)' }));
    var ip = cfg.ui.infoPanel;
    pn.appendChild(D.check(ip, 'enabled', 'Panel status (FPS/Ping + baris nilai)'));
    if (ip.enabled) {
      pn.appendChild(D.text(ip, 'title', { label: 'Judul panel' }));
      (ip.lines || []).forEach(function (ln, i) { pn.appendChild(h('div', { class: 'card sub' }, h('div', { class: 'row sp' }, D.text(ln, 'label', { label: 'Label baris' }), D.iconBtn('✕', 'hapus', function () { D.act(function () { ip.lines.splice(i, 1); }); }, 'danger')), E.operand(ln.src, { noCast: true }))); });
      pn.appendChild(h('button', { class: 'btn sm', text: '+ Baris', onclick: function () { D.act(function () { ip.lines.push({ label: 'Baris', src: F.operand('widget') }); }); } }));
    }
    pn.appendChild(h('div', { style: 'margin-top:8px' }, D.check(cfg.ui, 'locationPanel', 'Panel lokasi (teleport / walk)')));
    if (cfg.ui.locationPanel) {
      pn.appendChild(D.select(cfg.ui, 'locationMode', [['walk', 'Walk'], ['teleport', 'Teleport']], { label: 'Mode' }));
      cfg.ui.locations.forEach(function (loc, i) {
        var ta = h('textarea', { rows: 2, placeholder: 'satu koordinat per baris: x,y,z' }); ta.value = (loc.lanes || []).join('\n');
        ta.addEventListener('input', function () { D.set(function () { loc.lanes = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }, { silent: true, coalesce: 'loc' + i }); });
        pn.appendChild(h('div', { class: 'card sub' }, h('div', { class: 'row sp' }, D.text(loc, 'name', { label: 'Nama lokasi' }), D.iconBtn('✕', 'hapus', function () { D.act(function () { cfg.ui.locations.splice(i, 1); }); }, 'danger')), D.field('Koordinat', ta)));
      });
      pn.appendChild(h('button', { class: 'btn sm', text: '+ Lokasi', onclick: function () { D.act(function () { cfg.ui.locations.push({ name: 'Lokasi ' + (cfg.ui.locations.length + 1), lanes: ['0,5,0'] }); }); } }));
    }
    left.appendChild(pn);
    right.appendChild(h('div', { class: 'lbl', text: 'Pratinjau (perkiraan tampilan, tema ' + cfg.project.theme + ')', style: 'text-align:center;margin-bottom:6px' }));
    right.appendChild(preview(cfg));
    root.appendChild(h('div', { class: 'pv-wrap' }, left, right));
    return root;
  };
})(typeof window !== 'undefined' ? window : globalThis);
