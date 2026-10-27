'use strict';
/*
 * e2e.test.js - menjalankan script HASIL generator di interpreter Lua mini + tiruan Roblox,
 * dengan LuluUI asli (hasil tambalan). Jalankan:  node tests/e2e.test.js
 */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
['core', 'runtime', 'luacheck', 'generator', 'validate', 'templates'].forEach((m) => { try { require(path.join(root, 'js', m + '.js')); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; } });
const { createEnv } = require('./robloxmock.js');
const F = LSB.make;
const LULU = fs.readFileSync(path.join(root, 'LuluUI.lua'), 'utf8');
const URL = 'https://raw.githubusercontent.com/test/repo/main/LuluUI.lua';

let pass = 0, fail = 0; const failures = [];
function test(name, fn) {
  try { fn(); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; failures.push(name + ': ' + (e && e.message)); console.log('  GAGAL ' + name + '\n        ' + (e && e.message)); }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'tidak sama') + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); }
function ok(c, msg) { if (!c) throw new Error(msg || 'assertion gagal'); }

function baseCfg(name) {
  const c = F.config(); c.project.name = name || 'T'; c.project.luluUrl = URL; c.project.skipLoading = true;
  c.targets.push(F.target({ id: 't1', alias: 'Collect', path: 'ReplicatedStorage.Remotes.Collect', type: 'remote' }),
    F.target({ id: 't2', alias: 'Quest', path: 'Players.LocalPlayer.leaderstats.Quest', type: 'value' }),
    F.target({ id: 't3', alias: 'Items', path: 'Workspace.Items', type: 'folder' }),
    F.target({ id: 't4', alias: 'Claim', path: 'ReplicatedStorage.Remotes.Claim', type: 'remote' }));
  return c;
}
function boot(cfg, opts) {
  opts = opts || {};
  const gen = LSB.generate(cfg, { stamp: false });
  const chk = LSB.luacheck.check(gen.code);
  if (!chk.ok) throw new Error('sintaks hasil tidak valid: ' + JSON.stringify(chk.errors));
  if (chk.globals.length) throw new Error('global liar: ' + chk.globals.map(g => g.name).join(','));
  const mock = opts.mock || createEnv(opts.env || {});
  mock.http[URL] = LULU;
  if (opts.files) opts.files.forEach((v, k) => mock.files.set(k, v));
  mock.run(gen.code, 'script');
  mock.advance(opts.wait == null ? 1 : opts.wait);
  return { mock, gen, errors: () => mock.vm.errors, calls: () => mock.remoteCalls.map(c => c.inst.name + ':' + c.args.map(a => String(a)).join('|')) };
}
const quest = (m, v) => { const q = m.lp.children.find(c => c.name === 'leaderstats').children.find(c => c.name === 'Quest'); q.set('Value', v); };
function noErr(b) { if (b.errors().length) throw new Error('error runtime: ' + b.errors()[0].split('\n').slice(0, 3).join(' / ')); }
const numberSet = (m, label, v) => { const lbl = m.byText(label, 'TextLabel')[0]; if (!lbl) throw new Error('NumberInput tidak ada: ' + label); const box = lbl.parent.children.find(c => c.cls === 'TextBox'); m.setText(box, String(v)); };

/* ============================================================ 1. dasar */
console.log('\n[1] boot + UI');
test('script minimal berjalan tanpa error', () => { const b = boot(baseCfg('Mini')); noErr(b); });
test('tab Main + Info dibuat, window punya judul', () => {
  const c = baseCfg('UiTest'); c.project.title = 'Judul Saya'; c.ui.tabs[0].widgets.push(F.widget('Label', { id: 'l1', label: 'Halo Dunia' }));
  const b = boot(c); noErr(b);
  ok(b.mock.byText('Halo Dunia').length === 1, 'label tidak muncul');
  ok(b.mock.byText('Main').length >= 1 && b.mock.byText('Info').length >= 1, 'tab tidak ada');
});

