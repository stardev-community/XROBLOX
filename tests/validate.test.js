'use strict';
/* node tests/validate.test.js */
const path = require('path'), root = path.join(__dirname, '..');
['core', 'runtime', 'luacheck', 'generator', 'validate', 'templates'].forEach((m) => require(path.join(root, 'js', m + '.js')));
const F = LSB.make; let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('  GAGAL ' + name + ': ' + e.message); } }
function has(cfg, re, level) { const r = LSB.validate(cfg); if (!r.issues.some((i) => re.test(i.msg) && (!level || i.level === level))) throw new Error('tidak ada isu ' + re + ' | ' + r.issues.map((i) => i.msg).join(' / ')); }
function none(cfg, re) { const r = LSB.validate(cfg); if (r.issues.some((i) => re.test(i.msg))) throw new Error('isu tak diharapkan ' + re); }
const base = () => { const c = F.config(); c.project.luluUrl = 'https://raw.githubusercontent.com/a/b/main/LuluUI.lua'; return c; };
t('URL contoh -> peringatan', () => { const c = F.config(); has(c, /masih contoh/, 'warn'); });
t('nama kosong -> error', () => { const c = base(); c.project.name = ' '; has(c, /Nama script kosong/, 'error'); });
t('path kosong -> error', () => { const c = base(); c.targets.push(F.target({ alias: 'X' })); has(c, /path masih kosong/, 'error'); });
t('aksi tanpa target -> error', () => { const c = base(); c.actions.push(F.action('fire', { name: 'A' })); has(c, /belum memilih target/, 'error'); });
t('referensi target putus -> error', () => { const c = base(); c.actions.push(F.action('fire', { name: 'A', targetId: 'zzz' })); has(c, /referensi putus/, 'error'); });
t('aksi yatim -> peringatan', () => { const c = base(); c.targets.push(F.target({ id: 't', path: 'ReplicatedStorage.R', alias: 'R' })); c.actions.push(F.action('fire', { name: 'A', targetId: 't' })); has(c, /aksi yatim/, 'warn'); });
t('widget tanpa binding -> peringatan', () => { const c = base(); c.ui.tabs[0].widgets.push(F.widget('Button', { label: 'Go' })); has(c, /belum punya fungsi/, 'warn'); });
t('kondisi menunjuk watcher hilang -> error', () => { const c = base(); c.rules.push(F.rule({ name: 'R', when: 'nope' })); has(c, /watcher pemicu tidak ditemukan/, 'error'); });
t('relasi melingkar rule -> error', () => {
  const c = base();
  c.actions.push(F.action('runrule', { id: 'a1', ref: 'r2' }), F.action('runrule', { id: 'a2', ref: 'r1' }));
  c.watchers.push(F.watcher('manual', { id: 'w1' }));
  c.rules.push(F.rule({ id: 'r1', name: 'R1', when: 'w1', steps: [{ id: 'a1', delay: 0 }] }), F.rule({ id: 'r2', name: 'R2', when: 'w1', steps: [{ id: 'a2', delay: 0 }] }));
  has(c, /melingkar/, 'error');
});
t('interval terlalu cepat -> peringatan', () => { const c = base(); c.watchers.push(F.watcher('interval', { name: 'T', intervalOp: F.fixed('0.01', 'number') })); has(c, /sangat cepat/, 'warn'); });
t('Custom Lua dengan library UI lain -> error', () => { const c = base(); c.actions.push(F.action('custom', { name: 'C', code: 'local R = loadstring(game:HttpGet("x"))()\nRayfield:CreateWindow({})' })); has(c, /library UI lain/, 'error'); });
t('ScreenGui mentah -> error', () => { const c = base(); c.actions.push(F.action('custom', { name: 'C', code: 'Instance.new("ScreenGui")' })); has(c, /ScreenGui mentah/, 'error'); });
t('angka tidak valid -> error', () => { const c = base(); c.actions.push(F.action('wait', { name: 'W', args: [F.fixed('abc', 'number')] })); has(c, /bukan angka/, 'error'); });
t('template bersih tanpa error', () => { LSB.templates.forEach((tp) => { const c = tp.build(); c.project.luluUrl = 'https://raw.githubusercontent.com/a/b/main/LuluUI.lua'; const r = LSB.validate(c); if (r.errors) throw new Error(tp.id + ': ' + r.issues.filter((i) => i.level === 'error').map((i) => i.msg).join(';')); }); });
t('share encode/decode bolak-balik', () => { const c = LSB.templates[1].build(); const d = LSB.share.decode(LSB.share.encode(c)); if (JSON.stringify(LSB.migrate(c)) !== JSON.stringify(d)) throw new Error('beda'); });
t('store undo/redo', () => { const s = LSB.store; s.reset(); s.commit((c) => { c.project.name = 'Z1'; }); s.commit((c) => { c.project.name = 'Z2'; }); s.undo(); if (s.cfg.project.name !== 'Z1') throw new Error('undo'); s.redo(); if (s.cfg.project.name !== 'Z2') throw new Error('redo'); });
console.log('\n' + pass + ' lulus, ' + fail + ' gagal'); process.exit(fail ? 1 : 0);
