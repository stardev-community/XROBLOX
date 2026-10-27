#!/usr/bin/env python3
"""Baca tema dari ../LuluUI.lua -> ../js/themes.js (dipakai preview web)."""
import re, json, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, '..', 'LuluUI.lua'), encoding='utf-8').read()
block = src[src.index('LuluUI.Themes = {'):src.index('LuluUI.Theme = LuluUI.Themes.Purple')]
themes = {}
for m in re.finditer(r'\n    (\w+) = \{(.*?)\n    \},?', block, re.S):
    themes[m.group(1)] = {k: '#%02x%02x%02x' % (int(r), int(g), int(b))
        for k, r, g, b in re.findall(r'(\w+)\s*=\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)', m.group(2))}
out = ("/* Dibuat otomatis dari LuluUI.lua oleh lulu-patch/gen_themes.py - jangan edit manual */\n"
       "(function (g) {\n  var LSB = g.LSB = g.LSB || {};\n  LSB.THEMES = " + json.dumps(themes, indent=2) +
       ";\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(here, '..', 'js', 'themes.js'), 'w').write(out)
print('OK', list(themes))