/* ============================================================ 2. rule + watcher + toggle */
console.log('\n[2] watcher -> rule -> aksi');
function farmCfg() {
  const c = baseCfg('Farm');
  c.actions.push(
    F.action('fire', { id: 'a1', name: 'CollectOne', targetId: 't1', args: [F.operand('widget', { ref: 'w2', type: 'number' }), F.fixed('hello', 'string')] }),
    F.action('fire', { id: 'a2', name: 'CollectAll', targetId: 't1', args: [] }));
  c.watchers.push(F.watcher('valueChanged', { id: 'wt1', targetId: 't2' }));
  c.rules.push(F.rule({ id: 'r1', name: 'AutoCollect', when: 'wt1', cooldown: 0.5, steps: [{ id: 'a1', delay: 0 }, { id: 'a2', delay: 0.3 }], cond: { op: 'AND', items: [{ left: F.operand('watcher', { ref: 'wt1', field: 'value' }), cmp: '>', right: F.fixed('0', 'number') }] } }));
  c.ui.tabs[0].widgets.push(F.widget('Toggle', { id: 'w1', label: 'Auto Collect', bind: { kind: 'rule', ref: 'r1' } }), F.widget('NumberInput', { id: 'w2', label: 'Jumlah', default: 3, min: 1, max: 99 }),
    F.widget('Button', { id: 'w4', label: 'Collect sekali', bind: { kind: 'action', ref: 'a2' } }));
  return c;
}
test('rule tidak jalan saat toggle OFF', () => { const b = boot(farmCfg()); quest(b.mock, 5); b.mock.advance(2); noErr(b); eq(b.calls(), []); });
test('toggle ON -> Quest berubah -> dua aksi berurutan dengan argumen widget', () => {
  const b = boot(farmCfg()); b.mock.toggleClick('Auto Collect'); quest(b.mock, 5); b.mock.advance(0.1);
  eq(b.calls(), ['Collect:3|hello']); b.mock.advance(1); eq(b.calls(), ['Collect:3|hello', 'Collect:']); noErr(b);
});
test('NumberInput mengubah argumen yang dibaca saat aksi jalan (bukan nilai beku)', () => {
  const b = boot(farmCfg()); b.mock.toggleClick('Auto Collect'); numberSet(b.mock, 'Jumlah', 42); quest(b.mock, 1); b.mock.advance(1);
  eq(b.calls()[0], 'Collect:42|hello');
});
test('kondisi false -> aksi tidak jalan (Quest = 0)', () => { const b = boot(farmCfg()); b.mock.toggleClick('Auto Collect'); quest(b.mock, 4); b.mock.advance(1); b.mock.remoteCalls.length = 0; quest(b.mock, 0); b.mock.advance(1); eq(b.calls(), []); });
test('cooldown rule: 2 perubahan cepat -> hanya 1 eksekusi', () => { const b = boot(farmCfg()); b.mock.toggleClick('Auto Collect'); quest(b.mock, 1); b.mock.advance(0.05); quest(b.mock, 2); b.mock.advance(2); eq(b.calls().length, 2); });
test('toggle OFF kembali menghentikan rule', () => { const b = boot(farmCfg()); b.mock.toggleClick('Auto Collect'); b.mock.toggleClick('Auto Collect'); quest(b.mock, 9); b.mock.advance(2); eq(b.calls(), []); });
test('Button menjalankan aksi', () => { const b = boot(farmCfg()); b.mock.clickButton('Collect sekali'); b.mock.advance(0.2); eq(b.calls(), ['Collect:']); noErr(b); });

/* ============================================================ 3. makro, loop, stop all */
console.log('\n[3] makro / loop / stop semua');
test('makro loop via Toggle: jalan berulang lalu berhenti saat OFF', () => {
  const c = baseCfg('Macro');
  c.actions.push(F.action('fire', { id: 'a1', name: 'A', targetId: 't1' }), F.action('fire', { id: 'a2', name: 'B', targetId: 't4' }));
  c.macros.push(F.macro({ id: 'm1', name: 'Cycle', loop: true, interval: 0.1, steps: [{ action: 'a1' }, { wait: 1 }, { action: 'a2' }] }));
  c.ui.tabs[0].widgets.push(F.widget('Toggle', { id: 'w1', label: 'Loop farm', bind: { kind: 'macro', ref: 'm1' } }));
  const b = boot(c); b.mock.toggleClick('Loop farm'); b.mock.advance(3.5); noErr(b);
  const n1 = b.calls().length; ok(n1 >= 4, 'harusnya >= 4 panggilan, dapat ' + n1);
  b.mock.toggleClick('Loop farm'); b.mock.advance(0.5); const n2 = b.calls().length; b.mock.advance(5); eq(b.calls().length, n2, 'masih jalan setelah OFF');
});
test('aksi loop (jumlah terbatas) lewat Button selesai sendiri', () => {
  const c = baseCfg('Loop');
  c.actions.push(F.action('fire', { id: 'a1', name: 'A', targetId: 't1' }), F.action('loop', { id: 'a5', name: 'L', steps: ['a1'], args: [F.fixed('0.2', 'number'), F.fixed('4', 'number')] }));
  c.ui.tabs[0].widgets.push(F.widget('Button', { id: 'w1', label: 'Mulai', bind: { kind: 'action', ref: 'a5' } }));
  const b = boot(c); b.mock.clickButton('Mulai'); b.mock.advance(3); noErr(b); eq(b.calls().length, 4);
});
test('Stop Semua (tab Info) mematikan toggle + rule + makro', () => {
  const c = farmCfg();
  c.macros.push(F.macro({ id: 'm1', name: 'Cycle', loop: true, interval: 0.1, steps: [{ action: 'a2' }, { wait: 0.5 }] }));
  c.ui.tabs[0].widgets.push(F.widget('Toggle', { id: 'w7', label: 'Makro ON', bind: { kind: 'macro', ref: 'm1' } }));
  const b = boot(c); b.mock.toggleClick('Auto Collect'); b.mock.toggleClick('Makro ON'); b.mock.advance(2);
  const before = b.calls().length; ok(before > 0);
  b.mock.clickButton('⛔ Stop Semua'); b.mock.advance(0.3); const mid = b.calls().length; quest(b.mock, 8); b.mock.advance(4); noErr(b);
  eq(b.calls().length, mid, 'masih ada panggilan setelah Stop Semua');
});

