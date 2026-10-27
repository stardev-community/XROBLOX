/*
 * generator.js - fungsi MURNI: config -> string Lua.  LSB.generate(cfg, opts)
 * Tidak menyentuh DOM / jaringan. Aman dijalankan di Node untuk tes.
 */
(function (g) {
  var LSB = g.LSB = g.LSB || {};
  var U = LSB.util, M = LSB.META, W = LSB.walk, R = LSB.runtime;
  if (typeof require !== 'undefined' && !U) {
    require('./core.js'); require('./runtime.js');
    U = LSB.util; M = LSB.META; W = LSB.walk; R = LSB.runtime;
  }

  /* ================================================================ penulis kode */
  function Writer(o) {
    this.out = []; this.ind = 0; this.comments = o.comments !== false && !o.minify; this.minify = !!o.minify;
  }
  Writer.prototype.line = function (s) {
    if (s === undefined || s === '') { if (!this.minify) this.out.push(''); return; }
    this.out.push(new Array(this.ind + 1).join('    ') + s);
  };
  Writer.prototype.blank = function () { if (!this.minify) this.out.push(''); };
  Writer.prototype.cm = function (s) { if (this.comments) this.line('-- ' + s); };
  Writer.prototype.open = function (s) { this.line(s); this.ind++; };
  Writer.prototype.close = function (s) { this.ind = Math.max(0, this.ind - 1); this.line(s || 'end'); };
  Writer.prototype.raw = function (block) { // blok teks mentah (rata kiri) + indent saat ini
    var self = this;
    String(block).split('\n').forEach(function (l) { self.out.push(l === '' ? '' : new Array(self.ind + 1).join('    ') + l); });
  };
  Writer.prototype.banner = function (title) {
    if (!this.comments) return;
    this.blank();
    this.line('-- ' + new Array(62).join('='));
    this.line('-- ' + title);
    this.line('-- ' + new Array(62).join('='));
  };
  Writer.prototype.toString = function () { return this.out.join('\n') + '\n'; };

  var L = U.luaStr;

  /* ================================================================ literal & operand */
  function numLit(v, d) { return U.luaNum(U.num(v, d == null ? 0 : d)); }

  function autoLit(s) {
    var t = String(s == null ? '' : s).trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) return U.luaNum(Number(t));
    if (t === 'true' || t === 'false') return t;
    if (t === 'nil') return 'nil';
    return L(s);
  }

  function nums(s) { return String(s == null ? '' : s).split(/[,\s]+/).filter(function (x) { return x !== ''; }).map(Number).filter(function (n) { return isFinite(n); }); }

  function fixedLit(value, type) {
    type = type || 'auto';
    switch (type) {
      case 'number': return numLit(value, 0);
      case 'string': return L(value);
      case 'boolean': return (/^(true|1|ya|on)$/i.test(String(value).trim())) ? 'true' : 'false';
      case 'nil': return 'nil';
      case 'Vector3': { var v = nums(value); while (v.length < 3) v.push(0); return 'Vector3.new(' + v.slice(0, 3).map(U.luaNum).join(', ') + ')'; }
      case 'CFrame': { var c = nums(value); if (c.length >= 12) return 'CFrame.new(' + c.slice(0, 12).map(U.luaNum).join(', ') + ')'; while (c.length < 3) c.push(0); return 'CFrame.new(' + c.slice(0, 3).map(U.luaNum).join(', ') + ')'; }
      case 'Instance': return String(value).trim() ? 'PathInst(' + L(String(value).trim()) + ')' : 'nil';
      case 'table': { var items = String(value == null ? '' : value).split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; }); return '{' + items.map(autoLit).join(', ') + '}'; }
      default: return autoLit(value);
    }
  }

  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  // ekspresi Lua dari sebuah operand. Dipakai di dalam fungsi yang punya variabel `ctx`.
  function opExpr(cfg, o) {
    if (!o) return 'nil';
    var src = o.src || 'fixed', e;
    switch (src) {
      case 'fixed': return fixedLit(o.value, o.type);
      case 'widget': if (!o.ref || !W.widget(cfg, o.ref)) return 'nil'; e = 'S[' + L(o.ref) + ']'; break;
      case 'action': if (!o.ref) return 'nil'; e = 'Results[' + L(o.ref) + ']'; if (o.field) e = 'Field(' + e + ', ' + L(o.field) + ')'; break;
      case 'watcher': if (!o.ref) return 'nil'; e = 'WOut(' + L(o.ref) + ', ' + L(o.field || 'value') + ')'; break;
      case 'event': e = 'Ev(ctx, ' + L(o.field || 'value') + ')'; break;
      case 'random': e = 'RandRange(' + numLit(o.min, 1) + ', ' + numLit(o.max, 10) + ')'; break;
      case 'pick': e = 'Pick({' + (o.list || []).map(autoLit).join(', ') + '})'; break;
      case 'rr': e = 'RR(' + L('rr_' + hash(JSON.stringify(o.list || []) + (o.ref || ''))) + ', {' + (o.list || []).map(autoLit).join(', ') + '})'; break;
      case 'player': e = 'LP'; break;
      case 'character': e = 'LP.Character'; break;
      case 'hrp': e = 'HRP()'; break;
      case 'humanoid': e = 'Hum()'; break;
      case 'target': if (!o.ref) return 'nil'; e = 'TargetField(' + L(o.ref) + ', ' + L(o.field || 'instance') + ')'; break;
      case 'var': e = 'Vars[' + L(o.ref || '') + ']'; break;
      case 'template': e = 'Tpl(' + L(o.tpl || '') + ', ctx)'; break;
      case 'expr': e = '(' + (String(o.expr || '').trim() || 'nil') + ')'; break;
      default: return 'nil';
    }
    if (o.type && o.type !== 'auto' && o.type !== 'Instance' && o.type !== 'table' && o.type !== 'nil' && o.type !== 'CFrame') e = 'Cast(' + L(o.type) + ', ' + e + ')';
    return e;
  }

  function condExpr(cfg, c) {
    if (!c) return 'true';
    if (c.cmp) {
      var l = opExpr(cfg, c.left), op = c.cmp;
      if (op === 'exists' || op === 'isNil') return 'Cmp(' + L(op) + ', ' + l + ')';
      if (op === 'between') {
        var parts = String((c.right && c.right.value) || '').split(',');
        return 'Cmp("between", ' + l + ', ' + autoLit(parts[0] || '0') + ', ' + autoLit(parts[1] || '0') + ')';
      }
      return 'Cmp(' + L(op) + ', ' + l + ', ' + opExpr(cfg, c.right) + ')';
    }
    var items = (c.items || []).map(function (x) { return condExpr(cfg, x); }).filter(Boolean);
    if (!items.length) return 'true';
    var join = c.op === 'OR' ? ' or ' : ' and ';
    var body = items.length === 1 ? items[0] : '(' + items.join(join) + ')';
    return c.op === 'NOT' ? 'not ' + (items.length === 1 ? '(' + items[0] + ')' : body) : body;
  }

  /* ================================================================ nama unik */
  function uniqueNames(list, base, keyFn) {
    var used = {}, out = {};
    list.forEach(function (it, i) {
      var n = U.ident(keyFn(it) || (base + (i + 1)), base + (i + 1));
      if (U.isLuaKeyword(n)) n = n + '_';
      var cand = n, k = 2;
      while (used[cand]) cand = n + '_' + (k++);
      used[cand] = true; out[it.id] = cand;
    });
    return out;
  }

  /* ================================================================ AKSI */
  function argList(cfg, a) { return (a.args || []).map(function (o) { return opExpr(cfg, o); }); }
  function arg(cfg, a, i, dflt) { var o = (a.args || [])[i]; if (!o) return dflt == null ? 'nil' : dflt; var e = opExpr(cfg, o); return e; }
  function tplArg(cfg, a) {
    var o = (a.args || [])[0];
    if (o && o.src === 'template') return opExpr(cfg, o);
    return 'Tpl(' + arg(cfg, a, 0, '""') + ', ctx)';
  }
  function hasArg(a, i) { var o = (a.args || [])[i]; return !!o && !(o.src === 'fixed' && String(o.value == null ? '' : o.value).trim() === '' && o.type !== 'string'); }

  function emitActionBody(w, cfg, a) {
    var kind = a.kind;
    var tgt = a.targetId ? 'T(' + L(a.targetId) + ')' : null;
    var P = L(a.prop || 'Value');
    switch (kind) {
      case 'fire':
      case 'invoke':
        if (!tgt) { w.line('error("aksi ini belum punya target")'); break; }
        w.line('local inst = ' + tgt);
        w.line('local args = table.pack(' + argList(cfg, a).join(', ') + ')');
        w.line('return CallRemote(inst, args)');
        break;
      case 'get':
        if (!tgt) { w.line('error("aksi ini belum punya target")'); break; }
        w.line('local inst = ' + tgt);
        if (a.mode === 'attribute') w.line('return inst:GetAttribute(' + P + ')');
        else if (a.mode === 'children') w.line('return ToOptions(inst)');
        else if (a.mode === 'childCount') w.line('return #inst:GetChildren()');
        else if (a.mode === 'exists') w.line('return inst ~= nil');
        else w.line('return inst[' + P + ']');
        break;
      case 'set':
        if (!tgt) { w.line('error("aksi ini belum punya target")'); break; }
        w.line('local inst = ' + tgt);
        w.line('local val = ' + arg(cfg, a, 0));
        if (a.mode === 'attribute') w.line('inst:SetAttribute(' + P + ', val)'); else w.line('inst[' + P + '] = val');
        w.line('return val');
        break;
      case 'prompt':
        if (!tgt) { w.line('error("aksi ini belum punya target")'); break; }
        w.line('local inst = ' + tgt);
        w.line('Compat.fireproximityprompt(inst' + (hasArg(a, 0) ? ', tonumber(' + arg(cfg, a, 0) + ') or 0' : '') + ')');
        w.line('return true');
        break;
      case 'click':
        if (!tgt) { w.line('error("aksi ini belum punya target")'); break; }
        w.line('local inst = ' + tgt);
        w.line('Compat.fireclickdetector(inst' + (hasArg(a, 0) ? ', tonumber(' + arg(cfg, a, 0) + ') or 0' : '') + ')');
        w.line('return true');
        break;
      case 'equip':
        if (tgt) {
          w.line('local inst = ' + tgt);
          w.line('Hum():EquipTool(inst)');
        } else {
          w.line('local nm = tostring(' + arg(cfg, a, 0, '""') + ')');
          w.line('local tool = LP.Backpack:FindFirstChild(nm) or (LP.Character and LP.Character:FindFirstChild(nm))');
          w.line('if not tool then error("tool tidak ada: " .. nm) end');
          w.line('Hum():EquipTool(tool)');
        }
        w.line('return true');
        break;
      case 'unequip':
        w.line('Hum():UnequipTools()');
        w.line('return true');
        break;
      case 'teleport':
        w.line('local dest = ' + (hasArg(a, 0) ? arg(cfg, a, 0) : (tgt || 'nil')));
        w.line('local cf = ToCF(dest)');
        w.line('if not cf then error("tujuan teleport tidak valid") end');
        w.line('HRP().CFrame = cf + Vector3.new(0, tonumber(' + arg(cfg, a, 1, '0') + ') or 0, 0)');
        w.line('return true');
        break;
      case 'walk':
        w.line('local dest = ' + (hasArg(a, 0) ? arg(cfg, a, 0) : (tgt || 'nil')));
        w.line('local pos = PosOf(dest)');
        w.line('if not pos then error("tujuan walk tidak valid") end');
        w.line('local hum = Hum()');
        w.line('hum:MoveTo(pos)');
        w.open('if ' + arg(cfg, a, 1, 'false') + ' then');
        w.line('local done = false');
        w.line('local cn = hum.MoveToFinished:Connect(function() done = true end)');
        w.line('local t0, tmo = os.clock(), tonumber(' + arg(cfg, a, 2, '20') + ') or 20');
        w.line('while not done and Alive(ctx) and os.clock() - t0 < tmo do task.wait(0.1) end');
        w.line('cn:Disconnect()');
        w.close();
        w.line('return true');
        break;
      case 'wait':
        w.line('Sleep(ctx, tonumber(' + arg(cfg, a, 0, '1') + ') or 1)');
        w.line('return true');
        break;
      case 'loop': {
        var steps = (a.steps || []).filter(function (id) { return W.byId(cfg.actions, id); });
        w.line('local interval = tonumber(' + arg(cfg, a, 0, '1') + ') or 1');
        w.line('local count = tonumber(' + arg(cfg, a, 1, '0') + ') or 0');
        w.line('local i = 0');
        w.open('while Alive(ctx) do');
        w.line('i = i + 1');
        steps.forEach(function (id) {
          w.line('if not Alive(ctx) then break end');
          w.line('RunAction(' + L(id) + ', ctx)');
        });
        if (a.until && (a.until.items || a.until.cmp) && (a.until.cmp || a.until.items.length)) {
          w.line('if ' + condExpr(cfg, a.until) + ' then break end');
        }
        w.line('if count > 0 and i >= count then break end');
        w.line('if interval < 0.03 then interval = 0.03 end');
        w.line('Sleep(ctx, interval)');
        w.close();
        w.line('return i');
        break;
      }
      case 'log':
        w.line('local msg = ' + tplArg(cfg, a));
        w.line('Log(msg, ' + L(a.level || 'info') + ')');
        if (a.toNotify) w.line('Notify(msg, ' + L(a.level || 'info') + ')');
        w.line('return msg');
        break;
      case 'notify':
        w.line('local msg = ' + tplArg(cfg, a));
        w.line('Notify(msg, ' + L(a.level || 'info') + ')');
        w.line('return msg');
        break;
      case 'setwidget':
        w.line('local val = ' + arg(cfg, a, 0));
        w.line('SetWidget(' + L(a.widgetId || '') + ', val)');
        w.line('return val');
        break;
      case 'setvar':
        w.line('local val = ' + arg(cfg, a, 0));
        w.line('Vars[' + L(a.varName || 'var') + '] = val');
        w.line('return val');
        break;
      case 'runrule':
        w.line('RunRule(' + L(a.ref || '') + ', ctx.ev, true)');
        w.line('return true');
        break;
      case 'runmacro':
        w.line('RunMacro(' + L(a.ref || '') + ', ctx)');
        w.line('return true');
        break;
      case 'stopall':
        w.line('StopAll()');
        w.line('return true');
        break;
      case 'custom':
        w.line('local function userCode()');
        w.ind++;
        w.raw(String(a.code || '').replace(/\r\n?/g, '\n'));
        w.ind--;
        w.line('end');
        w.line('return userCode()');
        break;
      default:
        w.line('error("jenis aksi tidak dikenal: ' + String(kind).replace(/[^\w]/g, '') + '")');
    }
  }

  /* ================================================================ WATCHER */
  function emitWatcherStart(w, cfg, wt) {
    var id = L(wt.id), K = wt.kind;
    var tgt = wt.targetId ? 'T(' + L(wt.targetId) + ')' : null;
    var nf = L(wt.nameFilter || ''), cf = L(wt.classFilter || '');
    var wk = M.watcherKind(K);
    if (wk && wk.target && !tgt) { w.line('error("watcher ini belum punya target")'); return; }
    function childLike(sig, existing) {
      w.line('local inst = ' + tgt);
      w.open('local function onChild(ch)');
      w.line('if not Wild(ch.Name, ' + nf + ') then return end');
      if (wt.classFilter) w.line('if not ch:IsA(' + cf + ') then return end');
      w.line('Fire(' + id + ', { child = ch, name = ch.Name, class = ch.ClassName })');
      w.close();
      w.line('Conn(inst.' + sig + ':Connect(onChild))');
      if (existing && wt.fireExisting) {
        w.open('for _, ch in ipairs(inst:' + existing + '()) do');
        w.line('onChild(ch)');
        w.close();
      }
    }
    switch (K) {
      case 'valueChanged':
        w.line('local inst = ' + tgt);
        w.line('local old = inst.Value');
        w.open('Conn(inst:GetPropertyChangedSignal("Value"):Connect(function()');
        w.line('local nv = inst.Value');
        w.line('local o = old');
        w.line('old = nv');
        w.line('Fire(' + id + ', { value = nv, old = o })');
        w.close('end))');
        break;
      case 'attributeChanged':
        w.line('local inst = ' + tgt);
        w.line('local old = inst:GetAttribute(' + L(wt.attr || '') + ')');
        w.open('Conn(inst:GetAttributeChangedSignal(' + L(wt.attr || '') + '):Connect(function()');
        w.line('local nv = inst:GetAttribute(' + L(wt.attr || '') + ')');
        w.line('local o = old');
        w.line('old = nv');
        w.line('Fire(' + id + ', { value = nv, old = o })');
        w.close('end))');
        break;
      case 'propertyChanged':
        w.line('local inst = ' + tgt);
        w.line('local old = inst[' + L(wt.prop || 'Name') + ']');
        w.open('Conn(inst:GetPropertyChangedSignal(' + L(wt.prop || 'Name') + '):Connect(function()');
        w.line('local nv = inst[' + L(wt.prop || 'Name') + ']');
        w.line('local o = old');
        w.line('old = nv');
        w.line('Fire(' + id + ', { value = nv, old = o })');
        w.close('end))');
        break;
      case 'childAdded': childLike('ChildAdded', 'GetChildren'); break;
      case 'descendantAdded': childLike('DescendantAdded', 'GetDescendants'); break;
      case 'childRemoved': childLike('ChildRemoved', null); break;
      case 'remoteFired': {
        w.line('local inst = ' + tgt);
        w.line('local sig = inst:IsA("BindableEvent") and inst.Event or inst.OnClientEvent');
        w.line('local count = 0');
        w.open('Conn(sig:Connect(function(...)');
        w.line('local args = table.pack(...)');
        var f = wt.filter || {};
        if (f.enabled) w.line('if not Cmp(' + L(f.op || '==') + ', args[' + Math.max(1, U.num(f.index, 1)) + '], ' + autoLit(f.value) + ') then return end');
        w.line('count = count + 1');
        w.line('Fire(' + id + ', { args = args, a1 = args[1], a2 = args[2], a3 = args[3], count = count })');
        w.close('end))');
        break;
      }
      case 'interval':
        w.line('local ctx0 = NewCtx()');
        w.line('local n = 0');
        if (U.num(wt.startDelay, 0) > 0) w.line('Sleep(ctx0, ' + numLit(wt.startDelay) + ')');
        w.open('while Running do');
        w.line('local ctx = ctx0');
        w.line('local iv = tonumber(' + opExpr(cfg, wt.intervalOp) + ') or 1');
        w.line('if iv < 0.05 then iv = 0.05 end');
        w.open('if Flags.watcher[' + id + '] then');
        w.line('n = n + 1');
        w.line('Fire(' + id + ', { tick = n, time = os.clock() })');
        w.close();
        w.line('task.wait(iv)');
        w.close();
        break;
      case 'exists': {
        var on = wt.existsOn || 'appear';
        w.line('local was = Resolve(' + L(wt.targetId) + ', true) ~= nil');
        w.open('while Running do');
        w.line('task.wait(0.5)');
        w.line('Missing[' + L(wt.targetId) + '] = nil');
        w.line('local inst = Resolve(' + L(wt.targetId) + ', true)');
        w.line('local now = inst ~= nil');
        w.open('if now ~= was then');
        w.line('was = now');
        var cond = on === 'appear' ? 'now' : on === 'disappear' ? 'not now' : 'true';
        w.line('if ' + cond + ' then Fire(' + id + ', { value = now, child = inst }) end');
        w.close();
        w.close();
        break;
      }
      case 'distance':
        w.line('local inside = false');
        w.open('while Running do');
        w.line('task.wait(' + numLit(wt.pollEvery, 0.5) + ')');
        w.line('local okD, d = pcall(function()');
        w.ind++;
        w.line('local inst = Resolve(' + L(wt.targetId) + ', true)');
        w.line('if not inst then return nil end');
        w.line('local p = PosOf(inst)');
        w.line('if not p then return nil end');
        w.line('return (HRP().Position - p).Magnitude');
        w.ind--;
        w.line('end)');
        w.open('if okD and d then');
        w.line('local nowIn = d <= ' + numLit(wt.radius, 10));
        if (wt.onlyEnter !== false) w.line('if nowIn and not inside then Fire(' + id + ', { value = d }) end');
        else w.line('if nowIn then Fire(' + id + ', { value = d }) end');
        w.line('inside = nowIn');
        w.close();
        w.close();
        break;
      case 'respawn':
        w.open('Conn(LP.CharacterAdded:Connect(function(ch)');
        w.line('Fire(' + id + ', { character = ch })');
        w.close('end))');
        if (wt.fireOnStart) w.line('if LP.Character then Fire(' + id + ', { character = LP.Character }) end');
        break;
      case 'start':
        if (U.num(wt.startDelay, 0) > 0) w.line('task.wait(' + numLit(wt.startDelay) + ')');
        w.line('Fire(' + id + ', {})');
        break;
      case 'hotkey':
        w.open('Conn(UserInputService.InputBegan:Connect(function(input, gpe)');
        w.line('if gpe then return end');
        w.line('if input.KeyCode == Enum.KeyCode.' + U.ident(wt.key || 'F', 'F') + ' then Fire(' + id + ', { key = ' + L(wt.key || 'F') + ' }) end');
        w.close('end))');
        break;
      case 'manual':
        w.line('-- dipicu manual (tombol UI / aksi)');
        break;
      default:
        w.line('error("jenis watcher tidak dikenal")');
    }
  }

  /* ================================================================ UI */
  function widgetText(s) { return L(s == null ? '' : s); }
  function colorLit(hex) {
    return /^#?[0-9a-fA-F]{6}$/.test(String(hex || '').trim()) ? 'Color3.fromHex(' + L(String(hex).trim().replace(/^#?/, '#')) + ')' : null;
  }

  // callback tombol berdasarkan binding -> baris Lua di dalam function(done)
  function buttonBody(cfg, bind, ctx) {
    var k = bind && bind.kind, ref = bind && bind.ref;
    switch (k) {
      case 'action': return ref && W.byId(cfg.actions, ref) ? 'RunAction(' + L(ref) + ', ctx)' : null;
      case 'macro': return ref && W.byId(cfg.macros, ref) ? 'RunMacro(' + L(ref) + ', ctx)' : null;
      case 'rule': return ref && W.byId(cfg.rules, ref) ? 'RunRule(' + L(ref) + ', {}, true)' : null;
      case 'watcher': return ref && W.byId(cfg.watchers, ref) ? 'Fire(' + L(ref) + ', {}, true)' : null;
      case 'stopall': return 'StopAll()';
      case 'save': return 'DoSave()';
      case 'load': return 'ApplySaved()';
      case 'reset': return 'ResetAll()';
      case 'refresh': return ref ? 'RefreshOptions(' + L(ref) + ')' : null;
      default: return null;
    }
  }

  function emitWidget(w, cfg, wd, c, ctx) {
    var T_ = wd.type, id = L(wd.id), lab = widgetText(wd.label);
    var loc = wd.locked ? ', locked = true' : '';
    function optStr(extra) { var p = []; if (wd.subtext) p.push('subtext = ' + widgetText(wd.subtext)); if (wd.locked) p.push('locked = true'); if (extra) p = p.concat(extra); return p.length ? '{ ' + p.join(', ') + ' }' : null; }
    switch (T_) {
      case 'Label': {
        var op = ['size = ' + numLit(wd.size, 12)]; if (wd.bold) op.push('bold = true');
        w.line(c + ':Label(' + lab + ', { ' + op.join(', ') + ' })');
        break;
      }
      case 'InfoLabel': {
        w.line('do');
        w.ind++;
        w.line('local _, setVal = ' + c + ':InfoLabel(' + lab + ', ' + widgetText(wd.default == null ? '-' : wd.default) + ')');
        w.line('Widgets[' + id + '] = { set = function(v) setVal(Fmt(v)) end }');
        if (wd.src && wd.src.src && !(wd.src.src === 'fixed' && wd.src.value === '')) {
          w.line('Displays[#Displays + 1] = function()');
          w.ind++; w.line('local ctx = EmptyCtx'); w.line('setVal(Fmt(' + opExpr(cfg, wd.src) + '))'); w.ind--;
          w.line('end');
        }
        w.ind--;
        w.line('end');
        break;
      }
      case 'Badge': {
        var col = colorLit(wd.color);
        w.line(c + ':Badge(' + lab + (col ? ', { color = ' + col + ' }' : '') + ')');
        break;
      }
      case 'Separator': w.line(c + ':Separator(' + lab + ')'); break;
      case 'Divider': w.line(c + ':Divider()'); break;
      case 'Button': {
        var body = buttonBody(cfg, wd.bind);
        var o = [];
        var col2 = colorLit(wd.color); if (col2) o.push('color = ' + col2);
        if (wd.confirm && wd.confirm.enabled) o.push('confirm = { title = ' + widgetText(wd.confirm.title) + ', message = ' + widgetText(wd.confirm.message) + ' }');
        var loading = String(wd.loading || '').trim();
        if (loading) o.push('loading = ' + L(loading));
        var cb = 'function(' + (loading ? 'done' : '') + ')';
        w.open(c + ':Button(' + lab + ', ' + cb);
        if (body) { w.line('Click(function(ctx) ' + body + ' end' + (loading ? ', done' : '') + ')'); }
        else if (loading) w.line('done()');
        w.close('end' + (o.length ? ', { ' + o.join(', ') + ' }' : '') + ')');
        break;
      }
      case 'HalfButtons': {
        var b1 = buttonBody(cfg, wd.bind), b2 = buttonBody(cfg, wd.bind2);
        w.open(c + ':HalfButtons(' + lab + ', ' + widgetText(wd.label2) + ',');
        w.line('function() ' + (b1 ? 'Click(function(ctx) ' + b1 + ' end)' : '') + ' end,');
        w.line('function() ' + (b2 ? 'Click(function(ctx) ' + b2 + ' end)' : '') + ' end');
        w.close(')');
        break;
      }
      case 'Toggle': {
        var key = bindKey(wd.bind);
        w.line('do');
        w.ind++;
        w.line('local h');
        w.open('h = ' + c + ':Toggle(' + lab + ', S[' + id + '] == true, function(on)');
        w.line('S[' + id + '] = on');
        w.line('if BindApply[' + id + '] then BindApply[' + id + '](on) end');
        w.line('MarkDirty()');
        w.close('end' + (optStr() ? ', ' + optStr() : '') + ')');
        w.line('Widgets[' + id + '] = { set = function(v) h:Set(v) end, silent = function(v) h:Set(v, true) end }');
        w.ind--;
        w.line('end');
        break;
      }
      case 'NumberInput':
        w.line('do');
        w.ind++;
        w.line('local h');
        w.open('h = ' + c + ':NumberInput(' + lab + ', S[' + id + '], ' + numLit(wd.step, 1) + ', ' + numLit(wd.min, 0) + ', ' + numLit(wd.max, 100) + ', function(v)');
        w.line('S[' + id + '] = v');
        w.line('MarkDirty()');
        w.close('end)');
        w.line('Widgets[' + id + '] = { set = function(v) h:Set(v) end }');
        w.ind--;
        w.line('end');
        break;
      case 'TextInput':
        w.line('do');
        w.ind++;
        w.line('local box');
        w.open('box = ' + c + ':TextInput(' + lab + ', tostring(S[' + id + ']), function(text)');
        w.line('S[' + id + '] = text');
        w.line('MarkDirty()');
        w.close('end, { placeholder = ' + widgetText(wd.placeholder || '') + ' })');
        w.line('Widgets[' + id + '] = { set = function(v) box.Text = tostring(v); S[' + id + '] = tostring(v); MarkDirty() end }');
        w.ind--;
        w.line('end');
        break;
      case 'Dropdown': {
        var isProfile = wd.bind && wd.bind.kind === 'profile';
        var opts = isProfile ? '' : (wd.options || []).map(L).join(', ');
        w.line('do');
        w.ind++;
        w.line('local p');
        if (isProfile) w.line('local opts = ProfileNames()');
        else w.line('local opts = { ' + opts + ' }');
        w.line('local cur = tostring(S[' + id + '] or opts[1] or "---")');
        w.open('p = ' + c + ':Dropdown(' + lab + ', opts, cur, function(opt)');
        w.line('S[' + id + '] = opt');
        if (isProfile) w.line('ApplyProfile(opt)');
        w.line('MarkDirty()');
        w.close('end)');
        w.line('Widgets[' + id + '] = { set = function(v) p:SetValue(tostring(v), true) end }');
        if (wd.optionsFrom && W.byId(cfg.actions, wd.optionsFrom)) w.line('OptionSources[' + id + '] = { action = ' + L(wd.optionsFrom) + ', proxy = p }');
        w.ind--;
        w.line('end');
        break;
      }
      case 'MultiDropdown': {
        w.line('do');
        w.ind++;
        w.line('local p');
        w.open('p = ' + c + ':MultiDropdown(' + lab + ', { ' + (wd.options || []).map(L).join(', ') + ' }, S[' + id + '], function(sel)');
        w.line('S[' + id + '] = sel');
        w.line('MarkDirty()');
        w.close('end)');
        w.line('Widgets[' + id + '] = { set = function(v) p:SetSelected(v); S[' + id + '] = v; MarkDirty() end }');
        if (wd.optionsFrom && W.byId(cfg.actions, wd.optionsFrom)) w.line('OptionSources[' + id + '] = { action = ' + L(wd.optionsFrom) + ', proxy = p, multi = true }');
        w.ind--;
        w.line('end');
        break;
      }
      case 'Segment':
        w.line('do');
        w.ind++;
        w.line('local h');
        w.open('h = ' + c + ':Segment(' + lab + ', { ' + (wd.options || []).map(L).join(', ') + ' }, tostring(S[' + id + ']), function(opt)');
        w.line('S[' + id + '] = opt');
        w.line('MarkDirty()');
        w.close('end)');
        w.line('Widgets[' + id + '] = { set = function(v) h:Set(tostring(v)) end }');
        w.ind--;
        w.line('end');
        break;
      case 'ProgressBar': {
        w.line('do');
        w.ind++;
        w.line('local pb = ' + c + ':ProgressBar(' + lab + ', 0)');
        w.line('Widgets[' + id + '] = { set = function(v) pb:Set(math.clamp((tonumber(v) or 0) / ' + numLit(wd.max, 100) + ' * 100, 0, 100)) end }');
        if (wd.src && wd.src.src && !(wd.src.src === 'fixed' && wd.src.value === '')) {
          w.line('Displays[#Displays + 1] = function()');
          w.ind++; w.line('local ctx = EmptyCtx'); w.line('Widgets[' + id + '].set(' + opExpr(cfg, wd.src) + ')'); w.ind--;
          w.line('end');
        }
        w.ind--;
        w.line('end');
        break;
      }
      case 'List':
        w.line('do');
        w.ind++;
        w.line('local l = ' + c + ':List(' + lab + ', { height = ' + numLit(wd.height, 110) + ' })');
        w.line('Widgets[' + id + '] = { set = function(v) l:Add(Fmt(v)) end }');
        if (wd.isLog) {
          w.line('LogLists[#LogLists + 1] = l');
          w.line('for _, line in ipairs(LogBuf) do l:Add(line) end');
        }
        w.ind--;
        w.line('end');
        break;
      case 'Table': {
        var hd = '{ ' + (wd.headers || []).map(L).join(', ') + ' }';
        var rows = '{ ' + (wd.rows || []).map(function (r) { return '{ ' + r.map(function (x) { return L(x); }).join(', ') + ' }'; }).join(', ') + ' }';
        w.line(c + ':Table(' + ((wd.headers || []).length ? hd : 'nil') + ', ' + rows + ')');
        break;
      }
      case 'CopyButton':
        w.line(c + ':CopyButton(' + lab + ', ' + widgetText(wd.value) + ')');
        break;
      case 'Accordion': {
        var sk = 'acc_' + wd.id;
        if (wd.open) w.line('Win._accordionStates[' + L(sk) + '] = true');
        w.open(c + ':Accordion(' + lab + ', ' + L(sk) + ', function(sec' + wd.id.replace(/[^A-Za-z0-9]/g, '') + ')');
        var inner = 'sec' + wd.id.replace(/[^A-Za-z0-9]/g, '');
        (wd.children || []).forEach(function (ch) { emitWidget(w, cfg, ch, inner, ctx); });
        w.close('end)');
        break;
      }
      case 'Custom':
        w.open(c + ':Custom(function(container, y, theme)');
        w.raw(String(wd.code || '').replace(/\r\n?/g, '\n'));
        w.close('end)');
        break;
      default:
        w.line('-- widget tidak dikenal: ' + U.ident(T_, 'x'));
    }
  }

  function bindKey(b) {
    if (!b || !b.ref) return null;
    if (b.kind === 'rule') return 'rule:' + b.ref;
    if (b.kind === 'watcher') return 'watcher:' + b.ref;
    if (b.kind === 'macro') return 'macro:' + b.ref;
    if (b.kind === 'action') return 'loop:' + b.ref;
    return null;
  }

  /* ================================================================ nilai awal widget */
  function widgetDefault(wd) {
    switch (wd.type) {
      case 'Toggle': return wd.default === true || wd.default === 'true' ? 'true' : 'false';
      case 'NumberInput': return numLit(wd.default, U.num(wd.min, 0));
      case 'TextInput': return L(wd.default == null ? '' : wd.default);
      case 'Dropdown': {
        if (wd.bind && wd.bind.kind === 'profile') return 'nil';
        var o = wd.options || []; var d = wd.default != null && wd.default !== '' ? wd.default : o[0];
        return d == null ? 'nil' : L(d);
      }
      case 'MultiDropdown': return '{ ' + (Array.isArray(wd.default) ? wd.default : []).map(L).join(', ') + ' }';
      case 'Segment': { var so = wd.options || []; var sd = wd.default != null && wd.default !== '' ? wd.default : so[0]; return sd == null ? 'nil' : L(sd); }
      default: return null;
    }
  }

  /* ================================================================ MAIN */
  function generate(cfgIn, optsIn) {
    var cfg = LSB.migrate(U.clone(cfgIn));
    var opts = Object.assign({ minify: cfg.project.minify, comments: cfg.project.comments }, optsIn || {});
    var P = cfg.project;
    var name = U.fileName(P.name);
    var w = new Writer(opts);
    var warnings = [];

    var actNames = uniqueNames(cfg.actions, 'Action', function (a) { return a.name; });
    var watNames = {};
    cfg.watchers.forEach(function (x, i) { var k = M.watcherKind(x.kind); watNames[x.id] = x.name || ((k ? k.label : 'Watcher') + ' #' + (i + 1)); });
    var allW = W.allWidgets(cfg);

    /* ---- header ---- */
    w.line('--[[');
    w.line('    ' + name + '.lua');
    w.line('    Dibuat dengan Lulu Script Builder v' + LSB.VERSION + (opts.stamp === false ? '' : ' - ' + new Date().toISOString().slice(0, 10)));
    w.line('    UI: LuluUI (dimuat dari URL raw GitHub)');
    w.line(']]');
    w.blank();
    w.line('local SCRIPT_NAME = ' + L(name));
    w.line('local LULU_URL = ' + L(P.luluUrl));
    w.blank();

    /* ---- 1. services + LuluUI ---- */
    w.banner('1. SERVICES + LULUUI');
    w.raw(R.services);
    w.blank();
    w.raw(R.loadLulu);
    w.blank();

    /* ---- 2. compat ---- */
    w.banner('2. KOMPATIBILITAS EXECUTOR');
    w.raw(R.compat.replace('%FNS%', '{ ' + M.EXECUTOR_FNS.map(L).join(', ') + ' }'));
    w.blank();

    /* ---- 3. config ---- */
    w.banner('3. CONFIG');
    w.line('local CONFIG = {');
    w.ind++;
    w.line('name = ' + L(name) + ',');
    w.line('folder = ' + L(name) + ',');
    w.line('resolveTimeout = ' + numLit(P.resolveTimeout, 10) + ',');
    w.line('maxActionsPerSecond = ' + numLit(P.maxActionsPerSecond, 30) + ',');
    w.line('ruleBurst = ' + numLit(P.ruleBurst, 25) + ',');
    w.line('autosave = ' + (P.autosave ? 'true' : 'false') + ',');
    w.line('debug = ' + (P.debug ? 'true' : 'false') + ',');
    w.line('placeGuard = ' + L(P.placeGuard || 'warn') + ',');
    var pids = (P.placeIds || []).map(function (x) { return Math.floor(Number(x)); }).filter(function (x) { return isFinite(x) && x > 0; });
    w.line('placeIds = { ' + pids.join(', ') + ' },');
    w.ind--;
    w.line('}');
    w.blank();
    w.line('local Targets = {');
    w.ind++;
    cfg.targets.forEach(function (t) {
      w.line('[' + L(t.id) + '] = { alias = ' + L(t.alias || t.id) + ', path = ' + L(String(t.path || '').trim()) + ', kind = ' + L(t.type || 'auto') + ' },');
    });
    w.ind--;
    w.line('}');
    w.blank();
    w.raw(R.singleton);
    w.blank();

    /* ---- 4. state ---- */
    w.banner('4. STATE');
    w.raw(R.state);
    w.line('local Actions, ActionsById, Macros, Rules, Watchers, WatcherRules, WatcherStart = {}, {}, {}, {}, {}, {}, {}');
    var valueWidgets = allW.filter(function (x) { return M.VALUE_WIDGETS.indexOf(x.w.type) >= 0; });
    var persistIds = valueWidgets.filter(function (x) { return x.w.persist !== false; }).map(function (x) { return L(x.w.id); });
    w.line('local PersistIds = { ' + persistIds.join(', ') + ' }');
    w.blank();
    w.cm('nilai awal widget (Defaults) lalu timpa dengan data tersimpan');
    w.line('local Defaults = {}');
    valueWidgets.forEach(function (x) { var d = widgetDefault(x.w); if (d != null && d !== 'nil') w.line('Defaults[' + L(x.w.id) + '] = ' + d); });
    w.line('local ProfileData = {');
    w.ind++;
    cfg.profiles.forEach(function (pr) {
      var vals = Object.keys(pr.values || {}).filter(function (k) { return W.widget(cfg, k); }).map(function (k) {
        var v = pr.values[k], wd = W.widget(cfg, k), lit;
        if (typeof v === 'boolean') lit = String(v); else if (typeof v === 'number') lit = U.luaNum(v); else if (Array.isArray(v)) lit = '{ ' + v.map(L).join(', ') + ' }'; else lit = (wd.type === 'NumberInput' && v !== '' && isFinite(Number(v))) ? U.luaNum(Number(v)) : (wd.type === 'Toggle' ? (String(v) === 'true' ? 'true' : 'false') : L(v));
        return '[' + L(k) + '] = ' + lit;
      });
      w.line('{ name = ' + L(pr.name) + ', values = { ' + vals.join(', ') + ' } },');
    });
    w.ind--;
    w.line('}');
    w.blank();

    /* ---- 5. core ---- */
    w.banner('5. UTILITAS INTI');
    w.raw(R.core);
    w.blank();
    w.banner('6. RESOLVER PATH');
    w.raw(R.resolver);
    w.blank();
    w.banner('7. SIMPAN / MUAT');
    w.raw(R.save);
    w.blank();

    w.line('local Saved = LoadSaved()');
    w.line('for id, v in pairs(Defaults) do S[id] = v end');
    w.line('for id, v in pairs(Saved) do');
    w.line('    if Defaults[id] ~= nil and type(v) == type(Defaults[id]) then S[id] = v end');
    w.line('end');
    w.line('CurrentProfile = Saved.__profile');
    w.blank();

    w.line('local function ProfileNames()');
    w.line('    local n = {}');
    w.line('    for _, p in ipairs(ProfileData) do n[#n + 1] = p.name end');
    w.line('    if #n == 0 then n[1] = "-" end');
    w.line('    return n');
    w.line('end');
    w.line('local function ApplyProfile(nm)');
    w.line('    for _, p in ipairs(ProfileData) do');
    w.line('        if p.name == nm then');
    w.line('            CurrentProfile = nm');
    w.line('            for id, v in pairs(p.values) do SetWidget(id, v) end');
    w.line('            Log("Profil: " .. nm)');
    w.line('            return true');
    w.line('        end');
    w.line('    end');
    w.line('    return false');
    w.line('end');
    w.line('local function ApplySaved()');
    w.line('    local d = LoadSaved()');
    w.line('    local n = 0');
    w.line('    for id, v in pairs(d) do');
    w.line('        if Defaults[id] ~= nil then SetWidget(id, v); n = n + 1 end');
    w.line('    end');
    w.line('    Notify(n > 0 and ("Dimuat " .. n .. " pengaturan") or "Tidak ada data tersimpan", n > 0 and "success" or "warning")');
    w.line('end');
    w.line('local function DoSave()');
    w.line('    local ok = SaveNow()');
    w.line('    Notify(ok and "Pengaturan disimpan" or "Gagal menyimpan (executor tidak mendukung writefile)", ok and "success" or "error")');
    w.line('end');
    w.line('local function ResetAll()');
    w.line('    for id, v in pairs(Defaults) do SetWidget(id, v) end');
    w.line('    if Compat.delfile and Compat.isfile then pcall(function() if Compat.isfile(CfgFile()) then Compat.delfile(CfgFile()) end end) end');
    w.line('    Notify("Pengaturan di-reset", "info")');
    w.line('end');
    w.blank();

    /* ---- mesin ---- */
    w.banner('8. MESIN (aksi, makro, rule, watcher)');
    w.raw(R.engine);
    w.blank();
    w.line('local function Click(fn, done)');
    w.line('    task.spawn(function()');
    w.line('        local ctx = NewCtx()');
    w.line('        local ok, err = pcall(fn, ctx)');
    w.line('        if not ok then Log("Error tombol: " .. tostring(err), "error") end');
    w.line('        if done then done() end');
    w.line('    end)');
    w.line('end');
    w.blank();
    w.line('local function RefreshOptions(wid)');
    w.line('    local src = OptionSources[wid]');
    w.line('    if not src then return end');
    w.line('    Click(function(ctx)');
    w.line('        local ok = RunAction(src.action, ctx)');
    w.line('        if not ok then return end');
    w.line('        local opts = ToOptions(Results[src.action])');
    w.line('        if #opts == 0 then opts = { "---" } end');
    w.line('        src.proxy:SetOptions(opts, true)');
    w.line('        if not src.multi then');
    w.line('            local found = false');
    w.line('            for _, o in ipairs(opts) do if o == S[wid] then found = true end end');
    w.line('            if not found then');
    w.line('                S[wid] = opts[1]');
    w.line('                src.proxy:SetValue(tostring(opts[1]))');
    w.line('            end');
    w.line('        end');
    w.line('    end)');
    w.line('end');
    w.blank();

    /* ---- aksi ---- */
    w.banner('9. AKSI');
    cfg.actions.forEach(function (a) {
      var kd = M.actionKind(a.kind) || {};
      var nm = actNames[a.id];
      w.blank();
      if (a.note) w.cm(a.note);
      w.open('Actions.' + nm + ' = function(ctx)');
      emitActionBody(w, cfg, a);
      w.close('end');
      var needs = (kd.needs || []).map(L).join(', ');
      w.line('ActionsById[' + L(a.id) + '] = { name = ' + L(a.name || nm) + ', fn = Actions.' + nm + ', needs = {' + (needs ? ' ' + needs + ' ' : '') + '}, cooldown = ' + numLit(a.cooldown) + ', last = -1e9, delay = ' + numLit(a.delay) + ', after = ' + numLit(a.after) + ', retry = ' + Math.min(5, Math.max(0, Math.floor(U.num(a.retry, 0)))) + ', ignoreError = ' + (a.ignoreError ? 'true' : 'false') + ' }');
    });
    w.blank();

    /* ---- makro ---- */
    w.banner('10. MAKRO');
    cfg.macros.forEach(function (m) {
      var steps = (m.steps || []).map(function (s) {
        if (s.wait != null && s.wait !== '') return '{ wait = ' + numLit(s.wait, 1) + ' }';
        if (s.action && W.byId(cfg.actions, s.action)) return '{ action = ' + L(s.action) + ' }';
        return null;
      }).filter(Boolean);
      w.line('Macros[' + L(m.id) + '] = { name = ' + L(m.name || m.id) + ', loop = ' + (m.loop ? 'true' : 'false') + ', count = ' + Math.max(1, Math.floor(U.num(m.count, 1))) + ', interval = ' + numLit(m.interval, 0.1) + ', steps = { ' + steps.join(', ') + ' } }');
    });
    w.blank();

    /* ---- rule ---- */
    w.banner('11. RULE');
    cfg.rules.forEach(function (r) {
      var steps = (r.steps || []).filter(function (s) { return W.byId(cfg.actions, s.id); }).map(function (s) { return '{ id = ' + L(s.id) + ', delay = ' + numLit(s.delay) + ' }'; });
      w.open('Rules[' + L(r.id) + '] = {');
      w.line('name = ' + L(r.name || r.id) + ', mode = ' + L(r.mode === 'parallel' ? 'parallel' : 'sequence') + ', onFail = ' + L(r.onFail || 'continue') + ', fallback = ' + L(r.fallback || '') + ',');
      w.line('cooldown = ' + numLit(r.cooldown) + ', maxRuns = ' + Math.max(0, Math.floor(U.num(r.maxRuns, 0))) + ', overlap = ' + (r.allowOverlap ? 'true' : 'false') + ',');
      w.line('runs = 0, last = -1e9, busy = false, bt = 0, bn = 0, enabled = ' + (r.enabled === false ? 'false' : 'true') + ',');
      w.line('steps = { ' + steps.join(', ') + ' },');
      var hasCond = r.cond && (r.cond.cmp || (r.cond.items && r.cond.items.length));
      if (hasCond) w.line('cond = function(ctx) return ' + condExpr(cfg, r.cond) + ' end,');
      w.close('}');
      w.line('Flags.rule[' + L(r.id) + '] = Rules[' + L(r.id) + '].enabled');
    });
    w.blank();

    /* ---- watcher ---- */
    w.banner('12. WATCHER');
    cfg.watchers.forEach(function (wt) {
      w.line('Watchers[' + L(wt.id) + '] = { name = ' + L(watNames[wt.id]) + ', kind = ' + L(wt.kind) + ' }');
      w.line('Flags.watcher[' + L(wt.id) + '] = ' + (wt.enabled === false ? 'false' : 'true'));
    });
    var wr = {};
    cfg.rules.forEach(function (r) { if (r.when && W.byId(cfg.watchers, r.when)) (wr[r.when] = wr[r.when] || []).push(r); });
    Object.keys(wr).forEach(function (k) {
      wr[k].sort(function (a, b) { return U.num(b.priority, 0) - U.num(a.priority, 0); });
      w.line('WatcherRules[' + L(k) + '] = { ' + wr[k].map(function (r) { return L(r.id); }).join(', ') + ' }');
    });
    cfg.watchers.forEach(function (wt) {
      w.blank();
      w.open('WatcherStart[' + L(wt.id) + '] = function()');
      emitWatcherStart(w, cfg, wt);
      w.close('end');
    });
    w.blank();

    /* ---- cleanup ---- */
    w.raw(R.cleanup);
    w.blank();

    /* ---- UI ---- */
    w.banner('13. UI (LuluUI)');
    w.line('pcall(function() LuluUI.SetTheme(' + L(P.theme || 'Dark') + ') end)');
    var wopts = ['title = ' + L(P.title || name)];
    wopts.push('subtitle = ' + L(P.subtitle || 'by Lulu Script Builder'));
    wopts.push('width = ' + numLit(P.width, 330), 'height = ' + numLit(P.height, 300));
    if (P.icon) wopts.push('icon = ' + L(/^\d+$/.test(P.icon.trim()) ? 'rbxassetid://' + P.icon.trim() : P.icon.trim()));
    if (P.skipLoading) wopts.push('skipLoading = true');
    if (P.loadingTitle) wopts.push('loadingTitle = ' + L(P.loadingTitle));
    if (P.loadingDesc) wopts.push('loadingDesc = ' + L(P.loadingDesc));
    if (P.loadingCreator) wopts.push('loadingCreator = ' + L(P.loadingCreator));
    wopts.push('name = ' + L('LSB_' + name));
    w.line('Win = LuluUI.new({ ' + wopts.join(', ') + ' })');
    w.line('Win:OnClose(Cleanup)');
    w.line('local StartAll');
    w.blank();

    // binding Toggle -> logic
    var toggleBinds = [];
    allW.forEach(function (x) {
      var wd = x.w; if (wd.type !== 'Toggle') return;
      var b = wd.bind || {}, key = bindKey(b); if (!key) return;
      var valid = (b.kind === 'rule' && W.byId(cfg.rules, b.ref)) || (b.kind === 'watcher' && W.byId(cfg.watchers, b.ref)) || (b.kind === 'macro' && W.byId(cfg.macros, b.ref)) || (b.kind === 'action' && W.byId(cfg.actions, b.ref));
      if (!valid) return;
      toggleBinds.push({ wd: wd, b: b, key: key });
    });
    if (toggleBinds.length) {
      w.cm('binding Toggle -> rule / watcher / makro / loop');
      toggleBinds.forEach(function (tb) {
        var id = L(tb.wd.id), ref = L(tb.b.ref);
        w.line('ToggleFor[' + L(tb.key) + '] = ' + id);
        w.open('BindApply[' + id + '] = function(on)');
        if (tb.b.kind === 'rule') w.line('Flags.rule[' + ref + '] = on');
        else if (tb.b.kind === 'watcher') w.line('Flags.watcher[' + ref + '] = on');
        else if (tb.b.kind === 'macro') {
          w.line('if on then StartTask(' + L(tb.key) + ', function(ctx) RunMacro(' + ref + ', ctx) end) else StopTask(' + L(tb.key) + ') end');
        } else {
          w.line('if on then StartTask(' + L(tb.key) + ', function(ctx) RunAction(' + ref + ', ctx) end) else StopTask(' + L(tb.key) + ') end');
        }
        w.close('end');
      });
      w.blank();
    }

    cfg.ui.tabs.forEach(function (tab, ti) {
      w.blank();
      w.cm('tab: ' + String(tab.name).replace(/[\r\n]/g, ' '));
      w.line('do');
      w.ind++;
      w.line('local tab = Win:Tab(' + L(tab.name || ('Tab ' + (ti + 1))) + ')');
      (tab.widgets || []).forEach(function (wd) { emitWidget(w, cfg, wd, 'tab'); });
      w.ind--;
      w.line('end');
    });

    // tab Info
    if (P.infoTab) {
      w.blank();
      w.cm('tab bawaan: Info (kontrol, kompatibilitas, log)');
      w.line('do');
      w.ind++;
      w.line('local info = Win:Tab("Info")');
      w.line('info:Separator("Kontrol")');
      w.line('info:Button("⛔ Stop Semua", function() Click(function() StopAll() end) end, { color = Color3.fromRGB(200, 60, 60) })');
      w.line('info:HalfButtons("Simpan", "Muat", function() DoSave() end, function() ApplySaved() end)');
      w.line('info:Button("Reset Pengaturan", function() ResetAll() end, { confirm = { title = "Reset", message = "Kembalikan semua pengaturan ke bawaan?" } })');
      if (pids.length && P.placeGuard === 'hold') w.line('info:Button("▶ Jalankan Tetap (game tidak sesuai)", function() if StartAll then StartAll() end end, { color = Color3.fromRGB(210, 150, 0) })');
      w.line('info:Separator("Kompatibilitas Executor")');
      w.line('local compatList = info:List("Fungsi executor", { height = 120, columns = { "Fungsi", "Status" } })');
      w.line('local function CheckCompat()');
      w.line('    compatList:Clear()');
      w.line('    local names = {}');
      w.line('    for k in pairs(Compat) do if string.sub(k, 1, 1) ~= "_" then names[#names + 1] = k end end');
      w.line('    table.sort(names)');
      w.line('    local okN = 0');
      w.line('    for _, k in ipairs(names) do');
      w.line('        local has = Compat[k] ~= nil');
      w.line('        if has then okN = okN + 1 end');
      w.line('        compatList:Add({ k, has and "ada" or "tidak ada" })');
      w.line('    end');
      w.line('    Notify("Kompatibilitas: " .. okN .. "/" .. #names .. " fungsi tersedia", okN == #names and "success" or "warning")');
      w.line('end');
      w.line('info:Button("Cek Kompatibilitas", function() CheckCompat() end)');
      w.line('info:Separator("Log")');
      w.line('local logList = info:List("Log aktivitas", { height = 130 })');
      w.line('LogLists[#LogLists + 1] = logList');
      w.line('for _, line in ipairs(LogBuf) do logList:Add(line) end');
      w.line('info:Button("Bersihkan Log", function() logList:Clear() end)');
      w.line('info:Label("Lulu Script Builder v' + LSB.VERSION + '", { size = 10 })');
      w.ind--;
      w.line('end');
    }

    // panel opsional
    var ip = cfg.ui.infoPanel;
    if (ip && ip.enabled) {
      w.blank();
      w.cm('InfoPanel (FPS/CPU/Ping + baris status)');
      w.line('do');
      w.ind++;
      w.line('local panel = Win:InfoPanel({})');
      (ip.lines || []).forEach(function (ln, i) {
        w.line('local ln' + (i + 1) + ' = panel:Line(' + L((ln.label || '') + ': -') + ')');
        w.open('Displays[#Displays + 1] = function()');
        w.line('local ctx = EmptyCtx');
        w.line('ln' + (i + 1) + '.Text = ' + L((ln.label || '') + ': ') + ' .. Fmt(' + opExpr(cfg, ln.src) + ')');
        w.close('end');
      });
      w.ind--;
      w.line('end');
    }
    if (cfg.ui.locationPanel) {
      w.blank();
      w.cm('LocationPanel (Walk / Back)');
      w.line('do');
      w.ind++;
      w.line('local LocState = {}');
      w.open('local panel = Win:LocationPanel({}, function(name, lanes)');
      w.open('Click(function(ctx)');
      w.line('local st = LocState[name]');
      w.open('if not st then');
      w.line('LocState[name] = { origin = HRP().CFrame }');
      w.line('for _, p in ipairs(lanes) do');
      w.line('    ' + (cfg.ui.locationMode === 'teleport' ? 'HRP().CFrame = CFrame.new(p)' : 'local hum = Hum(); hum:MoveTo(p); hum.MoveToFinished:Wait()'));
      w.line('end');
      w.ind--;
      w.line('else');
      w.ind++;
      w.line('HRP().CFrame = st.origin');
      w.line('LocState[name] = nil');
      w.close();
      w.close('end)');
      w.close('end)');
      (cfg.ui.locations || []).forEach(function (loc) {
        var lanes = (loc.lanes || []).map(function (p) { var v = nums(p); while (v.length < 3) v.push(0); return 'Vector3.new(' + v.slice(0, 3).map(U.luaNum).join(', ') + ')'; });
        w.line('panel:AddLocation(' + L(loc.name || 'Lokasi') + ', { ' + lanes.join(', ') + ' })');
      });
      w.ind--;
      w.line('end');
    }
    w.blank();

    /* ---- start ---- */
    w.banner('14. JALANKAN');
    w.line('local Started = false');
    w.open('StartAll = function()');
    w.line('if Started then return end');
    w.line('Started = true');
    w.line('for wid, fn in pairs(BindApply) do pcall(fn, S[wid]) end');
    w.line('for wid, fn in pairs(WatcherStart) do SafeStart(wid, fn) end');
    w.line('for wid in pairs(OptionSources) do RefreshOptions(wid) end');
    w.line('task.spawn(function()');
    w.line('    while Running do');
    w.line('        for _, f in ipairs(Displays) do pcall(f) end');
    w.line('        task.wait(0.5)');
    w.line('    end');
    w.line('end)');
    w.close('end');
    w.blank();
    w.raw(R.register);
    w.blank();
    w.line('local guardOk = true');
    w.open('if #CONFIG.placeIds > 0 then');
    w.line('local here = false');
    w.line('for _, pid in ipairs(CONFIG.placeIds) do');
    w.line('    if pid == game.PlaceId or pid == game.GameId then here = true end');
    w.line('end');
    w.open('if not here then');
    w.line('guardOk = false');
    w.line('Log("Game ini tidak ada di daftar yang diizinkan (PlaceId " .. tostring(game.PlaceId) .. ")", "error")');
    w.open('if CONFIG.placeGuard == "stop" then');
    w.line('warn("[" .. SCRIPT_NAME .. "] Game tidak sesuai, script dihentikan.")');
    w.line('Cleanup()');
    w.line('Win:Destroy()');
    w.line('return');
    w.ind--;
    w.line('elseif CONFIG.placeGuard == "hold" then');
    w.ind++;
    w.line('Notify("Game tidak sesuai! Tekan Jalankan Tetap di tab Info", "warning")');
    w.ind--;
    w.line('else');
    w.ind++;
    w.line('Notify("Peringatan: game ini bukan target script", "warning")');
    w.line('guardOk = true');
    w.close();
    w.close();
    w.close();
    w.line('if guardOk then StartAll() end');
    w.blank();
    w.line('Log("' + name + ' siap")');

    var code = w.toString();
    if (opts.minify) code = code.replace(/\n{2,}/g, '\n');

    // peringatan kecil
    if (!cfg.targets.length && !cfg.actions.length) warnings.push('Project masih kosong.');
    if (/USERNAME\/REPO/.test(P.luluUrl)) warnings.push('URL raw LuluUI masih contoh: ganti dengan URL repo GitHub kamu.');

    return {
      code: code, fileName: name + '.lua', warnings: warnings,
      stats: { lines: code.split('\n').length, bytes: code.length, actions: cfg.actions.length, watchers: cfg.watchers.length, rules: cfg.rules.length }
    };
  }

  LSB.generate = generate;
  LSB.gen = { opExpr: opExpr, condExpr: condExpr, fixedLit: fixedLit, autoLit: autoLit };
  if (typeof module !== 'undefined') module.exports = LSB;
})(typeof window !== 'undefined' ? window : globalThis);
