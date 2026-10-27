/*
 * core.js - util, katalog (meta), pabrik data, dan store (state + undo/redo + autosave).
 * Tidak menyentuh DOM kecuali LSB.store.persist (localStorage, opsional).
 */
(function (g) {
  var LSB = g.LSB = g.LSB || {};
  LSB.VERSION = '1.0.0';
  LSB.SCHEMA = 1;

  /* ================================================================ util */
  var U = LSB.util = {};

  U.uid = function (prefix) {
    U._n = (U._n || 0) + 1;
    return prefix + Math.random().toString(36).slice(2, 6) + U._n.toString(36);
  };
  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  // string literal Lua yang aman
  U.luaStr = function (s) {
    s = String(s == null ? '' : s);
    var out = '"';
    for (var i = 0; i < s.length; i++) {
      var c = s[i], code = s.charCodeAt(i);
      if (c === '\\') out += '\\\\';
      else if (c === '"') out += '\\"';
      else if (c === '\n') out += '\\n';
      else if (c === '\r') out += '\\r';
      else if (c === '\t') out += '\\t';
      else if (code < 32 || code === 127) out += '\\' + ('00' + code).slice(-3);
      else out += c;
    }
    return out + '"';
  };

  // identifier Lua valid dari teks bebas
  U.ident = function (s, fallback) {
    var r = String(s == null ? '' : s).replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
    if (!r) r = fallback || 'x';
    if (/^[0-9]/.test(r)) r = '_' + r;
    return r;
  };
  var LUA_KW = 'and break do else elseif end false for function goto if in local nil not or repeat return then true until while continue'.split(' ');
  U.isLuaKeyword = function (s) { return LUA_KW.indexOf(s) >= 0; };

  // nama file aman: huruf, angka, _ dan -
  U.fileName = function (s) {
    var r = String(s || '').trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
    return r || 'MyScript';
  };

  U.num = function (v, d) { var n = Number(v); return isFinite(n) && String(v).trim() !== '' ? n : (d == null ? 0 : d); };
  U.luaNum = function (n) {
    n = Number(n);
    if (!isFinite(n)) return '0';
    var s = String(n);
    return s.indexOf('e') >= 0 ? n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '') : s;
  };
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  };

  /* ================================================================ katalog */
  var M = LSB.META = {};

  M.TARGET_TYPES = [
    { k: 'auto', label: 'Otomatis (deteksi saat jalan)' },
    { k: 'remote', label: 'RemoteEvent' },
    { k: 'function', label: 'RemoteFunction' },
    { k: 'bindable', label: 'BindableEvent / Function' },
    { k: 'value', label: 'ValueObject (Int/Number/String/Bool)' },
    { k: 'instance', label: 'Instance biasa' },
    { k: 'folder', label: 'Folder / Model (pantau isi)' },
    { k: 'prompt', label: 'ProximityPrompt' },
    { k: 'click', label: 'ClickDetector' },
    { k: 'tool', label: 'Tool' },
    { k: 'humanoid', label: 'Humanoid' },
    { k: 'player', label: 'Player / Karakter' }
  ];

  M.ARG_TYPES = ['auto', 'number', 'string', 'boolean', 'Vector3', 'CFrame', 'Instance', 'nil', 'table'];

  M.SRC_KINDS = [
    { k: 'fixed', label: 'Nilai tetap' },
    { k: 'widget', label: 'Nilai widget UI' },
    { k: 'action', label: 'Hasil aksi lain' },
    { k: 'watcher', label: 'Output watcher terakhir' },
    { k: 'event', label: 'Payload event (rule ini)' },
    { k: 'random', label: 'Angka acak (min-maks)' },
    { k: 'pick', label: 'Pilih acak dari daftar' },
    { k: 'rr', label: 'Berputar (round robin)' },
    { k: 'player', label: 'LocalPlayer' },
    { k: 'character', label: 'Karakter' },
    { k: 'hrp', label: 'HumanoidRootPart' },
    { k: 'humanoid', label: 'Humanoid' },
    { k: 'target', label: 'Instance dari Target' },
    { k: 'var', label: 'Variabel (setvar)' },
    { k: 'template', label: 'Teks template {w:id} {a:id}' },
    { k: 'expr', label: 'Ekspresi Lua (lanjut)' }
  ];

  M.CMP_OPS = [
    { k: '==', label: '= sama dengan' }, { k: '~=', label: '≠ tidak sama' },
    { k: '>', label: '> lebih besar' }, { k: '<', label: '< lebih kecil' },
    { k: '>=', label: '≥' }, { k: '<=', label: '≤' },
    { k: 'contains', label: 'mengandung teks' }, { k: 'startsWith', label: 'diawali teks' },
    { k: 'exists', label: 'ada (bukan nil)' }, { k: 'isNil', label: 'kosong (nil)' },
    { k: 'between', label: 'di antara (a,b)' }
  ];

  // jenis aksi. args: label slot argumen (null = daftar bebas)
  M.ACTION_KINDS = [
    { k: 'fire', label: 'Fire Remote', icon: '🚀', target: true, free: true, help: 'FireServer (RemoteEvent) atau Fire (BindableEvent) dengan argumen bebas.' },
    { k: 'invoke', label: 'Invoke (simpan hasil)', icon: '📞', target: true, free: true, help: 'InvokeServer/Invoke. Hasilnya bisa dipakai aksi lain (sumber "Hasil aksi").' },
    { k: 'get', label: 'Get (baca nilai)', icon: '🔎', target: true, fields: ['mode', 'prop'], argLabels: [], help: 'Membaca Value / Property / Attribute. Hasil tersimpan.' },
    { k: 'set', label: 'Set (ubah nilai)', icon: '✏️', target: true, fields: ['mode', 'prop'], argLabels: ['Nilai baru'], help: 'Mengubah Value / Property / Attribute.' },
    { k: 'prompt', label: 'ProximityPrompt', icon: '🖐️', target: true, argLabels: ['Tahan (detik, opsional)'], needs: ['fireproximityprompt'], help: 'Memicu ProximityPrompt (fireproximityprompt).' },
    { k: 'click', label: 'ClickDetector', icon: '👆', target: true, argLabels: ['Jarak (opsional)'], needs: ['fireclickdetector'], help: 'Memicu ClickDetector (fireclickdetector).' },
    { k: 'equip', label: 'Equip Tool', icon: '🎒', target: 'optional', argLabels: ['Nama tool (jika tanpa target)'], help: 'Memakai Tool dari target atau dari Backpack berdasarkan nama.' },
    { k: 'unequip', label: 'Unequip semua Tool', icon: '🎒', target: false, argLabels: [], help: 'Melepas semua Tool.' },
    { k: 'teleport', label: 'Teleport', icon: '📍', target: 'optional', argLabels: ['Tujuan (Vector3 / CFrame / Instance)', 'Offset Y (opsional)'], help: 'Pindah langsung ke posisi / ke Target.' },
    { k: 'walk', label: 'Walk To', icon: '🚶', target: 'optional', argLabels: ['Tujuan (Vector3 / Instance)', 'Tunggu sampai tiba? (boolean)', 'Timeout detik (opsional)'], help: 'Humanoid:MoveTo ke tujuan.' },
    { k: 'wait', label: 'Wait', icon: '⏱️', target: false, argLabels: ['Detik'], help: 'Menunggu beberapa detik.' },
    { k: 'loop', label: 'Loop', icon: '🔁', target: false, argLabels: ['Interval detik', 'Jumlah (0 = tanpa batas)'], fields: ['steps', 'until'], help: 'Mengulang daftar langkah sampai dihentikan / kondisi terpenuhi.' },
    { k: 'log', label: 'Log (catat)', icon: '📝', target: false, argLabels: ['Pesan (boleh template)'], fields: ['level', 'toNotify'], help: 'Menulis ke List log; opsional notifikasi.' },
    { k: 'notify', label: 'Notifikasi', icon: '🔔', target: false, argLabels: ['Pesan (boleh template)'], fields: ['level'], help: 'Menampilkan luluNotify.' },
    { k: 'setwidget', label: 'Set Widget', icon: '🎚️', target: false, argLabels: ['Nilai'], fields: ['widgetId'], help: 'Mengubah nilai widget UI dari logic.' },
    { k: 'setvar', label: 'Set Variabel', icon: '📦', target: false, argLabels: ['Nilai'], fields: ['varName'], help: 'Menyimpan nilai ke variabel (sumber "Variabel").' },
    { k: 'runrule', label: 'Jalankan Rule', icon: '⚙️', target: false, argLabels: [], fields: ['ref'], help: 'Menjalankan sebuah rule secara paksa.' },
    { k: 'runmacro', label: 'Jalankan Makro', icon: '🎬', target: false, argLabels: [], fields: ['ref'], help: 'Menjalankan sebuah makro.' },
    { k: 'stopall', label: 'Stop Semua', icon: '⛔', target: false, argLabels: [], help: 'Mematikan semua rule, loop, makro, dan watcher.' },
    { k: 'custom', label: 'Custom Lua (lanjut)', icon: '🧩', target: false, argLabels: [], fields: ['code'], advanced: true, help: 'Potongan Lua bebas, dijalankan di dalam pcall. Variabel tersedia: ctx, S, R, T(id), LP, Log(msg).' }
  ];
  M.actionKind = function (k) { return M.ACTION_KINDS.filter(function (x) { return x.k === k; })[0]; };

  M.WATCHER_KINDS = [
    { k: 'valueChanged', label: 'Value berubah', icon: '📊', target: true, outputs: ['value', 'old'], help: 'Memantau ValueObject (.Changed). Output: value, old.' },
    { k: 'attributeChanged', label: 'Attribute berubah', icon: '🏷️', target: true, fields: ['attr'], outputs: ['value', 'old'], help: 'Memantau satu Attribute.' },
    { k: 'propertyChanged', label: 'Property berubah', icon: '🔧', target: true, fields: ['prop'], outputs: ['value', 'old'], help: 'Memantau satu Property.' },
    { k: 'childAdded', label: 'Child muncul', icon: '➕', target: true, fields: ['nameFilter', 'classFilter', 'fireExisting'], outputs: ['child', 'name', 'class'], help: 'Instance baru muncul di dalam target.' },
    { k: 'childRemoved', label: 'Child hilang', icon: '➖', target: true, fields: ['nameFilter', 'classFilter'], outputs: ['child', 'name', 'class'], help: 'Instance hilang dari target.' },
    { k: 'descendantAdded', label: 'Descendant muncul', icon: '🌳', target: true, fields: ['nameFilter', 'classFilter', 'fireExisting'], outputs: ['child', 'name', 'class'], help: 'Instance baru di seluruh turunan target.' },
    { k: 'remoteFired', label: 'Remote dipanggil server', icon: '📡', target: true, fields: ['filter'], outputs: ['args', 'a1', 'a2', 'a3', 'count'], help: 'OnClientEvent dengan filter argumen opsional.' },
    { k: 'interval', label: 'Interval (timer)', icon: '⏲️', target: false, fields: ['intervalOp', 'startDelay'], outputs: ['tick', 'time'], help: 'Memicu setiap N detik. Interval bisa dari widget.' },
    { k: 'exists', label: 'Instance muncul / hilang', icon: '👁️', target: true, fields: ['existsOn'], outputs: ['value', 'child'], help: 'Polling keberadaan Target.' },
    { k: 'distance', label: 'Jarak ke objek', icon: '📏', target: true, fields: ['radius', 'pollEvery', 'onlyEnter'], outputs: ['value'], help: 'Memicu saat karakter dekat dengan Target.' },
    { k: 'respawn', label: 'Karakter respawn', icon: '♻️', target: false, fields: ['fireOnStart'], outputs: ['character'], help: 'LocalPlayer.CharacterAdded.' },
    { k: 'start', label: 'Saat script mulai', icon: '▶️', target: false, fields: ['startDelay'], outputs: [], help: 'Sekali saat script selesai dimuat.' },
    { k: 'hotkey', label: 'Tombol keyboard', icon: '⌨️', target: false, fields: ['key'], outputs: ['key'], help: 'Memicu saat tombol ditekan.' },
    { k: 'manual', label: 'Manual (tombol UI)', icon: '🖱️', target: false, fields: [], outputs: [], help: 'Hanya dipicu dari Button UI / aksi.' }
  ];
  M.watcherKind = function (k) { return M.WATCHER_KINDS.filter(function (x) { return x.k === k; })[0]; };

  M.WIDGET_TYPES = [
    { k: 'Label', label: 'Label', icon: 'Aa', group: 'Teks' },
    { k: 'InfoLabel', label: 'InfoLabel (nilai live)', icon: '📟', group: 'Teks' },
    { k: 'Badge', label: 'Badge', icon: '🏷️', group: 'Teks' },
    { k: 'Separator', label: 'Separator', icon: '➖', group: 'Teks' },
    { k: 'Divider', label: 'Divider', icon: '─', group: 'Teks' },
    { k: 'Button', label: 'Button', icon: '🔘', group: 'Kontrol' },
    { k: 'HalfButtons', label: 'HalfButtons (2 tombol)', icon: '◫', group: 'Kontrol' },
    { k: 'Toggle', label: 'Toggle', icon: '🔀', group: 'Kontrol' },
    { k: 'NumberInput', label: 'NumberInput', icon: '🔢', group: 'Input' },
    { k: 'TextInput', label: 'TextInput', icon: '⌨️', group: 'Input' },
    { k: 'Dropdown', label: 'Dropdown', icon: '▾', group: 'Input' },
    { k: 'MultiDropdown', label: 'MultiDropdown', icon: '☑️', group: 'Input' },
    { k: 'Segment', label: 'Segment', icon: '⬚', group: 'Input' },
    { k: 'ProgressBar', label: 'ProgressBar', icon: '▰', group: 'Tampilan' },
    { k: 'List', label: 'List / Log', icon: '☰', group: 'Tampilan' },
    { k: 'Table', label: 'Table (statis)', icon: '▦', group: 'Tampilan' },
    { k: 'CopyButton', label: 'CopyButton', icon: '📋', group: 'Tampilan' },
    { k: 'Accordion', label: 'Accordion', icon: '🗂️', group: 'Struktur' },
    { k: 'Custom', label: 'Custom Lua (lanjut)', icon: '🧩', group: 'Struktur', advanced: true }
  ];
  M.widgetType = function (k) { return M.WIDGET_TYPES.filter(function (x) { return x.k === k; })[0]; };

  // widget yang menyimpan nilai (State + persist)
  M.VALUE_WIDGETS = ['Toggle', 'NumberInput', 'TextInput', 'Dropdown', 'MultiDropdown', 'Segment'];
  M.BIND_KINDS = {
    Toggle: [['none', 'Tidak ada (hanya nilai)'], ['rule', 'Aktif/nonaktif Rule'], ['watcher', 'Aktif/nonaktif Watcher'], ['macro', 'Start/Stop Makro'], ['action', 'Start/Stop Aksi (loop)']],
    Button: [['none', 'Tidak ada'], ['action', 'Jalankan Aksi'], ['macro', 'Jalankan Makro'], ['rule', 'Jalankan Rule'], ['watcher', 'Picu Watcher'], ['stopall', 'Stop Semua'], ['save', 'Simpan pengaturan'], ['load', 'Muat pengaturan'], ['reset', 'Reset pengaturan'], ['refresh', 'Refresh opsi Dropdown']],
    Dropdown: [['none', 'Hanya nilai'], ['profile', 'Pilih Profil']]
  };

  M.THEME_NAMES = ['Purple', 'Ocean', 'Matrix', 'Crimson', 'Luxury', 'Sakura', 'White', 'Dark', 'Tosca', 'DarkPurple', 'Midnight', 'Carbon'];

  M.KEYS = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z One Two Three Four Five Six Seven Eight Nine Zero F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Space Return Tab LeftShift RightShift LeftControl LeftAlt Insert Delete Home End PageUp PageDown Up Down Left Right Backquote'.split(' ');

  M.EXECUTOR_FNS = ['gethui', 'setclipboard', 'writefile', 'readfile', 'isfile', 'isfolder', 'makefolder', 'fireproximityprompt', 'fireclickdetector', 'firesignal', 'getconnections', 'hookfunction', 'request', 'http_request', 'loadstring', 'getgenv'];

  /* ================================================================ pabrik data */
  var F = LSB.make = {};

  F.operand = function (src, o) {
    var x = { src: src || 'fixed', type: 'auto', value: '', ref: '', field: '', min: '1', max: '10', list: [], expr: '', tpl: '' };
    if (o) for (var k in o) x[k] = o[k];
    return x;
  };
  F.fixed = function (value, type) { return F.operand('fixed', { value: String(value == null ? '' : value), type: type || 'auto' }); };

  F.project = function () {
    return {
      name: 'MyScript', title: 'My Script', subtitle: '', theme: 'Dark', width: 330, height: 300,
      icon: '', luluUrl: 'https://raw.githubusercontent.com/USERNAME/REPO/main/LuluUI.lua',
      resolveTimeout: 10, placeIds: [], placeGuard: 'warn', autosave: true, infoTab: true, debug: false,
      skipLoading: false, loadingTitle: '', loadingDesc: '', loadingCreator: '', maxActionsPerSecond: 30,
      ruleBurst: 25, minify: false, comments: true
    };
  };
  F.config = function () {
    return {
      v: LSB.SCHEMA, project: F.project(), targets: [], actions: [], watchers: [], rules: [], macros: [], profiles: [],
      ui: { tabs: [{ id: U.uid('tab'), name: 'Main', widgets: [] }], infoPanel: { enabled: false, title: 'Status', lines: [] }, locationPanel: false, locationMode: 'walk', locations: [] }
    };
  };
  F.target = function (o) { return Object.assign({ id: U.uid('t'), alias: '', path: '', type: 'auto', note: '' }, o || {}); };
  F.action = function (kind, o) {
    var a = {
      id: U.uid('a'), name: '', kind: kind || 'fire', targetId: '', args: [], retry: 0, delay: 0, after: 0, cooldown: 0,
      ignoreError: false, note: '', mode: 'property', prop: 'Value', widgetId: '', varName: '', ref: '', steps: [], until: null,
      level: 'info', toNotify: false, code: ''
    };
    if (o) for (var k in o) a[k] = o[k];
    return a;
  };
  F.watcher = function (kind, o) {
    var w = {
      id: U.uid('w'), name: '', kind: kind || 'valueChanged', targetId: '', enabled: true, attr: '', prop: '', nameFilter: '', classFilter: '',
      fireExisting: false, intervalOp: F.fixed('1', 'number'), startDelay: 0, radius: 10, pollEvery: 0.5, onlyEnter: true,
      key: 'F', existsOn: 'appear', filter: { enabled: false, index: 1, op: '==', value: '' }, fireOnStart: false
    };
    if (o) for (var k in o) w[k] = o[k];
    return w;
  };
  F.rule = function (o) {
    return Object.assign({
      id: U.uid('r'), name: '', when: '', cond: null, mode: 'sequence', steps: [], cooldown: 0, maxRuns: 0, priority: 0,
      onFail: 'continue', fallback: '', enabled: true, allowOverlap: false
    }, o || {});
  };
  F.macro = function (o) { return Object.assign({ id: U.uid('m'), name: '', steps: [], loop: false, count: 1, interval: 0.1 }, o || {}); };
  F.profile = function (o) { return Object.assign({ name: 'Profil Baru', values: {} }, o || {}); };
  F.condGroup = function (op) { return { op: op || 'AND', items: [] }; };
  F.cond = function () { return { left: F.operand('widget'), cmp: '==', right: F.fixed('', 'auto') }; };

  F.widget = function (type, o) {
    var w = {
      id: U.uid('w'), type: type, label: '', subtext: '', default: null, locked: false, persist: true,
      bind: { kind: 'none', ref: '' }
    };
    switch (type) {
      case 'Label': w.label = 'Label teks'; w.size = 12; w.bold = false; break;
      case 'InfoLabel': w.label = 'Info'; w.src = F.operand('widget'); w.default = '-'; break;
      case 'Badge': w.label = 'BADGE'; w.color = ''; break;
      case 'Separator': w.label = ''; break;
      case 'Divider': break;
      case 'Button': w.label = 'Tombol'; w.color = ''; w.confirm = { enabled: false, title: 'Konfirmasi', message: 'Lanjutkan aksi ini?' }; w.loading = ''; break;
      case 'HalfButtons': w.label = 'A'; w.label2 = 'B'; w.bind = { kind: 'none', ref: '' }; w.bind2 = { kind: 'none', ref: '' }; break;
      case 'Toggle': w.label = 'Toggle'; w.default = false; break;
      case 'NumberInput': w.label = 'Angka'; w.default = 1; w.step = 1; w.min = 0; w.max = 100; break;
      case 'TextInput': w.label = 'Teks'; w.default = ''; w.placeholder = 'ketik di sini...'; break;
      case 'Dropdown': w.label = 'Pilihan'; w.options = ['Opsi 1', 'Opsi 2']; w.default = 'Opsi 1'; w.optionsFrom = ''; w.bind = { kind: 'none', ref: '' }; break;
      case 'MultiDropdown': w.label = 'Banyak pilihan'; w.options = ['A', 'B', 'C']; w.default = []; w.optionsFrom = ''; break;
      case 'Segment': w.label = 'Mode'; w.options = ['Normal', 'Cepat', 'Brutal']; w.default = 'Normal'; break;
      case 'ProgressBar': w.label = 'Progress'; w.src = F.operand('widget'); w.max = 100; break;
      case 'List': w.label = 'Log'; w.height = 110; w.isLog = false; break;
      case 'Table': w.label = ''; w.headers = ['Kunci', 'Nilai']; w.rows = [['Contoh', 'Isi']]; break;
      case 'CopyButton': w.label = 'Salin teks'; w.value = 'teks yang disalin'; break;
      case 'Accordion': w.label = 'Grup'; w.open = false; w.children = []; break;
      case 'Custom': w.label = 'Custom'; w.code = '-- container, y, theme tersedia\n'; break;
    }
    if (o) for (var k in o) w[k] = o[k];
    return w;
  };

  /* ================================================================ penjelajah config */
  var W = LSB.walk = {};
  // iterasi semua widget (termasuk anak accordion)
  W.widgets = function (cfg, fn) {
    function rec(list, tab, parent) {
      list.forEach(function (w) { fn(w, tab, parent); if (w.type === 'Accordion' && w.children) rec(w.children, tab, w); });
    }
    cfg.ui.tabs.forEach(function (t) { rec(t.widgets, t, null); });
  };
  W.allWidgets = function (cfg) { var r = []; W.widgets(cfg, function (w, t) { r.push({ w: w, tab: t }); }); return r; };
  W.byId = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  W.widget = function (cfg, id) { var f = null; W.widgets(cfg, function (w) { if (w.id === id) f = w; }); return f; };

  // nama tampilan
  W.labelOf = function (item, fallback) { return (item && (item.name || item.alias || item.label)) || fallback || (item && item.id) || '?'; };

  /* ================================================================ migrasi */
  LSB.migrate = function (cfg) {
    var d = F.config();
    cfg = cfg || {};
    var out = Object.assign({}, d, cfg);
    out.project = Object.assign(F.project(), cfg.project || {});
    out.ui = Object.assign(d.ui, cfg.ui || {});
    out.ui.infoPanel = Object.assign(d.ui.infoPanel, (cfg.ui && cfg.ui.infoPanel) || {});
    ['targets', 'actions', 'watchers', 'rules', 'macros', 'profiles'].forEach(function (k) { if (!Array.isArray(out[k])) out[k] = []; });
    if (!Array.isArray(out.ui.tabs) || !out.ui.tabs.length) out.ui.tabs = d.ui.tabs;
    out.actions = out.actions.map(function (a) { return Object.assign(F.action(a.kind), a); });
    out.watchers = out.watchers.map(function (w) { return Object.assign(F.watcher(w.kind), w); });
    out.rules = out.rules.map(function (r) { return Object.assign(F.rule(), r); });
    out.macros = out.macros.map(function (m) { return Object.assign(F.macro(), m); });
    out.v = LSB.SCHEMA;
    return out;
  };

  /* ================================================================ store */
  var store = LSB.store = {
    cfg: F.config(), past: [], future: [], subs: [], key: 'lulu-script-builder:project:v1', histKey: 'lulu-script-builder:history:v1',
    mode: 'easy' // 'easy' | 'adv'
  };
  store.subscribe = function (fn) { store.subs.push(fn); return function () { store.subs = store.subs.filter(function (f) { return f !== fn; }); }; };
  store._emit = function (meta) { store.subs.forEach(function (f) { try { f(store.cfg, meta || {}); } catch (e) { if (typeof console !== 'undefined') console.error(e); } }); };

  // commit(mutator, meta): salin snapshot ke undo, jalankan mutator
  store.commit = function (mutator, meta) {
    meta = meta || {};
    var snap = JSON.stringify(store.cfg);
    if (!meta.noHistory) {
      var last = store.past[store.past.length - 1];
      if (!(meta.coalesce && last && last.k === meta.coalesce && Date.now() - last.t < 1200)) {
        store.past.push({ s: snap, k: meta.coalesce || null, t: Date.now() });
        if (store.past.length > 80) store.past.shift();
      } else last.t = Date.now();
      store.future = [];
    }
    mutator(store.cfg);
    store._persist();
    store._emit(meta);
  };
  store.undo = function () {
    if (!store.past.length) return false;
    store.future.push({ s: JSON.stringify(store.cfg) });
    store.cfg = JSON.parse(store.past.pop().s);
    store._persist(); store._emit({ undo: true }); return true;
  };
  store.redo = function () {
    if (!store.future.length) return false;
    store.past.push({ s: JSON.stringify(store.cfg) });
    store.cfg = JSON.parse(store.future.pop().s);
    store._persist(); store._emit({ redo: true }); return true;
  };
  store.load = function (cfg, meta) {
    store.past.push({ s: JSON.stringify(store.cfg) });
    store.cfg = LSB.migrate(cfg); store.future = [];
    store._persist(); store._emit(Object.assign({ loaded: true }, meta || {}));
  };
  store.reset = function () { store.load(F.config()); };

  var ls = function () { try { return g.localStorage || null; } catch (e) { return null; } };
  store._persist = U.debounce(function () {
    var s = ls(); if (!s) return;
    try { s.setItem(store.key, JSON.stringify(store.cfg)); } catch (e) { /* penuh / diblokir */ }
  }, 400);
  store.restore = function () {
    var s = ls(); if (!s) return false;
    try { var raw = s.getItem(store.key); if (!raw) return false; store.cfg = LSB.migrate(JSON.parse(raw)); return true; } catch (e) { return false; }
  };
  // riwayat versi (10 terakhir) - disimpan manual / saat generate
  store.saveVersion = function (label) {
    var s = ls(); if (!s) return false;
    try {
      var h = JSON.parse(s.getItem(store.histKey) || '[]');
      h.unshift({ t: Date.now(), label: label || 'Versi', cfg: store.cfg });
      s.setItem(store.histKey, JSON.stringify(h.slice(0, 10))); return true;
    } catch (e) { return false; }
  };
  store.versions = function () { var s = ls(); if (!s) return []; try { return JSON.parse(s.getItem(store.histKey) || '[]'); } catch (e) { return []; } };

  /* share string: JSON -> base64 (tanpa kompresi eksternal; pakai CompressionStream bila ada) */
  LSB.share = {
    encode: function (cfg) {
      var json = JSON.stringify(cfg);
      var b = (typeof btoa === 'function') ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
      return 'LSB1:' + b;
    },
    decode: function (str) {
      str = String(str || '').trim();
      if (str.indexOf('LSB1:') !== 0) throw new Error('Bukan string project Lulu Script Builder');
      var b = str.slice(5);
      var json = (typeof atob === 'function') ? decodeURIComponent(escape(atob(b))) : Buffer.from(b, 'base64').toString('utf8');
      return LSB.migrate(JSON.parse(json));
    }
  };

  if (typeof module !== 'undefined') module.exports = LSB;
})(typeof window !== 'undefined' ? window : globalThis);