/* ============================================================ 4. watcher beraneka */
console.log('\n[4] jenis watcher');
function watcherCfg(kind, wopts, extraRuleOpts) {
  const c = baseCfg('W_' + kind);
  c.actions.push(F.action('fire', { id: 'a1', name: 'Out', targetId: 't4', args: [F.operand('event', { field: (extraRuleOpts && extraRuleOpts.field) || 'name' })] }));
  c.watchers.push(F.watcher(kind, Object.assign({ id: 'wt1' }, wopts)));
  c.rules.push(F.rule({ id: 'r1', name: 'R', when: 'wt1', steps: [{ id: 'a1', delay: 0 }] }));
  return c;
}
test('childAdded + filter nama wildcard + kelas', () => {
  const b = boot(watcherCfg('childAdded', { targetId: 't3', nameFilter: 'Coin*', classFilter: 'BasePart' })); noErr(b);
  b.mock.addCoin('Coin1'); b.mock.addCoin('Rock'); b.mock.addCoin('CoinX'); b.mock.advance(0.5); eq(b.calls(), ['Claim:Coin1', 'Claim:CoinX']);
});
test('childAdded + fireExisting memproses anak yang sudah ada', () => {
  const env = createEnv(); env.addCoin('Coin1'); env.addCoin('Coin2');
  const b = boot(watcherCfg('childAdded', { targetId: 't3', nameFilter: 'Coin*', fireExisting: true }), { mock: env }); noErr(b); b.mock.advance(0.5); eq(b.calls(), ['Claim:Coin1', 'Claim:Coin2']);
});
test('childRemoved', () => {
  const b = boot(watcherCfg('childRemoved', { targetId: 't3' })); const p = b.mock.addCoin('C1'); b.mock.advance(0.2); eq(b.calls(), []); p.destroy(); b.mock.advance(0.2); eq(b.calls(), ['Claim:C1']);
});
test('remoteFired + filter argumen', () => {
  const c = watcherCfg('remoteFired', { targetId: 't1', filter: { enabled: true, index: 1, op: '==', value: 'ok' } }, { field: 'a2' });
  const b = boot(c); const rem = b.mock.remotes.children.find(x => x.name === 'Collect');
  b.mock.fireSignal(rem.sig('OnClientEvent'), ['no', 1]); b.mock.fireSignal(rem.sig('OnClientEvent'), ['ok', 77]); b.mock.advance(0.3); noErr(b); eq(b.calls(), ['Claim:77']);
});
test('interval memicu berkali-kali, interval dari widget', () => {
  const c = watcherCfg('interval', { intervalOp: F.operand('widget', { ref: 'w2', type: 'number' }) }, { field: 'tick' });
  c.ui.tabs[0].widgets.push(F.widget('NumberInput', { id: 'w2', label: 'Detik', default: 1, min: 0.1, max: 10, step: 0.1 }));
  const b = boot(c, { wait: 0.05 }); b.mock.advance(3.5); noErr(b); eq(b.calls(), ['Claim:1', 'Claim:2', 'Claim:3', 'Claim:4']);
});
test('hotkey', () => {
  const b = boot(watcherCfg('hotkey', { key: 'F' }, { field: 'key' })); const uis = b.mock.services.UserInputService;
  const inp = (kc) => { const t = new (require('./luavm.js').LuaTable)(); t.set('KeyCode', b.mock.vm.G.get('Enum').meta.get('__index').fn([b.mock.vm.G.get('Enum'), 'KeyCode'])); return t; };
  const kc = b.mock.vm.G.get('Enum').meta.get('__index').fn([null, 'KeyCode']).meta.get('__index').fn([null, 'F']);
  const t = new (require('./luavm.js').LuaTable)(); t.set('KeyCode', kc);
  b.mock.fireSignal(uis.sig('InputBegan'), [t, false]); b.mock.advance(0.3); noErr(b); eq(b.calls(), ['Claim:F']);
});
test('respawn karakter', () => { const b = boot(watcherCfg('respawn', {}, { field: 'character' })); b.mock.spawnCharacter(); b.mock.advance(0.3); noErr(b); eq(b.calls().length, 1); });
test('script mulai (start)', () => { const b = boot(watcherCfg('start', {}, { field: 'x' })); noErr(b); eq(b.calls(), ['Claim:undefined']); });
test('distance: memicu saat masuk radius saja', () => {
  const env = createEnv(); const far = env.mk('Part', 'Statue', env.mock ? null : null);
  const c = watcherCfg('distance', { targetId: 't5', radius: 15 }, { field: 'value' });
  c.targets.push(F.target({ id: 't5', alias: 'Statue', path: 'Workspace.Statue', type: 'instance' }));
  const p = env.mk('Part', 'Statue', env.services ? env.services.Workspace : env.game.children.find(x => x.name === 'Workspace')); p.set('CFrame', env.CF(100, 5, 0));
  const b = boot(c, { mock: env }); b.mock.advance(2); eq(b.calls(), []); p.set('CFrame', env.CF(5, 5, 0)); b.mock.advance(1); eq(b.calls().length, 1); b.mock.advance(2); eq(b.calls().length, 1, 'onlyEnter');
});
test('exists: muncul', () => {
  const c = watcherCfg('exists', { targetId: 't5', existsOn: 'appear' }, { field: 'value' }); c.targets.push(F.target({ id: 't5', alias: 'Boss', path: 'Workspace.Boss', type: 'instance' }));
  const b = boot(c); b.mock.advance(2); eq(b.calls(), []); b.mock.mk('Part', 'Boss', b.mock.services.Workspace); b.mock.advance(2); noErr(b); eq(b.calls().length, 1);
});
test('attributeChanged', () => {
  const c = watcherCfg('attributeChanged', { targetId: 't3', attr: 'Level' }, { field: 'value' });
  const b = boot(c); b.mock.items.attrs.set('Level', 1); const s = b.mock.items.sigs.get('attr:Level'); b.mock.items.attrs.set('Level', 5); b.mock.fireSignal(s, []); b.mock.advance(0.3); noErr(b); eq(b.calls(), ['Claim:5']);
});

