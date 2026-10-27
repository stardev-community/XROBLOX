-- ============================================================

local LuluUI = {}
LuluUI.__index = LuluUI

-- ============================================================
-- SERVICES
-- ============================================================
local TweenService     = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService       = game:GetService("RunService")
local Players          = game:GetService("Players")

-- ============================================================
-- THEME PRESETS
-- Pilih tema: LuluUI.SetTheme("Ocean")
-- ============================================================

-- Helper internal
local function rgb(r,g,b) return Color3.fromRGB(r,g,b) end

LuluUI.Themes = {

    --  Purple
    Purple = {
        accent       = rgb(40,  120, 255),
        accentDark   = rgb(70,  0,   90),
        sidebar      = rgb(100, 0,   120),
        sidebarBg    = rgb(128, 0,   128),
        windowBg     = rgb(255, 255, 255),
        contentBg    = rgb(245, 247, 252),
        text         = rgb(40,  50,  70),
        textLight    = rgb(200, 200, 220),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(40,  180, 80),
        toggleOff    = rgb(190, 195, 210),
        divider      = rgb(220, 225, 235),
        shadow       = rgb(20,  90,  200),
        accordionBg  = rgb(235, 238, 248),
        accordionTxt = rgb(100, 110, 140),
        segmentOff   = rgb(160, 165, 180),
        luluNotify        = rgb(30,  30,  40),
        success = rgb(40, 180, 80),   
        warning = rgb(255, 170, 50),   
        danger  = rgb(200, 60, 60),    
    },

    --  Ocean
    Ocean = {
        accent       = rgb(0,   180, 255),
        accentDark   = rgb(0,   40,  80),
        sidebar      = rgb(0,   60,  110),
        sidebarBg    = rgb(0,   80,  140),
        windowBg     = rgb(240, 248, 255),
        contentBg    = rgb(232, 244, 252),
        text         = rgb(20,  40,  70),
        textLight    = rgb(160, 200, 230),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(0,   200, 180),
        toggleOff    = rgb(160, 190, 210),
        divider      = rgb(200, 220, 240),
        shadow       = rgb(0,   120, 200),
        accordionBg  = rgb(220, 238, 252),
        accordionTxt = rgb(60,  100, 150),
        segmentOff   = rgb(120, 160, 195),
        luluNotify        = rgb(10,  30,  55),
        success = rgb(40, 180, 80),  
        warning = rgb(255, 170, 50),  
        danger  = rgb(200, 60, 60),   
    },

    --  Matrix
    Matrix = {
        accent       = rgb(0,   210, 100),
        accentDark   = rgb(0,   50,  20),
        sidebar      = rgb(0,   80,  30),
        sidebarBg    = rgb(0,   100, 40),
        windowBg     = rgb(240, 252, 244),
        contentBg    = rgb(230, 248, 236),
        text         = rgb(20,  50,  30),
        textLight    = rgb(140, 210, 160),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(0,   210, 100),
        toggleOff    = rgb(150, 190, 160),
        divider      = rgb(190, 230, 200),
        shadow       = rgb(0,   150, 60),
        accordionBg  = rgb(215, 242, 222),
        accordionTxt = rgb(40,  110, 60),
        segmentOff   = rgb(100, 170, 120),
        luluNotify        = rgb(10,  40,  20),
        success = rgb(40, 180, 80),  
        warning = rgb(255, 170, 50),   
        danger  = rgb(200, 60, 60),    
    },

    --  Crimson
    Crimson = {
        accent       = rgb(220, 40,  60),
        accentDark   = rgb(90,  0,   15),
        sidebar      = rgb(140, 10,  30),
        sidebarBg    = rgb(170, 20,  40),
        windowBg     = rgb(255, 248, 248),
        contentBg    = rgb(252, 240, 242),
        text         = rgb(60,  20,  25),
        textLight    = rgb(230, 180, 185),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(220, 40,  60),
        toggleOff    = rgb(210, 175, 178),
        divider      = rgb(240, 210, 215),
        shadow       = rgb(180, 20,  40),
        accordionBg  = rgb(252, 228, 232),
        accordionTxt = rgb(140, 60,  70),
        segmentOff   = rgb(195, 140, 145),
        luluNotify        = rgb(50,  10,  15),
        success = rgb(40, 180, 80),  
        warning = rgb(255, 170, 50), 
        danger  = rgb(200, 60, 60),  
    },

    --  Luxury
    Luxury = {
        accent       = rgb(200, 155, 40),
        accentDark   = rgb(70,  45,  0),
        sidebar      = rgb(100, 70,  0),
        sidebarBg    = rgb(130, 95,  10),
        windowBg     = rgb(255, 253, 242),
        contentBg    = rgb(252, 248, 232),
        text         = rgb(55,  40,  10),
        textLight    = rgb(220, 195, 130),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(200, 155, 40),
        toggleOff    = rgb(200, 185, 145),
        divider      = rgb(235, 220, 180),
        shadow       = rgb(160, 120, 20),
        accordionBg  = rgb(248, 238, 205),
        accordionTxt = rgb(130, 100, 30),
        segmentOff   = rgb(185, 165, 100),
        luluNotify        = rgb(45,  30,  5),
        success = rgb(40, 180, 80),  
        warning = rgb(255, 170, 50),  
        danger  = rgb(200, 60, 60),   
    },

    --  Sakura
    Sakura = {
        accent       = rgb(230, 80,  150),
        accentDark   = rgb(100, 20,  60),
        sidebar      = rgb(170, 40,  100),
        sidebarBg    = rgb(200, 60,  120),
        windowBg     = rgb(255, 248, 252),
        contentBg    = rgb(252, 238, 248),
        text         = rgb(60,  25,  45),
        textLight    = rgb(235, 175, 210),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(230, 80,  150),
        toggleOff    = rgb(215, 175, 200),
        divider      = rgb(242, 215, 232),
        shadow       = rgb(190, 50,  120),
        accordionBg  = rgb(252, 228, 244),
        accordionTxt = rgb(155, 70,  115),
        segmentOff   = rgb(205, 155, 185),
        luluNotify        = rgb(55,  15,  40),
        success = rgb(40, 180, 80),    
        warning = rgb(255, 170, 50), 
        danger  = rgb(200, 60, 60),
    },

    --  White
    White = {
        accent       = rgb(60,  130, 255),
        accentDark   = rgb(30,  70,  180),
        sidebar      = rgb(60,  70,  90),
        sidebarBg    = rgb(75,  85,  105),
        windowBg     = rgb(255, 255, 255),
        contentBg    = rgb(248, 249, 252),
        text         = rgb(30,  35,  50),
        textLight    = rgb(190, 195, 210),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(50,  185, 90),
        toggleOff    = rgb(185, 190, 205),
        divider      = rgb(225, 228, 238),
        shadow       = rgb(50,  100, 200),
        accordionBg  = rgb(240, 242, 250),
        accordionTxt = rgb(100, 108, 135),
        segmentOff   = rgb(155, 162, 180),
        luluNotify        = rgb(30,  32,  45),
        success = rgb(40, 180, 80),    
        warning = rgb(255, 170, 50),  
        danger  = rgb(200, 60, 60),   
    },

    --  Dark 
    Dark = {
        accent       = rgb(80,  150, 255),
        accentDark   = rgb(30,  50,  110),
        sidebar      = rgb(25,  28,  40),
        sidebarBg    = rgb(32,  35,  50),
        windowBg     = rgb(20,  22,  32),
        contentBg    = rgb(30,  33,  48),
        text         = rgb(210, 215, 230),
        textLight    = rgb(100, 110, 140),
        textWhite    = rgb(235, 238, 248),
        toggleOn     = rgb(60,  190, 100),
        toggleOff    = rgb(70,  78,  100),
        divider      = rgb(50,  55,  75),
        shadow       = rgb(60,  120, 230),
        accordionBg  = rgb(38,  42,  60),
        accordionTxt = rgb(130, 140, 170),
        segmentOff   = rgb(75,  83,  110),
        luluNotify        = rgb(18,  20,  30),
        success = rgb(40, 180, 80),   
        warning = rgb(255, 170, 50),   
        danger  = rgb(200, 60, 60),    
    },

    --  Tosca
    Tosca = {
        accent       = rgb(0,   185, 175),
        accentDark   = rgb(0,   65,  65),
        sidebar      = rgb(0,   110, 105),
        sidebarBg    = rgb(0,   135, 128),
        windowBg     = rgb(240, 253, 252),
        contentBg    = rgb(228, 250, 248),
        text         = rgb(15,  50,  48),
        textLight    = rgb(140, 210, 205),
        textWhite    = rgb(255, 255, 255),
        toggleOn     = rgb(0,   185, 175),
        toggleOff    = rgb(145, 195, 192),
        divider      = rgb(190, 235, 232),
        shadow       = rgb(0,   150, 140),
        accordionBg  = rgb(210, 245, 242),
        accordionTxt = rgb(30,  115, 110),
        segmentOff   = rgb(100, 175, 170),
        luluNotify        = rgb(5,   40,  38),
        success = rgb(40, 180, 80),  
        warning = rgb(255, 170, 50),  
        danger  = rgb(200, 60, 60),   
    },

    DarkPurple = {
        accent       = rgb(124, 77,  255),
        accentDark   = rgb(60,  20,  120),
        sidebar      = rgb(26,  26,  46),
        sidebarBg    = rgb(30,  30,  55),
        windowBg     = rgb(13,  13,  26),
        contentBg    = rgb(22,  22,  40),
        text         = rgb(220, 215, 240),
        textLight    = rgb(100, 95,  140),
        textWhite    = rgb(235, 230, 255),
        toggleOn     = rgb(124, 77,  255),
        toggleOff    = rgb(55,  50,  85),
        divider      = rgb(40,  38,  65),
        shadow       = rgb(100, 50,  200),
        accordionBg  = rgb(30,  28,  52),
        accordionTxt = rgb(130, 120, 170),
        segmentOff   = rgb(70,  65,  110),
        luluNotify   = rgb(10,  10,  20),
        success      = rgb(40,  180, 80),
        warning      = rgb(255, 170, 50),
        danger       = rgb(200, 60,  60),
    },

    Midnight = {
        accent       = rgb(80,  160, 255),
        accentDark   = rgb(20,  40,  90),
        sidebar      = rgb(10,  12,  18),
        sidebarBg    = rgb(14,  16,  24),
        windowBg     = rgb(6,   7,   12),
        contentBg    = rgb(12,  14,  22),
        text         = rgb(200, 208, 225),
        textLight    = rgb(70,  80,  110),
        textWhite    = rgb(220, 228, 245),
        toggleOn     = rgb(80,  160, 255),
        toggleOff    = rgb(35,  42,  65),
        divider      = rgb(25,  30,  48),
        shadow       = rgb(50,  110, 220),
        accordionBg  = rgb(16,  19,  30),
        accordionTxt = rgb(90,  105, 145),
        segmentOff   = rgb(45,  55,  85),
        luluNotify   = rgb(5,   6,   10),
        success      = rgb(40,  180, 80),
        warning      = rgb(255, 170, 50),
        danger       = rgb(200, 60,  60),
    },

    Carbon = {
        accent       = rgb(240, 240, 240),
        accentDark   = rgb(80,  80,  80),
        sidebar      = rgb(20,  20,  20),
        sidebarBg    = rgb(28,  28,  28),
        windowBg     = rgb(10,  10,  10),
        contentBg    = rgb(18,  18,  18),
        text         = rgb(210, 210, 210),
        textLight    = rgb(80,  80,  80),
        textWhite    = rgb(245, 245, 245),
        toggleOn     = rgb(220, 220, 220),
        toggleOff    = rgb(50,  50,  50),
        divider      = rgb(35,  35,  35),
        shadow       = rgb(30,  30,  30),
        accordionBg  = rgb(22,  22,  22),
        accordionTxt = rgb(110, 110, 110),
        segmentOff   = rgb(60,  60,  60),
        luluNotify   = rgb(8,   8,   8),
        success      = rgb(40,  180, 80),
        warning      = rgb(255, 170, 50),
        danger       = rgb(200, 60,  60),
    },
}


LuluUI.Theme = LuluUI.Themes.Purple

function LuluUI.SetTheme(name)
    local t = LuluUI.Themes[name]
    assert(t, "LuluUI.SetTheme: tema '" .. tostring(name) .. "' tidak ditemukan.\n"
        .. "Tema tersedia: Purple, Ocean, Matrix, Crimson, Luxury, Sakura, White, Dark, Tosca, DarkPurple, Midnight, Carbon")
    LuluUI.Theme = t
end

--  GetThemes
function LuluUI.GetThemes()
    local list = {}
    for name in pairs(LuluUI.Themes) do
        table.insert(list, name)
    end
    table.sort(list)
    return list
end

-- ============================================================
-- INTERNAL PRIMITIVE HELPERS
-- ============================================================
local function mkCorner(parent, radius)
    local c = Instance.new("UICorner", parent)
    c.CornerRadius = UDim.new(0, radius or 8)
    return c
end

local function makeHover(btn, base, hov)
    btn.MouseEnter:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3 = hov}):Play()
    end)
    btn.MouseLeave:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3 = base}):Play()
    end)
end

local function lighten(c, amt)
    amt = amt or 30
    return Color3.fromRGB(
        math.clamp(c.R * 255 + amt, 0, 255),
        math.clamp(c.G * 255 + amt, 0, 255),
        math.clamp(c.B * 255 + amt, 0, 255)
    )
end

-- ============================================================
-- WIDGET BUILDERS
-- ============================================================

local function _mkLabel(parent, text, yOff, h, size, bold, color, theme, depth)
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    local l = Instance.new("TextLabel")
    l.Size = UDim2.new(1, -(ML + MR), 0, h or 20)
    l.Position = UDim2.new(0, ML, 0, yOff)
    l.BackgroundTransparency = 1
    l.Text = prefix .. text
    l.Font = bold and Enum.Font.GothamBold or Enum.Font.Gotham
    l.TextSize = size or 12
    l.TextColor3 = color or theme.textWhite
    l.TextXAlignment = Enum.TextXAlignment.Left
    l.TextTruncate = Enum.TextTruncate.AtEnd
    l.Parent = parent
    return l, h or 20
end

local function _mkInfoLabel(parent, label, initValue, yOff, theme, opts, depth)
    opts  = opts  or {}
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    local H      = opts.height or 28

    local bg = Instance.new("Frame")
    bg.Size                   = UDim2.new(1, -(ML + MR), 0, H)
    bg.Position               = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3       = theme.contentBg
    bg.BorderSizePixel        = 0
    bg.Parent                 = parent
    mkCorner(bg, 8)

    local lbl = Instance.new("TextLabel")
    lbl.Size                  = UDim2.new(0.55, -8, 1, 0)
    lbl.Position              = UDim2.new(0, 10, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text                  = prefix .. label
    lbl.Font                  = opts.bold and Enum.Font.GothamBold or Enum.Font.Gotham
    lbl.TextSize               = opts.size or 10
    lbl.TextColor3             = theme.text
    lbl.TextXAlignment         = Enum.TextXAlignment.Left
    lbl.TextTruncate           = Enum.TextTruncate.AtEnd
    lbl.Parent                 = bg

    local valLbl = Instance.new("TextLabel")
    valLbl.Size                   = UDim2.new(0.45, -10, 0, H - 8)
    valLbl.Position               = UDim2.new(0.55, 0, 0.5, -(H - 8) / 2)
    valLbl.BackgroundColor3       = opts.valueBg or theme.accordionBg
    valLbl.BackgroundTransparency = 0
    valLbl.BorderSizePixel        = 0
    valLbl.Text                   = tostring(initValue or "")
    valLbl.Font                   = Enum.Font.GothamBold
    valLbl.TextSize                = opts.size or 10
    valLbl.TextColor3              = opts.color or theme.accent
    valLbl.TextXAlignment          = Enum.TextXAlignment.Center
    valLbl.TextTruncate            = Enum.TextTruncate.AtEnd
    valLbl.Parent                  = bg
    mkCorner(valLbl, 5)

    local function setLabel(newText)
        lbl.Text = prefix .. tostring(newText)
    end

    local function setValue(newVal, newColor)
        valLbl.Text = tostring(newVal)
        if newColor then valLbl.TextColor3 = newColor end
    end

    return bg, H, setLabel, setValue
end

local function _mkDivider(parent, yOff, theme, depth)
    depth = depth or 0
    local ML = 8 + depth * 10
    local MR = 8
    local d = Instance.new("Frame")
    d.Size = UDim2.new(1, -(ML + MR), 0, 1)
    d.Position = UDim2.new(0, ML, 0, yOff)
    d.BackgroundColor3 = theme.divider
    d.BorderSizePixel = 0
    d.Parent = parent
    return d, 1
end

local function _mkBtn(parent, text, yOff, h, col, theme, opts, depth)
    opts = opts or {}
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    col = col or theme.accent
    local loadingText = opts.loading

    local b = Instance.new("TextButton")
    b.Size = UDim2.new(1, -(ML + MR), 0, h or 22)
    b.Position = UDim2.new(0, ML, 0, yOff)
    b.BackgroundColor3 = col
    b.BackgroundTransparency = 0.15
    b.Text = prefix .. text
    b.Font = Enum.Font.GothamBold
    b.TextSize = 10
    b.TextColor3 = theme.textWhite
    b.BorderSizePixel = 0
    b.Parent = parent
    mkCorner(b, 2)

    local stroke = Instance.new("UIStroke", b)
    stroke.Color           = col
    stroke.Thickness        = 1.5
    stroke.Transparency     = 0
    stroke.ApplyStrokeMode  = Enum.ApplyStrokeMode.Border

    b.MouseEnter:Connect(function()
        TweenService:Create(b, TweenInfo.new(0.15), {
            BackgroundTransparency = 0,
        }):Play()
    end)
    b.MouseLeave:Connect(function()
        TweenService:Create(b, TweenInfo.new(0.15), {
            BackgroundTransparency = 0.15,
        }):Play()
    end)

    if opts.locked then
        b.BackgroundColor3       = theme.accordionTxt
        b.BackgroundTransparency = 0.3
        stroke.Color             = theme.accordionTxt
        b.AutoButtonColor        = false

        local ov = Instance.new("TextButton", b)
        ov.Size                   = UDim2.new(1, 0, 1, 0)
        ov.BackgroundTransparency = 1
        ov.BorderSizePixel        = 0
        ov.Text                   = "🔒"
        ov.Font                   = Enum.Font.GothamBold
        ov.TextSize               = 11
        ov.TextColor3             = theme.textWhite
        ov.TextXAlignment         = Enum.TextXAlignment.Right
        ov.Active                 = true
        ov.AutoButtonColor        = false
        ov.ZIndex                 = b.ZIndex + 5
        ov.MouseButton1Click:Connect(function() end) 
        local ovPad = Instance.new("UIPadding", ov)
        ovPad.PaddingRight = UDim.new(0, 6)
    end

    return b, h or 26
end

local function _mkHalfBtns(parent, textA, textB, yOff, h, colA, colB, theme)
    h = h or 26
    colA = colA or theme.accent
    colB = colB or theme.accent

    local wrapper = Instance.new("Frame")
    wrapper.Size                 = UDim2.new(1, -16, 0, h)
    wrapper.Position             = UDim2.new(0, 8, 0, yOff)
    wrapper.BackgroundTransparency = 1
    wrapper.BorderSizePixel      = 0
    wrapper.Parent               = parent

    local function makeHalf(text, col, posX, sizeXOffset)
        local b = Instance.new("TextButton")
        b.Size                   = UDim2.new(0.5, sizeXOffset, 1, 0)
        b.Position               = UDim2.new(posX, posX == 0 and 0 or 4, 0, 0)
        b.BackgroundColor3       = col
        b.BackgroundTransparency = 0.15
        b.Text                   = text
        b.Font                   = Enum.Font.GothamBold
        b.TextSize               = 11
        b.TextColor3             = theme.textWhite
        b.BorderSizePixel        = 0
        b.Parent                 = wrapper
        mkCorner(b, 2)

        local stroke = Instance.new("UIStroke", b)
        stroke.Color            = col
        stroke.Thickness        = 1.5
        stroke.Transparency     = 0
        stroke.ApplyStrokeMode  = Enum.ApplyStrokeMode.Border

        b.MouseEnter:Connect(function()
            TweenService:Create(b, TweenInfo.new(0.15), {BackgroundTransparency = 0}):Play()
        end)
        b.MouseLeave:Connect(function()
            TweenService:Create(b, TweenInfo.new(0.15), {BackgroundTransparency = 0.15}):Play()
        end)

        return b
    end

    local bA = makeHalf(textA, colA, 0,   -2)
    local bB = makeHalf(textB, colB, 0.5, -2)

    return bA, bB, h
end

local function _mkToggle(parent, label, yOff, default, callback, theme, opts, depth)
    opts = opts or {}
    depth = depth or 0
    local ML = 8 + depth * 10
    local MR = 8
    local prefix = depth > 0 and " " or ""
    local subtext  = opts.subtext
    local locked   = opts.locked == true
    local disabled = opts.disabled == true or locked
    local totalH   = subtext and 48 or 28

    local state = {default}
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -(ML + MR), 0, totalH)
    bg.Position = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3 = disabled and theme.divider or theme.contentBg
    bg.BorderSizePixel = 0
    bg.Parent = parent
    mkCorner(bg, 8)

    local textColor = disabled and theme.accordionTxt or theme.text

    if subtext then
        local lbl = Instance.new("TextLabel")
        lbl.Size = UDim2.new(1, -60, 0, 18)
        lbl.Position = UDim2.new(0, 10, 0, 8)
        lbl.BackgroundTransparency = 1
        lbl.Text = prefix .. label
        lbl.Font = Enum.Font.GothamBold
        lbl.TextSize = 10
        lbl.TextColor3 = textColor
        lbl.TextXAlignment = Enum.TextXAlignment.Left
        lbl.Parent = bg

        local sub = Instance.new("TextLabel")
        sub.Size = UDim2.new(1, -60, 0, 14)
        sub.Position = UDim2.new(0, 10, 0, 27)
        sub.BackgroundTransparency = 1
        sub.Text = subtext
        sub.Font = Enum.Font.Gotham
        sub.TextSize = 10
        sub.TextColor3 = theme.accordionTxt
        sub.TextXAlignment = Enum.TextXAlignment.Left
        sub.Parent = bg
    else
        local lbl = Instance.new("TextLabel")
        lbl.Size = UDim2.new(1, -60, 1, 0)
        lbl.Position = UDim2.new(0, 10, 0, 0)
        lbl.BackgroundTransparency = 1
        lbl.Text = prefix .. label
        lbl.Font = Enum.Font.Gotham
        lbl.TextSize = 10
        lbl.TextColor3 = textColor
        lbl.TextXAlignment = Enum.TextXAlignment.Left
        lbl.Parent = bg
    end

    local trackColor = disabled and theme.divider
        or (default and theme.toggleOn or theme.toggleOff)
    local track = Instance.new("Frame")
    track.Size = UDim2.new(0, 38, 0, 20)
    track.Position = UDim2.new(1, -46, 0.5, -10)
    track.BackgroundColor3 = trackColor
    track.BorderSizePixel = 0
    track.Parent = bg
    mkCorner(track, 10)

    local knob = Instance.new("Frame")
    knob.Size = UDim2.new(0, 16, 0, 16)
    knob.Position = default and UDim2.new(0, 20, 0.5, -8) or UDim2.new(0, 2, 0.5, -8)
    knob.BackgroundColor3 = disabled and theme.accordionTxt or theme.textWhite
    knob.BorderSizePixel = 0
    knob.Parent = track
    mkCorner(knob, 8)

    if not disabled then
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

    if locked then
        local lockLbl = Instance.new("TextLabel", bg)
        lockLbl.Size                   = UDim2.new(0, 38, 0, 20)
        lockLbl.Position               = UDim2.new(1, -46, 0.5, -10)
        lockLbl.BackgroundTransparency = 1
        lockLbl.Text                   = "🔒"
        lockLbl.Font                   = Enum.Font.GothamBold
        lockLbl.TextSize               = 13
        lockLbl.TextXAlignment         = Enum.TextXAlignment.Center
        lockLbl.ZIndex                 = track.ZIndex + 2
        lockLbl.Parent                 = bg
    end

    return bg, totalH
