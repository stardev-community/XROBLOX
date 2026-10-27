#!/usr/bin/env python3
"""
Menerapkan 8 tambalan pada LuluUI asli -> ../LuluUI.lua
Pakai:  python3 patch_luluui.py
Setiap tambalan diperiksa: teks lama harus ditemukan TEPAT sekali,
sehingga kalau LuluUI asli berubah, patcher berhenti dengan pesan jelas.
"""
import re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "LuluUI.orig.lua")
DST = os.path.join(HERE, "..", "LuluUI.lua")

src = open(SRC, encoding="utf-8").read()
log = []

def rep(name, old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        sys.exit(f"[GAGAL] {name}: ditemukan {n}x (harusnya {count}x)\n--- teks dicari ---\n{old}")
    src = src.replace(old, new)
    log.append(name)

def rep_re(name, pattern, new, count=1, flags=0):
    global src
    found = re.findall(pattern, src, flags)
    if len(found) != count:
        sys.exit(f"[GAGAL] {name}: pola ditemukan {len(found)}x (harusnya {count}x): {pattern}")
    src = re.sub(pattern, lambda m: new, src, flags=flags)
    log.append(name)

# ---------------------------------------------------------------- versi
rep("versi-konstanta", "LuluUI.__index = LuluUI\n",
    "LuluUI.__index = LuluUI\nLuluUI.Version = \"1.4.0\"\n")

# ---------------------------------------------------------------- P8 GUI parent aman
rep("p8-guiParent",
'''    local guiParent = (gethui and gethui())
        or game:GetService("CoreGui")
        or Players.LocalPlayer:WaitForChild("PlayerGui")''',
'''    -- [PATCH 8] parent GUI aman: gethui -> CoreGui -> PlayerGui (semua dibungkus pcall)
    local guiParent
    do
        local okH, h = pcall(function() return gethui and gethui() end)
        if okH and h then guiParent = h end
        if not guiParent then
            local okC, c = pcall(function()
                local cg = game:GetService("CoreGui")
                local _ = cg.Name
                return cg
            end)
            if okC and c then guiParent = c end
        end
        if not guiParent then
            guiParent = Players.LocalPlayer:WaitForChild("PlayerGui")
        end
    end''')

# ---------------------------------------------------------------- P4 branding via cfg
rep("p4-subtitle", 'cfg.subtitle or "LuluUI v1.3.1"', 'cfg.subtitle or ("LuluUI v" .. LuluUI.Version)')
rep_re("p4-loading-title", r'titleText\.Text\s*=\s*"Loading Script"',
       'titleText.Text               = cfg.loadingTitle or "Loading Script"')
rep_re("p4-loading-desc", r'descText\.Text\s*=\s*"Beautiful UI v1\.3\.3 \[StarDevVersion\]"',
       'descText.Text                = cfg.loadingDesc or ("Beautiful UI v" .. LuluUI.Version)')
rep_re("p4-loading-creator", r'creatorText\.Text\s*=\s*"by Lulu_Attack"',
       'creatorText.Text             = cfg.loadingCreator or "by Lulu_Attack"')
rep("p4-skipLoading",
'''        local playerName = Players.LocalPlayer and Players.LocalPlayer.Name or "Player"''',
'''        -- [PATCH 4] cfg.skipLoading = true -> langsung tampil tanpa intro
        if cfg.skipLoading then
            lotusBtn.Visible  = true
            mainFrame.Visible = true
            return
        end
        local playerName = Players.LocalPlayer and Players.LocalPlayer.Name or "Player"''')

# ---------------------------------------------------------------- P5 ikon kunci accordion
rep("p5-lock-icon",
    "            ic.Position = UDim2.new(1, -ic.AbsoluteSize.X - 8, 0, 0)",
    "            ic.AnchorPoint = Vector2.new(1, 0)\n            ic.Position = UDim2.new(1, -8, 0, 0)")

# ---------------------------------------------------------------- P7 getter: Toggle
rep("p7-toggle-handle",
'''    if not disabled then
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(1, 0, 1, 0)
        btn.BackgroundTransparency = 1
        btn.Text = ""
        btn.Parent = bg

        btn.MouseButton1Click:Connect(function()
            state[1] = not state[1]
            local on = state[1]
            TweenService:Create(track, TweenInfo.new(0.2), {
                BackgroundColor3 = on and theme.toggleOn or theme.toggleOff
            }):Play()
            TweenService:Create(knob, TweenInfo.new(0.2), {
                Position = on and UDim2.new(0, 20, 0.5, -8) or UDim2.new(0, 2, 0.5, -8)
            }):Play()
            if callback then callback(on) end
        end)
    end
''',
'''    -- [PATCH 7] applyState dipakai klik DAN handle:Set / handle:Get
    local function applyState(on, fire)
        state[1] = on
        if not disabled then
            TweenService:Create(track, TweenInfo.new(0.2), {
                BackgroundColor3 = on and theme.toggleOn or theme.toggleOff
            }):Play()
            TweenService:Create(knob, TweenInfo.new(0.2), {
                Position = on and UDim2.new(0, 20, 0.5, -8) or UDim2.new(0, 2, 0.5, -8)
            }):Play()
        end
        if fire and callback then callback(on) end
    end

    if not disabled then
        local btn = Instance.new("TextButton")
        btn.Size = UDim2.new(1, 0, 1, 0)
        btn.BackgroundTransparency = 1
        btn.Text = ""
        btn.Parent = bg

        btn.MouseButton1Click:Connect(function()
            applyState(not state[1], true)
        end)
    end

    local handle = {}
    function handle:Set(v, silent) applyState(v and true or false, not silent) end
    function handle:Get() return state[1] end
''')
rep("p7-toggle-return", "    return bg, totalH\nend\n\nlocal function _mkDropdown",
    "    return bg, totalH, handle\nend\n\nlocal function _mkDropdown")

# ---------------------------------------------------------------- P7 getter: Dropdown
rep("p7-dd-curval", '    valBtn.Text = default .. " +"\n',
    '    local curVal = {default}   -- [PATCH 7] nilai terpilih untuk proxy:Get()\n    valBtn.Text = default .. " +"\n')
rep("p7-dd-pick",
'''                closeMenu()
                valBtn.Text = opt .. " +"
                if callback then callback(opt) end''',
'''                closeMenu()
                curVal[1] = opt
                valBtn.Text = opt .. " +"
                if callback then callback(opt) end''')
rep("p7-dd-setoptions",
'''        if not keepValue then
            valBtn.Text = (newOpts[1] or "---") .. " +"
        end''',
'''        if not keepValue then
            curVal[1] = newOpts[1]
            valBtn.Text = (newOpts[1] or "---") .. " +"
        end''')
rep("p7-dd-setvalue",
'''    function proxy:SetValue(text)
        valBtn.Text = text .. " +"
    end''',
'''    function proxy:SetValue(text, fire)
        curVal[1] = text
        valBtn.Text = tostring(text) .. " +"
        if fire and callback then callback(text) end
    end

    function proxy:Get()
        return curVal[1]
    end''')

# ---------------------------------------------------------------- P7 getter: NumberInput
rep("p7-num-update", "    local function update(v)\n        v = math.clamp",
    "    local function update(v, silent)\n        v = math.clamp")
rep("p7-num-cb", "        valBox.Text = tostring(v)\n        if callback then callback(v) end\n    end",
    "        valBox.Text = tostring(v)\n        if callback and not silent then callback(v) end\n    end")
rep("p7-num-handle",
'''    plusBtn.MouseButton1Click:Connect(function()  update(cur[1] + step) end)

    return bg, 28
end''',
'''    plusBtn.MouseButton1Click:Connect(function()  update(cur[1] + step) end)

    -- [PATCH 7] handle getter/setter
    local handle = {}
    function handle:Set(v, silent) update(tonumber(v) or cur[1], silent) end
    function handle:Get() return cur[1] end
    return bg, 28, handle
end''')

# ---------------------------------------------------------------- P7 getter: Segment
rep("p7-seg-handle", "    return bg, 52\nend",
'''    -- [PATCH 7] handle getter/setter
    local handle = {}
    function handle:Set(opt, silent)
        selected[1] = opt
        refresh()
        if callback and not silent then callback(opt) end
    end
    function handle:Get() return selected[1] end
    return bg, 52, handle
end''')

# ---------------------------------------------------------------- Section: return value
rep("sec-label",
'''    _mkLabel(self._c, text, self._y, h, opts.size, opts.bold, opts.color, self._t, self._depth)
    self._y = self._y + h + (opts.gap or 4)
end''',
'''    local lbl = _mkLabel(self._c, text, self._y, h, opts.size, opts.bold, opts.color, self._t, self._depth)
    self._y = self._y + h + (opts.gap or 4)
    return lbl   -- [PATCH 7] TextLabel dikembalikan supaya teksnya bisa diubah
end''')
rep("sec-badge",
'''    _mkBadge(self._c, text, self._y, self._t, opts)
    self._y = self._y + 20 + (opts.gap or 4)
end''',
'''    local badge = _mkBadge(self._c, text, self._y, self._t, opts)
    self._y = self._y + 20 + (opts.gap or 4)
    return badge
end''')
rep("sec-toggle",
'''    local _, h = _mkToggle(self._c, label, self._y, default, callback, self._t, opts, self._depth)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
end''',
'''    local _, h, handle = _mkToggle(self._c, label, self._y, default, callback, self._t, opts, self._depth)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
    return handle
end''')
rep("sec-number",
'''    _mkNumberInput(self._c, label, self._y, default, step, minVal, maxVal, callback, self._t, self._depth)
    self._y = self._y + 28 + (opts.gap or DEFAULT_GAP)
end''',
'''    local _, _, handle = _mkNumberInput(self._c, label, self._y, default, step, minVal, maxVal, callback, self._t, self._depth)
    self._y = self._y + 28 + (opts.gap or DEFAULT_GAP)
    return handle
end''')
rep("sec-segment",
'''    _mkSegment(self._c, label, options, default, self._y, callback, self._t)
    self._y = self._y + 52 + (opts.gap or DEFAULT_GAP)
end''',
'''    local _, _, handle = _mkSegment(self._c, label, options, default, self._y, callback, self._t)
    self._y = self._y + 52 + (opts.gap or DEFAULT_GAP)
    return handle
end''')

# ---------------------------------------------------------------- P6 OnClose
rep("p6-state", "    self._openMenuClosers = {}\n",
    "    self._openMenuClosers = {}\n    -- [PATCH 6] hook OnClose + daftar ScreenGui tambahan (LocationPanel)\n    self._onClose   = {}\n    self._extraGuis = {}\n    self._closed    = false\n")
rep("p6-close-btn", "        task.wait(0.31)\n        sg:Destroy()",
    "        task.wait(0.31)\n        self:_fireClose()\n        sg:Destroy()")
rep("p6-locpanel-gui", "    sg.Parent         = self.screenGui.Parent   -- sama dengan parent main UI",
    "    sg.Parent         = self.screenGui.Parent   -- sama dengan parent main UI\n    self._extraGuis[#self._extraGuis + 1] = sg")
rep("p6-destroy",
'''function Window:Destroy()
    self.screenGui:Destroy()
end''',
'''-- [PATCH 6] OnClose: daftarkan fungsi cleanup (dipanggil sekali saat window ditutup / Destroy)
function Window:OnClose(fn)
    if type(fn) == "function" then table.insert(self._onClose, fn) end
end

function Window:_fireClose()
    if self._closed then return end
    self._closed = true
    for _, fn in ipairs(self._onClose) do pcall(fn) end
    for _, g in ipairs(self._extraGuis) do pcall(function() g:Destroy() end) end
end

function Window:SetSubtitle(text)
    self.subtitleLabel.Text = text
end

function Window:Destroy()
    self:_fireClose()
    self.screenGui:Destroy()
end''')

# ---------------------------------------------------------------- P1-3 Tab API baru
start_marker = "    local api = {}\n\n    function api:Label(text, opts)"
end_marker = "    return api\nend\n\nfunction Window:_setActive(tab)"
i = src.find(start_marker)
j = src.find(end_marker)
if i < 0 or j < 0 or src.count(start_marker) != 1 or src.count(end_marker) != 1:
    sys.exit("[GAGAL] p1-3-tab-api: penanda Tab API tidak ditemukan")
new_api = '''    -- [PATCH 1,2,3] Tab API tunggal: semua widget didelegasikan ke Section,
    -- canvas di-update otomatis, dan SEMUA nilai kembalian (proxy/handle/setter) tetap lolos.
    local api = {}
    local WIDGETS = {
        "Label", "InfoLabel", "Divider", "Separator", "Badge", "Table", "CopyButton",
        "Button", "HalfButtons", "Toggle", "Dropdown", "MultiDropdown", "NumberInput",
        "TextInput", "List", "ProgressBar", "Segment", "Accordion", "Custom",
    }
    for _, wname in ipairs(WIDGETS) do
        api[wname] = function(_, ...)
            local r = table.pack(sec[wname](sec, ...))
            sec:_updateCanvas()
            return table.unpack(r, 1, r.n)
        end
    end
    api.Name    = name
    api.Section = sec
    function api:Select() self_win:_setActive(tab) end

    return api
end

function Window:_setActive(tab)'''
src = src[:i] + new_api + src[j + len(end_marker):]
log.append("p1-3-tab-api")

# self_win: referensi Window di dalam Window:Tab
rep("p3-selfwin", "function Window:Tab(name)\n    local theme  = self._theme\n",
    "function Window:Tab(name)\n    local self_win = self\n    local theme  = self._theme\n")

open(DST, "w", encoding="utf-8", newline="\n").write(src)
print("OK. Tambalan diterapkan:")
for l in log: print("  -", l)
print("Tulis ->", os.path.normpath(DST))