/* ============================================================ 5. jenis aksi */
console.log('\n[5] jenis aksi');
function actCfg(act, extra) { const c = baseCfg('Act'); c.actions.push(act); c.ui.tabs[0].widgets.push(F.widget('Button', { id: 'wb', label: 'Go', bind: { kind: 'action', ref: act.id } })); if (extra) extra(c); return c; }
test('set property + get', () => {
  const c = actCfg(F.action('set', { id: 'a1', name: 'SetQ', targetId: 't2', mode: 'property', prop: 'Value', args: [F.fixed('88', 'number')] }));
  const b = boot(c); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b);
  eq(b.mock.lp.children.find(x => x.name === 'leaderstats').children.find(x => x.name === 'Quest').props.get('Value'), 88);
});
test('teleport ke Vector3', () => {
  const b = boot(actCfg(F.action('teleport', { id: 'a1', name: 'TP', args: [F.fixed('10,20,30', 'Vector3')] }))); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b);
  const hrp = b.mock.lp.props.get('Character').inst.children.find(x => x.name === 'HumanoidRootPart'); const p = hrp.props.get('Position'); eq([p.get('X'), p.get('Y'), p.get('Z')], [10, 20, 30]);
});
test('walk ke Vector3 (menunggu tiba)', () => {
  const b = boot(actCfg(F.action('walk', { id: 'a1', name: 'W', args: [F.fixed('5,0,5', 'Vector3'), F.fixed('true', 'boolean')] }))); b.mock.clickButton('Go'); b.mock.advance(1); noErr(b); ok(b.mock.moveCalls && b.mock.moveCalls.length === 1);
});
test('invoke menyimpan hasil, dipakai aksi lain', () => {
  const c = baseCfg('Inv'); c.targets.push(F.target({ id: 't9', alias: 'GetData', path: 'ReplicatedStorage.Remotes.GetData', type: 'function' }));
  c.actions.push(F.action('invoke', { id: 'a1', name: 'Ambil', targetId: 't9', args: [F.fixed('x', 'string')] }), F.action('fire', { id: 'a2', name: 'Kirim', targetId: 't1', args: [F.operand('action', { ref: 'a1' })] }));
  c.macros.push(F.macro({ id: 'm1', name: 'M', steps: [{ action: 'a1' }, { action: 'a2' }] })); c.ui.tabs[0].widgets.push(F.widget('Button', { id: 'wb', label: 'Go', bind: { kind: 'macro', ref: 'm1' } }));
  const env = createEnv(); env.invokeHandlers.GetData = () => 'HASIL'; const b = boot(c, { mock: env }); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b); eq(b.calls(), ['GetData:x', 'Collect:HASIL']);
});
test('template {w:id} + log + notify', () => {
  const c = actCfg(F.action('notify', { id: 'a1', name: 'N', args: [F.fixed('Nilai {w:wn}', 'string')] }), (cc) => cc.ui.tabs[0].widgets.push(F.widget('NumberInput', { id: 'wn', label: 'N', default: 7 })));
  const b = boot(c); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b); ok(b.mock.byText('Nilai 7').length >= 1, 'notifikasi tidak tampil');
});
test('custom Lua + return value', () => {
  const c = actCfg(F.action('custom', { id: 'a1', name: 'Cust', code: 'local n = S["wn"] * 2\nT("t1"):FireServer("custom", n)\nreturn n' }), (cc) => cc.ui.tabs[0].widgets.push(F.widget('NumberInput', { id: 'wn', label: 'N', default: 21 })));
  const b = boot(c); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b); eq(b.calls(), ['Collect:custom|42']);
});
test('retry: aksi gagal diulang, error dicatat, tidak crash', () => {
  const c = actCfg(F.action('fire', { id: 'a1', name: 'Gagal', targetId: 'tX', retry: 2 }));
  const b = boot(c); b.mock.clickButton('Go'); b.mock.advance(3); noErr(b);
});
test('aksi butuh fireproximityprompt tapi executor tidak punya -> log, tidak crash', () => {
  const c = actCfg(F.action('prompt', { id: 'a1', name: 'P', targetId: 't3' }));
  const env = createEnv({ executor: ['gethui', 'getgenv'] }); const b = boot(c, { mock: env }); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b);
});
test('prompt memanggil fireproximityprompt bila ada', () => {
  const b = boot(actCfg(F.action('prompt', { id: 'a1', name: 'P', targetId: 't3' }))); b.mock.clickButton('Go'); b.mock.advance(0.5); noErr(b); eq((b.mock.prompts || []).length, 1);
});
test('setwidget mengubah widget & memicu binding toggle', () => {
  const c = farmCfg(); c.actions.push(F.action('setwidget', { id: 'a9', name: 'On', widgetId: 'w1', args: [F.fixed('true', 'boolean')] }));
  c.ui.tabs[0].widgets.push(F.widget('Button', { id: 'wb', label: 'Nyalakan', bind: { kind: 'action', ref: 'a9' } }));
  const b = boot(c); b.mock.clickButton('Nyalakan'); b.mock.advance(0.3); quest(b.mock, 3); b.mock.advance(1); noErr(b); ok(b.calls().length === 2, 'rule harus aktif: ' + b.calls());
});