end

local function _mkDropdown(parent, mainFrame, label, options, default, yOff, callback, theme, closers, depth)
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    local open        = {false}
    local currentOpts = options

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -(ML + MR), 0, 28)
    bg.Position = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel = 0
    bg.ClipsDescendants = false
    bg.Parent = parent
    mkCorner(bg, 8)

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(0.4, -14, 1, 0)
    lbl.Position = UDim2.new(0, 10, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = prefix .. label
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 10
    lbl.TextColor3 = theme.text
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.TextTruncate = Enum.TextTruncate.AtEnd
    lbl.Parent = bg

    local valBtn = Instance.new("TextButton")
    valBtn.Size = UDim2.new(0.6, -14, 0, 20)
    valBtn.Position = UDim2.new(0.4, 6, 0.5, -10)
    valBtn.BackgroundColor3 = theme.accent
    valBtn.Text = default .. " +"
    valBtn.Font = Enum.Font.GothamBold
    valBtn.TextSize = 10
    valBtn.TextColor3 = theme.textWhite
    valBtn.BorderSizePixel = 0
    valBtn.TextTruncate = Enum.TextTruncate.AtEnd
    valBtn.Parent = bg
    mkCorner(valBtn, 6)

    local ITEM_H   = 28
    local SEARCH_H = 28   
    local MAX_SHOW = 5    

    local dropMenu = Instance.new("Frame")
    dropMenu.BackgroundColor3 = theme.textWhite
    dropMenu.BorderSizePixel  = 0
    dropMenu.Visible          = false
    dropMenu.ZIndex           = 200
    dropMenu.ClipsDescendants = true
    mkCorner(dropMenu, 8)

    -- ── Search bar────────────────────────────
    local searchBg = Instance.new("Frame")
    searchBg.Size             = UDim2.new(1, 0, 0, SEARCH_H)
    searchBg.Position         = UDim2.new(0, 0, 0, 0)
    searchBg.BackgroundColor3 = theme.accordionBg
    searchBg.BorderSizePixel  = 0
    searchBg.ZIndex           = 202
    searchBg.Parent           = dropMenu

    local searchDiv = Instance.new("Frame")
    searchDiv.Size             = UDim2.new(1, 0, 0, 1)
    searchDiv.Position         = UDim2.new(0, 0, 1, -1)
    searchDiv.BackgroundColor3 = theme.divider
    searchDiv.BorderSizePixel  = 0
    searchDiv.ZIndex           = 203
    searchDiv.Parent           = searchBg

    local searchBox = Instance.new("TextBox")
    searchBox.Size             = UDim2.new(1, -10, 0, 18)
    searchBox.Position         = UDim2.new(0, 5, 0.5, -9)
    searchBox.BackgroundColor3 = theme.contentBg
    searchBox.BorderSizePixel  = 0
    searchBox.PlaceholderText  = "Search..."
    searchBox.PlaceholderColor3 = theme.textLight
    searchBox.Text             = ""
    searchBox.Font             = Enum.Font.Gotham
    searchBox.TextSize         = 10
    searchBox.TextColor3       = theme.text
    searchBox.TextXAlignment   = Enum.TextXAlignment.Left
    searchBox.ClearTextOnFocus = false
    searchBox.ZIndex           = 203
    searchBox.Parent           = searchBg
    mkCorner(searchBox, 4)
    local sbPad = Instance.new("UIPadding", searchBox)
    sbPad.PaddingLeft = UDim.new(0, 6)

    -- ── ScrollingFrame di search ──────────────────────────
    local scroll = Instance.new("ScrollingFrame")
    scroll.Size                  = UDim2.new(1, 0, 1, -SEARCH_H)
    scroll.Position              = UDim2.new(0, 0, 0, SEARCH_H)
    scroll.BackgroundTransparency = 1
    scroll.BorderSizePixel        = 0
    scroll.ScrollBarThickness     = 4
    scroll.ScrollBarImageColor3   = theme.accent
    scroll.CanvasSize             = UDim2.new(0, 0, 0, 0)
    scroll.ZIndex                 = 201
    scroll.Parent                 = dropMenu

    local trackConn   = nil
    local inputConn   = nil    
    local searchQuery = {""}     
    local menuHRef    = {SEARCH_H} 

    -- ── Filter helper ────────────────────────────────────────────
    local function filterOpts(opts, q)
        if not q or q == "" then return opts end
        q = q:lower()
        local res = {}
        for _, opt in ipairs(opts) do
            if opt:lower():find(q, 1, true) then
                table.insert(res, opt)
            end
        end
        return res
    end

    --  closeMenu 
    local function closeMenu()
        if open[1] then
            if trackConn then trackConn:Disconnect(); trackConn = nil end
            if inputConn then inputConn:Disconnect(); inputConn = nil end 
            dropMenu.Visible = false
            dropMenu.Parent  = nil
            open[1]          = false
            searchBox.Text   = ""
            searchQuery[1]   = ""
            local cur = valBtn.Text:gsub("%s*%+$", ""):gsub("%s*%-$", "")
            valBtn.Text = cur .. " +"
        end
    end

    if closers then table.insert(closers, closeMenu) end

    -- ── rebuildMenu ─────────────
    local function rebuildMenu()
        for _, c in ipairs(scroll:GetChildren()) do c:Destroy() end
        local filtered = filterOpts(currentOpts, searchQuery[1])
        scroll.CanvasSize = UDim2.new(0, 0, 0, #filtered * ITEM_H)
        local vis = math.min(#filtered, MAX_SHOW)
        menuHRef[1] = SEARCH_H + vis * ITEM_H
        if dropMenu.Parent then
            dropMenu.Size = UDim2.new(0, dropMenu.Size.X.Offset, 0, menuHRef[1])
        end
        for i, opt in ipairs(filtered) do
            local ob = Instance.new("TextButton")
            ob.Size                   = UDim2.new(1, 0, 0, ITEM_H)
            ob.Position               = UDim2.new(0, 0, 0, (i - 1) * ITEM_H)
            ob.BackgroundTransparency = 1
            ob.Text                   = opt
            ob.Font                   = Enum.Font.Gotham
            ob.TextSize               = 12
            ob.TextColor3             = theme.text
            ob.ZIndex                 = 202
            ob.Parent                 = scroll
            makeHover(ob, theme.textWhite, Color3.fromRGB(235, 240, 255))
            ob.MouseButton1Click:Connect(function()
                closeMenu()
                valBtn.Text = opt .. " +"
                if callback then callback(opt) end
            end)
        end
    end

    searchBox:GetPropertyChangedSignal("Text"):Connect(function()
        searchQuery[1] = searchBox.Text
        rebuildMenu()
    end)

    rebuildMenu()

    -- ── openMenu ─────────────────────────────────────────────────
    local function openMenu()
        searchBox.Text  = ""
        searchQuery[1]  = ""
        rebuildMenu()

        local absPos  = valBtn.AbsolutePosition
        local framePos = mainFrame.AbsolutePosition
        local menuW   = valBtn.AbsoluteSize.X
        dropMenu.Size = UDim2.new(0, menuW, 0, menuHRef[1])
        dropMenu.Position = UDim2.new(
            0, absPos.X - framePos.X,
            0, absPos.Y - framePos.Y + valBtn.AbsoluteSize.Y + 4
        )
        dropMenu.Parent  = mainFrame
        dropMenu.Visible = true
        open[1]          = true
        local cur = valBtn.Text:gsub("%s*%+$", ""):gsub("%s*%-$", "")
        valBtn.Text = cur .. " -"

        trackConn = RunService.RenderStepped:Connect(function()
            if not open[1] then trackConn:Disconnect(); trackConn = nil; return end
            local ap = valBtn.AbsolutePosition
            local fp = mainFrame.AbsolutePosition
            local mW = valBtn.AbsoluteSize.X
            dropMenu.Size     = UDim2.new(0, mW, 0, menuHRef[1])
            dropMenu.Position = UDim2.new(
                0, ap.X - fp.X,
                0, ap.Y - fp.Y + valBtn.AbsoluteSize.Y + 4
            )
        end)

        inputConn = UserInputService.InputBegan:Connect(function(input)
            if not open[1] then return end
            if input.UserInputType ~= Enum.UserInputType.MouseButton1
            and input.UserInputType ~= Enum.UserInputType.Touch then return end
            local pos = input.Position
            local function isInside(gui)
                if not gui or not gui.Visible then return false end
                local ap = gui.AbsolutePosition
                local as = gui.AbsoluteSize
                return pos.X >= ap.X and pos.X <= ap.X + as.X
                   and pos.Y >= ap.Y and pos.Y <= ap.Y + as.Y
            end
            if not isInside(dropMenu) and not isInside(valBtn) then
                closeMenu()
            end
        end)
    end

    valBtn.MouseButton1Click:Connect(function()
        if open[1] then closeMenu() else openMenu() end
    end)

    local proxy = {}

    function proxy:SetOptions(newOpts, keepValue)
        closeMenu()
        currentOpts = newOpts
        rebuildMenu()
        if not keepValue then
            valBtn.Text = (newOpts[1] or "---") .. " +"
        end
    end

    function proxy:SetValue(text)
        valBtn.Text = text .. " +"
    end

    return bg, 28, proxy
end

local function _mkMultiDropdown(parent, mainFrame, label, options, defaults, yOff, callback, theme, closers, depth)
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    local open    = {false}
    local selected = {} 

    -- init defaults
    if defaults then
        for _, v in ipairs(defaults) do selected[v] = true end
    end

    local function countSelected()
        local n = 0
        for _ in pairs(selected) do n = n + 1 end
        return n
    end

    local function getLabel()
        local n = countSelected()
        if n == 0 then return "— none — " end
        if n == 1 then
            for k in pairs(selected) do return k .. " " end
        end
        return n .. " selected "
    end

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -(ML + MR), 0, 28)
    bg.Position = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel = 0
    bg.ClipsDescendants = false
    bg.Parent = parent
    mkCorner(bg, 8)

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(0.4, -14, 1, 0)
    lbl.Position = UDim2.new(0, 10, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = prefix .. label
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 10
    lbl.TextColor3 = theme.text
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.TextTruncate = Enum.TextTruncate.AtEnd
    lbl.Parent = bg

    local valBtn = Instance.new("TextButton")
    valBtn.Size = UDim2.new(0.6, -14, 0, 20)
    valBtn.Position = UDim2.new(0.4, 6, 0.5, -10)
    valBtn.BackgroundColor3 = theme.accent
    valBtn.Text = getLabel()
    valBtn.Font = Enum.Font.GothamBold
    valBtn.TextSize = 10
    valBtn.TextColor3 = theme.textWhite
    valBtn.BorderSizePixel = 0
    valBtn.TextTruncate = Enum.TextTruncate.AtEnd
    valBtn.Parent = bg
    mkCorner(valBtn, 6)

    local itemH    = 30
    local SEARCH_H = 28
    local MAX_SHOW = 5
    local menuHRef = {SEARCH_H}

    local dropMenu = Instance.new("Frame")
    dropMenu.BackgroundColor3 = theme.textWhite
    dropMenu.BorderSizePixel = 0
    dropMenu.Visible = false
    dropMenu.ZIndex = 200
    dropMenu.ClipsDescendants = true
    mkCorner(dropMenu, 8)

    -- ── Search bar ───────────────────────────────────────────────
    local searchBg = Instance.new("Frame")
    searchBg.Size             = UDim2.new(1, 0, 0, SEARCH_H)
    searchBg.Position         = UDim2.new(0, 0, 0, 0)
    searchBg.BackgroundColor3 = theme.accordionBg
    searchBg.BorderSizePixel  = 0
    searchBg.ZIndex           = 202
    searchBg.Parent           = dropMenu

    local searchDiv = Instance.new("Frame")
    searchDiv.Size             = UDim2.new(1, 0, 0, 1)
    searchDiv.Position         = UDim2.new(0, 0, 1, -1)
    searchDiv.BackgroundColor3 = theme.divider
    searchDiv.BorderSizePixel  = 0
    searchDiv.ZIndex           = 203
    searchDiv.Parent           = searchBg

    local searchBox = Instance.new("TextBox")
    searchBox.Size             = UDim2.new(1, -10, 0, 18)
    searchBox.Position         = UDim2.new(0, 5, 0.5, -9)
    searchBox.BackgroundColor3 = theme.contentBg
    searchBox.BorderSizePixel  = 0
    searchBox.PlaceholderText  = "search..."
    searchBox.PlaceholderColor3 = theme.textLight
    searchBox.Text             = ""
    searchBox.Font             = Enum.Font.Gotham
    searchBox.TextSize         = 10
    searchBox.TextColor3       = theme.text
    searchBox.TextXAlignment   = Enum.TextXAlignment.Left
    searchBox.ClearTextOnFocus = false
    searchBox.ZIndex           = 203
    searchBox.Parent           = searchBg
    mkCorner(searchBox, 4)
    local sbPad = Instance.new("UIPadding", searchBox)
    sbPad.PaddingLeft = UDim.new(0, 6)

    local scroll = Instance.new("ScrollingFrame")
    scroll.Size = UDim2.new(1, 0, 1, -SEARCH_H)
    scroll.Position = UDim2.new(0, 0, 0, SEARCH_H)
    scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
    scroll.BackgroundTransparency = 1
    scroll.BorderSizePixel = 0
    scroll.ScrollBarThickness = 3
    scroll.ScrollBarImageColor3 = theme.accent
    scroll.ZIndex = 201
    scroll.Parent = dropMenu

    local allOpts    = options  
    local searchQuery = {""}  
    local itemRows   = {}      

    -- ── Filter helper ────────────────────────────────────────────
    local function filterOpts(q)
        if not q or q == "" then return allOpts end
        q = q:lower()
        local res = {}
        for _, opt in ipairs(allOpts) do
            if opt:lower():find(q, 1, true) then
                table.insert(res, opt)
            end
        end
        return res
    end

    local function refreshRow(opt, row, check)
        local on = selected[opt] == true
        row.BackgroundTransparency = on and 0 or 1
        row.BackgroundColor3       = on and Color3.fromRGB(230, 242, 255) or theme.textWhite
        check.BackgroundColor3 = on and theme.accent or theme.contentBg
        check.Text             = on and "✓" or ""
        check.TextColor3       = on and theme.textWhite or theme.accordionTxt
    end

    -- ── buildRows ──────────────
    local function buildRows()
        for _, child in ipairs(scroll:GetChildren()) do child:Destroy() end
        itemRows = {}

        local filtered = filterOpts(searchQuery[1])

        -- Pilihan yang sudah dicentang muncul di atas
        table.sort(filtered, function(a, b)
            local sa = selected[a] == true
            local sb = selected[b] == true
            if sa ~= sb then return sa end
            return a < b
        end)

        local vis = math.min(#filtered, MAX_SHOW)
        menuHRef[1] = SEARCH_H + vis * itemH + 4
        scroll.CanvasSize = UDim2.new(0, 0, 0, #filtered * itemH)
        if dropMenu.Parent then
            dropMenu.Size = UDim2.new(0, dropMenu.Size.X.Offset, 0, menuHRef[1])
        end

        for i, opt in ipairs(filtered) do
            local isOn = selected[opt] == true
            local row = Instance.new("TextButton")
            row.Size = UDim2.new(1, 0, 0, itemH)
            row.Position = UDim2.new(0, 0, 0, (i - 1) * itemH)
            row.BackgroundColor3      = isOn and Color3.fromRGB(230, 242, 255) or theme.textWhite
            row.BackgroundTransparency = isOn and 0 or 1
            row.BorderSizePixel = 0
            row.Text = ""
            row.ZIndex = 202
            row.Parent = scroll

            row.MouseEnter:Connect(function()
                if not selected[opt] then
                    TweenService:Create(row, TweenInfo.new(0.1), {
                        BackgroundColor3 = Color3.fromRGB(245, 248, 255),
                        BackgroundTransparency = 0
                    }):Play()
                end
            end)
            row.MouseLeave:Connect(function()
                if not selected[opt] then
                    TweenService:Create(row, TweenInfo.new(0.1), {
                        BackgroundTransparency = 1
                    }):Play()
                end
            end)

            local check = Instance.new("TextLabel")
            check.Size = UDim2.new(0, 18, 0, 18)
            check.Position = UDim2.new(0, 7, 0.5, -9)
            check.BackgroundColor3 = isOn and theme.accent or theme.contentBg
            check.BorderSizePixel = 0
            check.Text             = isOn and "✓" or ""
            check.Font = Enum.Font.GothamBold
            check.TextSize = 11
            check.TextColor3       = isOn and theme.textWhite or theme.accordionTxt
            check.TextXAlignment = Enum.TextXAlignment.Center
            check.ZIndex = 203
            check.Parent = row
            mkCorner(check, 4)

            local optLbl = Instance.new("TextLabel")
            optLbl.Size = UDim2.new(1, -34, 1, 0)
            optLbl.Position = UDim2.new(0, 32, 0, 0)
            optLbl.BackgroundTransparency = 1
            optLbl.Text = opt
            optLbl.Font = Enum.Font.Gotham
            optLbl.TextSize = 12
            optLbl.TextColor3 = theme.text
            optLbl.TextXAlignment = Enum.TextXAlignment.Left
            optLbl.ZIndex = 203
            optLbl.Parent = row

            table.insert(itemRows, {opt = opt, row = row, check = check})

            row.MouseButton1Click:Connect(function()
                if selected[opt] then
                    selected[opt] = nil
                else
                    selected[opt] = true
                end
                for _, r in ipairs(itemRows) do
                    refreshRow(r.opt, r.row, r.check)
                end
                valBtn.Text = getLabel()
                if callback then
                    local result = {}
                    for k in pairs(selected) do table.insert(result, k) end
                    table.sort(result)
                    callback(result)
                end
            end)
        end

        valBtn.Text = getLabel()
    end

    searchBox:GetPropertyChangedSignal("Text"):Connect(function()
        searchQuery[1] = searchBox.Text
        buildRows()
    end)

    buildRows()

    local trackConnM = nil
    local inputConnM = nil

    local function closeMenu()
        if trackConnM then trackConnM:Disconnect(); trackConnM = nil end
        if inputConnM then inputConnM:Disconnect(); inputConnM = nil end
        dropMenu.Visible = false
        dropMenu.Parent = nil
        open[1] = false
        searchBox.Text  = ""
        searchQuery[1]  = ""
        buildRows()
    end

    if closers then table.insert(closers, closeMenu) end

    valBtn.MouseButton1Click:Connect(function()
        open[1] = not open[1]
        if open[1] then
            searchBox.Text  = ""
            searchQuery[1]  = ""
            buildRows()
            local absPos   = valBtn.AbsolutePosition
            local framePos = mainFrame.AbsolutePosition
            local menuW    = math.max(valBtn.AbsoluteSize.X, 150)
            dropMenu.Size  = UDim2.new(0, menuW, 0, menuHRef[1])
            dropMenu.Position = UDim2.new(0, absPos.X - framePos.X, 0,
                absPos.Y - framePos.Y + valBtn.AbsoluteSize.Y + 4)
            dropMenu.Parent = mainFrame
            dropMenu.Visible = true

            trackConnM = RunService.RenderStepped:Connect(function()
                if not open[1] then
                    trackConnM:Disconnect(); trackConnM = nil; return
                end
                local ap  = valBtn.AbsolutePosition
                local fp  = mainFrame.AbsolutePosition
                local mW  = math.max(valBtn.AbsoluteSize.X, 150)
                dropMenu.Size     = UDim2.new(0, mW, 0, menuHRef[1])
                dropMenu.Position = UDim2.new(
                    0, ap.X - fp.X,
                    0, ap.Y - fp.Y + valBtn.AbsoluteSize.Y + 4
                )
            end)

            -- Disconnect saat tutup
            inputConnM = UserInputService.InputBegan:Connect(function(input)
                if not open[1] then return end
                if input.UserInputType ~= Enum.UserInputType.MouseButton1
                and input.UserInputType ~= Enum.UserInputType.Touch then return end
                local pos = input.Position
                local function isInside(gui)
                    if not gui or not gui.Visible then return false end
                    local ap = gui.AbsolutePosition
                    local as = gui.AbsoluteSize
                    return pos.X >= ap.X and pos.X <= ap.X + as.X
                       and pos.Y >= ap.Y and pos.Y <= ap.Y + as.Y
                end
                if not isInside(dropMenu) and not isInside(valBtn) then
                    closeMenu()
                end
            end)
        else
            closeMenu()
        end
    end)

    -- Proxy: SetOptions rebuild semua row dengan opsi baru
    local proxy = {}
    function proxy:SetOptions(newOpts)
        allOpts = newOpts
        -- Bersihkan selected yang tidak ada di opsi baru
        local optSet = {}
        for _, v in ipairs(newOpts) do optSet[v] = true end
        for k in pairs(selected) do
            if not optSet[k] then selected[k] = nil end
        end
        buildRows()
        if open[1] and dropMenu.Visible then
            dropMenu.Size = UDim2.new(0, math.max(valBtn.AbsoluteSize.X, 150), 0, menuHRef[1])
        end
    end

    -- SetSelected → set pilihan aktif secara programatik
    function proxy:SetSelected(items)
        selected = {}
        for _, v in ipairs(items) do selected[v] = true end
        buildRows()
        valBtn.Text = getLabel()
    end

    function proxy:GetSelected()
        local result = {}
        for k in pairs(selected) do table.insert(result, k) end
        table.sort(result)
        return result
    end

    return bg, 28, proxy
end

-- ============================================================
-- TEXT INPUT
-- label di atas, kotak ketik di bawah
-- opts.placeholder, opts.maxLen, opts.clearOnSubmit
-- callback(text) dipanggil saat Enter / tombol 
-- ============================================================
local function _mkTextInput(parent, label, yOff, default, callback, theme, opts, depth)
    opts = opts or {}
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    local totalH = 58

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -(ML + MR), 0, totalH)
    bg.Position = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel = 0
    bg.Parent = parent
    mkCorner(bg, 8)

    -- Label atas
    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(1, -12, 0, 16)
    lbl.Position = UDim2.new(0, 8, 0, 6)
    lbl.BackgroundTransparency = 1
    lbl.Text = prefix .. label
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 10
    lbl.TextColor3 = theme.accordionTxt
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.Parent = bg

    -- Kotak input
    local inputBg = Instance.new("Frame")
    inputBg.Size = UDim2.new(1, -12, 0, 26)
    inputBg.Position = UDim2.new(0, 6, 0, 24)
    inputBg.BackgroundColor3 = theme.textWhite
    inputBg.BorderSizePixel = 0
    inputBg.Parent = bg
    mkCorner(inputBg, 6)

    -- Border accent saat fokus
    local border = Instance.new("UIStroke", inputBg)
    border.Color = theme.divider
    border.Thickness = 1

    local box = Instance.new("TextBox")
    box.Size = UDim2.new(1, -16, 1, 0)
    box.Position = UDim2.new(0, 8, 0, 0)
    box.BackgroundTransparency = 1
    box.Text = default or ""
    box.PlaceholderText = opts.placeholder or "ketik di sini..."
    box.PlaceholderColor3 = Color3.fromRGB(180, 185, 200)
    box.Font = Enum.Font.Gotham
    box.TextSize = 11
    box.TextColor3 = theme.text
    box.TextXAlignment = Enum.TextXAlignment.Left
    box.ClearTextOnFocus = false
    box.MaxVisibleGraphemes = opts.maxLen or math.huge
    box.Parent = inputBg

    box.Focused:Connect(function()
        TweenService:Create(border, TweenInfo.new(0.15), {Color = theme.accent}):Play()
    end)
    box.FocusLost:Connect(function()
        TweenService:Create(border, TweenInfo.new(0.15), {Color = theme.divider}):Play()
        if callback then
            callback(box.Text)
            if opts.clearOnSubmit then box.Text = "" end
        end
    end)

    -- Expose: caller bisa baca/set box.Text
    return bg, totalH, box
end

-- ============================================================
-- LIST / TABLE
-- Nampilin baris data yang bisa di-update dinamis
-- opts.height  → tinggi area list (default 120)
-- opts.columns → {"Col A", "Col B"} (optional, kalau nil = single column)
-- api yang di-return: :Add(row), :Remove(i), :Clear(), :SetRows(tbl)
-- row bisa string (single col) atau table of strings (multi col)
-- ============================================================
local function _mkList(parent, label, yOff, theme, opts)
    opts = opts or {}
    local listH   = opts.height  or 120
    local columns = opts.columns or nil   -- nil = single column
    local rowH    = 22
    local totalH  = listH + (label ~= "" and 20 or 0) + 8

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -16, 0, totalH)
    bg.Position = UDim2.new(0, 8, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel = 0
    bg.Parent = parent
    mkCorner(bg, 8)

    local labelY = 0
    if label and label ~= "" then
        local hdr = Instance.new("TextLabel")
        hdr.Size = UDim2.new(1, -12, 0, 16)
        hdr.Position = UDim2.new(0, 8, 0, 6)
        hdr.BackgroundTransparency = 1
        hdr.Text = label
        hdr.Font = Enum.Font.Gotham
        hdr.TextSize = 10
        hdr.TextColor3 = theme.accordionTxt
        hdr.TextXAlignment = Enum.TextXAlignment.Left
        hdr.Parent = bg
        labelY = 22
    end

    -- Header kolom (optional)
    local colY = labelY
    if columns then
        local hrow = Instance.new("Frame")
        hrow.Size = UDim2.new(1, -12, 0, 18)
        hrow.Position = UDim2.new(0, 6, 0, labelY)
        hrow.BackgroundColor3 = theme.accordionBg
        hrow.BorderSizePixel = 0
        hrow.Parent = bg
        mkCorner(hrow, 4)
        local colW = 1 / #columns
        for ci, cname in ipairs(columns) do
            local cl = Instance.new("TextLabel")
            cl.Size = UDim2.new(colW, 0, 1, 0)
            cl.Position = UDim2.new(colW * (ci - 1), 0, 0, 0)
            cl.BackgroundTransparency = 1
            cl.Text = cname
            cl.Font = Enum.Font.GothamBold
            cl.TextSize = 9
            cl.TextColor3 = theme.accordionTxt
            cl.TextXAlignment = Enum.TextXAlignment.Center
            cl.Parent = hrow
        end
        colY = labelY + 22
    end

    -- Scroll area
    local scroll = Instance.new("ScrollingFrame")
    scroll.Size = UDim2.new(1, -12, 0, listH - (colY - labelY))
    scroll.Position = UDim2.new(0, 6, 0, colY)
    scroll.BackgroundTransparency = 1
    scroll.BorderSizePixel = 0
    scroll.ScrollBarThickness = 3
    scroll.ScrollBarImageColor3 = theme.accent
    scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
    scroll.Parent = bg

    local rows = {}

    local function rebuildRows()
        for _, c in ipairs(scroll:GetChildren()) do c:Destroy() end
        for ri, row in ipairs(rows) do
            local even = ri % 2 == 0
            local rowFr = Instance.new("Frame")
            rowFr.Size = UDim2.new(1, 0, 0, rowH)
            rowFr.Position = UDim2.new(0, 0, 0, (ri - 1) * rowH)
            rowFr.BackgroundColor3 = even
                and Color3.fromRGB(240, 243, 252)
                or  theme.textWhite
            rowFr.BackgroundTransparency = even and 0 or 0.3
            rowFr.BorderSizePixel = 0
            rowFr.Parent = scroll

            if type(row) == "string" then
                -- Single column
                local tl = Instance.new("TextLabel")
                tl.Size = UDim2.new(1, -8, 1, 0)
                tl.Position = UDim2.new(0, 6, 0, 0)
                tl.BackgroundTransparency = 1
                tl.Text = row
                tl.Font = Enum.Font.Gotham
                tl.TextSize = 11
                tl.TextColor3 = theme.text
                tl.TextXAlignment = Enum.TextXAlignment.Left
                tl.TextTruncate = Enum.TextTruncate.AtEnd
                tl.Parent = rowFr
            else
                -- Multi column
                local colW = 1 / #row
                for ci, cell in ipairs(row) do
                    local tl = Instance.new("TextLabel")
                    tl.Size = UDim2.new(colW, 0, 1, 0)
                    tl.Position = UDim2.new(colW * (ci - 1), 0, 0, 0)
                    tl.BackgroundTransparency = 1
                    tl.Text = tostring(cell)
                    tl.Font = Enum.Font.Gotham
                    tl.TextSize = 11
                    tl.TextColor3 = theme.text
                    tl.TextXAlignment = Enum.TextXAlignment.Center
                    tl.TextTruncate = Enum.TextTruncate.AtEnd
                    tl.Parent = rowFr
                end
            end
        end
        scroll.CanvasSize = UDim2.new(0, 0, 0, #rows * rowH)
        -- Auto scroll ke bawah
        scroll.CanvasPosition = Vector2.new(0, math.max(0, #rows * rowH - scroll.AbsoluteSize.Y))
    end

    -- Public API
    local api = {}

    function api:Add(row)
        table.insert(rows, row)
        rebuildRows()
    end

    function api:Remove(i)
        table.remove(rows, i)
        rebuildRows()
    end

    function api:Clear()
        rows = {}
        rebuildRows()
    end

    function api:SetRows(tbl)
        rows = {}
        for _, r in ipairs(tbl) do table.insert(rows, r) end
        rebuildRows()
    end

    function api:Count()
        return #rows
    end

    return bg, totalH, api
end

-- ============================================================
-- PROGRESS BAR
-- opts.height    → tinggi bar (default 8)
-- opts.showText  → true/false, nampilin "42%" di tengah bar (default true)
-- api yang di-return: :Set(0-100), :Get()
-- ============================================================
local function _mkProgressBar(parent, label, yOff, initVal, theme, opts)
    opts = opts or {}
    local barH     = opts.barHeight or 10
    local showText = opts.showText ~= false
    local totalH   = barH + 24

    local val = {math.clamp(initVal or 0, 0, 100)}

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -16, 0, totalH)
    bg.Position = UDim2.new(0, 8, 0, yOff)
    bg.BackgroundTransparency = 1
    bg.BorderSizePixel = 0
    bg.Parent = parent

    -- Label + persen di baris atas
    local topRow = Instance.new("Frame")
    topRow.Size = UDim2.new(1, 0, 0, 14)
    topRow.BackgroundTransparency = 1
    topRow.Parent = bg

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(0.7, 0, 1, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = label
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 10
    lbl.TextColor3 = theme.accordionTxt
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.Parent = topRow

    local pctLbl = Instance.new("TextLabel")
    pctLbl.Size = UDim2.new(0.3, 0, 1, 0)
    pctLbl.Position = UDim2.new(0.7, 0, 0, 0)
    pctLbl.BackgroundTransparency = 1
    pctLbl.Text = val[1] .. "%"
    pctLbl.Font = Enum.Font.GothamBold
    pctLbl.TextSize = 10
    pctLbl.TextColor3 = theme.accent
    pctLbl.TextXAlignment = Enum.TextXAlignment.Right
    pctLbl.Parent = topRow

    -- Track (background bar)
    local track = Instance.new("Frame")
    track.Size = UDim2.new(1, 0, 0, barH)
    track.Position = UDim2.new(0, 0, 0, 16)
    track.BackgroundColor3 = theme.toggleOff
    track.BorderSizePixel = 0
    track.ClipsDescendants = true
    track.Parent = bg
    mkCorner(track, barH / 2)

    -- Fill (biru, animasi)
    local fill = Instance.new("Frame")
    fill.Size = UDim2.new(val[1] / 100, 0, 1, 0)
    fill.BackgroundColor3 = theme.accent
    fill.BorderSizePixel = 0
    fill.Parent = track
    mkCorner(fill, barH / 2)

    -- Public API
    local api = {}

    function api:Set(v)
        v = math.clamp(v, 0, 100)
        val[1] = v
        TweenService:Create(fill, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
            Size = UDim2.new(v / 100, 0, 1, 0)
        }):Play()
        pctLbl.Text = math.floor(v) .. "%"
        -- Warna bar: merah → kuning → hijau
        local r = v < 50 and 1 or (1 - (v - 50) / 50)
        local g = v > 50 and 1 or (v / 50)
        TweenService:Create(fill, TweenInfo.new(0.3), {
            BackgroundColor3 = Color3.new(r * 0.8, g * 0.8, 0.2)
        }):Play()
    end

    function api:Get()
        return val[1]
    end

    return bg, totalH, api
end

-- Number input (− | [ketik] | +)
-- Nilai di tengah bisa diklik untuk ketik manual, Enter/blur untuk konfirmasi
local function _mkNumberInput(parent, labelText, yOff, defaultVal, step, minVal, maxVal, callback, theme, depth)
    depth = depth or 0
    local ML     = 8 + depth * 10
    local MR     = 8
    local prefix = depth > 0 and " " or ""
    local cur = {defaultVal}

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -(ML + MR), 0, 28)
    bg.Position = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel = 0
    bg.Parent = parent
    mkCorner(bg, 8)

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(0.5, 0, 1, 0)
    lbl.Position = UDim2.new(0, 8, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = prefix .. labelText
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 10
    lbl.TextColor3 = theme.text
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.Parent = bg

    local minusBtn = Instance.new("TextButton")
    minusBtn.Size = UDim2.new(0, 18, 0, 18)
    minusBtn.Position = UDim2.new(1, -84, 0.5, -9)
    minusBtn.Text = "−"
    minusBtn.Font = Enum.Font.GothamBold
    minusBtn.TextSize = 12
    minusBtn.BackgroundColor3 = Color3.fromRGB(200, 210, 230)
    minusBtn.TextColor3 = theme.text
    minusBtn.BorderSizePixel = 0
    minusBtn.Parent = bg
    mkCorner(minusBtn, 4)

    -- Kotak nilai: TextBox supaya bisa diklik & ketik manual
    local valBox = Instance.new("TextBox")
    valBox.Size = UDim2.new(0, 36, 0, 18)
    valBox.Position = UDim2.new(1, -62, 0.5, -9)
    valBox.BackgroundColor3 = theme.textWhite
    valBox.BorderSizePixel = 0
    valBox.Text = tostring(defaultVal)
    valBox.Font = Enum.Font.GothamBold
    valBox.TextSize = 10
    valBox.TextColor3 = theme.accent
    valBox.TextXAlignment = Enum.TextXAlignment.Center
    valBox.ClearTextOnFocus = true
    valBox.Parent = bg
    mkCorner(valBox, 4)

    -- Border tipis, nyala biru saat fokus
    local border = Instance.new("UIStroke", valBox)
    border.Color = theme.divider
    border.Thickness = 1

    local plusBtn = Instance.new("TextButton")
    plusBtn.Size = UDim2.new(0, 18, 0, 18)
    plusBtn.Position = UDim2.new(1, -22, 0.5, -9)
    plusBtn.Text = "+"
    plusBtn.Font = Enum.Font.GothamBold
    plusBtn.TextSize = 12
    plusBtn.BackgroundColor3 = theme.accent
    plusBtn.TextColor3 = theme.textWhite
    plusBtn.BorderSizePixel = 0
    plusBtn.Parent = bg
    mkCorner(plusBtn, 5)

    local function update(v)
        v = math.clamp(math.floor(v / step + 0.5) * step, minVal, maxVal)
        v = math.floor(v * 100 + 0.5) / 100
        cur[1] = v
        valBox.Text = tostring(v)
        if callback then callback(v) end
    end

    -- Fokus → border biru, teks dipilih semua
    valBox.Focused:Connect(function()
        TweenService:Create(border, TweenInfo.new(0.15), {Color = theme.accent}):Play()
        valBox.CursorPosition = #valBox.Text + 1
        valBox.SelectionStart = 1
    end)

    -- Blur/Enter → parse dan clamp
    valBox.FocusLost:Connect(function()
        TweenService:Create(border, TweenInfo.new(0.15), {Color = theme.divider}):Play()
        local typed = tonumber(valBox.Text)
        if typed then
            update(typed)
        else
            -- Input bukan angka → kembalikan ke nilai sebelumnya
            valBox.Text = tostring(cur[1])
        end
    end)

    minusBtn.MouseButton1Click:Connect(function() update(cur[1] - step) end)
    plusBtn.MouseButton1Click:Connect(function()  update(cur[1] + step) end)

    return bg, 28
end

-- Segmented selector (pilihan mode: Normal | Mid | Brutal, dll)
local function _mkSegment(parent, label, options, default, yOff, callback, theme)
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -16, 0, 52)
    bg.Position = UDim2.new(0, 8, 0, yOff)
    bg.BackgroundTransparency = 1
    bg.BorderSizePixel = 0
    bg.Parent = parent

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(1, 0, 0, 14)
    lbl.Position = UDim2.new(0, 0, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = label
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 10
    lbl.TextColor3 = theme.accordionTxt
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.Parent = bg

    local strip = Instance.new("Frame")
    strip.Size = UDim2.new(1, 0, 0, 30)
    strip.Position = UDim2.new(0, 0, 0, 16)
    strip.BackgroundColor3 = theme.accordionBg
    strip.BorderSizePixel = 0
    strip.Parent = bg
    mkCorner(strip, 8)

    local selected = {default}
    local btns = {}

    local function refresh()
        for _, info in ipairs(btns) do
            info.b.BackgroundColor3 = (info.opt == selected[1]) and theme.toggleOn or theme.segmentOff
        end
    end

    for i, opt in ipairs(options) do
        local b = Instance.new("TextButton")
        b.Size = UDim2.new(1 / #options, i < #options and -2 or 0, 1, -6)
        b.Position = UDim2.new((i - 1) / #options, i == 1 and 3 or 1, 0, 3)
        b.BackgroundColor3 = (opt == default) and theme.toggleOn or theme.segmentOff
        b.Text = opt
        b.Font = Enum.Font.GothamBold
        b.TextSize = 10
        b.TextColor3 = theme.textWhite
        b.BorderSizePixel = 0
        b.Parent = strip
        mkCorner(b, 6)
        table.insert(btns, {b = b, opt = opt})
        b.MouseButton1Click:Connect(function()
            selected[1] = opt
            refresh()
            if callback then callback(opt) end
        end)
    end

    return bg, 52
end

-- ============================================================
-- SEPARATOR BERLABEL   Judul Section 
-- Garis horizontal dengan teks di tengah
-- ============================================================
local function _mkSeparator(parent, text, yOff, theme)
    text = tostring(text or "")   -- FIX: nil -> "" agar tidak error assign Text
    local h = 16
    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -16, 0, h)
    bg.Position = UDim2.new(0, 8, 0, yOff)
    bg.BackgroundTransparency = 1
    bg.BorderSizePixel = 0
    bg.Parent = parent

    -- Kalau tidak ada teks, garis full lebar
    if text == "" then
        local line = Instance.new("Frame")
        line.Size = UDim2.new(1, 0, 0, 1)
        line.Position = UDim2.new(0, 0, 0.5, 0)
        line.BackgroundColor3 = theme.divider
        line.BorderSizePixel = 0
        line.Parent = bg
        return bg, h
    end

    -- Garis kiri
    local lineL = Instance.new("Frame")
    lineL.Size = UDim2.new(0.5, -30, 0, 1)
    lineL.Position = UDim2.new(0, 0, 0.5, 0)
    lineL.BackgroundColor3 = theme.divider
    lineL.BorderSizePixel = 0
    lineL.Parent = bg

    -- Teks tengah
    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(0, 56, 1, 0)
    lbl.Position = UDim2.new(0.5, -28, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = text
    lbl.Font = Enum.Font.GothamBold
    lbl.TextSize = 9
    lbl.TextColor3 = theme.accordionTxt
    lbl.TextXAlignment = Enum.TextXAlignment.Center
    lbl.Parent = bg

    -- Garis kanan
    local lineR = Instance.new("Frame")
    lineR.Size = UDim2.new(0.5, -30, 0, 1)
    lineR.Position = UDim2.new(0.5, 30, 0.5, 0)
    lineR.BackgroundColor3 = theme.divider
    lineR.BorderSizePixel = 0
    lineR.Parent = bg

    return bg, h
end

-- ============================================================
-- BADGE / TAG
-- Label kecil berwarna inline, return instance (bisa update .Text)
-- opts.color → warna background badge (default accent)
-- opts.textColor → warna teks (default putih)
-- ============================================================
local function _mkBadge(parent, text, yOff, theme, opts)
    opts = opts or {}
    local col     = opts.color     or theme.accent
    local textCol = opts.textColor or theme.textWhite
    local h       = 20

    local badge = Instance.new("TextLabel")
    badge.Size = UDim2.new(0, 0, 0, h)   -- auto-size via AutomaticSize
    badge.AutomaticSize = Enum.AutomaticSize.X
    badge.Position = UDim2.new(0, 8, 0, yOff)
    badge.BackgroundColor3 = col
    badge.BorderSizePixel = 0
    badge.Text = "  " .. text .. "  "
    badge.Font = Enum.Font.GothamBold
    badge.TextSize = 9
    badge.TextColor3 = textCol
    badge.TextXAlignment = Enum.TextXAlignment.Center
    badge.Parent = parent
    mkCorner(badge, 4)

    return badge, h
end

-- ============================================================
-- TABLE STATIS (info grid 2 kolom)
-- headers = {"Kolom1","Kolom2"} atau nil (tanpa header)
-- rows    = { {"key1","val1"}, {"key2","val2"}, ... }
-- opts: colWidths={0.38,0.62}, rowHeight=22, note="teks kecil bawah"
-- ============================================================
local function _mkTable(parent, headers, rows, yOff, theme, opts, depth)
    opts      = opts  or {}
    depth     = depth or 0
    local ML  = 8 + depth * 10
    local MR  = 8
    local RH  = opts.rowHeight or 22
    local CW1 = (opts.colWidths and opts.colWidths[1]) or 0.38
    local CW2 = (opts.colWidths and opts.colWidths[2]) or (1 - CW1)

    local totalRows = #rows
    local hasHeader = headers ~= nil and #headers > 0
    local headerH   = hasHeader and RH or 0
    local noteH     = opts.note and 20 or 0
    local totalH    = headerH + totalRows * RH + noteH + 2

    -- Container
    local bg = Instance.new("Frame")
    bg.Size             = UDim2.new(1, -(ML + MR), 0, totalH)
    bg.Position         = UDim2.new(0, ML, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel  = 0
    bg.ClipsDescendants = true
    bg.Parent           = parent
    mkCorner(bg, 8)

    local stroke = Instance.new("UIStroke", bg)
    stroke.Color           = theme.divider
    stroke.Thickness        = 1
    stroke.ApplyStrokeMode  = Enum.ApplyStrokeMode.Border

    -- Header row
    if hasHeader then
        local hdrBg = Instance.new("Frame")
        hdrBg.Size             = UDim2.new(1, 0, 0, headerH)
        hdrBg.Position         = UDim2.new(0, 0, 0, 0)
        hdrBg.BackgroundColor3 = theme.accent
        hdrBg.BackgroundTransparency = 0.15
        hdrBg.BorderSizePixel  = 0
        hdrBg.Parent           = bg

        local function mkHdrCell(text, xScale, wScale)
            local l = Instance.new("TextLabel")
            l.Size             = UDim2.new(wScale, -8, 0, headerH)
            l.Position         = UDim2.new(xScale, 6, 0, 0)
            l.BackgroundTransparency = 1
            l.Text             = text
            l.Font             = Enum.Font.GothamBold
            l.TextSize         = 10
            l.TextColor3       = theme.textWhite
            l.TextXAlignment   = Enum.TextXAlignment.Left
            l.TextTruncate     = Enum.TextTruncate.AtEnd
            l.Parent           = bg
        end
        mkHdrCell(headers[1] or "", 0,    CW1)
        mkHdrCell(headers[2] or "", CW1,  CW2)

        -- Divider bawah header
        local div = Instance.new("Frame")
        div.Size             = UDim2.new(1, 0, 0, 1)
        div.Position         = UDim2.new(0, 0, 0, headerH - 1)
        div.BackgroundColor3 = theme.divider
        div.BorderSizePixel  = 0
        div.Parent           = bg
    end

    -- Data rows
    for i, row in ipairs(rows) do
        local ry   = headerH + (i - 1) * RH
        local even = (i % 2 == 0)

        local rb = Instance.new("Frame")
        rb.Size             = UDim2.new(1, 0, 0, RH)
        rb.Position         = UDim2.new(0, 0, 0, ry)
        rb.BackgroundColor3 = even and theme.accordionBg or theme.contentBg
        rb.BorderSizePixel  = 0
        rb.Parent           = bg

        -- Divider vertikal antara 2 kolom
        local vdiv = Instance.new("Frame")
        vdiv.Size             = UDim2.new(0, 1, 1, 0)
        vdiv.Position         = UDim2.new(CW1, 0, 0, 0)
        vdiv.BackgroundColor3 = theme.divider
        vdiv.BorderSizePixel  = 0
        vdiv.Parent           = rb

        -- Kolom 1 (key) — bold, accordionTxt
        local l1 = Instance.new("TextLabel")
        l1.Size             = UDim2.new(CW1, -8, 1, 0)
        l1.Position         = UDim2.new(0, 7, 0, 0)
        l1.BackgroundTransparency = 1
        l1.Text             = tostring(row[1] or "")
        l1.Font             = Enum.Font.GothamBold
        l1.TextSize         = 10
        l1.TextColor3       = theme.accordionTxt
        l1.TextXAlignment   = Enum.TextXAlignment.Left
        l1.TextTruncate     = Enum.TextTruncate.AtEnd
        l1.Parent           = rb

        -- Kolom 2 (value) — normal, text
        local l2 = Instance.new("TextLabel")
        l2.Size             = UDim2.new(CW2, -8, 1, 0)
        l2.Position         = UDim2.new(CW1, 7, 0, 0)
        l2.BackgroundTransparency = 1
        l2.Text             = tostring(row[2] or "")
        l2.Font             = Enum.Font.Gotham
        l2.TextSize         = 10
        l2.TextColor3       = theme.text
        l2.TextXAlignment   = Enum.TextXAlignment.Left
        l2.TextTruncate     = Enum.TextTruncate.AtEnd
        l2.Parent           = rb

        -- Divider horizontal bawah tiap row (kecuali terakhir)
        if i < totalRows then
            local hdiv = Instance.new("Frame")
            hdiv.Size             = UDim2.new(1, 0, 0, 1)
            hdiv.Position         = UDim2.new(0, 0, 1, -1)
            hdiv.BackgroundColor3 = theme.divider
            hdiv.BackgroundTransparency = 0.5
            hdiv.BorderSizePixel  = 0
            hdiv.Parent           = rb
        end
    end

    -- Note kecil di bawah tabel (optional)
    if opts.note then
        local noteLbl = Instance.new("TextLabel")
        noteLbl.Size             = UDim2.new(1, -16, 0, noteH)
        noteLbl.Position         = UDim2.new(0, 8, 0, totalH - noteH)
        noteLbl.BackgroundTransparency = 1
        noteLbl.Text             = "  " .. opts.note
        noteLbl.Font             = Enum.Font.Gotham
        noteLbl.TextSize         = 9
        noteLbl.TextColor3       = theme.accordionTxt
        noteLbl.TextXAlignment   = Enum.TextXAlignment.Left
        noteLbl.TextTruncate     = Enum.TextTruncate.AtEnd
        noteLbl.Parent           = bg
    end

    return bg, totalH
end

-- ============================================================
-- COPY BUTTON
-- Baris label + tombol kecil "Copy" di kanan
-- Klik → setclipboard(value), lalu tombol sementara jadi " Copied"
-- ============================================================
local function _mkCopyButton(parent, label, value, yOff, theme)
    local h = 30

    local bg = Instance.new("Frame")
    bg.Size = UDim2.new(1, -16, 0, h)
    bg.Position = UDim2.new(0, 8, 0, yOff)
    bg.BackgroundColor3 = theme.contentBg
    bg.BorderSizePixel = 0
    bg.Parent = parent
    mkCorner(bg, 8)

    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.new(1, -80, 1, 0)
    lbl.Position = UDim2.new(0, 10, 0, 0)
    lbl.BackgroundTransparency = 1
    lbl.Text = label
    lbl.Font = Enum.Font.Gotham
    lbl.TextSize = 11
    lbl.TextColor3 = theme.text
    lbl.TextXAlignment = Enum.TextXAlignment.Left
    lbl.TextTruncate = Enum.TextTruncate.AtEnd
    lbl.Parent = bg

    local copyBtn = Instance.new("TextButton")
    copyBtn.Size = UDim2.new(0, 58, 0, 20)
    copyBtn.Position = UDim2.new(1, -64, 0.5, -10)
    copyBtn.BackgroundColor3 = theme.accent
    copyBtn.Text = "Copy"
    copyBtn.Font = Enum.Font.GothamBold
    copyBtn.TextSize = 10
    copyBtn.TextColor3 = theme.textWhite
    copyBtn.BorderSizePixel = 0
    copyBtn.Parent = bg
    mkCorner(copyBtn, 5)
    makeHover(copyBtn, theme.accent, lighten(theme.accent))

    local copying = false
    copyBtn.MouseButton1Click:Connect(function()
        if copying then return end
        copying = true
        pcall(function() setclipboard(value) end)
        copyBtn.Text = " Copied"
        copyBtn.BackgroundColor3 = theme.toggleOn
        task.wait(1.5)
        copyBtn.Text = "Copy"
        copyBtn.BackgroundColor3 = theme.accent
        copying = false
    end)

    -- Expose: caller bisa update value kalau dinamis
    return bg, h, function(newVal) value = newVal end
end

-- ============================================================
-- CONFIRM DIALOG
-- Popup kecil di tengah mainFrame: "Judul" + pesan + Batal/Ya
-- onConfirm() dipanggil kalau user klik Ya
-- onCancel()  dipanggil kalau klik Batal / luar popup (optional)
-- ============================================================
local function _showConfirm(mainFrame, title, message, onConfirm, onCancel, theme)
    -- Overlay gelap
    local overlay = Instance.new("Frame")
    overlay.Size = UDim2.new(1, 0, 1, 0)
    overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    overlay.BackgroundTransparency = 0.5
    overlay.BorderSizePixel = 0
    overlay.ZIndex = 500
    overlay.Parent = mainFrame

    -- Kotak dialog
    local dialog = Instance.new("Frame")
    dialog.Size = UDim2.new(0, 200, 0, 110)
    dialog.AnchorPoint = Vector2.new(0.5, 0.5)
    dialog.Position = UDim2.new(0.5, 0, 0.5, 0)
    dialog.BackgroundColor3 = theme.textWhite
    dialog.BorderSizePixel = 0
    dialog.ZIndex = 501
    dialog.Parent = mainFrame
    mkCorner(dialog, 10)

    -- Shadow
    local ds = Instance.new("Frame")
    ds.Size = UDim2.new(1, 10, 1, 10)
    ds.Position = UDim2.new(0, -5, 0, -5)
    ds.BackgroundColor3 = theme.accent
    ds.BackgroundTransparency = 0.85
    ds.BorderSizePixel = 0
    ds.ZIndex = 500
    ds.Parent = dialog
    mkCorner(ds, 12)

    -- Animasi masuk (scale dari kecil)
    dialog.Size = UDim2.new(0, 0, 0, 0)
    TweenService:Create(dialog,
        TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {Size = UDim2.new(0, 200, 0, 110)}
    ):Play()

    -- Judul
    local titleLbl = Instance.new("TextLabel")
    titleLbl.Size = UDim2.new(1, -16, 0, 24)
    titleLbl.Position = UDim2.new(0, 8, 0, 8)
    titleLbl.BackgroundTransparency = 1
    titleLbl.Text = title
    titleLbl.Font = Enum.Font.GothamBold
    titleLbl.TextSize = 13
    titleLbl.TextColor3 = theme.text
    titleLbl.TextXAlignment = Enum.TextXAlignment.Center
    titleLbl.ZIndex = 502
    titleLbl.Parent = dialog

    -- Pesan
    local msgLbl = Instance.new("TextLabel")
    msgLbl.Size = UDim2.new(1, -16, 0, 30)
    msgLbl.Position = UDim2.new(0, 8, 0, 34)
    msgLbl.BackgroundTransparency = 1
    msgLbl.Text = message
    msgLbl.Font = Enum.Font.Gotham
    msgLbl.TextSize = 11
    msgLbl.TextColor3 = theme.accordionTxt
    msgLbl.TextXAlignment = Enum.TextXAlignment.Center
    msgLbl.TextWrapped = true
    msgLbl.ZIndex = 502
    msgLbl.Parent = dialog

    local function closeDialog()
        TweenService:Create(dialog,
            TweenInfo.new(0.15, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
            {Size = UDim2.new(0, 0, 0, 0)}
        ):Play()
        task.wait(0.16)
        pcall(function() overlay:Destroy() end)
        pcall(function() dialog:Destroy() end)
    end

    -- Tombol Batal
    local cancelBtn = Instance.new("TextButton")
    cancelBtn.Size = UDim2.new(0.5, -10, 0, 28)
    cancelBtn.Position = UDim2.new(0, 8, 1, -36)
    cancelBtn.BackgroundColor3 = Color3.fromRGB(210, 215, 225)
    cancelBtn.Text = "Batal"
    cancelBtn.Font = Enum.Font.GothamBold
    cancelBtn.TextSize = 11
    cancelBtn.TextColor3 = theme.text
    cancelBtn.BorderSizePixel = 0
    cancelBtn.ZIndex = 502
    cancelBtn.Parent = dialog
    mkCorner(cancelBtn, 7)
    makeHover(cancelBtn, Color3.fromRGB(210,215,225), Color3.fromRGB(190,195,210))

    -- Tombol Ya
    local confirmBtn = Instance.new("TextButton")
    confirmBtn.Size = UDim2.new(0.5, -10, 0, 28)
    confirmBtn.Position = UDim2.new(0.5, 2, 1, -36)
    confirmBtn.BackgroundColor3 = Color3.fromRGB(210, 50, 50)
    confirmBtn.Text = "Ya, lanjut"
    confirmBtn.Font = Enum.Font.GothamBold
    confirmBtn.TextSize = 11
    confirmBtn.TextColor3 = theme.textWhite
    confirmBtn.BorderSizePixel = 0
    confirmBtn.ZIndex = 502
    confirmBtn.Parent = dialog
    mkCorner(confirmBtn, 7)
    makeHover(confirmBtn, Color3.fromRGB(210,50,50), Color3.fromRGB(235,70,70))

    cancelBtn.MouseButton1Click:Connect(function()
        closeDialog()
        if onCancel then onCancel() end
    end)
    confirmBtn.MouseButton1Click:Connect(function()
        closeDialog()
        if onConfirm then onConfirm() end
    end)
    -- Klik overlay = batal
    overlay.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1 then
            closeDialog()
            if onCancel then onCancel() end
        end
    end)
end

-- ============================================================
-- SECTION OBJECT
-- Returned oleh Tab:Accordion() untuk build isi accordion
-- ============================================================
local Section = {}
Section.__index = Section

-- accordionStates sekarang optional — kalau nil, library auto-manage internal
-- closers: tabel shared dari Window._openMenuClosers — dipakai Dropdown untuk register closeMenu
function Section.new(container, mainFrame, theme, accordionStates, closers, propUp, depth)
    return setmetatable({
        _c      = container,
        _mf     = mainFrame,
        _t      = theme,
        _as     = accordionStates or {},
        _cl     = closers or {},
        _y      = 0,
        _propUp = propUp or nil,
        _depth  = depth or 0,   -- kedalaman accordion (0 = root, 1 = anak, dst)
    }, Section)
end

local DEFAULT_GAP = 6

function Section:Label(text, opts)
    opts = opts or {}
    local h = opts.height or 20
    _mkLabel(self._c, text, self._y, h, opts.size, opts.bold, opts.color, self._t, self._depth)
    self._y = self._y + h + (opts.gap or 4)
end

-- InfoLabel: label kiri + nilai kanan yang bisa di-update
-- Contoh:
--   local setter = sec:InfoLabel("Quest 1", "collect 0/5 sunflower")
--   setter("collect 3/5 sunflower")   ← update nilai kapan saja
-- opts: .color (warna nilai), .bold (bold label), .size, .gap, .valueBg
function Section:InfoLabel(label, initValue, opts)
    opts = opts or {}
    local _, h, setLabel, setValue = _mkInfoLabel(self._c, label, initValue, self._y, self._t, opts, self._depth)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
    return setLabel, setValue
end

function Section:Divider(opts)
    opts = opts or {}
    _mkDivider(self._c, self._y, self._t, self._depth)
    self._y = self._y + 1 + (opts.gap or 8)
end

-- Separator berlabel  Judul 
function Section:Separator(text, opts)
    opts = opts or {}
    _mkSeparator(self._c, text, self._y, self._t)
    self._y = self._y + 16 + (opts.gap or 6)
end

-- Badge / Tag kecil berwarna
-- opts.color, opts.textColor
function Section:Badge(text, opts)
    opts = opts or {}
    _mkBadge(self._c, text, self._y, self._t, opts)
    self._y = self._y + 20 + (opts.gap or 4)
end

-- Table statis 2 kolom
-- headers = {"Key","Value"} atau nil (tanpa header)
-- rows    = { {"baris1col1","baris1col2"}, ... }
-- opts: colWidths={0.38,0.62}, rowHeight=22, note="teks kecil bawah", gap
function Section:Table(headers, rows, opts)
    opts = opts or {}
    local _, h = _mkTable(self._c, headers, rows, self._y, self._t, opts, self._depth)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
end

-- Copy button — label + tombol Copy di kanan
-- return: setter fn → panggil setter("nilai baru") kalau value dinamis
function Section:CopyButton(label, value, opts)
    opts = opts or {}
    local _, _, setter = _mkCopyButton(self._c, label, value, self._y, self._t)
    self._y = self._y + 30 + (opts.gap or DEFAULT_GAP)
    return setter
end

-- opts.color, opts.height, opts.confirm, opts.loading
-- Kalau opts.loading ada → callback dipanggil dengan fn done()
--   contoh: tab:Button("Load", function(done) loadKata(); done() end, {loading="Loading..."})
function Section:Button(text, callback, opts)
    opts = opts or {}
    local h           = opts.height or 22
    local confirm     = opts.confirm
    local loadingText = opts.loading   -- teks saat proses, nil = tidak ada loading state
    local col         = opts.color or self._t.accent

    local b, _ = _mkBtn(self._c, text, self._y, h, col, self._t, opts, self._depth)

    if callback then
        b.MouseButton1Click:Connect(function()
            local function doAction()
                if loadingText then
                    -- Masuk loading state
                    b.Text = loadingText
                    b.BackgroundColor3 = self._t.accordionTxt
                    b.AutoButtonColor = false
                    local done = function()
                        b.Text = text
                        b.BackgroundColor3 = col
                        b.AutoButtonColor = true
                    end
                    task.spawn(function() callback(done) end)
                else
                    callback()
                end
            end

            if confirm then
                _showConfirm(
                    self._mf,
                    confirm.title   or "Konfirmasi",
                    confirm.message or "Lanjutkan aksi ini?",
                    doAction,
                    opts.onCancel,
                    self._t
                )
            else
                doAction()
            end
        end)
    end

    self._y = self._y + (opts.height or 22) + (opts.gap or DEFAULT_GAP)
    return b
end

function Section:HalfButtons(textA, textB, cbA, cbB, opts)
    opts = opts or {}
    local h = opts.height or 22
    local bA, bB = _mkHalfBtns(self._c, textA, textB, self._y, h,
        opts.colorA, opts.colorB, self._t)
    if cbA then bA.MouseButton1Click:Connect(cbA) end
    if cbB then bB.MouseButton1Click:Connect(cbB) end
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
    return bA, bB
end

function Section:Toggle(label, default, callback, opts)
    opts = opts or {}
    local _, h = _mkToggle(self._c, label, self._y, default, callback, self._t, opts, self._depth)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
end

function Section:Dropdown(label, options, default, callback, opts)
    opts = opts or {}
    local _, _, proxy = _mkDropdown(self._c, self._mf, label, options, default, self._y, callback, self._t, self._cl, self._depth)
    self._y = self._y + 28 + (opts.gap or DEFAULT_GAP)
    return proxy
end

-- Multi-select dropdown
-- defaults = {"Opt1", "Opt2"} (boleh nil / {})
-- callback(selectedTable) dipanggil tiap pilihan berubah
function Section:MultiDropdown(label, options, defaults, callback, opts)
    opts = opts or {}
    local _, _, proxy = _mkMultiDropdown(self._c, self._mf, label, options, defaults, self._y, callback, self._t, self._cl, self._depth)
    self._y = self._y + 28 + (opts.gap or DEFAULT_GAP)
    return proxy
end

function Section:NumberInput(label, default, step, minVal, maxVal, callback, opts)
    opts = opts or {}
    _mkNumberInput(self._c, label, self._y, default, step, minVal, maxVal, callback, self._t, self._depth)
    self._y = self._y + 28 + (opts.gap or DEFAULT_GAP)
end

-- TextInput
-- callback(text) dipanggil saat Enter atau tombol 
-- opts.placeholder, opts.clearOnSubmit, opts.maxLen
-- return: TextBox instance (bisa baca/set .Text)
function Section:TextInput(label, default, callback, opts)
    opts = opts or {}
    local _, h, box = _mkTextInput(self._c, label, self._y, default, callback, self._t, opts, self._depth)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
    return box
end

-- List / Table
-- opts.height, opts.columns
-- return: api { :Add(row), :Remove(i), :Clear(), :SetRows(tbl), :Count() }
function Section:List(label, opts)
    opts = opts or {}
    local _, h, api = _mkList(self._c, label, self._y, self._t, opts)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
    return api
end

-- Progress Bar
-- initVal = 0..100
-- opts.barHeight, opts.showText
-- return: api { :Set(0-100), :Get() }
function Section:ProgressBar(label, initVal, opts)
    opts = opts or {}
    local _, h, api = _mkProgressBar(self._c, label, self._y, initVal, self._t, opts)
    self._y = self._y + h + (opts.gap or DEFAULT_GAP)
    return api
end

function Section:Segment(label, options, default, callback, opts)
    opts = opts or {}
    _mkSegment(self._c, label, options, default, self._y, callback, self._t)
    self._y = self._y + 52 + (opts.gap or DEFAULT_GAP)
end

-- Accordion auto-managed:
-- stateKey sekarang OPSIONAL — kalau nil, library auto-generate key unik
-- Signature lama: Accordion(title, stateKey, builderFn, opts) → tetap kompatibel
-- Signature baru: Accordion(title, builderFn, opts) → stateKey auto
-- Nested level tak terbatas (lv.1 / lv.2 / lv.3 dst) via _propUp chain
function Section:Accordion(title, stateKeyOrFn, builderFnOrOpts, opts)
    -- Deteksi signature: kalau arg ke-2 adalah function → signature baru
    local stateKey, builderFn
    if type(stateKeyOrFn) == "function" then
        -- Signature baru: Accordion(title, builderFn, opts)
        stateKey  = "acc_" .. tostring(self._y) .. "_" .. title:gsub("%s","")
        builderFn = stateKeyOrFn
        opts      = builderFnOrOpts or {}
    else
        -- Signature lama: Accordion(title, stateKey, builderFn, opts)
        stateKey  = stateKeyOrFn or ("acc_" .. tostring(self._y) .. "_" .. title:gsub("%s",""))
        builderFn = builderFnOrOpts
        opts      = opts or {}
    end

    local theme           = self._t
    local accordionStates = self._as
    local open            = {accordionStates[stateKey] == true}
    local yOff            = self._y
    local parent          = self._c

    local depth    = self._depth or 0
    local HDR_ML   = 8 + depth * 10
    local HDR_MR   = 8
    local hdrPrefix = depth > 0 and " " or "  "

    -- Arrow: ▼ = terbuka, ▲ = tertutup
    local ARROW_OPEN   = " ▼"
    local ARROW_CLOSED = " ▲"

    --  Header — kiri naik per depth, kanan selalu 8px
    local hdr = Instance.new("TextButton")
    hdr.Name             = "AccordionHeader"
    hdr.Size             = UDim2.new(1, -(HDR_ML + HDR_MR), 0, 28)
    hdr.Position         = UDim2.new(0, HDR_ML, 0, yOff)
    hdr.BackgroundColor3 = theme.accordionBg
    hdr.BorderSizePixel  = 0
    hdr.Text             = hdrPrefix .. title .. (open[1] and ARROW_OPEN or ARROW_CLOSED)
    hdr.Font             = Enum.Font.GothamBold
    hdr.TextSize         = 10
    hdr.TextColor3       = theme.accordionTxt
    hdr.TextXAlignment   = Enum.TextXAlignment.Left
    hdr.ZIndex           = 2
    hdr.Parent           = parent
    mkCorner(hdr, 7)

    --  Body — mulai tepat di bawah header, lebar full body induk (X=0)
    --  Nested accordion di dalamnya akan indent +INDENT relatif dari sini
    local body = Instance.new("Frame")
    body.Size                 = UDim2.new(1, 0, 0, 0)
    body.Position             = UDim2.new(0, 0, 0, yOff + 32)
    body.BackgroundTransparency = 1
    body.BorderSizePixel      = 0
    body.ClipsDescendants     = true
    body.Visible              = open[1]
    body.Parent               = parent

    -- innerH sebagai mutable ref supaya propUpFn bisa update nilainya
    local innerH = {0}

    -- propUpFn: dipanggil oleh inner Section saat ada nested accordion toggle
    local selfRef = self
    local function propUpFn(delta)
        innerH[1] = innerH[1] + delta
        body.Size = UDim2.new(1, 0, 0, body.Size.Y.Offset + delta)
        if open[1] then
            local threshold = hdr.Position.Y.Offset + 28
            for _, child in ipairs(parent:GetChildren()) do
                if child ~= hdr and child ~= body then
                    if child.Position.Y.Offset > threshold then
                        child.Position = UDim2.new(
                            child.Position.X.Scale, child.Position.X.Offset,
                            0, child.Position.Y.Offset + delta
                        )
                    end
                end
            end
            if parent:IsA("ScrollingFrame") then
                parent.CanvasSize = UDim2.new(0, 0, 0, parent.CanvasSize.Y.Offset + delta)
            end
            -- Bubble up ke grandparent (dan seterusnya)
            if selfRef._propUp then selfRef._propUp(delta) end
        end
    end

    --  Build isi → ukur tinggi otomatis 
    -- depth tidak diteruskan: indent sudah relatif terhadap body masing-masing level
    local inner = Section.new(body, self._mf, theme, self._as, self._cl, propUpFn, (self._depth or 0) + 1)
    inner._accordionDepth = (opts._depth or 0) + 1
    if builderFn then builderFn(inner) end
    innerH[1] = inner._y + 8

    body.Size = UDim2.new(1, 0, 0, innerH[1])

    --  Toggle 
    hdr.MouseButton1Click:Connect(function()
        open[1] = not open[1]
        accordionStates[stateKey] = open[1]
        body.Visible = open[1]
        hdr.Text = hdrPrefix .. title .. (open[1] and ARROW_OPEN or ARROW_CLOSED)
        local shift = open[1] and innerH[1] or -innerH[1]
        local threshold = hdr.Position.Y.Offset + 28
        for _, child in ipairs(parent:GetChildren()) do
            if child ~= hdr and child ~= body then
                if child.Position.Y.Offset > threshold then
                    child.Position = UDim2.new(
                        child.Position.X.Scale, child.Position.X.Offset,
                        0, child.Position.Y.Offset + shift
                    )
                end
            end
        end
        -- Update canvas hanya kalau parent adalah ScrollingFrame (lv.1)
        -- Level lebih dalam adalah Frame biasa → update via _propUp chain
        if parent:IsA("ScrollingFrame") then
            parent.CanvasSize = UDim2.new(0, 0, 0, parent.CanvasSize.Y.Offset + shift)
        end
        -- Bubble shift ke parent accordion (lv.2 → lv.1, lv.3 → lv.2, dst)
        if self._propUp then self._propUp(shift) end
    end)

    -- ══ LOCKED ══
    -- opts.locked = true:
    --   • Header dapat 🔒, tetap bisa open/close
    --   • Nested AccordionHeader juga dapat 🔒, tetap bisa open/close
    --   • Tiap widget row dapat overlay TextButton hitam 97% yang absorb semua klik
    if opts.locked then

        -- 1. Set teks header + patch setiap kali teks berubah (saat open/close)
        hdr.Text = hdrPrefix .. title .. "  🔒"
        hdr:GetPropertyChangedSignal("Text"):Connect(function()
            local t = hdr.Text
            if not t:find("🔒") then
                hdr.Text = t:gsub("%s*[▼▲]%s*$", "") .. "  🔒"
            end
        end)

        -- 2. Patch semua nested AccordionHeader yang sudah ada + yang akan dibuat
        for _, desc in ipairs(body:GetDescendants()) do
            if desc:IsA("TextButton") and desc.Name == "AccordionHeader" then
                desc.Text = desc.Text:gsub("%s*[▼▲]%s*$", "") .. "  🔒"
                desc:GetPropertyChangedSignal("Text"):Connect(function()
                    local t = desc.Text
                    if not t:find("🔒") then
                        desc.Text = t:gsub("%s*[▼▲]%s*$", "") .. "  🔒"
                    end
                end)
            end
        end

        -- 3. Helper: overlay TextButton (Active=true → absorb semua klik) + ikon 🔒
        local function addLockOverlay(frame)
            local ov = Instance.new("TextButton")
            ov.Size                   = UDim2.new(1, 0, 1, 0)
            ov.Position               = UDim2.new(0, 0, 0, 0)
            ov.BackgroundColor3       = Color3.fromRGB(0, 0, 0)
            ov.BackgroundTransparency = 0.50
            ov.BorderSizePixel        = 0
            ov.Text                   = ""
            ov.Active                 = true
            ov.AutoButtonColor        = false
            ov.ZIndex                 = 60
            ov.Parent                 = frame
            mkCorner(ov, 4)
            -- Blok semua klik
            ov.MouseButton1Click:Connect(function() end)

            local ic = Instance.new("TextLabel")
            ic.Size = UDim2.new(0, 0, 1, 0)
            ic.Position = UDim2.new(1, -ic.AbsoluteSize.X - 8, 0, 0)
            ic.AutomaticSize = Enum.AutomaticSize.X
            ic.BackgroundTransparency = 1
            ic.Text                   ="🖤 Feature locked"
            ic.Font                   = Enum.Font.GothamBold
            ic.TextSize               = 13
            ic.TextColor3             = Color3.fromRGB(255, 255, 255)
            ic.TextXAlignment = Enum.TextXAlignment.Right
            ic.ZIndex                 = 61
            ic.Parent                 = ov
        end

        -- 4. Tambah overlay ke widget rows, rekursif ke nested accordion body
        local function overlayContainer(container)
            for _, child in ipairs(container:GetChildren()) do
                if child.Name == "AccordionHeader" then
                    -- skip: header tetap bisa diklik

                elseif child:IsA("Frame")
                    and child.BackgroundTransparency == 1
                    and child.ClipsDescendants == true then
                    -- Ini nested accordion body → rekursif ke dalamnya
                    overlayContainer(child)

                elseif child:IsA("Frame") or child:IsA("TextButton") then
                    addLockOverlay(child)
                end
            end
        end
        overlayContainer(body)
    end

    local addedH = 32 + (open[1] and innerH[1] or 0)
    self._y = yOff + addedH + (opts.gap or 4)
    return inner
end

-- Escape hatch: build custom UI langsung ke container
function Section:Custom(fn)
    fn(self._c, self._y, self._t)
end

function Section:_updateCanvas()
    self._c.CanvasSize = UDim2.new(0, 0, 0, self._y + 10)
end

-- ============================================================
-- WINDOW OBJECT
-- ============================================================
local Window = {}
Window.__index = Window

function LuluUI.new(cfg)
    local self = setmetatable({}, Window)
    cfg = cfg or {}

    -- Merge theme: default + override dari cfg.theme
    local theme = {}
    for k, v in pairs(LuluUI.Theme) do theme[k] = v end
    if cfg.theme then
        for k, v in pairs(cfg.theme) do theme[k] = v end
    end
    self._theme = theme
    -- accordionStates dikelola internal oleh library — user tidak perlu buat sendiri
    self._accordionStates = {}
    -- Registry closeMenu tiap Dropdown — dipanggil semua saat ganti tab
    self._openMenuClosers = {}

    -- GUI parent (prioritas: gethui() → CoreGui → PlayerGui)
    local guiParent = (gethui and gethui())
        or game:GetService("CoreGui")
        or Players.LocalPlayer:WaitForChild("PlayerGui")

    --  ScreenGui 
    local sg = Instance.new("ScreenGui")
    sg.Name = cfg.name or "LuluUI"
    sg.ResetOnSpawn = false
    sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    sg.Parent = guiParent
    self.screenGui = sg

    -- luluNotify
    self._luluNotifyQueue   = {}
    self._luluNotifyRunning = false

    --  Lotus Button 
    local lotusBtn = Instance.new("ImageButton")
    lotusBtn.Size = UDim2.new(0, 50, 0, 50)
    lotusBtn.Position = cfg.lotusPos or UDim2.new(0, 10, 0, 10)
    lotusBtn.Image = cfg.icon or "rbxassetid://89098667773873"
    lotusBtn.BackgroundTransparency = 1
    lotusBtn.BorderSizePixel = 0
    lotusBtn.Visible = false   -- disembunyikan sampai loading selesai
    lotusBtn.Parent = sg
    self.lotusBtn = lotusBtn

    --  Main Frame 
    local W = cfg.width  or 310
    local H = cfg.height or 288  -- +18px kompensasi header gabungan (54px vs 36px lama)
    local mainFrame = Instance.new("Frame")
    mainFrame.Size = UDim2.new(0, W, 0, H)
    mainFrame.Position = cfg.position or UDim2.new(0.5, -W / 2, 0.5, -H / 2)
    mainFrame.BackgroundColor3 = theme.windowBg
    mainFrame.BackgroundTransparency = 0.8
    mainFrame.BorderSizePixel = 0
    mainFrame.Active = true
    mainFrame.Visible = false
    mainFrame.Parent = sg
    mkCorner(mainFrame, 3)
    -- Batas (border) mainFrame — pengganti efek rounded corner lama
    local mainStroke = Instance.new("UIStroke", mainFrame)
    mainStroke.Color           = theme.accent
    mainStroke.Thickness        = 1.5
    mainStroke.Transparency     = 0.4
    mainStroke.ApplyStrokeMode  = Enum.ApplyStrokeMode.Border
    self.mainFrame = mainFrame

    --  Title Bar (header tunggal: title + subtitle + divider) 
    local HDR_H = 45
    local titleBar = Instance.new("Frame")
    titleBar.Size = UDim2.new(1, 0, 0, HDR_H)
    titleBar.BackgroundColor3 = theme.sidebar
    titleBar.BackgroundTransparency = 0.2
    titleBar.BorderSizePixel = 0
    titleBar.ZIndex = 2
    titleBar.Parent = mainFrame
    mkCorner(titleBar, 3)
    self.titleBar = titleBar

    -- Fix rounded bottom corners titlebar
    local titleFix = Instance.new("Frame")
    titleFix.Size = UDim2.new(1, 0, 0, 3)
    titleFix.Position = UDim2.new(0, 0, 1, -3)
    titleFix.BackgroundColor3 = theme.sidebar
    titleFix.BackgroundTransparency = 0.2
    titleFix.BorderSizePixel = 0
    titleFix.ZIndex = 1
    titleFix.Parent = titleBar

    -- Icon di titlebar (rata kiri, tengah vertikal bagian atas)
    local titleIcon = Instance.new("ImageLabel")
    titleIcon.Size = UDim2.new(0, 22, 0, 22)
    titleIcon.Position = UDim2.new(0, 12, 0, 9)
    titleIcon.BackgroundTransparency = 1
    titleIcon.Image = cfg.icon or "rbxassetid://89098667773873"
    titleIcon.ZIndex = 3
    titleIcon.Parent = titleBar

    -- Judul (baris atas)
    local titleLabel = Instance.new("TextLabel")
    titleLabel.Size = UDim2.new(1, -80, 0, 18)
    titleLabel.Position = UDim2.new(0, 42, 0, 7)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Text = cfg.title or "LuluUI"
    titleLabel.TextColor3 = theme.textWhite
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.TextSize = 13
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.ZIndex = 3
    titleLabel.Parent = titleBar
    self.titleLabel = titleLabel

    -- Subtitle (baris bawah judul, lebih kecil)
    local subtitleLabel = Instance.new("TextLabel")
    subtitleLabel.Size = UDim2.new(1, -80, 0, 13)
    subtitleLabel.Position = UDim2.new(0, 42, 0, 26)
    subtitleLabel.BackgroundTransparency = 1
    subtitleLabel.Text = cfg.subtitle or "LuluUI v1.3.1"
    subtitleLabel.TextColor3 = theme.textLight
    subtitleLabel.Font = Enum.Font.Gotham
    subtitleLabel.TextSize = 10
    subtitleLabel.TextXAlignment = Enum.TextXAlignment.Left
    subtitleLabel.ZIndex = 3
    subtitleLabel.Parent = titleBar
    self.subtitleLabel = subtitleLabel

    -- Garis pemisah di bawah header
    local hdrDivider = Instance.new("Frame")
    hdrDivider.Size = UDim2.new(1, 0, 0, 1)
    hdrDivider.Position = UDim2.new(0, 0, 1, -1)
    hdrDivider.BackgroundColor3 = theme.divider
    hdrDivider.BackgroundTransparency = 0.4
    hdrDivider.BorderSizePixel = 0
    hdrDivider.ZIndex = 3
    hdrDivider.Parent = titleBar

    -- Close button (tengah vertikal di header)
    local closeBtn = Instance.new("TextButton")
    closeBtn.Size = UDim2.new(0, 28, 0, 28)
    closeBtn.Position = UDim2.new(1, -34, 0, 13)
    closeBtn.Text = "×"
    closeBtn.Font = Enum.Font.GothamBold
    closeBtn.TextSize = 20
    closeBtn.BackgroundColor3 = theme.accentDark
    closeBtn.BackgroundTransparency = 0.1
    closeBtn.TextColor3 = theme.textWhite
    closeBtn.BorderSizePixel = 0
    closeBtn.ZIndex = 3
    closeBtn.Parent = titleBar
    mkCorner(closeBtn, 7)
    makeHover(closeBtn, theme.accentDark, theme.sidebar)

    --  Sidebar 
    local leftPanel = Instance.new("ScrollingFrame")
    leftPanel.Size                       = UDim2.new(0, 90, 1, -HDR_H)
    leftPanel.Position                   = UDim2.new(0, 0, 0, HDR_H)
    leftPanel.BackgroundColor3           = theme.sidebarBg
    leftPanel.BackgroundTransparency     = 0.2
    leftPanel.BorderSizePixel            = 0
    leftPanel.ScrollBarThickness         = 2
    leftPanel.ScrollBarImageColor3       = theme.accent
    leftPanel.ScrollBarImageTransparency = 0.4
    leftPanel.CanvasSize                 = UDim2.new(0, 0, 0, 0)
    leftPanel.ScrollingDirection         = Enum.ScrollingDirection.Y
    leftPanel.Parent                     = mainFrame
    -- Corner bawah-kiri supaya ngikut batas mainFrame
    mkCorner(leftPanel, 3)
    self.leftPanel = leftPanel

    --  Content Panel 
    local rightPanel = Instance.new("Frame")
    rightPanel.Size = UDim2.new(1, -90, 1, -HDR_H)
    rightPanel.Position = UDim2.new(0, 90, 0, HDR_H)
    rightPanel.BackgroundColor3 = theme.sidebarBg
    rightPanel.BackgroundTransparency = 0.2
    rightPanel.BorderSizePixel = 0
    rightPanel.ClipsDescendants = false
    rightPanel.Parent = mainFrame
    -- Corner bawah-kanan supaya ngikut batas mainFrame
    mkCorner(rightPanel, 3)
    self.rightPanel = rightPanel

    -- ScrollingFrame
    local container = Instance.new("ScrollingFrame")
    container.Size = UDim2.new(1, -12, 1, -12)
    container.Position = UDim2.new(0, 6, 0, 6)
    container.BackgroundTransparency = 1
    container.BorderSizePixel = 0
    container.ScrollBarThickness = 4
    container.ScrollBarImageColor3 = theme.accent
    container.CanvasSize = UDim2.new(0, 0, 0, 0)
    container.Parent = rightPanel
    self.container = container

    --  Resize Handle — sudut kanan bawah, ikon ↘ 
    local resizeHandle = Instance.new("Frame")
    resizeHandle.Size = UDim2.new(0, 18, 0, 18)
    resizeHandle.AnchorPoint = Vector2.new(1, 1)
    resizeHandle.Position = UDim2.new(1, -3, 1, -3)
    resizeHandle.BackgroundColor3 = theme.accent
    resizeHandle.BackgroundTransparency = 0.35
    resizeHandle.BorderSizePixel = 0
    resizeHandle.ZIndex = 10
    resizeHandle.Parent = mainFrame
    mkCorner(resizeHandle, 4)

    -- Ikon resize
    local resizeIcon = Instance.new("TextLabel")
    resizeIcon.Size = UDim2.new(1, 0, 1, 0)
    resizeIcon.BackgroundTransparency = 1
    resizeIcon.Text = "↘"
    resizeIcon.Font = Enum.Font.GothamBold
    resizeIcon.TextSize = 10
    resizeIcon.TextColor3 = theme.textWhite
    resizeIcon.TextXAlignment = Enum.TextXAlignment.Center
    resizeIcon.ZIndex = 11
    resizeIcon.Parent = resizeHandle

    -- Hover: lebih terang
    resizeHandle.MouseEnter:Connect(function()
        TweenService:Create(resizeHandle, TweenInfo.new(0.12), {
            BackgroundTransparency = 0
        }):Play()
    end)
    resizeHandle.MouseLeave:Connect(function()
        TweenService:Create(resizeHandle, TweenInfo.new(0.12), {
            BackgroundTransparency = 0.35
        }):Play()
    end)

    -- Tab state
    self._tabs      = {}
    self._tabBtns   = {}
    self._activeTab = nil
    self._tabY      = 8

    -- Setup drag & resize
    self:_setupDrag(mainFrame, titleBar)
    self:_setupDrag(lotusBtn, lotusBtn)
    self:_setupResize(resizeHandle, mainFrame, cfg)

    -- Close
    closeBtn.MouseButton1Click:Connect(function()
        TweenService:Create(mainFrame,
            TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.In),
            {Size = UDim2.new(0, 0, 0, 0)}
        ):Play()
        task.wait(0.31)
        sg:Destroy()
    end)

    -- Lotus toggle — simpan ukuran SAAT INI sebelum hide
    -- supaya kalau udah di-resize, restore ke ukuran yang benar
    lotusBtn.MouseButton1Click:Connect(function()
        if mainFrame.Visible then
            -- Simpan ukuran terkini sebelum hide
            self._savedSize = mainFrame.Size
            mainFrame.Visible = false
        else
            mainFrame.Visible = true
            local restoreSize = self._savedSize or mainFrame.Size
            mainFrame.Size = UDim2.new(0, 0, 0, 0)
            TweenService:Create(mainFrame,
                TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
                {Size = restoreSize}
            ):Play()
        end
        TweenService:Create(lotusBtn, TweenInfo.new(0.3),
            {Rotation = lotusBtn.Rotation + 180}
        ):Play()
    end)

    --  Loading Screen 
    -- Gaya Dex++: gradient sweep reveal, holder wipe, teks slide, close wipe
    task.spawn(function()
        local playerName = Players.LocalPlayer and Players.LocalPlayer.Name or "Player"
        local scriptName = cfg.title or "Script"

        -- Sembunyikan seluruh ScreenGui utama selama intro
        -- (cover mainFrame, lotusBtn, infopanel, spy panel, semua elemen)
        sg.Enabled = false

        --  ScreenGui terpisah khusus loading 
        local loadSg = Instance.new("ScreenGui")
        loadSg.Name        = "LuluUI_Loading"
        loadSg.ResetOnSpawn = false
        loadSg.IgnoreGuiInset = true
        loadSg.DisplayOrder = 9999
        loadSg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
        loadSg.Parent = guiParent

        --  Helper tweenNumber persis Dex++ 
        local tweenS = TweenService
        local function tweenNumber(n, ti, func)
            local tweenVal = Instance.new("IntValue")
            tweenVal.Value = 0
            tweenVal.Changed:Connect(func)
            local tween = tweenS:Create(tweenVal, ti, {Value = n})
            tween:Play()
            tween.Completed:Connect(function() tweenVal:Destroy() end)
            return tween
        end

        --  Main Frame (350x200, di tengah layar) 
        local main = Instance.new("Frame")
        main.Name                = "Main"
        main.Size                = UDim2.new(0, 350, 0, 200)
        main.Position            = UDim2.new(0.5, -175, 0.5, -100)
        main.BackgroundColor3    = Color3.fromRGB(28, 18, 50)  -- ungu gelap
        main.BorderSizePixel     = 0
        main.Active              = true
        main.ZIndex              = 901
        main.Parent              = loadSg

        -- backGradient di Main (sweep reveal dari tengah)
        local backGradient = Instance.new("UIGradient")
        backGradient.Rotation    = -30
        backGradient.Transparency = NumberSequence.new({
            NumberSequenceKeypoint.new(0, 1),
            NumberSequenceKeypoint.new(1, 1),
        })
        backGradient.Parent = main

        --  Outline ImageLabel (border efek) 
        local outlines = Instance.new("Frame")
        outlines.Name             = "Outlines"
        outlines.Size             = UDim2.new(1, 10, 1, 10)
        outlines.Position         = UDim2.new(0, -5, 0, -5)
        outlines.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        outlines.BackgroundTransparency = 1
        outlines.BorderSizePixel  = 0
        outlines.ZIndex           = 900
        outlines.Parent           = main
        mkCorner(outlines, 6)

        local outlinesGradient = Instance.new("UIGradient")
        outlinesGradient.Rotation    = -30
        outlinesGradient.Transparency = NumberSequence.new({
            NumberSequenceKeypoint.new(0, 1),
            NumberSequenceKeypoint.new(1, 1),
        })
        outlinesGradient.Parent = outlines

        -- UIStroke sebagai border
        local stroke = Instance.new("UIStroke")
        stroke.Color       = Color3.fromRGB(100, 60, 200)
        stroke.Thickness   = 1.5
        stroke.Transparency = 1
        stroke.Parent       = outlines

        --  Holder (ClipsDescendants = true) 
        local holder = Instance.new("Frame")
        holder.Name              = "Holder"
        holder.Size              = UDim2.new(1, 0, 1, 0)
        holder.BackgroundColor3  = Color3.fromRGB(22, 14, 40)  -- ungu lebih gelap
        holder.BorderSizePixel   = 0
        holder.ClipsDescendants  = true   -- ← batas clip konten
        holder.ZIndex            = 902
        holder.Parent            = main
        mkCorner(main, 8)
        mkCorner(holder, 8)

        -- holderGradient (wipe kiri→kanan untuk reveal & close)
        local holderGradient = Instance.new("UIGradient")
        holderGradient.Transparency = NumberSequence.new({
            NumberSequenceKeypoint.new(0, 1),
            NumberSequenceKeypoint.new(1, 1),
        })
        holderGradient.Parent = holder

        --  Title: "Loading Script" 
        local titleText = Instance.new("TextLabel")
        titleText.Name               = "Title"
        titleText.Size               = UDim2.new(0, 160, 0, 50)
        titleText.Position           = UDim2.new(0, -190, 0, 15)  -- offscreen kiri
        titleText.BackgroundTransparency = 1
        titleText.Text               = "Loading Script"
        titleText.Font               = Enum.Font.GothamBold
        titleText.TextSize           = 26
        titleText.TextColor3         = Color3.fromRGB(255, 255, 255)
        titleText.TextTransparency   = 1
        titleText.TextXAlignment     = Enum.TextXAlignment.Left
        titleText.ZIndex             = 903
        titleText.Parent             = holder

        --  Desc: "Beautiful UI by Lulu_Attack" 
        local descText = Instance.new("TextLabel")
        descText.Name                = "Desc"
        descText.Size                = UDim2.new(0, 220, 0, 25)
        descText.Position            = UDim2.new(0, -230, 0, 62)  -- offscreen kiri
        descText.BackgroundTransparency = 1
        descText.Text                = "Beautiful UI v1.3.3 [StarDevVersion]"
        descText.Font                = Enum.Font.Gotham
        descText.TextSize            = 14
        descText.TextColor3          = Color3.fromRGB(220, 220, 220)
        descText.TextTransparency    = 1
        descText.TextXAlignment      = Enum.TextXAlignment.Left
        descText.ZIndex              = 903
        descText.Parent              = holder

        --  Status Text 
        local statusText = Instance.new("TextLabel")
        statusText.Name              = "StatusText"
        statusText.Size              = UDim2.new(0, 200, 0, 25)
        statusText.Position          = UDim2.new(0, 20, 0, 110)
        statusText.BackgroundTransparency = 1
        statusText.Text              = "Loading..."
        statusText.Font              = Enum.Font.Gotham
        statusText.TextSize          = 13
        statusText.TextColor3        = Color3.fromRGB(200, 200, 200)
        statusText.TextTransparency  = 1
        statusText.TextXAlignment    = Enum.TextXAlignment.Left
        statusText.ZIndex            = 903
        statusText.Parent            = holder

        --  Progress Bar 
        local progressBar = Instance.new("Frame")
        progressBar.Name             = "ProgressBar"
        progressBar.Size             = UDim2.new(0, 0, 0, 4)
        progressBar.Position         = UDim2.new(0, 110, 0, 148)
        progressBar.BackgroundColor3 = Color3.fromRGB(52, 52, 52)
        progressBar.BorderSizePixel  = 0
        progressBar.ZIndex           = 903
        progressBar.Parent           = holder
        mkCorner(progressBar, 2)

        local bar = Instance.new("Frame")
        bar.Name             = "Bar"
        bar.Size             = UDim2.new(0, 0, 1, 0)
        bar.BackgroundColor3 = Color3.fromRGB(120, 60, 220)
        bar.BorderSizePixel  = 0
        bar.ZIndex           = 904
        bar.Parent           = progressBar
        mkCorner(bar, 2)

        local barGrad = Instance.new("UIGradient")
        barGrad.Color = ColorSequence.new({
            ColorSequenceKeypoint.new(0, Color3.fromRGB(100, 40, 200)),
            ColorSequenceKeypoint.new(1, Color3.fromRGB(190, 130, 255)),
        })
        barGrad.Parent = bar

        --  Creator (kanan bawah) — satu-satunya teks kanan 
        local creatorText = Instance.new("TextLabel")
        creatorText.Name             = "Creator"
        creatorText.Size             = UDim2.new(0, 105, 0, 20)
        creatorText.Position         = UDim2.new(1, -110, 1, -20)
        creatorText.BackgroundTransparency = 1
        creatorText.Text             = "by Lulu_Attack"
        creatorText.Font             = Enum.Font.Gotham
        creatorText.TextSize         = 12
        creatorText.TextColor3       = Color3.fromRGB(255, 255, 255)
        creatorText.TextXAlignment   = Enum.TextXAlignment.Right
        creatorText.ZIndex           = 903
        creatorText.Parent           = main

        local creatorGradient = Instance.new("UIGradient")
        creatorGradient.Transparency = NumberSequence.new({
            NumberSequenceKeypoint.new(0, 1),
            NumberSequenceKeypoint.new(1, 1),
        })
        creatorGradient.Parent = creatorText

        --  safeFinish 
        local function safeFinish()
            pcall(function()
                task.wait(0.1)
                loadSg:Destroy()
            end)
            -- Nyalakan kembali seluruh ScreenGui utama
            sg.Enabled       = true
            mainFrame.Visible = true
            lotusBtn.Visible  = true
            lotusBtn.Rotation = -180
            TweenService:Create(lotusBtn,
                TweenInfo.new(0.8, Enum.EasingStyle.Elastic),
                {Rotation = 0}
            ):Play()
        end

        local ok, err = pcall(function()

        local ti         = TweenInfo.new(0.4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
        local progressTI = TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

        --  FASE 1: backGradient + outlinesGradient sweep reveal 
        -- Persis Dex++: sweep dari tengah keluar (val/200)
        tweenNumber(100, ti, function(val)
            val = val / 200
            local s  = NumberSequenceKeypoint.new(0, 0)
            local a1 = NumberSequenceKeypoint.new(val, 0)
            local a2 = NumberSequenceKeypoint.new(math.min(0.5, val + math.min(0.05, val)), 1)
            if a1.Time == a2.Time then a2 = a1 end
            local b2 = NumberSequenceKeypoint.new(math.max(0.5, 1 - val - math.min(0.05, val)), 1)
            local b1 = NumberSequenceKeypoint.new(1 - val, 0)
            if b1.Time == b2.Time then b2 = b1 end
            local g  = NumberSequenceKeypoint.new(1, 0)
            backGradient.Transparency    = NumberSequence.new({s, a1, a2, b2, b1, g})
            outlinesGradient.Transparency = NumberSequence.new({s, a1, a2, b2, b1, g})
            stroke.Transparency = 1 - val * 2
        end)
        task.wait(0.4)

        --  FASE 2: holderGradient wipe kiri→kanan 
        -- + title slide in + desc slide in + rightText fade in
        tweenNumber(100, ti, function(val)
            val = val / 166.66
            local s  = NumberSequenceKeypoint.new(0, 0)
            local a1 = NumberSequenceKeypoint.new(val, 0)
            local a2 = NumberSequenceKeypoint.new(math.min(1, val + 0.01), 1)
            local g  = NumberSequenceKeypoint.new(1, 1)
            holderGradient.Transparency = NumberSequence.new({s, a1, a2, g})
        end)

        -- Title slide dari x=-190 ke x=20 + fade in
        tweenS:Create(titleText, ti, {
            Position = UDim2.new(0, 20, 0, 15),
            TextTransparency = 0,
        }):Play()

        -- Desc slide dari x=-230 ke x=20 + fade in
        tweenS:Create(descText, ti, {
            Position = UDim2.new(0, 20, 0, 62),
            TextTransparency = 0,
        }):Play()

        -- Version & Creator fade in dari kanan (rightTextTransparency)
        local function rightTextTransparency(obj)
            tweenNumber(100, ti, function(val)
                val = val / 100
                local a1 = NumberSequenceKeypoint.new(1 - val, 0)
                local a2 = NumberSequenceKeypoint.new(math.max(0, 1 - val - 0.01), 1)
                if a1.Time == a2.Time then a2 = a1 end
                local s  = NumberSequenceKeypoint.new(0, a1 == a2 and 0 or 1)
                local g  = NumberSequenceKeypoint.new(1, 0)
                obj.Transparency = NumberSequence.new({s, a2, a1, g})
            end)
        end
        rightTextTransparency(creatorGradient)

        task.wait(0.9)

        --  FASE 3: Status + ProgressBar muncul 
        tweenS:Create(statusText, progressTI, {
            Position = UDim2.new(0, 20, 0, 120),
            TextTransparency = 0,
        }):Play()
        tweenS:Create(progressBar, progressTI, {
            Position = UDim2.new(0, 20, 0, 148),
            Size     = UDim2.new(0, 310, 0, 4),
        }):Play()
        task.wait(0.3)

        --  FASE 4: Progress bar jalan 
        -- Status cukup "Loading..." sampai selesai → "Done"
        statusText.Text = "Loading..."
        local tw100 = tweenS:Create(bar, TweenInfo.new(1.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
            {Size = UDim2.new(1, 0, 1, 0)}
        )
        tw100:Play()
        tw100.Completed:Wait()
        statusText.Text = "Done"
        task.wait(0.4)

        --  FASE 5: Ganti semua teks → Welcome / Name / Script 
        tweenS:Create(titleText,  progressTI, {TextTransparency = 1}):Play()
        tweenS:Create(descText,   progressTI, {TextTransparency = 1}):Play()
        tweenS:Create(statusText, progressTI, {TextTransparency = 1}):Play()
        tweenS:Create(progressBar,progressTI, {BackgroundTransparency = 1}):Play()
        tweenS:Create(bar,        progressTI, {BackgroundTransparency = 1}):Play()
        task.wait(0.3)

        -- Welcome
        titleText.Text         = "Welcome"
        titleText.TextColor3   = Color3.fromRGB(80, 215, 115)
        tweenS:Create(titleText, progressTI, {TextTransparency = 0}):Play()
        task.wait(0.15)

        descText.Text          = playerName
        descText.TextColor3    = Color3.fromRGB(255, 255, 255)
        tweenS:Create(descText, progressTI, {TextTransparency = 0}):Play()
        task.wait(0.15)

        statusText.Text        = "Script : " .. scriptName
        statusText.TextColor3  = Color3.fromRGB(195, 140, 255)
        tweenS:Create(statusText, progressTI, {TextTransparency = 0}):Play()
        task.wait(1.0)

        --  FASE 6: close() persis Dex++ 
        tweenS:Create(titleText,   progressTI, {TextTransparency = 1}):Play()
        tweenS:Create(descText,    progressTI, {TextTransparency = 1}):Play()
        tweenS:Create(creatorText, progressTI, {TextTransparency = 1}):Play()
        tweenS:Create(statusText,  progressTI, {TextTransparency = 1}):Play()

        -- holderGradient wipe dari tengah ke kanan (Back easing)
        tweenNumber(100, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.In), function(val)
            val = val / 250
            local s  = NumberSequenceKeypoint.new(0, 0)
            local a1 = NumberSequenceKeypoint.new(0.6 + val, 0)
            local a2 = NumberSequenceKeypoint.new(math.min(1, 0.601 + val), 1)
            if a1.Time == a2.Time then a2 = a1 end
            local g  = NumberSequenceKeypoint.new(1, a1 == a2 and 0 or 1)
            holderGradient.Transparency = NumberSequence.new({s, a1, a2, g})
        end)
        task.wait(0.5)

        -- Background main hilang, outline sweep keluar
        main.BackgroundTransparency = 1
        outlinesGradient.Rotation = 30

        tweenNumber(100, ti, function(val)
            val = val / 100
            local s  = NumberSequenceKeypoint.new(0, 1)
            local a1 = NumberSequenceKeypoint.new(val, 1)
            local a2 = NumberSequenceKeypoint.new(math.min(1, val + math.min(0.05, val)), 0)
            if a1.Time == a2.Time then a2 = a1 end
            local g  = NumberSequenceKeypoint.new(1, a1 == a2 and 1 or 0)
            outlinesGradient.Transparency = NumberSequence.new({s, a1, a2, g})
            holderGradient.Transparency   = NumberSequence.new({s, a1, a2, g})
        end)
        task.wait(0.45)

        end) -- tutup pcall

        if not ok then warn("[LuluUI] Loading error:", err) end
        safeFinish()
    end)

    return self
end

-- ============================================================
-- DRAG & RESIZE
-- ============================================================
function Window:_setupDrag(frame, handle)
    local dragging, dragStart, startPos
    handle.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1
        or inp.UserInputType == Enum.UserInputType.Touch then
            dragging  = true
            dragStart = inp.Position
            startPos  = frame.Position
            inp.Changed:Connect(function()
                if inp.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)
    UserInputService.InputChanged:Connect(function(inp)
        if dragging
        and (inp.UserInputType == Enum.UserInputType.MouseMovement
          or inp.UserInputType == Enum.UserInputType.Touch) then
            local d = inp.Position - dragStart
            frame.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + d.X,
                startPos.Y.Scale, startPos.Y.Offset + d.Y
            )
        end
    end)
end

function Window:_setupResize(handle, frame, cfg)
    local resizing, initSz, resSt
    handle.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1
        or inp.UserInputType == Enum.UserInputType.Touch then
            resizing = true
            initSz   = frame.Size
            resSt    = inp.Position
            inp.Changed:Connect(function()
                if inp.UserInputState == Enum.UserInputState.End then
                    resizing = false
                end
            end)
        end
    end)
    UserInputService.InputChanged:Connect(function(inp)
        if resizing
        and (inp.UserInputType == Enum.UserInputType.MouseMovement
          or inp.UserInputType == Enum.UserInputType.Touch) then
            local d = inp.Position - resSt
            frame.Size = UDim2.new(
                0, math.clamp(initSz.X.Offset + d.X, cfg.minW or 260, cfg.maxW or 600),
                0, math.clamp(initSz.Y.Offset + d.Y, cfg.minH or 238, cfg.maxH or 500) -- minH +18px (header 54px vs 36px)
            )
        end
    end)
end

-- Expose drag untuk frame external (spy panel, info overlay, dll)
function Window:Draggable(frame, handle)
    self:_setupDrag(frame, handle or frame)
end

-- ============================================================
-- TAB SYSTEM  (persistent frame per tab — tidak rebuild saat switch)
-- ============================================================
function Window:Tab(name)
    local theme  = self._theme
    local yOff   = self._tabY

    --  Sidebar button 
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(1, -10, 0, 30)
    btn.Position = UDim2.new(0, 5, 0, yOff)
    btn.BackgroundColor3 = theme.sidebarBg
    btn.BackgroundTransparency = 1
    btn.Text = name
    btn.Font = Enum.Font.GothamBold
    btn.TextSize = 10
    btn.TextColor3 = theme.textLight
    btn.BorderSizePixel = 0
    btn.Parent = self.leftPanel
    mkCorner(btn, 7)
    makeHover(btn, theme.sidebarBg, Color3.fromRGB(180, 130, 200))

    self._tabY = yOff + 36
    self.leftPanel.CanvasSize = UDim2.new(0, 0, 0, self._tabY + 8)

    --  Frame persisten khusus tab ini 
    local frame = Instance.new("ScrollingFrame")
    frame.Size = UDim2.new(1, -12, 1, -12)
    frame.Position = UDim2.new(0, 6, 0, 6)
    frame.BackgroundTransparency = 1
    frame.BorderSizePixel = 0
    frame.ScrollBarThickness = 4
    frame.ScrollBarImageColor3 = theme.accent
    frame.CanvasSize = UDim2.new(0, 0, 0, 0)
    frame.Visible = false   -- hidden sampai diaktifkan
    frame.Parent = self.rightPanel

    --  Section langsung aktif, widget dibangun sekali 
    local sec = Section.new(frame, self.mainFrame, theme, self._accordionStates, self._openMenuClosers)
    sec._y = 8   -- top padding supaya widget pertama tidak nempel di ujung atas

    --  Tab data 
    local tab = {name = name, btn = btn, frame = frame, sec = sec}
    table.insert(self._tabs, tab)
    table.insert(self._tabBtns, btn)

    btn.MouseButton1Click:Connect(function()
        self:_setActive(tab)
    end)

    -- Aktifkan tab pertama otomatis
    if #self._tabs == 1 then
        self:_setActive(tab)
    end

    --  Tab API langsung delegasi ke Section 
    -- Widget dibangun langsung, tidak di-defer → state persistent
    local api = {}

    function api:Label(text, opts)         sec:Label(text, opts)               end
    function api:Divider(opts)             sec:Divider(opts)                   end
    function api:Separator(text, opts)     sec:Separator(text, opts)           end
    function api:Badge(text, opts)         sec:Badge(text, opts)               end
    function api:Table(headers, rows, opts) sec:Table(headers, rows, opts)     end
    function api:Button(text, cb, opts)    sec:Button(text, cb, opts)          end
    function api:HalfButtons(tA,tB,cA,cB,opts) sec:HalfButtons(tA,tB,cA,cB,opts) end
    function api:Toggle(lbl,def,cb,opts)   sec:Toggle(lbl,def,cb,opts)         end
    function api:Segment(lbl,opts_,def,cb,opts) sec:Segment(lbl,opts_,def,cb,opts) end
    function api:Dropdown(lbl,opts_,def,cb,opts) return sec:Dropdown(lbl,opts_,def,cb,opts) end
    function api:MultiDropdown(lbl,opts_,defs,cb,opts) sec:MultiDropdown(lbl,opts_,defs,cb,opts) end
    function api:NumberInput(lbl,def,step,mn,mx,cb,opts) sec:NumberInput(lbl,def,step,mn,mx,cb,opts) end
    function api:Accordion(title,skOrFn,bFnOrOpts,opts) sec:Accordion(title,skOrFn,bFnOrOpts,opts) end
    function api:Custom(fn)                sec:Custom(fn)                      end

    -- Widget dengan return value: return langsung (tidak perlu proxy)
    function api:TextInput(lbl,def,cb,opts)
        local box = sec:TextInput(lbl,def,cb,opts)
        sec:_updateCanvas()
        return box
    end
    function api:List(lbl,opts)
        local api_ = sec:List(lbl,opts)
        sec:_updateCanvas()
        return api_
    end
    function api:ProgressBar(lbl,initVal,opts)
        local api_ = sec:ProgressBar(lbl,initVal,opts)
        sec:_updateCanvas()
        return api_
    end
    function api:CopyButton(lbl,val,opts)
        local setter = sec:CopyButton(lbl,val,opts)
        sec:_updateCanvas()
        return setter
    end

    -- Update canvas setelah setiap call (auto)
    local _orig_meta = getmetatable(api)
    local _wrap = {}
    setmetatable(api, {
        __index = function(t, k)
            local fn = _wrap[k]
            if fn then return fn end
            -- fallback
            return rawget(t, k)
        end
    })

    -- Karena widget langsung dibangun, update canvas setelah tiap call
    -- Paksa via override sederhana pada api
    local _autoUpdate = function(origFn)
        return function(self_, ...)
            origFn(self_, ...)
            sec:_updateCanvas()
        end
    end
    for k, fn in pairs(api) do
        if type(fn) == "function" then
            local orig = fn
            api[k] = function(s, ...)
                orig(s, ...)
                sec:_updateCanvas()
            end
        end
    end

    -- Tapi widget yang return value tidak boleh di-wrap ulang
    -- Reregister yang return value:
    function api:TextInput(lbl,def,cb,opts)
        local box = sec:TextInput(lbl,def,cb,opts)
        sec:_updateCanvas()
        return box
    end
    function api:List(lbl,opts)
        local a = sec:List(lbl,opts)
        sec:_updateCanvas()
        return a
    end
    function api:ProgressBar(lbl,initVal,opts)
        local a = sec:ProgressBar(lbl,initVal,opts)
        sec:_updateCanvas()
        return a
    end
    function api:CopyButton(lbl,val,opts)
        local s = sec:CopyButton(lbl,val,opts)
        sec:_updateCanvas()
        return s
    end
    function api:Accordion(title,sk,bFn,opts)
        local inner = sec:Accordion(title,sk,bFn,opts)
        sec:_updateCanvas()
        return inner
    end

    -- Dropdown return proxy — harus di-register ulang setelah loop _autoUpdate
    -- supaya return value tidak hilang ditelan wrapper
    function api:Dropdown(lbl,opts_,def,cb,opts)
        local proxy = sec:Dropdown(lbl,opts_,def,cb,opts)
        sec:_updateCanvas()
        return proxy
    end

    return api
end

function Window:_setActive(tab)
    -- Tutup semua dropdown yang sedang terbuka
    for _, closer in ipairs(self._openMenuClosers) do
        closer()
    end
    local theme = self._theme
    -- Update button styles
    for _, b in ipairs(self._tabBtns) do
        b.BackgroundColor3 = theme.sidebarBg
        b.BackgroundTransparency = 1
        b.TextColor3 = theme.textLight
    end
    tab.btn.BackgroundColor3 = Color3.fromRGB(200, 180, 220)
    tab.btn.BackgroundTransparency = 0.3
    tab.btn.TextColor3 = Color3.fromRGB(40, 200, 80)
    -- Hide semua frame, show yang aktif
    for _, t in ipairs(self._tabs) do
        t.frame.Visible = (t == tab)
    end
    self._activeTab = tab
end

-- _rebuild tidak dipakai lagi tapi tetap ada buat kompatibilitas
function Window:_rebuild() end

-- ============================================================
-- luluNotify NOTIFICATION
-- ============================================================
-- Tipe shorthand (backward compatible, Color3 tetap jalan):
--   "success"  → hijau
--   "error"    → merah
--   "warning"  → kuning
--   "info"     → biru (default theme accent)
--   Color3     → warna custom langsung
function Window:luluNotify(msg, colorOrType)
    local theme = self._theme
    local color
    if type(colorOrType) == "string" then
        if     colorOrType == "success" then color = Color3.fromRGB(40,  180, 80)
        elseif colorOrType == "error"   then color = Color3.fromRGB(200, 50,  50)
        elseif colorOrType == "warning" then color = Color3.fromRGB(210, 150, 0)
        elseif colorOrType == "info"    then color = theme.accent
        else                                 color = theme.luluNotify
        end
    else
        color = colorOrType or theme.luluNotify
    end
    table.insert(self._luluNotifyQueue, {msg = msg, color = color})
    if self._luluNotifyRunning then return end
    self._luluNotifyRunning = true
    task.spawn(function()
        while #self._luluNotifyQueue > 0 do
            local item = table.remove(self._luluNotifyQueue, 1)

            local luluNotify = Instance.new("Frame")
            luluNotify.Size = UDim2.new(0, 220, 0, 36)
            luluNotify.Position = UDim2.new(1, -10, 1, 10)
            luluNotify.AnchorPoint = Vector2.new(1, 1)
            luluNotify.BackgroundColor3 = item.color
            luluNotify.BackgroundTransparency = 0.1
            luluNotify.BorderSizePixel = 0
            luluNotify.ZIndex = 999
            luluNotify.ClipsDescendants = true
            luluNotify.Parent = self.screenGui
            mkCorner(luluNotify, 8)

            local lbl = Instance.new("TextLabel")
            lbl.Size = UDim2.new(1, -16, 1, 0)
            lbl.Position = UDim2.new(0, 8, 0, 0)
            lbl.BackgroundTransparency = 1
            lbl.Text = item.msg
            lbl.Font = Enum.Font.GothamBold
            lbl.TextSize = 11
            lbl.TextColor3 = Color3.fromRGB(255, 255, 255)
            lbl.TextXAlignment = Enum.TextXAlignment.Left
            lbl.TextTruncate = Enum.TextTruncate.AtEnd
            lbl.ZIndex = 1000
            lbl.Parent = luluNotify

            TweenService:Create(luluNotify,
                TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
                {Position = UDim2.new(1, -10, 1, -10)}
            ):Play()
            task.wait(2.8)
            TweenService:Create(luluNotify,
                TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
                {Position = UDim2.new(1, -10, 1, 10)}
            ):Play()
            task.wait(0.22)
            pcall(function() luluNotify:Destroy() end)
            task.wait(0.1)
        end
        self._luluNotifyRunning = false
    end)
end

-- ============================================================
-- INFO PANEL (overlay kanan atas, optional)
-- Perf row FPS/CPU/PING otomatis dibikin & di-update.
-- User cukup panggil :Line(text) untuk baris data di bawahnya.
-- cfg: width(180), position, bg, visible
--
-- FIX v1.3.1:
--   - Bug 1: panel tidak lagi terus tumbuh saat grp:Clear()+rebuild
--             (pakai UIListLayout, items di-layout otomatis)
--   - Bug 2: tidak ada ruang kosong saat hanya pakai perf row
--             (panel hanya setinggi konten yang VISIBLE)
--   - Bug 3: teks QuestLine nilai sekarang rata kiri, bukan kanan
-- ============================================================
function Window:InfoPanel(cfg)
    cfg = cfg or {}

    local PERF_H  = 30
    local PAD_TOP = 6
    local LINE_H  = 18
    local PAD_BOT = 6
    local MAX_H   = cfg.maxHeight or 260

    local scrollTop = PAD_TOP + PERF_H + 4
    local initH     = PAD_TOP + PERF_H + PAD_BOT
    local panelW    = cfg.width or 180

    -- ── Panel utama ───────────────────────────────────────────
    local panel = Instance.new("Frame")
    panel.Size                   = UDim2.new(0, panelW, 0, initH)
    panel.Position               = cfg.position or UDim2.new(1, -(panelW + 10), 0, 10)
    panel.BackgroundColor3       = cfg.bg or Color3.fromRGB(15, 20, 35)
    panel.BackgroundTransparency = 0.2
    panel.BorderSizePixel        = 0
    panel.ClipsDescendants       = true
    panel.Visible                = cfg.visible ~= false
    panel.Parent                 = self.screenGui
    mkCorner(panel, 10)
    self:_setupDrag(panel, panel)

    -- ── Perf row ──────────────────────────────────────────────
    local perfRow = Instance.new("Frame")
    perfRow.Size             = UDim2.new(1, -8, 0, PERF_H)
    perfRow.Position         = UDim2.new(0, 4, 0, PAD_TOP)
    perfRow.BackgroundColor3 = Color3.fromRGB(25, 32, 55)
    perfRow.BorderSizePixel  = 0
    perfRow.Parent           = panel
    mkCorner(perfRow, 6)

    local function mkPerfCell(xScale, label)
        local cell = Instance.new("Frame")
        cell.Size                 = UDim2.new(1/3, 0, 1, 0)
        cell.Position             = UDim2.new(xScale, 0, 0, 0)
        cell.BackgroundTransparency = 1
        cell.Parent               = perfRow

        local hdr = Instance.new("TextLabel")
        hdr.Size                  = UDim2.new(1, 0, 0, 11)
        hdr.Position              = UDim2.new(0, 0, 0, 2)
        hdr.BackgroundTransparency = 1
        hdr.Text                  = label
        hdr.Font                  = Enum.Font.Gotham
        hdr.TextSize              = 8
        hdr.TextColor3            = Color3.fromRGB(120, 140, 180)
        hdr.TextXAlignment        = Enum.TextXAlignment.Center
        hdr.Parent                = cell

        local val = Instance.new("TextLabel")
        val.Size                  = UDim2.new(1, 0, 0, 13)
        val.Position              = UDim2.new(0, 0, 0, 13)
        val.BackgroundTransparency = 1
        val.Text                  = "—"
        val.Font                  = Enum.Font.GothamBold
        val.TextSize              = 11
        val.TextColor3            = Color3.fromRGB(255, 255, 255)
        val.TextXAlignment        = Enum.TextXAlignment.Center
        val.Parent                = cell
        return val
    end

    local function mkPerfDiv(xScale)
        local d = Instance.new("Frame")
        d.Size             = UDim2.new(0, 1, 0.65, 0)
        d.Position         = UDim2.new(xScale, 0, 0.175, 0)
        d.BackgroundColor3 = Color3.fromRGB(60, 75, 110)
        d.BorderSizePixel  = 0
        d.Parent           = perfRow
    end

    local lbl_FPS  = mkPerfCell(0,   "FPS")
    local lbl_CPU  = mkPerfCell(1/3, "CPU")
    local lbl_Ping = mkPerfCell(2/3, "PING")
    mkPerfDiv(1/3)
    mkPerfDiv(2/3)

    -- Auto-update perf stats
    local _fpsCount = 0
    local _lastDt   = 0
    local _rsConn = RunService.RenderStepped:Connect(function(dt)
        _fpsCount = _fpsCount + 1
        _lastDt   = dt
    end)
    panel.AncestryChanged:Connect(function()
        if not panel.Parent then _rsConn:Disconnect() end
    end)
    task.spawn(function()
        while panel and panel.Parent do
            task.wait(0.5)
            if panel.Visible then
                lbl_FPS.Text  = tostring(_fpsCount * 2)
                _fpsCount     = 0
                lbl_CPU.Text  = tostring(math.floor(_lastDt * 1000)) .. "ms"
                local pingMs  = 0
                pcall(function()
                    pingMs = math.floor(game:GetService("Players").LocalPlayer:GetNetworkPing() * 1000)
                end)
                lbl_Ping.Text = tostring(pingMs)
            end
        end
    end)

    -- ── ScrollingFrame + UIListLayout ─────────────────────────
    -- UIListLayout menangani posisi otomatis → tidak ada api._y
    -- Saat item di-Hide (Visible=false + Size.Y=0), layout auto-shrink
    -- Saat grp:Clear(), item dihapus → layout auto-update
    local scrollArea = Instance.new("ScrollingFrame")
    scrollArea.Size                   = UDim2.new(1, -6, 1, -scrollTop)
    scrollArea.Position               = UDim2.new(0, 3, 0, scrollTop)
    scrollArea.BackgroundTransparency = 1
    scrollArea.BorderSizePixel        = 0
    scrollArea.ScrollBarThickness     = 3
    scrollArea.ScrollBarImageColor3   = Color3.fromRGB(80, 120, 200)
    scrollArea.AutomaticCanvasSize = Enum.AutomaticSize.Y
    scrollArea.CanvasSize             = UDim2.new(0, 0, 0, 0)
    scrollArea.ClipsDescendants       = true
    scrollArea.Parent                 = panel

    local listLayout = Instance.new("UIListLayout", scrollArea)
    listLayout.Padding             = UDim.new(0, 2)
    listLayout.SortOrder           = Enum.SortOrder.LayoutOrder
    listLayout.FillDirection       = Enum.FillDirection.Vertical
    listLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left

    local scrollPad = Instance.new("UIPadding", scrollArea)
    scrollPad.PaddingTop    = UDim.new(0, 4)
    scrollPad.PaddingBottom = UDim.new(0, 4)
    scrollPad.PaddingLeft   = UDim.new(0, 4)
    scrollPad.PaddingRight  = UDim.new(0, 4)

    -- LayoutOrder counter (monoton naik, tidak perlu di-reset)
    local _order = 0
    local function nextOrder()
        _order = _order + 1
        return _order
    end

    -- Update tinggi panel sesuai konten yang visible
    -- Dipanggil otomatis saat AbsoluteContentSize berubah
    local function _updatePanelH()
        task.defer(function()
            local contentH = listLayout.AbsoluteContentSize.Y
            if contentH <= 2 then
                -- Tidak ada konten visible → kembali ke initH (hanya perf row)
                panel.Size = UDim2.new(0, panelW, 0, initH)
            else
                local totalH = scrollTop + contentH + 8
                panel.Size = UDim2.new(0, panelW, 0, math.min(totalH, MAX_H))
            end
        end)
    end
    listLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(_updatePanelH)

    -- ── API ───────────────────────────────────────────────────
    local api = {frame = panel}

    -- :Line(text) → baris info biasa, return TextLabel
    function api:Line(text)
        local l = Instance.new("TextLabel")
        l.Size                   = UDim2.new(1, 0, 0, LINE_H)
        l.BackgroundTransparency = 1
        l.Text                   = text
        l.Font                   = Enum.Font.GothamBold
        l.TextSize               = 10
        l.TextColor3             = Color3.fromRGB(200, 220, 255)
        l.TextXAlignment         = Enum.TextXAlignment.Left
        l.TextTruncate           = Enum.TextTruncate.AtEnd
        l.LayoutOrder            = nextOrder()
        l.Parent                 = scrollArea
        return l
    end

    -- :Group() → grup baris yang bisa di-Show/Hide/Clear sekaligus
    -- Saat Hide: item di-collapse (Visible=false + Size.Y=0) → panel auto-shrink
    -- Saat Clear: item di-destroy → panel auto-shrink tanpa _y ghost space
    function api:Group()
        local grp    = {}
        local members = {}   -- { inst=GuiObject, origH=number }

        local function addMember(inst, h)
            table.insert(members, {inst = inst, origH = h})
        end

        -- Header: teks accent tebal
        function grp:Header(text)
            local h = Instance.new("TextLabel")
            h.Size                   = UDim2.new(1, 0, 0, LINE_H)
            h.BackgroundTransparency = 1
            h.Text                   = text
            h.Font                   = Enum.Font.GothamBold
            h.TextSize               = 10
            h.TextColor3             = Color3.fromRGB(80, 200, 255)
            h.TextXAlignment        = Enum.TextXAlignment.Center
            h.LayoutOrder            = nextOrder()
            h.Parent                 = scrollArea
            addMember(h, LINE_H)
            return h
        end

        -- Line: teks biasa
        function grp:Line(text)
            local l = Instance.new("TextLabel")
            l.Size                   = UDim2.new(1, 0, 0, LINE_H)
            l.BackgroundTransparency = 1
            l.Text                   = text
            l.Font                   = Enum.Font.Gotham
            l.TextSize               = 10
            l.TextColor3             = Color3.fromRGB(200, 220, 255)
            l.TextXAlignment         = Enum.TextXAlignment.Left
            l.LayoutOrder            = nextOrder()
            l.Parent                 = scrollArea
            addMember(l, LINE_H)
            return l
        end

        -- QuestLine: label kiri + nilai kiri-sejajar (FIX Bug 3: was Right)
        -- return setter: function(newVal, newColor?)
        function grp:QuestLine(label, initVal)
            local row = Instance.new("Frame")
            row.Size                   = UDim2.new(1, 0, 0, LINE_H)
            row.BackgroundTransparency = 1
            row.BorderSizePixel        = 0
            row.LayoutOrder            = nextOrder()
            row.Parent                 = scrollArea
            addMember(row, LINE_H)

            local lbl = Instance.new("TextLabel")
            lbl.Size                   = UDim2.new(0.38, 0, 1, 0)
            lbl.BackgroundTransparency = 1
            lbl.Text                   = tostring(label)
            lbl.Font                   = Enum.Font.Gotham
            lbl.TextSize               = 9
            lbl.TextColor3             = Color3.fromRGB(160, 180, 210)
            lbl.TextXAlignment         = Enum.TextXAlignment.Left
            lbl.TextTruncate           = Enum.TextTruncate.AtEnd
            lbl.Parent                 = row

            local val = Instance.new("TextLabel")
            val.Size                   = UDim2.new(0.62, 0, 1, 0)
            val.Position               = UDim2.new(0.38, 0, 0, 0)
            val.BackgroundTransparency = 1
            val.Text                   = tostring(initVal or "—")
            val.Font                   = Enum.Font.GothamBold
            val.TextSize               = 9
            val.TextColor3             = Color3.fromRGB(80, 200, 255)
            val.TextXAlignment         = Enum.TextXAlignment.Left   -- FIX Bug 3
            val.TextTruncate           = Enum.TextTruncate.AtEnd
            val.Parent                 = row

            return function(newVal, newColor)
                val.Text = tostring(newVal or "—")
                if newColor then val.TextColor3 = newColor end
            end
        end

        -- Show: restore Visible + ukuran asli
        function grp:Show()
            for _, m in ipairs(members) do
                m.inst.Visible = true
                local s = m.inst.Size
                m.inst.Size = UDim2.new(s.X.Scale, s.X.Offset, 0, m.origH)
            end
        end

        -- Hide: collapse item (FIX Bug 1+2)
        -- Visible=false + Size.Y=0 → UIListLayout skip → panel auto-shrink
        function grp:Hide()
            for _, m in ipairs(members) do
                m.inst.Visible = false
                local s = m.inst.Size
                m.inst.Size = UDim2.new(s.X.Scale, s.X.Offset, 0, 0)
            end
        end

        function grp:SetVisible(v)
            if v then grp:Show() else grp:Hide() end
        end

        -- Clear: hapus semua item (FIX Bug 1)
        -- Destroy membuat layout auto-recalculate tanpa sisa _y
        function grp:Clear()
            for _, m in ipairs(members) do
                pcall(function() m.inst:Destroy() end)
            end
            members = {}
        end

        return grp
    end

    function api:Show()   panel.Visible = true             end
    function api:Hide()   panel.Visible = false            end
    function api:Toggle() panel.Visible = not panel.Visible end

    return api
end

-- ============================================================
-- LOCATION PANEL  (overlay draggable, panel lokasi + perf row)
-- API:
--   :AddLocation(name, lanes)    → tambah lokasi (lanes = {Vector3,...})
--   :RemoveLocation(name)        → hapus lokasi
--   :Refresh()                   → rebuild daftar baris
--   :Show() / :Hide() / :Toggle()
--
-- Tombol tiap baris toggle Walk ↔ Back:
--   Klik 1 → tombol jadi "↩ Back", panggil walkFn(name, lanes)
--   Klik 2 → tombol jadi "Walk",   panggil walkFn(name, lanes)
--   Logika walk/back ditangani oleh walkFn di luar (di script)
--
-- cfg: width(205), height(310), position, visible
-- walkFn: function(name: string, lanes: {Vector3}) → dipanggil saat tombol diklik
-- ============================================================
function Window:LocationPanel(cfg, walkFn)
    cfg     = cfg     or {}
    walkFn  = walkFn  or function() end

    local theme  = self._theme
    local panelW = cfg.width    or 205
    local panelH = cfg.height   or 310
    local HDR_H  = 33
    local PERF_H = 30
    local PAD    = 4

    -- ScreenGui terpisah supaya layering independen
    local sg = Instance.new("ScreenGui")
    sg.Name           = "LuluUI_LocationPanel"
    sg.ResetOnSpawn   = false
    sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    sg.Enabled        = cfg.visible ~= false
    sg.Parent         = self.screenGui.Parent   -- sama dengan parent main UI

    -- ── Frame utama ──────────────────────────────────────────
    local frame = Instance.new("Frame", sg)
    frame.Name             = "LocationPanel"
    frame.Size             = UDim2.new(0, panelW, 0, panelH)
    frame.Position         = cfg.position or UDim2.new(0.76, 0, 0.25, 0)
    frame.BackgroundColor3 = theme.windowBg
    frame.BorderSizePixel  = 0
    mkCorner(frame, 10)

    -- Glow shadow
    local glow = Instance.new("Frame", frame)
    glow.Size                   = UDim2.new(1, 14, 1, 14)
    glow.Position               = UDim2.new(0, -7, 0, -7)
    glow.BackgroundColor3       = theme.shadow
    glow.BackgroundTransparency = 0.82
    glow.BorderSizePixel        = 0
    glow.ZIndex                 = frame.ZIndex - 1
    mkCorner(glow, 14)

    -- ── Header (drag handle) ─────────────────────────────────
    local hdr = Instance.new("Frame", frame)
    hdr.Name             = "Header"
    hdr.Size             = UDim2.new(1, 0, 0, HDR_H)
    hdr.BackgroundColor3 = theme.accent
    hdr.BorderSizePixel  = 0
    mkCorner(hdr, 10)

    -- Fix sudut bawah header
    local hFix = Instance.new("Frame", hdr)
    hFix.Size             = UDim2.new(1, 0, 0.5, 0)
    hFix.Position         = UDim2.new(0, 0, 0.5, 0)
    hFix.BackgroundColor3 = theme.accent
    hFix.BorderSizePixel  = 0

    local hTitle = Instance.new("TextLabel", hdr)
    hTitle.Size                   = UDim2.new(1, -75, 1, 0)
    hTitle.Position               = UDim2.new(0, 10, 0, 0)
    hTitle.BackgroundTransparency = 1
    hTitle.Text                   = "📍 Lokasi"
    hTitle.Font                   = Enum.Font.GothamBold
    hTitle.TextSize               = 13
    hTitle.TextColor3             = theme.textWhite
    hTitle.TextXAlignment         = Enum.TextXAlignment.Left

    -- Badge jumlah lokasi
    local badge = Instance.new("TextLabel", hdr)
    badge.Size                   = UDim2.new(0, 56, 0, 20)
    badge.Position               = UDim2.new(1, -62, 0.5, -10)
    badge.BackgroundColor3       = theme.accentDark
    badge.BackgroundTransparency = 0.2
    badge.Text                   = "0 loc"
    badge.Font                   = Enum.Font.GothamBold
    badge.TextSize               = 10
    badge.TextColor3             = theme.textWhite
    badge.BorderSizePixel        = 0
    mkCorner(badge, 6)

    -- ── Perf Row (FPS / CPU / PING) ──────────────────────────
    local perfRow = Instance.new("Frame", frame)
    perfRow.Size             = UDim2.new(1, -8, 0, PERF_H)
    perfRow.Position         = UDim2.new(0, 4, 0, HDR_H + 4)
    perfRow.BackgroundColor3 = theme.accentDark
    perfRow.BorderSizePixel  = 0
    mkCorner(perfRow, 6)

    local function mkPerfCell(xScale, label)
        local cell = Instance.new("Frame", perfRow)
        cell.Size                 = UDim2.new(1/3, 0, 1, 0)
        cell.Position             = UDim2.new(xScale, 0, 0, 0)
        cell.BackgroundTransparency = 1

        local lh = Instance.new("TextLabel", cell)
        lh.Size                   = UDim2.new(1, 0, 0, 11)
        lh.Position               = UDim2.new(0, 0, 0, 2)
        lh.BackgroundTransparency = 1
        lh.Text                   = label
        lh.Font                   = Enum.Font.Gotham
        lh.TextSize               = 8
        lh.TextColor3             = theme.textLight
        lh.TextXAlignment         = Enum.TextXAlignment.Center

        local lv = Instance.new("TextLabel", cell)
        lv.Size                   = UDim2.new(1, 0, 0, 13)
        lv.Position               = UDim2.new(0, 0, 0, 13)
        lv.BackgroundTransparency = 1
        lv.Text                   = "—"
        lv.Font                   = Enum.Font.GothamBold
        lv.TextSize               = 11
        lv.TextColor3             = theme.textWhite
        lv.TextXAlignment         = Enum.TextXAlignment.Center
        return lv
    end

    local function mkPerfDiv(xScale)
        local d = Instance.new("Frame", perfRow)
        d.Size             = UDim2.new(0, 1, 0.65, 0)
        d.Position         = UDim2.new(xScale, 0, 0.175, 0)
        d.BackgroundColor3 = theme.divider
        d.BorderSizePixel  = 0
    end

    local lblFPS  = mkPerfCell(0,   "FPS")
    local lblCPU  = mkPerfCell(1/3, "CPU")
    local lblPing = mkPerfCell(2/3, "PING")
    mkPerfDiv(1/3)
    mkPerfDiv(2/3)

    -- Auto-update perf stats
    local _fpsCount = 0
    local _lastDt   = 0
    local RunService = game:GetService("RunService")
    local rsConn = RunService.RenderStepped:Connect(function(dt)
        _fpsCount = _fpsCount + 1
        _lastDt   = dt
    end)
    frame.AncestryChanged:Connect(function()
        if not frame.Parent then pcall(function() rsConn:Disconnect() end) end
    end)
    task.spawn(function()
        while frame and frame.Parent do
            task.wait(0.5)
            if sg.Enabled then
                lblFPS.Text  = tostring(_fpsCount * 2)
                _fpsCount    = 0
                lblCPU.Text  = tostring(math.floor(_lastDt * 1000)) .. "ms"
                local ping = 0
                pcall(function()
                    ping = math.floor(game:GetService("Players").LocalPlayer:GetNetworkPing() * 1000)
                end)
                lblPing.Text = tostring(ping)
            end
        end
    end)

    -- ── ScrollingFrame ───────────────────────────────────────
    local scrollTop = HDR_H + PERF_H + PAD * 2 + 6
    local scroll = Instance.new("ScrollingFrame", frame)
    scroll.Size                  = UDim2.new(1, -8, 1, -(scrollTop + 4))
    scroll.Position              = UDim2.new(0, 4, 0, scrollTop)
    scroll.BackgroundTransparency = 1
    scroll.BorderSizePixel       = 0
    scroll.ScrollBarThickness    = 4
    scroll.ScrollBarImageColor3  = theme.accent
    scroll.AutomaticCanvasSize   = Enum.AutomaticCanvasSize.Y
    scroll.CanvasSize            = UDim2.new(0, 0, 0, 0)

    local layout = Instance.new("UIListLayout", scroll)
    layout.Padding   = UDim.new(0, 4)
    layout.SortOrder = Enum.SortOrder.LayoutOrder

    local pad = Instance.new("UIPadding", scroll)
    pad.PaddingTop   = UDim.new(0, 4)
    pad.PaddingLeft  = UDim.new(0, 2)
    pad.PaddingRight = UDim.new(0, 2)

    -- Label kosong
    local emptyLbl = Instance.new("TextLabel", scroll)
    emptyLbl.Name                   = "EmptyLbl"
    emptyLbl.LayoutOrder            = 9999
    emptyLbl.Size                   = UDim2.new(1, 0, 0, 40)
    emptyLbl.BackgroundTransparency = 1
    emptyLbl.Text                   = "Belum ada lokasi ditambahkan"
    emptyLbl.Font                   = Enum.Font.Gotham
    emptyLbl.TextSize               = 11
    emptyLbl.TextColor3             = theme.textLight
    emptyLbl.TextXAlignment         = Enum.TextXAlignment.Center

    -- ── State internal ────────────────────────────────────────
    local locations  = {}   -- { name, lanes={Vector3,...} }
    local originMap  = {}   -- [name] = Vector3 posisi awal sebelum walk pertama
    local activeMap  = {}   -- [name] = true jika sedang "di lokasi" (sudah walk ke sana)

    -- ── Drag ─────────────────────────────────────────────────
    local dragging, dragStart, startPos = false, nil, nil
    hdr.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1
        or inp.UserInputType == Enum.UserInputType.Touch then
            dragging  = true
            dragStart = inp.Position
            startPos  = frame.Position
            inp.Changed:Connect(function()
                if inp.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)
    UserInputService.InputChanged:Connect(function(inp)
        if dragging
        and (inp.UserInputType == Enum.UserInputType.MouseMovement
          or inp.UserInputType == Enum.UserInputType.Touch) then
            local d = inp.Position - dragStart
            frame.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + d.X,
                startPos.Y.Scale, startPos.Y.Offset + d.Y
            )
        end
    end)

    -- ── API ───────────────────────────────────────────────────
    local api = {}

    -- Rebuild semua baris lokasi
    function api:Refresh()
        for _, child in ipairs(scroll:GetChildren()) do
            if child:IsA("Frame") then child:Destroy() end
        end

        badge.Text         = #locations .. " loc"
        emptyLbl.Visible   = (#locations == 0)

        for i, loc in ipairs(locations) do
            local row = Instance.new("Frame", scroll)
            row.Name             = "Loc_" .. i
            row.Size             = UDim2.new(1, -4, 0, 36)
            row.BackgroundColor3 = theme.contentBg
            row.BorderSizePixel  = 0
            row.LayoutOrder      = i
            mkCorner(row, 6)

            -- Nama lokasi
            local nameLbl = Instance.new("TextLabel", row)
            nameLbl.Size                  = UDim2.new(1, -84, 1, 0)
            nameLbl.Position              = UDim2.new(0, 8, 0, 0)
            nameLbl.BackgroundTransparency = 1
            nameLbl.Text                  = loc.name
            nameLbl.Font                  = Enum.Font.Gotham
            nameLbl.TextSize              = 12
            nameLbl.TextColor3            = theme.text
            nameLbl.TextXAlignment        = Enum.TextXAlignment.Left
            nameLbl.TextTruncate          = Enum.TextTruncate.AtEnd

            -- Tombol toggle Walk / Back
            local isActive = activeMap[loc.name] == true
            local btnColor = isActive and theme.toggleOn or theme.accent

            local btn = Instance.new("TextButton", row)
            btn.Size             = UDim2.new(0, 68, 0, 26)
            btn.Position         = UDim2.new(1, -74, 0.5, -13)
            btn.BackgroundColor3 = btnColor
            btn.BorderSizePixel  = 0
            btn.Text             = isActive and "↩ Back" or "Walk"
            btn.Font             = Enum.Font.GothamBold
            btn.TextSize         = 11
            btn.TextColor3       = theme.textWhite
            mkCorner(btn, 5)

            -- Hover
            btn.MouseEnter:Connect(function()
                TweenService:Create(btn, TweenInfo.new(0.12), {
                    BackgroundColor3 = lighten(btn.BackgroundColor3, 20)
                }):Play()
            end)
            btn.MouseLeave:Connect(function()
                TweenService:Create(btn, TweenInfo.new(0.12), {
                    BackgroundColor3 = activeMap[loc.name] and theme.toggleOn or theme.accent
                }):Play()
            end)

            local capturedName  = loc.name
            local capturedLanes = loc.lanes

            btn.MouseButton1Click:Connect(function()
                -- Toggle state tombol
                activeMap[capturedName] = not activeMap[capturedName]
                if activeMap[capturedName] then
                    btn.Text             = "↩ Back"
                    btn.BackgroundColor3 = theme.toggleOn
                else
                    btn.Text             = "Walk"
                    btn.BackgroundColor3 = theme.accent
                end
                -- Serahkan logika walk/back ke walkFn di script
                walkFn(capturedName, capturedLanes)
            end)
        end
    end

    function api:AddLocation(name, lanes)
        -- Cegah duplikat
        for _, loc in ipairs(locations) do
            if loc.name == name then return false end
        end
        -- lanes harus table of Vector3
        local safeLanes = {}
        if type(lanes) == "table" then
            for _, v in ipairs(lanes) do table.insert(safeLanes, v) end
        end
        table.insert(locations, { name = name, lanes = safeLanes })
        api:Refresh()
        return true
    end

    function api:RemoveLocation(name)
        for i, loc in ipairs(locations) do
            if loc.name == name then
                table.remove(locations, i)
                activeMap[name]  = nil
                originMap[name]  = nil
                api:Refresh()
                return true
            end
        end
        return false
    end

    function api:SetCount(n)
        badge.Text = tostring(n) .. " loc"
    end

    function api:GetLocations()
        return locations
    end

    function api:Show()   sg.Enabled = true            end
    function api:Hide()   sg.Enabled = false           end
    function api:Toggle() sg.Enabled = not sg.Enabled  end

    api:Refresh()
    return api
end

-- ============================================================
-- SETTERS
-- ============================================================
function Window:SetTitle(text)
    self.titleLabel.Text = text
end

-- Shortcut confirm dialog langsung dari window
-- win:Confirm("Judul", "Pesan?", function() ... end)
function Window:Confirm(title, message, onConfirm, onCancel)
    _showConfirm(self.mainFrame, title, message, onConfirm, onCancel, self._theme)
end

function Window:Destroy()
    self.screenGui:Destroy()
end

-- ============================================================
return LuluUI
-- ============================================================

