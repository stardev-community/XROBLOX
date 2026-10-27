/*
 * validate.js - pemeriksa project sebelum generate.  LSB.validate(cfg) -> { issues, errors, warnings }
 * issue = { level: 'error'|'warn'|'info', msg, kind, id, step }  (kind/id dipakai tombol "lompat ke item")
 */
(function (g) {
  var LSB = g.LSB = g.LSB || {};
  var U = LSB.util, M = LSB.META, W = LSB.walk;
  if (typeof require !== 'undefined' && !U) { require('./core.js'); U = LSB.util; M = LSB.META; W = LSB.walk; }

  var FORBIDDEN_UI = /\b(Rayfield|OrionLib|Orion\s*Library|Fluent|Kavo|KavoUI|Venyx|Linoria|LinoriaLib|Wally|SimpleUI|Library\s*:\s*CreateWindow|CreateLib|Elerium|Bracket\s*V\d?)\b/i;
  var RAW_GUI = /Instance\s*\.\s*new\s*\(\s*["'](ScreenGui|BillboardGui|SurfaceGui)["']/;
  var EXT_LOAD = /loadstring\s*\(\s*game\s*:\s*HttpGet/;
  var NEEDS_TARGET = ['fire', 'invoke', 'get', 'set', 'prompt', 'click'];

  function validate(cfgIn) {
    var cfg = LSB.migrate(U.clone(cfgIn));
    var issues = [];
    function add(level, msg, kind, id, step) { issues.push({ level: level, msg: msg, kind: kind || 'project', id: id || '', step: step || '' }); }
    var P = cfg.project;

    /* ---- project ---- */
    if (!String(P.name || '').trim()) add('error', 'Nama script kosong.', 'project', '', 'project');
    else if (U.fileName(P.name) !== String(P.name).trim()) add('warn', 'Nama file akan dibersihkan menjadi "' + U.fileName(P.name) + '.lua" (hanya huruf, angka, _ dan -).', 'project', '', 'project');
    if (!/^https?:\/\/\S+$/i.test(String(P.luluUrl || '').trim())) add('error', 'URL raw LuluUI belum valid (harus diawali https://).', 'project', '', 'project');
    else if (/USERNAME\/REPO/.test(P.luluUrl)) add('warn', 'URL raw LuluUI masih contoh. Upload LuluUI.lua ke GitHub lalu isi URL Raw-nya.', 'project', '', 'project');
    else if (!/raw\.githubusercontent\.com|gist\.githubusercontent\.com|githubusercontent|raw\.github/.test(P.luluUrl)) add('info', 'URL LuluUI bukan dari raw.githubusercontent.com. Pastikan URL mengembalikan teks Lua mentah.', 'project', '', 'project');
    (P.placeIds || []).forEach(function (p) { if (!(Number(p) > 0)) add('error', 'PlaceId tidak valid: ' + p, 'project', '', 'project'); });
    if (U.num(P.width, 330) < 260 || U.num(P.height, 300) < 200) add('warn', 'Ukuran window sangat kecil; widget bisa terpotong.', 'project', '', 'project');
    if (U.num(P.maxActionsPerSecond, 30) > 200) add('warn', 'Batas aksi per detik terlalu tinggi; risiko lag.', 'project', '', 'project');

    /* ---- id duplikat ---- */
    function dupIds(list, kind, label) {
      var seen = {};
      list.forEach(function (x) { if (seen[x.id]) add('error', 'ID ' + label + ' duplikat: ' + x.id, kind, x.id, kind); seen[x.id] = 1; });
    }
    dupIds(cfg.targets, 'target', 'target'); dupIds(cfg.actions, 'action', 'aksi'); dupIds(cfg.watchers, 'watcher', 'watcher'); dupIds(cfg.rules, 'rule', 'rule'); dupIds(cfg.macros, 'macro', 'makro');
    var wAll = W.allWidgets(cfg); dupIds(wAll.map(function (x) { return x.w; }), 'widget', 'widget');

    /* ---- targets ---- */
    var aliasSeen = {};
    cfg.targets.forEach(function (t) {
      var nm = t.alias || t.id;
      var path = String(t.path || '').trim();
      if (!path && t.type !== 'player') add('error', 'Target "' + nm + '": path masih kosong.', 'target', t.id, 'targets');
      else if (path && /\s{2,}|\.\.|^\.|\.$/.test(path)) add('warn', 'Target "' + nm + '": format path mencurigakan (' + path + ').', 'target', t.id, 'targets');
      if (path && /^game\.?$/.test(path)) add('error', 'Target "' + nm + '": path tidak boleh hanya "game".', 'target', t.id, 'targets');
      if (t.alias) { if (aliasSeen[t.alias]) add('warn', 'Alias target duplikat: "' + t.alias + '".', 'target', t.id, 'targets'); aliasSeen[t.alias] = 1; }
      if (!t.alias) add('info', 'Target dengan path "' + path + '" belum punya alias (hanya untuk kemudahan baca).', 'target', t.id, 'targets');
    });

    var actById = {}; cfg.actions.forEach(function (a) { actById[a.id] = a; });
    var widById = {}; wAll.forEach(function (x) { widById[x.w.id] = x.w; });
    var watById = {}; cfg.watchers.forEach(function (x) { watById[x.id] = x; });
    var ruleById = {}; cfg.rules.forEach(function (x) { ruleById[x.id] = x; });
    var macById = {}; cfg.macros.forEach(function (x) { macById[x.id] = x; });
    var tgtById = {}; cfg.targets.forEach(function (x) { tgtById[x.id] = x; });

    function checkOperand(o, where, kind, id, step, ctx) {
      if (!o) return;
      var s = o.src || 'fixed';
      if (s === 'widget') { if (!o.ref || !widById[o.ref]) add('error', where + ': sumber widget tidak ditemukan.', kind, id, step); else if (M.VALUE_WIDGETS.indexOf(widById[o.ref].type) < 0 && widById[o.ref].type !== 'InfoLabel') add('warn', where + ': widget "' + (widById[o.ref].label || o.ref) + '" (' + widById[o.ref].type + ') tidak menyimpan nilai.', kind, id, step); }
      else if (s === 'action') { if (!o.ref || !actById[o.ref]) add('error', where + ': sumber hasil aksi tidak ditemukan.', kind, id, step); }
      else if (s === 'watcher') { if (!o.ref || !watById[o.ref]) add('error', where + ': sumber watcher tidak ditemukan.', kind, id, step); }
      else if (s === 'target') { if (!o.ref || !tgtById[o.ref]) add('error', where + ': sumber target tidak ditemukan.', kind, id, step); }
      else if (s === 'event' && ctx === 'noevent') add('warn', where + ': "Payload event" hanya terisi saat dijalankan dari rule/watcher.', kind, id, step);
      else if (s === 'expr') {
        if (FORBIDDEN_UI.test(o.expr || '')) add('error', where + ': ekspresi memakai library UI lain (hanya LuluUI yang diizinkan).', kind, id, step);
        if (!String(o.expr || '').trim()) add('warn', where + ': ekspresi Lua kosong.', kind, id, step);
      } else if (s === 'fixed' && o.type === 'number' && String(o.value).trim() !== '' && !isFinite(Number(o.value))) add('error', where + ': "' + o.value + '" bukan angka.', kind, id, step);
      else if (s === 'fixed' && o.type === 'Vector3' && nums(o.value).length < 3) add('warn', where + ': Vector3 butuh 3 angka (x,y,z).', kind, id, step);
      else if (s === 'random' && U.num(o.min, 1) > U.num(o.max, 10)) add('warn', where + ': nilai acak min lebih besar dari maks (akan ditukar).', kind, id, step);
      else if ((s === 'pick' || s === 'rr') && !(o.list || []).length) add('warn', where + ': daftar pilihan kosong.', kind, id, step);
    }
    function nums(s) { return String(s == null ? '' : s).split(/[,\s]+/).filter(Boolean).map(Number).filter(isFinite); }

    function checkCond(c, where, kind, id, step) {
      if (!c) return;
      if (c.cmp) {
        checkOperand(c.left, where + ' (kondisi, kiri)', kind, id, step);
        if (c.cmp !== 'exists' && c.cmp !== 'isNil') checkOperand(c.right, where + ' (kondisi, kanan)', kind, id, step);
        if (['>', '<', '>=', '<='].indexOf(c.cmp) >= 0 && c.right && c.right.src === 'fixed' && String(c.right.value).trim() !== '' && !isFinite(Number(c.right.value))) add('warn', where + ': operator ' + c.cmp + ' dengan nilai bukan angka ("' + c.right.value + '").', kind, id, step);
        if (c.cmp === 'between' && String((c.right && c.right.value) || '').split(',').filter(function (x) { return x.trim() !== ''; }).length < 2) add('warn', where + ': "di antara" butuh dua nilai dipisah koma (a,b).', kind, id, step);
        if (c.left && c.left.src === 'fixed' && String(c.left.value) === '' && !(c.left.type === 'string')) add('warn', where + ': sisi kiri kondisi kosong.', kind, id, step);
      } else (c.items || []).forEach(function (x) { checkCond(x, where, kind, id, step); });
    }

    /* ---- actions ---- */
    var usedActions = {};
    cfg.rules.forEach(function (r) { (r.steps || []).forEach(function (s) { usedActions[s.id] = 1; }); if (r.fallback) usedActions[r.fallback] = 1; });
    cfg.macros.forEach(function (m) { (m.steps || []).forEach(function (s) { if (s.action) usedActions[s.action] = 1; }); });
    cfg.actions.forEach(function (a) { (a.steps || []).forEach(function (s) { usedActions[s] = 1; }); if (a.kind === 'setwidget') { /* tidak menandai */ } });
    wAll.forEach(function (x) {
      var b = x.w.bind, b2 = x.w.bind2; [b, b2].forEach(function (bb) { if (bb && bb.kind === 'action' && bb.ref) usedActions[bb.ref] = 1; });
      if (x.w.optionsFrom) usedActions[x.w.optionsFrom] = 1;
    });
    function scanOperandUse(o) { if (o && o.src === 'action' && o.ref) usedActions[o.ref] = 1; }
    function scanCondUse(c) { if (!c) return; if (c.cmp) { scanOperandUse(c.left); scanOperandUse(c.right); } else (c.items || []).forEach(scanCondUse); }
    cfg.actions.forEach(function (a) { (a.args || []).forEach(scanOperandUse); scanCondUse(a.until); });
    cfg.rules.forEach(function (r) { scanCondUse(r.cond); });
    cfg.watchers.forEach(function (w) { scanOperandUse(w.intervalOp); });
    wAll.forEach(function (x) { scanOperandUse(x.w.src); });
    (cfg.ui.infoPanel.lines || []).forEach(function (l) { scanOperandUse(l.src); });

    cfg.actions.forEach(function (a) {
      var kd = M.actionKind(a.kind); var nm = a.name || (kd ? kd.label : a.kind) + ' (' + a.id + ')';
      if (!kd) { add('error', 'Aksi "' + nm + '": jenis tidak dikenal (' + a.kind + ').', 'action', a.id, 'actions'); return; }
      if (!a.name) add('info', 'Aksi tanpa nama (' + kd.label + ').', 'action', a.id, 'actions');
      if (NEEDS_TARGET.indexOf(a.kind) >= 0) {
        if (!a.targetId) add('error', 'Aksi "' + nm + '": belum memilih target.', 'action', a.id, 'actions');
        else if (!tgtById[a.targetId]) add('error', 'Aksi "' + nm + '": target tidak ditemukan (referensi putus).', 'action', a.id, 'actions');
      } else if (a.targetId && !tgtById[a.targetId]) add('error', 'Aksi "' + nm + '": target tidak ditemukan (referensi putus).', 'action', a.id, 'actions');
      if ((a.kind === 'teleport' || a.kind === 'walk') && !a.targetId && !(a.args && a.args[0] && !(a.args[0].src === 'fixed' && String(a.args[0].value).trim() === ''))) add('error', 'Aksi "' + nm + '": belum ada tujuan (isi argumen 1 atau pilih target).', 'action', a.id, 'actions');
      if (a.kind === 'equip' && !a.targetId && !(a.args && a.args[0] && String(a.args[0].value || '').trim() !== '') && !(a.args && a.args[0] && a.args[0].src !== 'fixed')) add('error', 'Aksi "' + nm + '": isi nama tool atau pilih target.', 'action', a.id, 'actions');
      if ((a.kind === 'get' || a.kind === 'set') && a.mode !== 'children' && a.mode !== 'childCount' && a.mode !== 'exists' && !String(a.prop || '').trim()) add('error', 'Aksi "' + nm + '": nama property/attribute kosong.', 'action', a.id, 'actions');
      if (a.kind === 'set' && !(a.args && a.args[0])) add('error', 'Aksi "' + nm + '": nilai baru belum diisi.', 'action', a.id, 'actions');
      if (a.kind === 'setwidget') { if (!a.widgetId || !widById[a.widgetId]) add('error', 'Aksi "' + nm + '": widget tujuan tidak ditemukan.', 'action', a.id, 'actions'); }
      if (a.kind === 'setvar' && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(a.varName || '')) add('error', 'Aksi "' + nm + '": nama variabel harus huruf/angka/_ dan tidak diawali angka.', 'action', a.id, 'actions');
      if (a.kind === 'runrule' && !ruleById[a.ref]) add('error', 'Aksi "' + nm + '": rule tidak ditemukan.', 'action', a.id, 'actions');
      if (a.kind === 'runmacro' && !macById[a.ref]) add('error', 'Aksi "' + nm + '": makro tidak ditemukan.', 'action', a.id, 'actions');
      if (a.kind === 'loop') {
        var steps = a.steps || [];
        if (!steps.length) add('warn', 'Aksi loop "' + nm + '": belum ada langkah.', 'action', a.id, 'actions');
        steps.forEach(function (sid) { if (!actById[sid]) add('error', 'Aksi loop "' + nm + '": langkah tidak ditemukan.', 'action', a.id, 'actions'); else if (sid === a.id) add('error', 'Aksi loop "' + nm + '": memanggil dirinya sendiri.', 'action', a.id, 'actions'); });
        var iv = a.args && a.args[0] && a.args[0].src === 'fixed' ? Number(a.args[0].value) : 1; var cnt = a.args && a.args[1] && a.args[1].src === 'fixed' ? Number(a.args[1].value) : 0;
        if (isFinite(iv) && iv < 0.1) add('warn', 'Aksi loop "' + nm + '": interval ' + iv + ' detik sangat cepat (risiko lag/crash; dibatasi minimal 0.03).', 'action', a.id, 'actions');
        if (!cnt && !(a.until && (a.until.cmp || (a.until.items && a.until.items.length)))) add('info', 'Aksi loop "' + nm + '": tanpa batas jumlah/kondisi; berhenti lewat Toggle / Stop Semua.', 'action', a.id, 'actions');
      }
      if (a.kind === 'wait' && a.args && a.args[0] && a.args[0].src === 'fixed' && Number(a.args[0].value) < 0) add('warn', 'Aksi "' + nm + '": waktu tunggu negatif.', 'action', a.id, 'actions');
      if (a.kind === 'custom') {
        if (!String(a.code || '').trim()) add('warn', 'Aksi custom "' + nm + '": kode kosong.', 'action', a.id, 'actions');
        if (FORBIDDEN_UI.test(a.code || '')) add('error', 'Aksi custom "' + nm + '": memakai library UI lain. Hanya LuluUI yang diizinkan.', 'action', a.id, 'actions');
        if (RAW_GUI.test(a.code || '')) add('error', 'Aksi custom "' + nm + '": membuat ScreenGui mentah. Pakai widget LuluUI.', 'action', a.id, 'actions');
        if (EXT_LOAD.test(a.code || '')) add('warn', 'Aksi custom "' + nm + '": memuat kode dari URL lain; hasil tidak lagi mandiri.', 'action', a.id, 'actions');
      }
      (a.args || []).forEach(function (o, i) { checkOperand(o, 'Aksi "' + nm + '" argumen ' + (i + 1), 'action', a.id, 'actions'); });
      if (a.kind === 'loop' && a.until) checkCond(a.until, 'Aksi loop "' + nm + '"', 'action', a.id, 'actions');
      if (kd.needs && kd.needs.length) add('info', 'Aksi "' + nm + '" butuh fungsi executor: ' + kd.needs.join(', ') + ' (dicek saat jalan; bila tidak ada, aksi dilewati + notifikasi).', 'action', a.id, 'actions');
      if (!usedActions[a.id] && a.kind !== 'stopall') add('warn', 'Aksi "' + nm + '" belum dipakai oleh rule, makro, atau tombol (aksi yatim).', 'action', a.id, 'actions');
      if (U.num(a.retry, 0) > 5) add('warn', 'Aksi "' + nm + '": retry maksimum 5 (akan dibatasi).', 'action', a.id, 'actions');
    });

    /* ---- watchers ---- */
    var watcherUsed = {};
    cfg.rules.forEach(function (r) { if (r.when) watcherUsed[r.when] = 1; });
    wAll.forEach(function (x) { [x.w.bind, x.w.bind2].forEach(function (b) { if (b && (b.kind === 'watcher') && b.ref) watcherUsed[b.ref] = 1; }); if (x.w.src && x.w.src.src === 'watcher') watcherUsed[x.w.src.ref] = 1; });
    cfg.actions.forEach(function (a) { (a.args || []).forEach(function (o) { if (o && o.src === 'watcher') watcherUsed[o.ref] = 1; }); });
    (cfg.ui.infoPanel.lines || []).forEach(function (l) { if (l.src && l.src.src === 'watcher') watcherUsed[l.src.ref] = 1; });
    function scanW(c) { if (!c) return; if (c.cmp) { [c.left, c.right].forEach(function (o) { if (o && o.src === 'watcher') watcherUsed[o.ref] = 1; }); } else (c.items || []).forEach(scanW); }
    cfg.rules.forEach(function (r) { scanW(r.cond); });
    cfg.watchers.forEach(function (w) {
      var kd = M.watcherKind(w.kind); var nm = w.name || (kd ? kd.label : w.kind) + ' (' + w.id + ')';
      if (!kd) { add('error', 'Watcher "' + nm + '": jenis tidak dikenal.', 'watcher', w.id, 'logic'); return; }
      if (kd.target) {
        if (!w.targetId) add('error', 'Watcher "' + nm + '": belum memilih target.', 'watcher', w.id, 'logic');
        else if (!tgtById[w.targetId]) add('error', 'Watcher "' + nm + '": target tidak ditemukan (referensi putus).', 'watcher', w.id, 'logic');
      }
      if (w.kind === 'attributeChanged' && !String(w.attr || '').trim()) add('error', 'Watcher "' + nm + '": nama attribute kosong.', 'watcher', w.id, 'logic');
      if (w.kind === 'propertyChanged' && !String(w.prop || '').trim()) add('error', 'Watcher "' + nm + '": nama property kosong.', 'watcher', w.id, 'logic');
      if (w.kind === 'interval') {
        var o = w.intervalOp; checkOperand(o, 'Watcher "' + nm + '" interval', 'watcher', w.id, 'logic', 'noevent');
        if (o && o.src === 'fixed') { var iv = Number(o.value); if (!isFinite(iv) || iv <= 0) add('error', 'Watcher "' + nm + '": interval harus > 0.', 'watcher', w.id, 'logic'); else if (iv < 0.1) add('warn', 'Watcher "' + nm + '": interval ' + iv + ' detik sangat cepat (dibatasi minimal 0.05); risiko lag.', 'watcher', w.id, 'logic'); }
      }
      if (w.kind === 'distance' && !(U.num(w.radius, 0) > 0)) add('error', 'Watcher "' + nm + '": radius harus > 0.', 'watcher', w.id, 'logic');
      if (w.kind === 'hotkey' && M.KEYS.indexOf(w.key) < 0) add('warn', 'Watcher "' + nm + '": nama tombol "' + w.key + '" tidak ada di daftar KeyCode.', 'watcher', w.id, 'logic');
      if (w.kind === 'remoteFired' && tgtById[w.targetId] && ['remote', 'bindable', 'auto'].indexOf(tgtById[w.targetId].type) < 0) add('warn', 'Watcher "' + nm + '": target bukan RemoteEvent/Bindable.', 'watcher', w.id, 'logic');
      if (['valueChanged'].indexOf(w.kind) >= 0 && tgtById[w.targetId] && ['value', 'auto', 'instance'].indexOf(tgtById[w.targetId].type) < 0) add('warn', 'Watcher "' + nm + '": target sebaiknya bertipe ValueObject.', 'watcher', w.id, 'logic');
      if (!watcherUsed[w.id] && w.kind !== 'manual') add('warn', 'Watcher "' + nm + '" belum dipakai rule / tampilan manapun.', 'watcher', w.id, 'logic');
      if (w.kind === 'manual' && !watcherUsed[w.id]) add('warn', 'Watcher manual "' + nm + '" tidak dipicu tombol manapun.', 'watcher', w.id, 'logic');
    });

    /* ---- rules ---- */
    var ruleHasToggle = {};
    wAll.forEach(function (x) { if (x.w.type === 'Toggle' && x.w.bind && x.w.bind.kind === 'rule' && x.w.bind.ref) ruleHasToggle[x.w.bind.ref] = 1; });
    cfg.rules.forEach(function (r) {
      var nm = r.name || r.id;
      if (!r.when) add('error', 'Rule "' + nm + '": belum memilih watcher pemicu.', 'rule', r.id, 'logic');
      else if (!watById[r.when]) add('error', 'Rule "' + nm + '": watcher pemicu tidak ditemukan (referensi putus).', 'rule', r.id, 'logic');
      if (!(r.steps || []).length) add('warn', 'Rule "' + nm + '": belum ada aksi.', 'rule', r.id, 'logic');
      (r.steps || []).forEach(function (s, i) { if (!actById[s.id]) add('error', 'Rule "' + nm + '": langkah ' + (i + 1) + ' menunjuk aksi yang tidak ada.', 'rule', r.id, 'logic'); if (U.num(s.delay, 0) < 0) add('warn', 'Rule "' + nm + '": delay negatif pada langkah ' + (i + 1) + '.', 'rule', r.id, 'logic'); });
      if (r.onFail === 'fallback' && !actById[r.fallback]) add('error', 'Rule "' + nm + '": aksi cadangan belum dipilih.', 'rule', r.id, 'logic');
      checkCond(r.cond, 'Rule "' + nm + '"', 'rule', r.id, 'logic');
      if (r.when && watById[r.when] && watById[r.when].kind === 'interval' && !(U.num(r.cooldown, 0) > 0) && (r.steps || []).length && (r.steps || []).every(function (s) { return !s.delay || Number(s.delay) === 0; })) { /* normal */ }
      if (r.enabled !== false && !ruleHasToggle[r.id] && watById[r.when] && ['interval'].indexOf(watById[r.when].kind) >= 0) add('info', 'Rule "' + nm + '" aktif otomatis tanpa Toggle; tambahkan Toggle supaya bisa dimatikan (atau pakai Stop Semua).', 'rule', r.id, 'logic');
    });

    /* ---- siklus rule (rule -> runrule -> rule, dan rule -> set Value -> watcher -> rule) ---- */
    var edges = {};
    function ruleActions(r) { return (r.steps || []).map(function (s) { return actById[s.id]; }).filter(Boolean).concat(r.fallback && actById[r.fallback] ? [actById[r.fallback]] : []); }
    cfg.rules.forEach(function (r) {
      edges[r.id] = edges[r.id] || [];
      ruleActions(r).forEach(function (a) {
        var expand = [a]; if (a.kind === 'loop') expand = expand.concat((a.steps || []).map(function (id) { return actById[id]; }).filter(Boolean));
        expand.forEach(function (aa) {
          if (aa.kind === 'runrule' && ruleById[aa.ref]) edges[r.id].push({ to: aa.ref, hard: true });
          if (aa.kind === 'runmacro' && macById[aa.ref]) (macById[aa.ref].steps || []).forEach(function (st) { var ma = actById[st.action]; if (ma && ma.kind === 'runrule' && ruleById[ma.ref]) edges[r.id].push({ to: ma.ref, hard: true }); });
          if (aa.kind === 'set' && aa.targetId) cfg.rules.forEach(function (r2) { var w2 = watById[r2.when]; if (w2 && w2.targetId === aa.targetId && ['valueChanged', 'attributeChanged', 'propertyChanged'].indexOf(w2.kind) >= 0) edges[r.id].push({ to: r2.id, hard: false }); });
          if (aa.kind === 'setwidget' && aa.widgetId) wAll.forEach(function (x) { if (x.w.id === aa.widgetId && x.w.type === 'Toggle' && x.w.bind && x.w.bind.kind === 'rule' && ruleById[x.w.bind.ref]) { /* hanya mengaktifkan, bukan memicu */ } });
        });
      });
    });
    function findCycle(hardOnly) {
      var color = {}, stack = [], found = null;
      function dfs(u) {
        color[u] = 1; stack.push(u);
        (edges[u] || []).forEach(function (e) {
          if (found || (hardOnly && !e.hard)) return;
          if (color[e.to] === 1) { found = stack.slice(stack.indexOf(e.to)).concat([e.to]); return; }
          if (!color[e.to]) dfs(e.to);
        });
        stack.pop(); color[u] = 2;
      }
      Object.keys(edges).forEach(function (k) { if (!color[k] && !found) dfs(k); });
      return found;
    }
    var hardCycle = findCycle(true), softCycle = findCycle(false);
    function rn(id) { return (ruleById[id] && (ruleById[id].name || id)) || id; }
    if (hardCycle) add('error', 'Relasi melingkar antar rule: ' + hardCycle.map(rn).join(' → ') + '. Rule saling memanggil tanpa akhir.', 'rule', hardCycle[0], 'logic');
    else if (softCycle) add('warn', 'Rule berpotensi memicu dirinya sendiri lewat perubahan Value: ' + softCycle.map(rn).join(' → ') + '. Gunakan cooldown atau kondisi pembatas.', 'rule', softCycle[0], 'logic');
    // makro memanggil makro sendiri
    cfg.macros.forEach(function (m) {
      var nm = m.name || m.id;
      (m.steps || []).forEach(function (st, i) {
        if (st.action && !actById[st.action]) add('error', 'Makro "' + nm + '": langkah ' + (i + 1) + ' menunjuk aksi yang tidak ada.', 'macro', m.id, 'logic');
        if (st.action && actById[st.action] && actById[st.action].kind === 'runmacro' && actById[st.action].ref === m.id) add('error', 'Makro "' + nm + '" memanggil dirinya sendiri.', 'macro', m.id, 'logic');
        if (st.wait != null && st.wait !== '' && !(Number(st.wait) >= 0)) add('error', 'Makro "' + nm + '": waktu tunggu langkah ' + (i + 1) + ' tidak valid.', 'macro', m.id, 'logic');
      });
      if (!(m.steps || []).length) add('warn', 'Makro "' + nm + '" kosong.', 'macro', m.id, 'logic');
      if (m.loop && !(m.steps || []).some(function (st) { return Number(st.wait) > 0; }) && !(U.num(m.interval, 0.1) >= 0.1)) add('warn', 'Makro "' + nm + '" loop tanpa jeda memadai; risiko lag (interval minimal 0.1).', 'macro', m.id, 'logic');
      var used = wAll.some(function (x) { return x.w.bind && x.w.bind.kind === 'macro' && x.w.bind.ref === m.id; }) || wAll.some(function (x) { return x.w.bind2 && x.w.bind2.kind === 'macro' && x.w.bind2.ref === m.id; }) || cfg.actions.some(function (a) { return a.kind === 'runmacro' && a.ref === m.id; });
      if (!used) add('warn', 'Makro "' + nm + '" belum dihubungkan ke tombol/toggle/aksi.', 'macro', m.id, 'logic');
    });

    /* ---- UI ---- */
    var tabNames = {};
    cfg.ui.tabs.forEach(function (t, i) {
      var nm = String(t.name || '').trim();
      if (!nm) add('error', 'Tab ke-' + (i + 1) + ' belum punya nama.', 'tab', t.id, 'ui');
      if (tabNames[nm.toLowerCase()]) add('warn', 'Nama tab duplikat: "' + nm + '".', 'tab', t.id, 'ui'); tabNames[nm.toLowerCase()] = 1;
      if (nm.toLowerCase() === 'info' && P.infoTab) add('warn', 'Tab "Info" bentrok dengan tab bawaan Info. Ganti nama atau matikan tab Info bawaan.', 'tab', t.id, 'ui');
    });
    if (!wAll.length && !cfg.ui.infoPanel.enabled && !cfg.ui.locationPanel) add('warn', 'UI masih kosong: belum ada widget.', 'ui', '', 'ui');
    function bindCheck(wd, b, label) {
      if (!b) return;
      var k = b.kind;
      if (k === 'rule' && !ruleById[b.ref]) add('error', 'Widget "' + label + '": rule tujuan tidak ditemukan.', 'widget', wd.id, 'ui');
      if (k === 'watcher' && !watById[b.ref]) add('error', 'Widget "' + label + '": watcher tujuan tidak ditemukan.', 'widget', wd.id, 'ui');
      if (k === 'macro' && !macById[b.ref]) add('error', 'Widget "' + label + '": makro tujuan tidak ditemukan.', 'widget', wd.id, 'ui');
      if (k === 'action' && !actById[b.ref]) add('error', 'Widget "' + label + '": aksi tujuan tidak ditemukan.', 'widget', wd.id, 'ui');
      if (k === 'refresh' && !(widById[b.ref] && widById[b.ref].optionsFrom)) add('warn', 'Widget "' + label + '": tombol refresh menunjuk Dropdown tanpa sumber opsi.', 'widget', wd.id, 'ui');
    }
    wAll.forEach(function (x) {
      var wd = x.w, label = wd.label || wd.type + ' (' + wd.id + ')';
      if (wd.type === 'Toggle') {
        var b = wd.bind || {};
        if (['rule', 'watcher', 'macro', 'action'].indexOf(b.kind) >= 0) bindCheck(wd, b, label);
        else add('info', 'Toggle "' + label + '" tidak dihubungkan ke apa pun (hanya menyimpan nilai untuk dibaca aksi).', 'widget', wd.id, 'ui');
        if (b.kind === 'action' && actById[b.ref] && actById[b.ref].kind !== 'loop') add('warn', 'Toggle "' + label + '": aksi tujuan bukan Loop; toggle menjalankannya sekali lalu mati sendiri.', 'widget', wd.id, 'ui');
      }
      if (wd.type === 'Button') { var bb = wd.bind || {}; if (!bb.kind || bb.kind === 'none') add('warn', 'Button "' + label + '" belum punya fungsi (binding kosong).', 'widget', wd.id, 'ui'); else bindCheck(wd, bb, label); }
      if (wd.type === 'HalfButtons') { [wd.bind, wd.bind2].forEach(function (bb, i) { if (!bb || !bb.kind || bb.kind === 'none') add('warn', 'HalfButtons "' + label + '": tombol ' + (i + 1) + ' belum punya fungsi.', 'widget', wd.id, 'ui'); else bindCheck(wd, bb, label); }); }
      if (wd.type === 'Dropdown' && wd.bind && wd.bind.kind === 'profile' && !cfg.profiles.length) add('warn', 'Dropdown profil "' + label + '" tapi belum ada profil.', 'widget', wd.id, 'ui');
      if ((wd.type === 'Dropdown' || wd.type === 'MultiDropdown' || wd.type === 'Segment') && !(wd.bind && wd.bind.kind === 'profile') && !(wd.options || []).length && !wd.optionsFrom) add('warn', label + ': belum ada opsi.', 'widget', wd.id, 'ui');
      if (wd.optionsFrom && !actById[wd.optionsFrom]) add('error', 'Widget "' + label + '": sumber opsi (aksi) tidak ditemukan.', 'widget', wd.id, 'ui');
      if (wd.optionsFrom && actById[wd.optionsFrom] && ['get', 'invoke', 'custom', 'setvar'].indexOf(actById[wd.optionsFrom].kind) < 0) add('warn', 'Widget "' + label + '": sumber opsi sebaiknya aksi Get/Invoke yang mengembalikan daftar.', 'widget', wd.id, 'ui');
      if ((wd.type === 'InfoLabel' || wd.type === 'ProgressBar') && wd.src) checkOperand(wd.src, 'Widget "' + label + '"', 'widget', wd.id, 'ui', 'noevent');
      if (wd.type === 'NumberInput' && !(Number(wd.min) <= Number(wd.max))) add('error', 'NumberInput "' + label + '": min lebih besar dari maks.', 'widget', wd.id, 'ui');
      if (wd.type === 'NumberInput' && !(Number(wd.step) > 0)) add('error', 'NumberInput "' + label + '": step harus > 0.', 'widget', wd.id, 'ui');
      if (wd.type === 'ProgressBar' && !(Number(wd.max) > 0)) add('error', 'ProgressBar "' + label + '": maks harus > 0.', 'widget', wd.id, 'ui');
      if (wd.type === 'Custom') {
        if (FORBIDDEN_UI.test(wd.code || '')) add('error', 'Custom widget "' + label + '": memakai library UI lain. Hanya LuluUI yang diizinkan.', 'widget', wd.id, 'ui');
        if (RAW_GUI.test(wd.code || '')) add('error', 'Custom widget "' + label + '": membuat ScreenGui mentah.', 'widget', wd.id, 'ui');
        if (EXT_LOAD.test(wd.code || '')) add('warn', 'Custom widget "' + label + '": memuat kode dari URL lain.', 'widget', wd.id, 'ui');
      }
      if (wd.type === 'Button' && wd.color && !/^#?[0-9a-fA-F]{6}$/.test(String(wd.color).trim())) add('warn', 'Warna "' + wd.color + '" pada "' + label + '" bukan hex 6 digit (diabaikan).', 'widget', wd.id, 'ui');
      if (wd.type === 'Accordion' && !(wd.children || []).length) add('info', 'Accordion "' + label + '" kosong.', 'widget', wd.id, 'ui');
    });
    cfg.profiles.forEach(function (p, i) {
      Object.keys(p.values || {}).forEach(function (k) { if (!widById[k]) add('warn', 'Profil "' + p.name + '": widget ' + k + ' sudah tidak ada.', 'profile', String(i), 'logic'); });
      if (!String(p.name || '').trim()) add('error', 'Profil ke-' + (i + 1) + ' belum punya nama.', 'profile', String(i), 'logic');
    });
    var pn = {}; cfg.profiles.forEach(function (p, i) { if (pn[p.name]) add('warn', 'Nama profil duplikat: ' + p.name, 'profile', String(i), 'logic'); pn[p.name] = 1; });
    (cfg.ui.infoPanel.lines || []).forEach(function (l, i) { checkOperand(l.src, 'InfoPanel baris ' + (i + 1), 'ui', '', 'ui', 'noevent'); });
    (cfg.ui.locations || []).forEach(function (loc, i) { if (!(loc.lanes || []).length) add('warn', 'Lokasi "' + (loc.name || i + 1) + '" tanpa koordinat.', 'ui', '', 'ui'); (loc.lanes || []).forEach(function (p) { if (nums(p).length < 3) add('warn', 'Lokasi "' + (loc.name || i + 1) + '": koordinat "' + p + '" harus x,y,z.', 'ui', '', 'ui'); }); });
    if (cfg.ui.locationPanel && !(cfg.ui.locations || []).length) add('warn', 'LocationPanel aktif tapi belum ada lokasi.', 'ui', '', 'ui');

    /* ---- executor ---- */
    if (P.autosave && wAll.some(function (x) { return M.VALUE_WIDGETS.indexOf(x.w.type) >= 0 && x.w.persist !== false; })) add('info', 'Penyimpanan pengaturan butuh writefile/readfile; bila executor tidak mendukung, script tetap jalan tanpa menyimpan.', 'project', '', 'project');
    if (P.minify) add('info', 'Minify aktif: komentar dan baris kosong dihapus; kode lebih sulit dibaca.', 'project', '', 'project');

    var errors = issues.filter(function (i) { return i.level === 'error'; }).length;
    var warnings = issues.filter(function (i) { return i.level === 'warn'; }).length;
    return { issues: issues, errors: errors, warnings: warnings, ok: errors === 0 };
  }

  LSB.validate = validate;
  if (typeof module !== 'undefined') module.exports = validate;
})(typeof window !== 'undefined' ? window : globalThis);
