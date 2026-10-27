/*
 * templates.js - template awal. LSB.templates = [{ id, name, icon, desc, build() -> cfg }]
 * Path di template hanyalah contoh; pengguna menggantinya di langkah "Target".
 */
(function (g) {
  var LSB = g.LSB = g.LSB || {};
  if (typeof require !== 'undefined' && !LSB.make) require('./core.js');
  var F = LSB.make;

  function base(name, title) { var c = F.config(); c.project.name = name; c.project.title = title; return c; }
  function T(c, id, alias, path, type) { var t = F.target({ id: id, alias: alias, path: path, type: type }); c.targets.push(t); return t; }
  function add(c, w) { c.ui.tabs[0].widgets.push(w); return w; }

  var list = LSB.templates = [];

  list.push({
    id: 'blank', name: 'Kosong', icon: '📄', desc: 'Mulai dari nol.',
    build: function () { return F.config(); }
  });

  list.push({
    id: 'autocollect', name: 'Auto Collect', icon: '🧺', desc: 'Toggle: kirim Remote Collect tiap beberapa detik, dengan jumlah dari UI.',
    build: function () {
      var c = base('AutoCollect', 'Auto Collect');
      T(c, 't1', 'Collect', 'ReplicatedStorage.Remotes.Collect', 'remote');
      c.actions.push(F.action('fire', { id: 'a1', name: 'Collect', targetId: 't1', args: [F.operand('widget', { ref: 'w2', type: 'number' })] }));
      c.watchers.push(F.watcher('interval', { id: 'wt1', name: 'Timer collect', intervalOp: F.operand('widget', { ref: 'w3', type: 'number' }) }));
      c.rules.push(F.rule({ id: 'r1', name: 'Collect berkala', when: 'wt1', steps: [{ id: 'a1', delay: 0 }], enabled: false }));
      add(c, F.widget('Toggle', { id: 'w1', label: 'Auto Collect', bind: { kind: 'rule', ref: 'r1' } }));
      add(c, F.widget('NumberInput', { id: 'w2', label: 'Jumlah', default: 1, min: 1, max: 999 }));
      add(c, F.widget('NumberInput', { id: 'w3', label: 'Jeda (detik)', default: 2, step: 0.5, min: 0.2, max: 60 }));
      return c;
    }
  });

  list.push({
    id: 'autofarm', name: 'Auto Farm Loop', icon: '🌾', desc: 'Makro berulang: teleport → proximity prompt → tunggu → ulang. Ada tombol Stop.',
    build: function () {
      var c = base('AutoFarm', 'Auto Farm');
      T(c, 't1', 'Spot', 'Workspace.Farm.Spot', 'instance');
      T(c, 't2', 'Prompt', 'Workspace.Farm.Spot.ProximityPrompt', 'prompt');
      c.actions.push(
        F.action('teleport', { id: 'a1', name: 'Ke spot', targetId: 't1', args: [F.operand('target', { ref: 't1' }), F.fixed('3', 'number')] }),
        F.action('prompt', { id: 'a2', name: 'Ambil', targetId: 't2' }),
        F.action('notify', { id: 'a3', name: 'Info', args: [F.fixed('Farm berjalan', 'string')] }));
      c.macros.push(F.macro({ id: 'm1', name: 'Farm', loop: true, interval: 0.5, steps: [{ action: 'a1' }, { wait: 0.4 }, { action: 'a2' }, { wait: 1.5 }] }));
      add(c, F.widget('Toggle', { id: 'w1', label: 'Auto Farm', bind: { kind: 'macro', ref: 'm1' } }));
      add(c, F.widget('Button', { id: 'w2', label: '⛔ Berhenti', bind: { kind: 'stopall', ref: '' } }));
      return c;
    }
  });

  list.push({
    id: 'quest', name: 'Quest Tracker', icon: '📜', desc: 'Pantau nilai Quest; saat selesai, otomatis claim + tampilkan di panel Status.',
    build: function () {
      var c = base('QuestTracker', 'Quest Tracker');
      T(c, 't1', 'Quest', 'Players.LocalPlayer.leaderstats.Quest', 'value');
      T(c, 't2', 'Claim', 'ReplicatedStorage.Remotes.ClaimQuest', 'remote');
      c.watchers.push(F.watcher('valueChanged', { id: 'wt1', name: 'Quest berubah', targetId: 't1' }));
      c.actions.push(
        F.action('fire', { id: 'a1', name: 'Claim', targetId: 't2', args: [F.operand('watcher', { ref: 'wt1', field: 'value' })] }),
        F.action('log', { id: 'a2', name: 'Catat', args: [F.operand('template', { tpl: 'Quest {wt:wt1.value} diclaim' })] }));
      c.rules.push(F.rule({
        id: 'r1', name: 'Auto claim', when: 'wt1', cooldown: 1, steps: [{ id: 'a1', delay: 0 }, { id: 'a2', delay: 0 }], enabled: false,
        cond: { op: 'AND', items: [{ left: F.operand('watcher', { ref: 'wt1', field: 'value' }), cmp: '>=', right: F.fixed('10', 'number') }] }
      }));
      add(c, F.widget('Toggle', { id: 'w1', label: 'Auto claim quest', bind: { kind: 'rule', ref: 'r1' } }));
      add(c, F.widget('InfoLabel', { id: 'w2', label: 'Quest sekarang', src: F.operand('watcher', { ref: 'wt1', field: 'value' }) }));
      add(c, F.widget('List', { id: 'w3', label: 'Log', isLog: true }));
      return c;
    }
  });

  list.push({
    id: 'autoclaim', name: 'Auto Claim saat mulai', icon: '🎁', desc: 'Saat script jalan & saat respawn, kirim Remote claim sekali.',
    build: function () {
      var c = base('AutoClaim', 'Auto Claim');
      T(c, 't1', 'Claim', 'ReplicatedStorage.Remotes.ClaimDaily', 'remote');
      c.actions.push(F.action('fire', { id: 'a1', name: 'Claim', targetId: 't1' }), F.action('notify', { id: 'a2', name: 'Info', args: [F.fixed('Claim dikirim', 'string')] }));
      c.watchers.push(F.watcher('start', { id: 'wt1', name: 'Saat mulai', startDelay: 2 }), F.watcher('respawn', { id: 'wt2', name: 'Respawn' }));
      c.rules.push(F.rule({ id: 'r1', name: 'Claim awal', when: 'wt1', steps: [{ id: 'a1', delay: 0 }, { id: 'a2', delay: 0 }] }),
        F.rule({ id: 'r2', name: 'Claim respawn', when: 'wt2', cooldown: 5, steps: [{ id: 'a1', delay: 1 }] }));
      add(c, F.widget('Toggle', { id: 'w1', label: 'Claim saat respawn', default: true, bind: { kind: 'rule', ref: 'r2' } }));
      add(c, F.widget('Button', { id: 'w2', label: 'Claim sekarang', bind: { kind: 'action', ref: 'a1' } }));
      return c;
    }
  });

  list.push({
    id: 'teleport', name: 'Teleport Menu', icon: '📍', desc: 'Daftar lokasi dengan tombol teleport (LocationPanel bawaan).',
    build: function () {
      var c = base('TeleportMenu', 'Teleport');
      c.ui.locationPanel = true; c.ui.locationMode = 'walk';
      c.ui.locations = [{ name: 'Spawn', lanes: ['0,5,0'] }, { name: 'Toko', lanes: ['120,5,-40'] }, { name: 'Boss', lanes: ['-200,8,300'] }];
      return c;
    }
  });

  list.push({
    id: 'antiafk', name: 'Anti AFK', icon: '💤', desc: 'Toggle yang menggerakkan karakter sedikit tiap 60 detik.',
    build: function () {
      var c = base('AntiAFK', 'Anti AFK');
      c.actions.push(F.action('custom', { id: 'a1', name: 'Gerak kecil', code: 'local vu = game:GetService("VirtualUser")\nvu:CaptureController()\nvu:ClickButton2(Vector2.new())' }));
      c.watchers.push(F.watcher('interval', { id: 'wt1', name: 'Tiap menit', intervalOp: F.fixed('60', 'number') }));
      c.rules.push(F.rule({ id: 'r1', name: 'Anti AFK', when: 'wt1', steps: [{ id: 'a1', delay: 0 }], enabled: false }));
      add(c, F.widget('Toggle', { id: 'w1', label: 'Anti AFK', bind: { kind: 'rule', ref: 'r1' } }));
      return c;
    }
  });

  list.push({
    id: 'equip', name: 'Auto Equip Tool', icon: '🎒', desc: 'Pakai tool pilihan saat respawn; dropdown dari nama tool.',
    build: function () {
      var c = base('AutoEquip', 'Auto Equip');
      c.actions.push(F.action('equip', { id: 'a1', name: 'Equip', args: [F.operand('widget', { ref: 'w2', type: 'string' })] }));
      c.watchers.push(F.watcher('respawn', { id: 'wt1', name: 'Respawn' }));
      c.rules.push(F.rule({ id: 'r1', name: 'Equip saat respawn', when: 'wt1', steps: [{ id: 'a1', delay: 1 }], enabled: false }));
      add(c, F.widget('Toggle', { id: 'w1', label: 'Auto equip', bind: { kind: 'rule', ref: 'r1' } }));
      add(c, F.widget('TextInput', { id: 'w2', label: 'Nama tool', default: 'Sword', placeholder: 'nama tool' }));
      add(c, F.widget('Button', { id: 'w3', label: 'Equip sekarang', bind: { kind: 'action', ref: 'a1' } }));
      return c;
    }
  });

  list.push({
    id: 'infopanel', name: 'Panel Info (ESP ringan)', icon: '📟', desc: 'Panel status live: nilai Value + jarak ke objek.',
    build: function () {
      var c = base('InfoPanelDemo', 'Status');
      T(c, 't1', 'Coins', 'Players.LocalPlayer.leaderstats.Coins', 'value');
      T(c, 't2', 'Boss', 'Workspace.Boss', 'instance');
      c.watchers.push(F.watcher('valueChanged', { id: 'wt1', name: 'Coins', targetId: 't1' }), F.watcher('distance', { id: 'wt2', name: 'Dekat Boss', targetId: 't2', radius: 50, pollEvery: 0.5, onlyEnter: false }));
      c.ui.infoPanel = { enabled: true, title: 'Status', lines: [{ label: 'Coins', src: F.operand('watcher', { ref: 'wt1', field: 'value' }) }, { label: 'Jarak Boss', src: F.operand('watcher', { ref: 'wt2', field: 'value' }) }] };
      add(c, F.widget('Label', { id: 'w1', label: 'Panel status ada di tab Info' }));
      return c;
    }
  });

  LSB.templateById = function (id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  if (typeof module !== 'undefined') module.exports = list;
})(typeof window !== 'undefined' ? window : globalThis);