/* ============================================================ 6. simpan / profil / guard / compat */
console.log('\n[6] simpan, profil, guard, executor');
test('pengaturan tersimpan lalu dimuat saat script dijalankan lagi', () => {
  const c = farmCfg(); const b = boot(c); numberSet(b.mock, 'Jumlah', 15); b.mock.toggleClick('Auto Collect'); b.mock.advance(3); noErr(b);
  const key = 'Farm/config.json'; ok(b.mock.files.has(key), 'file config tidak ditulis'); const data = JSON.parse(b.mock.files.get(key)); eq([data.w1, data.w2], [true, 15]);
  const b2 = boot(farmCfg(), { files: b.mock.files }); noErr(b2); quest(b2.mock, 2); b2.mock.advance(1); eq(b2.calls()[0], 'Collect:15|hello', 'nilai tersimpan tidak dipakai / toggle tidak aktif');
});
test('tanpa writefile: tidak crash, tidak ada file', () => {
  const env = createEnv({ executor: ['gethui', 'getgenv', 'setclipboard'] }); const b = boot(farmCfg(), { mock: env }); numberSet(b.mock, 'Jumlah', 9); b.mock.advance(3); noErr(b); eq(b.mock.files.size, 0);
});
test('profil mengubah banyak widget sekaligus', () => {
  const c = farmCfg(); c.ui.tabs[0].widgets.push(F.widget('Dropdown', { id: 'wp', label: 'Profil', bind: { kind: 'profile' } }));
  c.profiles.push(F.profile({ name: 'Cepat', values: { w2: 50 } }), F.profile({ name: 'Aman', values: { w2: 5 } }));
  const b = boot(c); b.mock.toggleClick('Auto Collect'); const dd = b.mock.byText('Profil', 'TextLabel')[0]; ok(dd, 'dropdown profil tidak ada');
  // pilih "Aman" lewat tombol item pada menu dropdown
  const valBtn = dd.parent.children.find(x => x.cls === 'TextButton'); b.mock.click(valBtn); b.mock.advance(0.2);
  const item = b.mock.byText('Aman', 'TextButton')[0]; ok(item, 'item profil tidak muncul'); b.mock.click(item); b.mock.advance(0.2); quest(b.mock, 1); b.mock.advance(1); noErr(b); eq(b.calls()[0], 'Collect:5|hello');
});
test('placeGuard=stop di game salah: window dihancurkan, watcher tidak jalan', () => {
  const c = farmCfg(); c.project.placeIds = [999]; c.project.placeGuard = 'stop'; const b = boot(c, { env: { placeId: 1, gameId: 2 } }); b.mock.toggleClick && 0; quest(b.mock, 5); b.mock.advance(2); eq(b.calls(), []);
  ok(!b.mock.services.CoreGui.children.some(x => x.name === 'LSB_Farm'), 'window masih ada');
});
test('placeGuard=hold: logika ditahan sampai tombol Jalankan Tetap', () => {
  const c = farmCfg(); c.project.placeIds = [999]; c.project.placeGuard = 'hold'; const b = boot(c, { env: { placeId: 1, gameId: 2 } });
  b.mock.toggleClick('Auto Collect'); quest(b.mock, 5); b.mock.advance(1); eq(b.calls(), []); b.mock.clickButton('▶ Jalankan Tetap (game tidak sesuai)'); b.mock.advance(0.5); quest(b.mock, 6); b.mock.advance(1.5); noErr(b); ok(b.calls().length >= 2);
});
test('placeGuard=warn di game benar: berjalan normal', () => { const c = farmCfg(); c.project.placeIds = [123]; const b = boot(c, { env: { placeId: 123 } }); b.mock.toggleClick('Auto Collect'); quest(b.mock, 5); b.mock.advance(1.5); noErr(b); ok(b.calls().length === 2); });
test('Cek Kompatibilitas mengisi daftar tanpa error', () => { const b = boot(farmCfg()); b.mock.clickButton('Cek Kompatibilitas'); b.mock.advance(0.5); noErr(b); });
test('menutup window (Destroy) memutus semua koneksi', () => {
  const b = boot(farmCfg()); b.mock.toggleClick('Auto Collect'); const sg = b.mock.services.CoreGui.children.find(x => x.name === 'LSB_Farm'); ok(sg, 'ScreenGui tidak ditemukan');
  const env = b.mock.vm.G.get('getgenv').fn([]); const entry = env.get('LSB_Farm'); ok(entry, 'singleton tidak terdaftar'); b.mock.vm.callSync(entry.get('Destroy'), []); b.mock.advance(0.5);
  quest(b.mock, 5); b.mock.advance(2); eq(b.calls(), [], 'rule masih jalan setelah Destroy'); ok(!env.get('LSB_Farm'), 'singleton tidak dibersihkan');
});
test('menjalankan script dua kali: instance lama dimatikan', () => {
  const g1 = boot(farmCfg()); g1.mock.toggleClick('Auto Collect'); const m = g1.mock; const gen = LSB.generate(farmCfg(), { stamp: false }); m.run(gen.code, 'script2'); m.advance(1); noErr(g1);
  const guis = m.services.CoreGui.children.filter(x => x.name === 'LSB_Farm'); eq(guis.length, 1, 'harusnya 1 window');
});

