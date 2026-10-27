'use strict';
/* node tests/templates.test.js : tiap template harus lolos validasi, generate, dan luacheck */
const path = require('path'), root = path.join(__dirname, '..');
['core', 'runtime', 'luacheck', 'generator', 'validate', 'templates'].forEach((m) => require(path.join(root, 'js', m + '.js')));
let fail = 0;
LSB.templates.forEach((t) => {
  const cfg = t.build(); cfg.project.luluUrl = 'https://raw.githubusercontent.com/a/b/main/LuluUI.lua';
  const v = LSB.validate(cfg);
  const g = LSB.generate(cfg, { stamp: false });
  const c = LSB.luacheck.check(g.code);
  const errs = v.issues.filter((i) => i.level === 'error');
  const bad = errs.length || !c.ok || c.globals.length;
  if (bad) fail++;
  console.log((bad ? ' GAGAL ' : '  ok   ') + t.id + '  (peringatan: ' + v.warnings + ', baris: ' + g.code.split('\n').length + ')');
  errs.forEach((e) => console.log('       validasi: ' + e.msg));
  if (!c.ok) console.log('       lua: ' + JSON.stringify(c.errors[0]));
  if (c.globals.length) console.log('       global: ' + c.globals.map((x) => x.name));
});
process.exit(fail ? 1 : 0);
