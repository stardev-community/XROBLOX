/* result.js - halaman Hasil: validasi, generate, unduh, ekspor/impor */
(function (g) {
  var LSB = g.LSB, D = LSB.dom, h = D.h, U = LSB.util;
  var V = LSB.views, UI = LSB.ui;
  UI.gen = null; UI.force = false;

  function issueList(res) {
    var box = h('div');
    if (!res.issues.length) return h('div', { class: 'issue' }, h('span', { class: 'pill ok', text: 'OK' }), 'Tidak ada masalah ditemukan.');
    ['error', 'warn', 'info'].forEach(function (lv) {
      res.issues.filter(function (i) { return i.level === lv; }).forEach(function (i) {
        box.appendChild(h('div', { class: 'issue ' + lv, onclick: function () { LSB.app.jump(i); } },
          h('span', { class: 'pill ' + (lv === 'error' ? 'err' : lv), text: lv === 'error' ? 'Error' : lv === 'warn' ? 'Peringatan' : 'Info' }),
          h('span', { text: i.msg }), h('span', { class: 'go', text: 'buka ▸' })));
      });
    });
    return box;
  }

  V.result = function () {
    var cfg = D.cfg(), root = h('div');
    root.appendChild(h('h2', { text: 'Hasil' }));
    root.appendChild(h('p', { class: 'lead', text: 'Periksa masalah, lalu unduh satu file .lua. Script memuat LuluUI dari URL raw GitHub yang Anda isi di tab Proyek.' }));
    var res = LSB.validate(cfg); UI.lastValidate = res;
    root.appendChild(h('div', { class: 'card' }, h('div', { class: 'row sp' }, h('b', { text: 'Pemeriksaan' }),
      h('span', null, h('span', { class: 'pill err', text: res.errors + ' error' }), ' ', h('span', { class: 'pill warn', text: res.warnings + ' peringatan' }))), issueList(res)));

    var gen = null, err = null;
    try { gen = LSB.generate(cfg, {}); } catch (e) { err = e; }
    UI.gen = gen;
    if (err) { root.appendChild(h('div', { class: 'card' }, h('span', { class: 'pill err', text: 'Gagal generate' }), h('pre', { class: 'code', text: String(err && err.stack || err) }))); return root; }
    var chk = LSB.luacheck.check(gen.code);
    var canDl = res.errors === 0 || UI.force;
    var bar = h('div', { class: 'card' });
    bar.appendChild(h('div', { class: 'row sp' }, h('b', { text: gen.fileName }), h('span', null,
      h('span', { class: 'pill ' + (chk.ok ? 'ok' : 'err'), text: chk.ok ? 'sintaks Lua valid' : chk.errors.length + ' error sintaks' }), ' ',
      h('span', { class: 'pill ' + (chk.globals.length ? 'warn' : 'ok'), text: chk.globals.length ? chk.globals.length + ' global tak dikenal' : 'tanpa global liar' }), ' ',
      h('span', { class: 'pill', text: gen.code.split('\n').length + ' baris · ' + Math.round(gen.code.length / 1024) + ' KB' }))));
    if (!chk.ok) chk.errors.slice(0, 4).forEach(function (e) { bar.appendChild(h('div', { class: 'issue error', text: 'Baris ' + e.line + ': ' + e.msg })); });
    if (chk.globals.length) bar.appendChild(h('div', { class: 'help', text: 'Global tak dikenal: ' + chk.globals.map(function (x) { return x.name; }).join(', ') + ' (biasanya dari Custom Lua).' }));
    (gen.warnings || []).forEach(function (w) { bar.appendChild(h('div', { class: 'issue warn', text: String(w) })); });
    var btns = h('div', { class: 'row', style: 'margin-top:10px' });
    btns.appendChild(h('button', { class: 'btn primary', text: '⬇ Unduh ' + gen.fileName, disabled: !canDl, onclick: function () { D.download(gen.fileName, gen.code); LSB.store.saveVersion('Unduh ' + new Date().toLocaleString()); D.toast('File diunduh', 'ok'); } }));
    btns.appendChild(h('button', { class: 'btn', text: '📋 Salin kode', onclick: function () { D.copy(gen.code); } }));
    if (res.errors) { var cb = h('input', { type: 'checkbox', checked: UI.force, onchange: function () { UI.force = cb.checked; LSB.app.render(); } }); btns.appendChild(h('label', { class: 'chk' }, cb, 'Tetap izinkan unduh walau ada error')); }
    bar.appendChild(btns);
    bar.appendChild(h('p', { class: 'help', style: 'margin-top:8px', text: 'Jalankan di executor dengan mengunggah file ke folder workspace, lalu: loadstring(readfile("' + gen.fileName + '"))() — atau tempel isinya langsung.' }));
    root.appendChild(bar);

    var lines = gen.code.split('\n'), shown = lines.slice(0, 600).join('\n');
    var pre = h('pre', { class: 'code' }); pre.innerHTML = D.highlight(shown);
    root.appendChild(h('details', { open: false }, h('summary', { text: 'Lihat kode' + (lines.length > 600 ? ' (600 baris pertama dari ' + lines.length + ')' : '') }), pre));

    // ekspor / impor
    var ex = h('div', { class: 'card' }, h('b', { text: 'Simpan & bagikan proyek' }), h('p', { class: 'help', text: 'Proyek tersimpan otomatis di browser ini. Ekspor untuk cadangan atau pindah perangkat.' }));
    ex.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn', text: '⬇ Ekspor JSON', onclick: function () { D.download(U.fileName(cfg.project.name) + '.lsb.json', JSON.stringify(cfg, null, 2), 'application/json'); } }),
      h('button', { class: 'btn', text: '⬆ Impor JSON', onclick: function () { var f = h('input', { type: 'file', accept: '.json,.lsb,application/json' }); f.onchange = function () { var r = new FileReader(); r.onload = function () { try { LSB.store.load(JSON.parse(r.result)); D.toast('Proyek dimuat', 'ok'); } catch (e) { D.toast('File tidak valid: ' + e.message, 'err'); } }; r.readAsText(f.files[0]); }; f.click(); } }),
      h('button', { class: 'btn', text: '🔗 Salin string proyek', onclick: function () { D.copy(LSB.share.encode(cfg)); } }),
      h('button', { class: 'btn', text: '📥 Tempel string proyek', onclick: function () {
        var ta = h('textarea', { rows: 5, placeholder: 'LSB1:...' });
        D.modal('Impor string proyek', ta, [{ text: 'Batal' }, { text: 'Muat', cls: 'primary', fn: function () { try { LSB.store.load(LSB.share.decode(ta.value)); D.toast('Proyek dimuat', 'ok'); } catch (e) { D.toast(e.message, 'err'); return false; } } }]); } }),
      h('button', { class: 'btn', text: '💾 Simpan versi', onclick: function () { LSB.store.saveVersion('Manual ' + new Date().toLocaleString()); D.toast('Versi disimpan', 'ok'); LSB.app.render(); } }),
      h('button', { class: 'btn danger', text: 'Proyek baru', onclick: function () { D.confirm('Hapus semua isi proyek dan mulai baru?', function () { LSB.store.reset(); }); } })));
    var vs = LSB.store.versions();
    if (vs.length) {
      ex.appendChild(h('h3', { text: 'Riwayat versi' }));
      vs.forEach(function (v) { ex.appendChild(h('div', { class: 'row sp', style: 'margin:4px 0' }, h('span', { text: v.label }), h('button', { class: 'btn sm', text: 'Pulihkan', onclick: function () { D.confirm('Pulihkan versi ini? Perubahan sekarang bisa di-undo.', function () { LSB.store.load(v.cfg); }); } }))); });
    }
    root.appendChild(ex);
    return root;
  };
})(typeof window !== 'undefined' ? window : globalThis);
