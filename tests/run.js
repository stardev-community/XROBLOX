'use strict';
/* node tests/run.js : jalankan semua tes tanpa dependensi */
const { spawnSync } = require('child_process'); const path = require('path');
let bad = 0;
['validate.test.js', 'templates.test.js', 'e2e.test.js'].forEach((f) => {
  console.log('\n=== ' + f + ' ===');
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: 'inherit' }); if (r.status) bad++;
});
console.log(bad ? '\nADA TES GAGAL' : '\nSEMUA TES LULUS'); process.exit(bad ? 1 : 0);