/* ============================================================ 7. widget lain */
console.log('\n[7] widget');
test('semua widget LuluUI bisa dibuat sekaligus', () => {
  const c = baseCfg('AllW'); const t = c.ui.tabs[0];
  c.actions.push(F.action('get', { id: 'a3', name: 'Items', targetId: 't3', mode: 'children' }));
  t.widgets.push(F.widget('Label'), F.widget('InfoLabel', { src: F.operand('widget', { ref: 'wn' }) }), F.widget('Badge', { color: '#ff0000' }), F.widget('Separator', { label: 'Sep' }), F.widget('Divider'),
    F.widget('Button'), F.widget('HalfButtons', { label: 'A', label2: 'B' }), F.widget('Toggle', { id: 'wt', label: 'Tg', locked: false, subtext: 'sub' }), F.widget('NumberInput', { id: 'wn', label: 'Num' }), F.widget('TextInput', { id: 'wx', label: 'Txt' }),
    F.widget('Dropdown', { id: 'wd', label: 'Dd', optionsFrom: 'a3' }), F.widget('MultiDropdown', { id: 'wm', label: 'Md' }), F.widget('Segment', { id: 'ws', label: 'Sg' }), F.widget('ProgressBar', { src: F.operand('widget', { ref: 'wn' }), max: 10 }),
    F.widget('List', { label: 'Lst', isLog: true }), F.widget('Table'), F.widget('CopyButton', { value: 'salin ini' }), F.widget('Accordion', { id: 'wa', label: 'Grup', open: true, children: [F.widget('Toggle', { id: 'wc', label: 'DalamGrup' }), F.widget('Accordion', { id: 'wb2', label: 'Dalam2', children: [F.widget('Label', { label: 'Tersarang' })] })] }));
  c.ui.infoPanel = { enabled: true, lines: [{ label: 'Nilai', src: F.operand('widget', { ref: 'wn' }) }] }; c.ui.locationPanel = true; c.ui.locations = [{ name: 'Spawn', lanes: ['0,5,0'] }];
  const b = boot(c, { wait: 2 }); noErr(b); ok(b.mock.byText('DalamGrup').length === 1);
});
test('Dropdown optionsFrom diisi dari hasil aksi Get', () => {
  const c = baseCfg('DD'); c.actions.push(F.action('get', { id: 'a3', name: 'Items', targetId: 't3', mode: 'children' })); c.ui.tabs[0].widgets.push(F.widget('Dropdown', { id: 'wd', label: 'Pilih', optionsFrom: 'a3' }));
  const env = createEnv(); env.addCoin('Apel'); env.addCoin('Jeruk'); const b = boot(c, { mock: env, wait: 2 }); noErr(b);
  const lbl = b.mock.byText('Pilih', 'TextLabel')[0]; ok(lbl, 'dropdown tidak ada'); const valBtn = lbl.parent.children.find(x => x.cls === 'TextButton'); ok(/Apel/.test(valBtn.props.get('Text')), 'opsi pertama bukan Apel: ' + valBtn.props.get('Text'));
});
test('CopyButton memakai setclipboard', () => { const c = baseCfg('Cp'); c.ui.tabs[0].widgets.push(F.widget('CopyButton', { label: 'Salin', value: 'ABC' })); const b = boot(c); noErr(b); const btn = b.mock.guiRoot().all().filter(i => i.cls === 'TextButton' && /Copy/i.test(String(i.props.get('Text')))); ok(btn.length, 'tombol copy tidak ada'); b.mock.click(btn[0]); eq(b.mock.clipboard, 'ABC'); });


