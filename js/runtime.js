/*
 * runtime.js - blok Lua STATIS yang disisipkan ke script hasil.
 * Semuanya ditulis sebagai teks Lua; generator hanya menyusun dan menyuntikkan data.
 * Aturan: tanpa backslash di sini (String.raw) kecuali memang dibutuhkan Lua.
 */
(function (g) {
  var LSB = g.LSB = g.LSB || {};
  var R = LSB.runtime = {};

  R.services = String.raw`local Players          = game:GetService("Players")
local RunService       = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local HttpService      = game:GetService("HttpService")
local LP               = Players.LocalPlayer`;

  R.loadLulu = String.raw`local LuluUI
do
    local okL, resL = pcall(function()
        return loadstring(game:HttpGet(LULU_URL))()
    end)
    if not okL or type(resL) ~= "table" then
        warn("[" .. SCRIPT_NAME .. "] Gagal memuat LuluUI dari URL: " .. tostring(resL))
        return
    end
    LuluUI = resL
end`;

  // %FNS% diganti daftar nama fungsi executor
  R.compat = String.raw`local Compat = {}
do
    local envOk, env = pcall(function()
        if getgenv then return getgenv() end
        return nil
    end)
    if not envOk then env = nil end
    local function grab(name)
        local ok, v = pcall(function()
            if env and env[name] ~= nil then return env[name] end
            if getfenv then return getfenv()[name] end
            return nil
        end)
        if ok and type(v) == "function" then return v end
        return nil
    end
    for _, n in ipairs(%FNS%) do Compat[n] = grab(n) end
    if not Compat.request then Compat.request = Compat.http_request end
    Compat._env = env
end`;

  // singleton: matikan instance lama dengan nama sama
  R.singleton = String.raw`do
    local envS = Compat._env or _G
    local old = envS["LSB_" .. CONFIG.name]
    if type(old) == "table" and type(old.Destroy) == "function" then
        pcall(old.Destroy)
    end
end`;

  // dipasang SETELAH Cleanup + Win tersedia
  R.register = String.raw`do
    local envR = Compat._env or _G
    envR["LSB_" .. CONFIG.name] = {
        Destroy = function()
            Cleanup()
            if Win then pcall(function() Win:Destroy() end) end
        end,
    }
end`;

  R.state = String.raw`local S, Vars, Results, Last = {}, {}, {}, {}
local Flags   = { rule = {}, watcher = {} }
local Tokens  = {}
local Widgets = {}
local Displays, LogLists, LogBuf, Conns = {}, {}, {}, {}
local BindApply, ToggleFor, OptionSources = {}, {}, {}
local Running, Epoch = true, 0
local Win = nil
local RRidx = {}
local EmptyCtx = { ev = {} }`;

  R.core = String.raw`-- ===== utilitas inti =====
local function Notify(msg, kind)
    if Win then pcall(function() Win:luluNotify(tostring(msg), kind or "info") end) end
end

local function Log(msg, level)
    local line = os.date("%H:%M:%S") .. "  " .. tostring(msg)
    LogBuf[#LogBuf + 1] = line
    if #LogBuf > 200 then table.remove(LogBuf, 1) end
    for _, l in ipairs(LogLists) do
        pcall(function() l:Add(line) end)
    end
    if CONFIG.debug or level == "error" then
        print("[" .. CONFIG.name .. "] " .. tostring(msg))
    end
end

local function Conn(c)
    Conns[#Conns + 1] = c
    return c
end

local function NewCtx()
    return { epoch = Epoch, ev = {} }
end

local function Alive(ctx)
    if not Running then return false end
    if ctx then
        if ctx.epoch ~= Epoch then return false end
        if ctx.tkey and Tokens[ctx.tkey] ~= ctx.token then return false end
    end
    return true
end

local function Sleep(ctx, sec)
    sec = tonumber(sec) or 0
    if sec <= 0 then
        task.wait()
        return
    end
    local t0 = os.clock()
    while Alive(ctx) do
        local left = sec - (os.clock() - t0)
        if left <= 0 then break end
        task.wait(math.min(left, 0.25))
    end
end

local Bucket = { t = 0, n = 0 }
local function Throttle(ctx)
    if CONFIG.maxActionsPerSecond <= 0 then return true end
    while Alive(ctx) do
        local now = os.clock()
        if now - Bucket.t >= 1 then
            Bucket.t = now
            Bucket.n = 0
        end
        if Bucket.n < CONFIG.maxActionsPerSecond then
            Bucket.n = Bucket.n + 1
            return true
        end
        task.wait(0.05)
    end
    return false
end

local function Fmt(v)
    if v == nil then return "-" end
    local t = typeof(v)
    if t == "table" then
        local p = {}
        for i, x in ipairs(v) do p[i] = tostring(x) end
        return table.concat(p, ", ")
    elseif t == "number" then
        if v % 1 == 0 then return tostring(v) end
        return string.format("%.2f", v)
    elseif t == "Instance" then
        return v.Name
    end
    return tostring(v)
end

local function Field(v, f)
    if type(v) == "table" then return v[f] end
    if typeof(v) == "Instance" then
        local ok, r = pcall(function() return v[f] end)
        if ok then return r end
    end
    return nil
end

local function WOut(wid, f)
    local o = Last[wid]
    if o == nil then return nil end
    return o[f]
end

local function Ev(ctx, f)
    local e = ctx and ctx.ev
    if e then return e[f] end
    return nil
end

local function Cast(ty, v)
    if ty == "number" then
        return tonumber(v) or 0
    elseif ty == "string" then
        if v == nil then return "" end
        return tostring(v)
    elseif ty == "boolean" then
        if type(v) == "string" then return string.lower(v) == "true" end
        return v and true or false
    elseif ty == "Vector3" then
        if typeof(v) == "Vector3" then return v end
        local x, y, z = string.match(tostring(v), "(-?[%d%.]+)%s*,%s*(-?[%d%.]+)%s*,%s*(-?[%d%.]+)")
        if x then return Vector3.new(tonumber(x), tonumber(y), tonumber(z)) end
        return Vector3.zero
    end
    return v
end

local function RandRange(a, b)
    a, b = tonumber(a) or 0, tonumber(b) or 0
    if a > b then a, b = b, a end
    if a % 1 == 0 and b % 1 == 0 then return math.random(a, b) end
    return a + math.random() * (b - a)
end

local function Pick(list)
    if #list == 0 then return nil end
    return list[math.random(1, #list)]
end

local function RR(key, list)
    if #list == 0 then return nil end
    RRidx[key] = ((RRidx[key] or 0) % #list) + 1
    return list[RRidx[key]]
end

local function Tpl(s, ctx)
    return (string.gsub(tostring(s), "{(%a+):([^}]+)}", function(k, v)
        local r
        if k == "w" then r = S[v]
        elseif k == "a" then r = Results[v]
        elseif k == "v" then r = Vars[v]
        elseif k == "e" then r = Ev(ctx, v)
        elseif k == "wt" then
            local wid, f = string.match(v, "([^.]+)%.(.+)")
            if wid then r = WOut(wid, f) end
        end
        return Fmt(r == nil and "" or r)
    end))
end

local function Cmp(op, a, b, c)
    if op == "exists" then return a ~= nil end
    if op == "isNil" then return a == nil end
    if op == "contains" then
        return a ~= nil and string.find(tostring(a), tostring(b), 1, true) ~= nil
    end
    if op == "startsWith" then
        return a ~= nil and string.sub(tostring(a), 1, #tostring(b)) == tostring(b)
    end
    if op == "between" then
        local n = tonumber(a)
        return n ~= nil and n >= (tonumber(b) or 0) and n <= (tonumber(c) or 0)
    end
    if op == "==" then return a == b or tostring(a) == tostring(b) end
    if op == "~=" then return not (a == b or tostring(a) == tostring(b)) end
    local x, y = tonumber(a), tonumber(b)
    if x == nil or y == nil then return false end
    if op == ">" then return x > y end
    if op == "<" then return x < y end
    if op == ">=" then return x >= y end
    if op == "<=" then return x <= y end
    return false
end

local function Wild(name, pat)
    if pat == nil or pat == "" then return true end
    if not string.find(pat, "*", 1, true) then return name == pat end
    local lp = "^" .. string.gsub(string.gsub(pat, "[%^%$%(%)%%%.%[%]%+%-%?]", "%%%0"), "%*", ".*") .. "$"
    return string.find(name, lp) ~= nil
end

local function ToOptions(v)
    local out = {}
    if typeof(v) == "Instance" then
        for _, c in ipairs(v:GetChildren()) do out[#out + 1] = c.Name end
    elseif type(v) == "table" then
        for _, x in ipairs(v) do out[#out + 1] = tostring(x) end
    elseif v ~= nil then
        out[1] = tostring(v)
    end
    return out
end`;

  R.resolver = String.raw`-- ===== resolver path =====
local function SplitPath(p)
    local parts = {}
    local pat = string.find(p, "/", 1, true) and "[^/]+" or "[^%.]+"
    for seg in string.gmatch(p, pat) do parts[#parts + 1] = seg end
    return parts
end

local function WalkPath(path, timeout)
    local parts = SplitPath(path)
    local cur = game
    local deadline = os.clock() + (timeout or 0)
    for i, seg in ipairs(parts) do
        if not (i == 1 and seg == "game") then
            local nxt
            if cur == game then
                if seg == "workspace" then seg = "Workspace" end
                local okS, svc = pcall(game.GetService, game, seg)
                if okS and svc then nxt = svc end
            end
            if not nxt and cur == Players and seg == "LocalPlayer" then nxt = LP end
            if not nxt and cur == LP and seg == "Character" then nxt = LP.Character end
            if not nxt then
                nxt = cur:FindFirstChild(seg)
                if not nxt and timeout and timeout > 0 then
                    local left = deadline - os.clock()
                    if left > 0 then nxt = cur:WaitForChild(seg, left) end
                end
            end
            if not nxt then return nil, seg end
            cur = nxt
        end
    end
    return cur
end

local Cache, Missing = {}, {}
local function Resolve(id, noWait)
    local def = Targets[id]
    if not def then return nil end
    local c = Cache[id]
    if c and (c.Parent ~= nil or c == game) then return c end
    if def.kind == "player" and def.path == "" then return LP end
    local miss = Missing[id]
    if miss and os.clock() - miss < 3 then return nil end
    local inst = WalkPath(def.path, noWait and 0 or CONFIG.resolveTimeout)
    if inst then
        Cache[id] = inst
        Missing[id] = nil
    else
        Missing[id] = os.clock()
    end
    return inst
end

local function T(id)
    local inst = Resolve(id)
    if not inst then
        local def = Targets[id]
        error("target tidak ditemukan: " .. (def and (def.alias .. " = " .. def.path) or tostring(id)))
    end
    return inst
end

local function PathInst(path)
    local inst = WalkPath(path, CONFIG.resolveTimeout)
    if not inst then error("path tidak ditemukan: " .. tostring(path)) end
    return inst
end

local function Char()
    return LP.Character or LP.CharacterAdded:Wait()
end

local function HRP()
    local hrp = Char():WaitForChild("HumanoidRootPart", 5)
    if not hrp then error("HumanoidRootPart tidak ada") end
    return hrp
end

local function Hum()
    local h = Char():FindFirstChildOfClass("Humanoid")
    if not h then error("Humanoid tidak ada") end
    return h
end

local function ToCF(d)
    local t = typeof(d)
    if t == "CFrame" then return d end
    if t == "Vector3" then return CFrame.new(d) end
    if t == "Instance" then
        if d:IsA("BasePart") then return d.CFrame end
        if d:IsA("Model") then return d:GetPivot() end
        if d:IsA("Attachment") then return d.WorldCFrame end
    end
    return nil
end

local function PosOf(d)
    local cf = ToCF(d)
    if cf then return cf.Position end
    return nil
end

local function TargetField(id, field)
    local inst = Resolve(id, true)
    if not inst then return nil end
    if field == "position" then return PosOf(inst) end
    if field == "cframe" then return ToCF(inst) end
    if field == "name" then return inst.Name end
    if field == "value" then
        local ok, v = pcall(function() return inst.Value end)
        if ok then return v end
        return nil
    end
    return inst
end

local function CallRemote(inst, args)
    local n = args.n or #args
    if inst:IsA("RemoteEvent") then
        inst:FireServer(table.unpack(args, 1, n))
        return true
    elseif inst:IsA("RemoteFunction") then
        return inst:InvokeServer(table.unpack(args, 1, n))
    elseif inst:IsA("BindableEvent") then
        inst:Fire(table.unpack(args, 1, n))
        return true
    elseif inst:IsA("BindableFunction") then
        return inst:Invoke(table.unpack(args, 1, n))
    end
    error("bukan Remote/Bindable: " .. inst:GetFullName())
end`;

  R.save = String.raw`-- ===== simpan / muat pengaturan =====
local function CfgFile()
    return CONFIG.folder .. "/config.json"
end

local function LoadSaved()
    local data = {}
    if CONFIG.autosave and Compat.readfile and Compat.isfile then
        pcall(function()
            if Compat.isfile(CfgFile()) then
                data = HttpService:JSONDecode(Compat.readfile(CfgFile()))
            end
        end)
    end
    if type(data) ~= "table" then data = {} end
    return data
end

local CurrentProfile = nil
local function SaveNow()
    if not Compat.writefile then return false end
    local data = {}
    for _, id in ipairs(PersistIds) do data[id] = S[id] end
    data.__profile = CurrentProfile
    local ok = pcall(function()
        if Compat.makefolder and Compat.isfolder and not Compat.isfolder(CONFIG.folder) then
            Compat.makefolder(CONFIG.folder)
        end
        Compat.writefile(CfgFile(), HttpService:JSONEncode(data))
    end)
    return ok
end

local SaveQueued, WarnedNoSave = false, false
local function MarkDirty()
    if not CONFIG.autosave then return end
    if not Compat.writefile then
        if not WarnedNoSave then
            WarnedNoSave = true
            Notify("Executor tidak mendukung writefile: pengaturan tidak disimpan", "warning")
        end
        return
    end
    if SaveQueued then return end
    SaveQueued = true
    task.delay(1.5, function()
        SaveQueued = false
        if Running then SaveNow() end
    end)
end

local function SetWidget(id, v)
    local w = Widgets[id]
    if not w then return false end
    local ok, err = pcall(w.set, v)
    if not ok then Log("SetWidget " .. tostring(id) .. ": " .. tostring(err), "error") end
    return ok
end`;

  R.engine = String.raw`-- ===== mesin: aksi, makro, rule, watcher =====
local function SyncToggle(key, on)
    local wid = ToggleFor[key]
    if not wid then return end
    S[wid] = on
    local w = Widgets[wid]
    if w and w.silent then pcall(w.silent, on) end
end

local function StartTask(tkey, fn)
    if Tokens[tkey] then return false end
    local token = {}
    Tokens[tkey] = token
    task.spawn(function()
        local ctx = NewCtx()
        ctx.tkey = tkey
        ctx.token = token
        local ok, err = pcall(fn, ctx)
        if not ok then Log("Error " .. tkey .. ": " .. tostring(err), "error") end
        if Tokens[tkey] == token then
            Tokens[tkey] = nil
            SyncToggle(tkey, false)
        end
    end)
    return true
end

local function StopTask(tkey)
    Tokens[tkey] = nil
end

local function RunAction(id, ctx)
    local a = ActionsById[id]
    if not a then
        Log("aksi tidak ditemukan: " .. tostring(id), "error")
        return false
    end
    ctx = ctx or NewCtx()
    for _, need in ipairs(a.needs) do
        if not Compat[need] then
            Log(a.name .. ": butuh " .. need .. " (tidak didukung executor)", "error")
            Notify(a.name .. ": executor tidak mendukung " .. need, "error")
            return false
        end
    end
    if a.cooldown > 0 and os.clock() - a.last < a.cooldown then return true end
    a.last = os.clock()
    if a.delay > 0 then Sleep(ctx, a.delay) end
    local ok, res
    for i = 1, a.retry + 1 do
        if not Alive(ctx) then return false end
        if not Throttle(ctx) then return false end
        ok, res = pcall(a.fn, ctx)
        if ok then break end
        if i <= a.retry then Sleep(ctx, 0.3) end
    end
    if ok then
        Results[id] = res
        if a.after > 0 then Sleep(ctx, a.after) end
        return true, res
    end
    Log(a.name .. " gagal: " .. tostring(res), "error")
    if a.ignoreError then return true end
    return false, res
end

local function StopAll()
    Epoch = Epoch + 1
    for k in pairs(Tokens) do Tokens[k] = nil end
    for k in pairs(Flags.rule) do Flags.rule[k] = false end
    for k in pairs(Flags.watcher) do Flags.watcher[k] = false end
    for key in pairs(ToggleFor) do SyncToggle(key, false) end
    Log("Stop semua")
    Notify("Semua dihentikan", "warning")
end

local function RunMacro(id, ctx)
    local m = Macros[id]
    if not m then
        Log("makro tidak ditemukan: " .. tostring(id), "error")
        return
    end
    ctx = ctx or NewCtx()
    local n = 0
    while Alive(ctx) do
        n = n + 1
        for _, st in ipairs(m.steps) do
            if not Alive(ctx) then return end
            if st.wait then
                Sleep(ctx, st.wait)
            elseif st.action then
                RunAction(st.action, ctx)
            end
        end
        if not m.loop and n >= m.count then break end
        Sleep(ctx, m.interval)
    end
end

local function RunRule(id, ev, force)
    local r = Rules[id]
    if not r then return end
    local ctx = NewCtx()
    ctx.ev = ev or {}
    ctx.rule = id
    if not force then
        if not Flags.rule[id] then return end
        if r.maxRuns > 0 and r.runs >= r.maxRuns then return end
        local now = os.clock()
        if r.cooldown > 0 and now - r.last < r.cooldown then return end
        if r.busy and not r.overlap then return end
        if r.cond then
            local okC, resC = pcall(r.cond, ctx)
            if not okC then
                Log("kondisi " .. r.name .. ": " .. tostring(resC), "error")
                return
            end
            if not resC then return end
        end
        if now - r.bt >= 1 then
            r.bt = now
            r.bn = 0
        end
        r.bn = r.bn + 1
        if CONFIG.ruleBurst > 0 and r.bn > CONFIG.ruleBurst then
            Flags.rule[id] = false
            SyncToggle("rule:" .. id, false)
            Log("rule " .. r.name .. " dihentikan: terlalu sering berjalan", "error")
            Notify("Rule " .. r.name .. " dihentikan (terlalu sering)", "error")
            return
        end
    end
    r.last = os.clock()
    r.runs = r.runs + 1
    r.busy = true
    task.spawn(function()
        local okR, errR = pcall(function()
            if r.mode == "parallel" then
                local pending = #r.steps
                for _, st in ipairs(r.steps) do
                    task.spawn(function()
                        if st.delay > 0 then Sleep(ctx, st.delay) end
                        RunAction(st.id, ctx)
                        pending = pending - 1
                    end)
                end
                while pending > 0 and Alive(ctx) do task.wait(0.05) end
            else
                for _, st in ipairs(r.steps) do
                    if not Alive(ctx) then break end
                    if st.delay > 0 then Sleep(ctx, st.delay) end
                    local okA = RunAction(st.id, ctx)
                    if not okA then
                        if r.onFail == "stop" then break end
                        if r.onFail == "fallback" then
                            if r.fallback ~= "" then RunAction(r.fallback, ctx) end
                            break
                        end
                    end
                end
            end
        end)
        r.busy = false
        if not okR then Log("rule " .. r.name .. ": " .. tostring(errR), "error") end
    end)
end

local function Fire(wid, out, force)
    if not force and not Flags.watcher[wid] then return end
    out = out or {}
    Last[wid] = out
    local list = WatcherRules[wid]
    if list then
        for _, rid in ipairs(list) do RunRule(rid, out) end
    end
end

local function SafeStart(wid, fn)
    task.spawn(function()
        local ok, err = pcall(fn)
        if not ok then
            local w = Watchers[wid]
            Log("watcher " .. (w and w.name or tostring(wid)) .. ": " .. tostring(err), "error")
            Notify("Watcher " .. (w and w.name or tostring(wid)) .. " gagal: " .. tostring(err), "error")
        end
    end)
end`;

  R.cleanup = String.raw`-- ===== cleanup =====
local function Cleanup()
    if not Running then return end
    Running = false
    Epoch = Epoch + 1
    for _, c in ipairs(Conns) do
        pcall(function() c:Disconnect() end)
    end
    for k in pairs(Tokens) do Tokens[k] = nil end
    if CONFIG.autosave and Compat.writefile then pcall(SaveNow) end
    local envC = Compat._env or _G
    local keyC = "LSB_" .. CONFIG.name
    if envC[keyC] then envC[keyC] = nil end
end`;

})(typeof window !== 'undefined' ? window : globalThis);
