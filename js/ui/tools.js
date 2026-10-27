/* tools.js - pencari path (snippet Lua) + importer log + impor massal */
(function (g) {
  var LSB = g.LSB, D = LSB.dom, h = D.h, F = LSB.make, U = LSB.util;
  var T = LSB.tools = {};

  T.SCAN_SNIPPET = [
    '-- Pencari path: jalankan di executor, hasil disalin ke clipboard (tempel di Lulu Script Builder > Target > Impor)',
    'local out, n = {}, 0',
    'local want = { RemoteEvent = true, RemoteFunction = true, BindableEvent = true, BindableFunction = true, ProximityPrompt = true, ClickDetector = true,',
    '  IntValue = true, NumberValue = true, StringValue = true, BoolValue = true, ObjectValue = true, Tool = true }',
    'local function path(i)',
    '  local names, c = {}, i',
    '  while c and c ~= game do table.insert(names, 1, c.Name); c = c.Parent end',
    '  local dot = false',
    '  for _, nm in ipairs(names) do if nm:find("%.") then dot = true end end',
    '  return table.concat(names, dot and "/" or ".")',
    'end',
    'local roots = { game:GetService("ReplicatedStorage"), workspace, game:GetService("Players").LocalPlayer, game:GetService("ReplicatedFirst") }',
    'for _, r in ipairs(roots) do',
    '  for _, d in ipairs(r:GetDescendants()) do',
    '    if want[d.ClassName] and n < 1500 then n += 1; out[#out + 1] = path(d) .. " | " .. d.ClassName end',
    '  end',
    'end',
    'local text = table.concat(out, "\\n")',
    'if setclipboard then setclipboard(text) end',
    'print(text)',
    'print("[Scan] " .. n .. " item" .. (setclipboard and " (sudah disalin)" or ""))'
  ].join('\n');

  T.SPY_SNIPPET = [
    '-- Remote spy ringan: tekan aksi di game, lalu panggilan Remote tercatat. Hasil disalin tiap 20 panggilan / ketik _G.LSB_COPY()',
    'local log, seen = {}, {}',
    'local function path(i) local t, c = {}, i; while c and c ~= game do table.insert(t, 1, c.Name); c = c.Parent end; return table.concat(t, ".") end',
    'local function lit(v)',
    '  local ty = typeof(v)',
    '  if ty == "string" then return string.format("%q", v) elseif ty == "number" or ty == "boolean" then return tostring(v) elseif v == nil then return "nil" end',
    '  return "<" .. ty .. ">"',
    'end',
    'local old; old = hookmetamethod(game, "__namecall", function(self, ...)',
    '  local m = getnamecallmethod()',
    '  if (m == "FireServer" or m == "InvokeServer") and typeof(self) == "Instance" then',
    '    local a = table.pack(...); local parts = {}',
    '    for i = 1, a.n do parts[#parts + 1] = lit(a[i]) end',
    '    local line = path(self) .. " | " .. self.ClassName .. " | " .. table.concat(parts, ", ")',
    '    if not seen[line] then seen[line] = true; log[#log + 1] = line; if #log % 20 == 0 and setclipboard then setclipboard(table.concat(log, "\\n")) end end',
    '  end',
    '  return old(self, ...)',
    'end)',
    'getgenv().LSB_COPY = function() if setclipboard then setclipboard(table.concat(log, "\\n")) end print(table.concat(log, "\\n")) end',
    'print("[Spy] aktif. Panggil LSB_COPY() untuk menyalin hasil.")'
  ].join('\n');

  var CLASS_TYPE = { RemoteEvent: 'remote', RemoteFunction: 'function', BindableEvent: 'bindable', BindableFunction: 'bindable', ProximityPrompt: 'prompt', ClickDetector: 'click', IntValue: 'value', NumberValue: 'value', StringValue: 'value', BoolValue: 'value', ObjectValue: 'value', Tool: 'tool', Humanoid: 'humanoid', Folder: 'folder', Model: 'folder' };

  // parse "path | Class | args" atau path polos
  T.parse = function (text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line || line.indexOf('--') === 0 || /^\[(Scan|Spy)\]/.test(line)) return;
      var p = line.split('|').map(function (x) { return x.trim(); });
      var path = p[0].replace(/^game\./, '');
      if (!/^[A-Za-z0-9_\-\.\/ \[\]()&']+$/.test(path)) return;
      var cls = p[1] || '';
      out.push({ path: path, cls: cls, type: CLASS_TYPE[cls] || 'auto', args: p.length > 2 ? p.slice(2).join('|') : null, name: path.split(/[\.\/]/).pop() });
    });
    return out;
  };

  // split argumen literal sederhana: 1, "abc", true
  T.splitArgs = function (s) {
    var res = [], cur = '', q = false, esc = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { cur += c; if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') q = false; continue; }
      if (c === '"') { q = true; cur += c; } else if (c === ',') { res.push(cur.trim()); cur = ''; } else cur += c;
    }
    if (cur.trim() !== '') res.push(cur.trim()); return res;
  };
  T.argOperand = function (lit) {
    if (/^".*"$/.test(lit)) return F.fixed(lit.slice(1, -1).replace(/\\"/g, '"'), 'string');
    if (/^-?\d+(\.\d+)?$/.test(lit)) return F.fixed(lit, 'number');
    if (lit === 'true' || lit === 'false') return F.fixed(lit, 'boolean');
    if (lit === 'nil') return F.fixed('', 'nil');
    return F.fixed(lit, 'auto');
  };

  T.uniqAlias = function (cfg, base) {
    var a = U.ident(base, 'Target'), n = a, k = 2; var used = cfg.targets.map(function (t) { return t.alias; });
    while (used.indexOf(n) >= 0) n = a + k++;
    return n;
  };

  // dialog impor
  T.importDialog = function () {
    var ta = h('textarea', { rows: 9, placeholder: 'Tempel hasil di sini.\nFormat: Path | Class | argumen(opsional)\nContoh:\nReplicatedStorage.Remotes.Collect | RemoteEvent | 5, "abc"\nWorkspace.Items\n' });
    var list = h('div'); var items = [];
    function render() {
      list.innerHTML = '';
      items = T.parse(ta.value);
      if (!items.length) { list.appendChild(D.empty('Belum ada baris valid.')); return; }
      list.appendChild(h('div', { class: 'help', text: items.length + ' baris dikenali. Centang yang ingin ditambahkan.' }));
      items.forEach(function (it) {
        it.on = it.on !== false;
        var cb = h('input', { type: 'checkbox', checked: it.on, onchange: function () { it.on = cb.checked; } });
        list.appendChild(h('label', { class: 'chk' }, cb, h('span', { text: it.path }), h('span', { class: 'pill', text: it.cls || it.type }), it.args != null ? h('span', { class: 'pill info', text: 'args: ' + it.args }) : null));
      });
    }
    ta.addEventListener('input', U.debounce(render, 250));
    var mkAction = { checked: true };
    var chk = h('input', { type: 'checkbox', checked: true, onchange: function () { mkAction.checked = chk.checked; } });
    var body = h('div', null, ta, list, h('label', { class: 'chk', style: 'margin-top:8px' }, chk, 'Buat aksi Fire/Invoke otomatis untuk Remote (argumen dari spy ikut terisi)'));
    D.modal('Impor path / hasil spy', body, [{ text: 'Batal' }, { text: 'Tambahkan', cls: 'primary', fn: function () {
      var add = items.filter(function (i) { return i.on !== false; }); if (!add.length) { D.toast('Tidak ada yang dipilih', 'err'); return false; }
      D.act(function (cfg) {
        add.forEach(function (it) {
          var ex = cfg.targets.filter(function (t) { return t.path === it.path; })[0];
          var t = ex || F.target({ alias: T.uniqAlias(cfg, it.name), path: it.path, type: it.type });
          if (!ex) cfg.targets.push(t);
          if (mkAction.checked && (it.type === 'remote' || it.type === 'function')) {
            var a = F.action(it.type === 'function' ? 'invoke' : 'fire', { name: (it.type === 'function' ? 'Invoke ' : 'Fire ') + t.alias, targetId: t.id });
            if (it.args) a.args = T.splitArgs(it.args).map(T.argOperand);
            cfg.actions.push(a);
          }
        });
      });
      D.toast(add.length + ' item ditambahkan', 'ok');
    } }]);
  };

  T.snippetDialog = function () {
    function block(title, desc, code) {
      return h('div', { class: 'card sub' }, h('b', { text: title }), h('p', { class: 'help', text: desc }), h('pre', { class: 'code', text: code, style: 'max-height:180px' }),
        h('button', { class: 'btn sm primary', text: 'Salin snippet', onclick: function () { D.copy(code); } }));
    }
    D.modal('Pencari path & Remote spy', h('div', null,
      h('p', { class: 'help', text: 'Jalankan snippet di executor pada game yang dituju, lalu tempel hasilnya lewat tombol "Impor". Tidak perlu mengetik path manual.' }),
      block('1. Pencari path', 'Mendaftar Remote, Value, ProximityPrompt, ClickDetector, Tool.', T.SCAN_SNIPPET),
      block('2. Remote spy ringan', 'Mencatat panggilan FireServer/InvokeServer beserta argumennya (butuh hookmetamethod).', T.SPY_SNIPPET)), [{ text: 'Tutup' }]);
  };

  if (typeof module !== 'undefined') module.exports = T;
})(typeof window !== 'undefined' ? window : globalThis);
