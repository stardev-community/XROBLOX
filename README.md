# Lulu Script Builder

Alat web (statis, tanpa build) untuk membuat script Roblox berbasis **LuluUI** tanpa menulis Lua.
Hasilnya **satu file `<namascript>.lua`** yang memuat LuluUI dari URL raw GitHub.

## Alur pakai
1. **Proyek** – nama, judul, tema, URL raw LuluUI (atau pilih template).
2. **Target** – path Remote / Value / objek. Pakai *Snippet pencari path* di executor, lalu *Impor* hasilnya.
3. **Aksi** – satu target boleh banyak aksi (Fire, Invoke, Get, Set, Prompt, Teleport, Loop, Log, Custom Lua, dll.).
4. **Logic** – *Watcher* (pemicu) → *Rule* (kondisi AND/OR/NOT + aksi) · *Makro* · *Profil*.
5. **UI** – susun widget LuluUI (Toggle, Button, NumberInput, Dropdown, List, Accordion…) dan hubungkan ke rule/makro/aksi.
6. **Hasil** – pemeriksaan otomatis, lalu unduh `.lua`.

Mode **Mudah** menyembunyikan opsi lanjutan; **Lanjut** menampilkan semuanya (retry, cooldown, prioritas, ekspresi Lua, dsb).

## Pasang di GitHub / hosting
1. Buat repo GitHub, upload seluruh isi folder ini (termasuk `LuluUI.lua` hasil tambalan).
2. **Hosting alat**: GitHub Pages (Settings → Pages → branch `main`, folder `/`) atau Vercel/Netlify (tanpa build, output = root).
3. **URL LuluUI**: buka `LuluUI.lua` di GitHub → *Raw* → salin URL (`https://raw.githubusercontent.com/USER/REPO/main/LuluUI.lua`) ke kolom *URL Raw LuluUI* di tab Proyek.

> `LuluUI.lua` di folder ini adalah versi yang sudah **ditambal** (handle widget `Set/Get`, `Window:OnClose`, dll.) — script hasil bergantung pada versi ini. Jangan ganti dengan LuluUI asli.
> Tambalan dibuat ulang dengan `python3 lulu-patch/patch_luluui.py` dari `lulu-patch/LuluUI.orig.lua`.

## Menjalankan hasil di executor
Simpan `.lua` ke folder workspace executor lalu `loadstring(readfile("Nama.lua"))()`, atau tempel isinya. Pengaturan widget disimpan di `<Nama>/config.json` bila executor punya `writefile/readfile`.

## Tes
```
node tests/run.js
```
Tanpa dependensi. Berisi: validator, template, dan **e2e** yang menjalankan script hasil + LuluUI asli di interpreter Lua mini (`tests/luavm.js`) dengan tiruan Roblox (`tests/robloxmock.js`).

## Batasan yang jujur
- Diuji di tiruan Roblox, **belum di Roblox/Delta sungguhan**. Dukungan fungsi executor (mis. `fireproximityprompt`, `hookmetamethod`) berbeda-beda; script mendeteksinya saat jalan dan melewati aksi bila tidak ada.
- Menjalankan script lewat executor **melanggar ToS Roblox** dan dapat membuat akun diblokir. Pakai dengan tanggung jawab sendiri.
- Belum ada: penguji kondisi interaktif, tampilan diff riwayat versi.

## Struktur
`index.html`, `css/`, `js/` (core, generator, runtime, validate, templates, `ui/*`), `LuluUI.lua`, `lulu-patch/`, `tests/`, `examples/` (impor lewat *Hasil → Impor JSON*).