/* ============================================================ 8. perilaku rule lanjutan */
console.log('\n[8] rule lanjutan');
function twoActRule(ropts, a1opts) {
  const c = baseCfg('R2');
  c.actions.push(F.action('fire', Object.assign({ id: 'a1', name: 'Satu', targetId: 't1', args: [F.fixed('one', 'string')] }, a1opts || {})), F.action('fire', { id: 'a2', name: 'Dua', targetId: 't4', args: [F.fixed('two', 'string')] }), F.action('fire', { id: 'a3', name: 'Cadangan', targetId: 't4', args: [F.fixed('fallback', 'string')] }));
  c.watchers.push(F.watcher('manual', { id: 'wt1' }));
  c.rules.push(F.rule(Object.assign({ id: 'r1', name: 'R', when: 'wt1', steps: [{ id: 'a1', delay: 0 }, { id: 'a2', delay: 0 }] }, ropts || {})));
  c.ui.tabs[0].widgets.push(F.widget('Button', { id: 'wb', label: 'Picu', bind: { kind: 'watcher', ref: 'wt1' } }));
  return c;
}
test('mode parallel: semua langkah mulai bersamaan', () => {
  const b = boot(twoActRule({ mode: 'parallel', steps: [{ id: 'a1', delay: 0.5 }, { id: 'a2', delay: 0.5 }] })); b.mock.clickButton('Picu'); b.mock.advance(0.3); eq(b.calls(), []); b.mock.advance(0.5); noErr(b); eq(b.calls().sort(), ['Claim:two', 'Collect:one']);
});
test('onFail=continue: langkah berikutnya tetap jalan', () => { const b = boot(twoActRule({ onFail: 'continue' }, { targetId: 'tX' })); b.mock.clickButton('Picu'); b.mock.advance(3); eq(b.calls(), ['Claim:two']); });
test('onFail=stop: berhenti di langkah yang gagal', () => { const b = boot(twoActRule({ onFail: 'stop' }, { targetId: 'tX' })); b.mock.clickButton('Picu'); b.mock.advance(3); eq(b.calls(), []); });
test('onFail=fallback: jalankan aksi cadangan lalu berhenti', () => { const b = boot(twoActRule({ onFail: 'fallback', fallback: 'a3' }, { targetId: 'tX' })); b.mock.clickButton('Picu'); b.mock.advance(3); eq(b.calls(), ['Claim:fallback']); });
test('ignoreError: aksi gagal dianggap berhasil', () => { const b = boot(twoActRule({ onFail: 'stop' }, { targetId: 'tX', ignoreError: true })); b.mock.clickButton('Picu'); b.mock.advance(3); eq(b.calls(), ['Claim:two']); });
test('maxRuns membatasi jumlah eksekusi', () => { const b = boot(twoActRule({ maxRuns: 2 })); for (let i = 0; i < 5; i++) { b.mock.clickButton('Picu'); b.mock.advance(0.5); } eq(b.calls().filter(x => x.startsWith('Collect')).length, 2); });
test('prioritas rule: angka besar jalan lebih dulu', () => {
  const c = twoActRule({ steps: [{ id: 'a1', delay: 0 }], priority: 1 }); c.rules.push(F.rule({ id: 'r2', name: 'R2', when: 'wt1', steps: [{ id: 'a2', delay: 0 }], priority: 5 }));
  const b = boot(c); b.mock.clickButton('Picu'); b.mock.advance(0.5); eq(b.calls(), ['Claim:two', 'Collect:one']);
});
test('watchdog: rule yang terlalu sering dihentikan otomatis', () => {
  const c = baseCfg('Burst'); c.project.ruleBurst = 3;
  c.actions.push(F.action('fire', { id: 'a1', name: 'A', targetId: 't1' })); c.watchers.push(F.watcher('interval', { id: 'wt1', intervalOp: F.fixed('0.05', 'number') }));
  c.rules.push(F.rule({ id: 'r1', name: 'R', when: 'wt1', steps: [{ id: 'a1', delay: 0 }] })); c.ui.tabs[0].widgets.push(F.widget('Toggle', { id: 'w1', label: 'Spam', default: true, bind: { kind: 'rule', ref: 'r1' } }));
  const b = boot(c, { wait: 0.05 }); b.mock.advance(3); noErr(b); ok(b.calls().length <= 3, 'harusnya <= 3, dapat ' + b.calls().length);
});
test('batas aksi per detik (throttle) menunda, tidak membuang', () => {
  const c = baseCfg('Thr'); c.project.maxActionsPerSecond = 5; c.actions.push(F.action('fire', { id: 'a1', name: 'A', targetId: 't1' }), F.action('loop', { id: 'a5', name: 'L', steps: ['a1'], args: [F.fixed('0', 'number'), F.fixed('20', 'number')] }));
  c.ui.tabs[0].widgets.push(F.widget('Button', { id: 'w', label: 'Go', bind: { kind: 'action', ref: 'a5' } })); const b = boot(c); b.mock.clickButton('Go'); b.mock.advance(1); const n1 = b.calls().length; ok(n1 <= 12, 'terlalu banyak dalam 1 detik: ' + n1); b.mock.advance(6); noErr(b); eq(b.calls().length, 20);
});

/* ============================================================ ringkasan */
console.log('\n' + pass + ' lulus, ' + fail + ' gagal');
if (fail) { console.log('\nGAGAL:\n - ' + failures.join('\n - ')); process.exit(1); }
