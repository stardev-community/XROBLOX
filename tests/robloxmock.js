'use strict';
/*
 * robloxmock.js - tiruan lingkungan Roblox + executor untuk menjalankan LuluUI asli
 * dan script hasil generator di dalam luavm.js. Hanya untuk pengujian.
 */
const { VM, LuaTable, Native, LuaError, Thread, type } = require('./luavm.js');

function createEnv(opts) {
  opts = opts || {};
  const vm = new VM(); const G = vm.G;
  const N = (name, fn, gen) => new Native(name, fn, gen);
  const mock = { vm, files: new Map(), folders: new Set(), clipboard: null, remoteCalls: [], invokeHandlers: {}, http: {}, notifyLog: [], insts: [], executor: opts.executor || null };

  /* ---------------------------------------------------------------- signal */
  const SignalMeta = new LuaTable();
  function newSignal() { return { handlers: [], waiters: [], once: [] }; }
  function signalObj(sig) { const t = new LuaTable(); t.sig = sig; t.meta = SignalMeta; return t; }
  function connObj(h) {
    const t = new LuaTable(); t.h = h; t.meta = ConnMeta; t.set('Connected', true); return t;
  }
  const ConnMeta = new LuaTable();
  ConnMeta.set('__index', N('idx', (a) => {
    if (a[1] === 'Disconnect') return N('Disconnect', (b) => { b[0].h.connected = false; b[0].set('Connected', false); const s = b[0].h.sig; s.handlers = s.handlers.filter(x => x !== b[0].h); });
    return undefined;
  }));
  ConnMeta.set('__typename', 'RBXScriptConnection');
  SignalMeta.set('__typename', 'RBXScriptSignal');
  SignalMeta.set('__index', N('idx', (a) => {
    const k = a[1];
    if (k === 'Connect') return N('Connect', (b) => { const h = { fn: b[1], connected: true, sig: b[0].sig }; b[0].sig.handlers.push(h); return connObj(h); });
    if (k === 'Once') return N('Once', (b) => { b[0].sig.once.push(b[1]); });
    if (k === 'Wait') return N('Wait', function* (b) { const r = yield { kind: 'signal', sig: b[0].sig }; return r || []; }, true);
    return undefined;
  }));
  const fire = (sig, args) => vm.fireSignal(sig, args || []);
  mock.fireSignal = fire;

  /* ---------------------------------------------------------------- tipe data */
  const typed = (name, fields, metaFns) => {
    const t = new LuaTable(); for (const k of Object.keys(fields)) t.set(k, fields[k]);
    t.meta = metaFns; return t;
  };
  const mkMeta = (name, extra) => { const m = new LuaTable(); m.set('__typename', name); if (extra) for (const k of Object.keys(extra)) m.set(k, extra[k]); return m; };
  const num = (v) => (typeof v === 'number' ? v : 0);

  const V3Meta = mkMeta('Vector3');
  const V3 = (x, y, z) => { const t = new LuaTable(); t.set('X', x); t.set('Y', y); t.set('Z', z); t.meta = V3Meta; return t; };
  const v3a = (t) => [t.get('X'), t.get('Y'), t.get('Z')];
  V3Meta.set('__index', N('idx', (a) => { const [x, y, z] = v3a(a[0]); if (a[1] === 'Magnitude') return Math.hypot(x, y, z); if (a[1] === 'Unit') { const m = Math.hypot(x, y, z) || 1; return V3(x / m, y / m, z / m); } return undefined; }));
  V3Meta.set('__add', N('add', (a) => { const p = v3a(a[0]), q = v3a(a[1]); return V3(p[0] + q[0], p[1] + q[1], p[2] + q[2]); }));
  V3Meta.set('__sub', N('sub', (a) => { const p = v3a(a[0]), q = v3a(a[1]); return V3(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }));
  V3Meta.set('__mul', N('mul', (a) => { if (typeof a[1] === 'number') { const p = v3a(a[0]); return V3(p[0] * a[1], p[1] * a[1], p[2] * a[1]); } const p = v3a(a[0]), q = v3a(a[1]); return V3(p[0] * q[0], p[1] * q[1], p[2] * q[2]); }));
  V3Meta.set('__eq', N('eq', (a) => v3a(a[0]).every((v, i) => v === v3a(a[1])[i])));
  V3Meta.set('__tostring', N('ts', (a) => v3a(a[0]).join(', ')));
  const Vector3 = new LuaTable(); G.set('Vector3', Vector3);
  Vector3.set('new', N('new', (a) => V3(num(a[0]), num(a[1]), num(a[2])))); Vector3.set('zero', V3(0, 0, 0)); Vector3.set('one', V3(1, 1, 1));

  const V2Meta = mkMeta('Vector2'); const V2 = (x, y) => { const t = new LuaTable(); t.set('X', x); t.set('Y', y); t.meta = V2Meta; return t; };
  V2Meta.set('__add', N('add', (a) => V2(a[0].get('X') + a[1].get('X'), a[0].get('Y') + a[1].get('Y'))));
  V2Meta.set('__sub', N('sub', (a) => V2(a[0].get('X') - a[1].get('X'), a[0].get('Y') - a[1].get('Y'))));
  V2Meta.set('__mul', N('mul', (a) => typeof a[1] === 'number' ? V2(a[0].get('X') * a[1], a[0].get('Y') * a[1]) : V2(a[0].get('X') * a[1].get('X'), a[0].get('Y') * a[1].get('Y'))));
  V2Meta.set('__eq', N('eq', (a) => a[0].get('X') === a[1].get('X') && a[0].get('Y') === a[1].get('Y')));
  V2Meta.set('__index', N('idx', (a) => a[1] === 'Magnitude' ? Math.hypot(a[0].get('X'), a[0].get('Y')) : undefined));
  const Vector2 = new LuaTable(); G.set('Vector2', Vector2); Vector2.set('new', N('new', (a) => V2(num(a[0]), num(a[1])))); Vector2.set('zero', V2(0, 0));

  const CFMeta = mkMeta('CFrame');
  const CF = (x, y, z) => { const t = new LuaTable(); t.set('X', x); t.set('Y', y); t.set('Z', z); t.set('Position', V3(x, y, z)); t.meta = CFMeta; return t; };
  CFMeta.set('__add', N('add', (a) => { const p = a[0].get('Position'), q = a[1]; return CF(p.get('X') + q.get('X'), p.get('Y') + q.get('Y'), p.get('Z') + q.get('Z')); }));
  CFMeta.set('__sub', N('sub', (a) => { const p = a[0].get('Position'), q = a[1]; return CF(p.get('X') - q.get('X'), p.get('Y') - q.get('Y'), p.get('Z') - q.get('Z')); }));
  CFMeta.set('__mul', N('mul', (a) => a[0]));
  CFMeta.set('__eq', N('eq', (a) => a[0].get('X') === a[1].get('X') && a[0].get('Y') === a[1].get('Y') && a[0].get('Z') === a[1].get('Z')));
  const CFrame = new LuaTable(); G.set('CFrame', CFrame);
  CFrame.set('new', N('new', (a) => { if (a[0] instanceof LuaTable) return CF(a[0].get('X'), a[0].get('Y'), a[0].get('Z')); return CF(num(a[0]), num(a[1]), num(a[2])); })); CFrame.set('identity', CF(0, 0, 0));

  const UDimMeta = mkMeta('UDim'); const UD = (s, o) => { const t = new LuaTable(); t.set('Scale', s); t.set('Offset', o); t.meta = UDimMeta; return t; };
  const UD2Meta = mkMeta('UDim2'); const UD2 = (xs, xo, ys, yo) => { const t = new LuaTable(); t.set('X', UD(xs, xo)); t.set('Y', UD(ys, yo)); t.set('Width', UD(xs, xo)); t.set('Height', UD(ys, yo)); t.meta = UD2Meta; return t; };
  UD2Meta.set('__add', N('add', (a) => UD2(a[0].get('X').get('Scale') + a[1].get('X').get('Scale'), a[0].get('X').get('Offset') + a[1].get('X').get('Offset'), a[0].get('Y').get('Scale') + a[1].get('Y').get('Scale'), a[0].get('Y').get('Offset') + a[1].get('Y').get('Offset'))));
  UD2Meta.set('__sub', N('sub', (a) => UD2(a[0].get('X').get('Scale') - a[1].get('X').get('Scale'), a[0].get('X').get('Offset') - a[1].get('X').get('Offset'), a[0].get('Y').get('Scale') - a[1].get('Y').get('Scale'), a[0].get('Y').get('Offset') - a[1].get('Y').get('Offset'))));
  UD2Meta.set('__eq', N('eq', (a) => ['X', 'Y'].every(k => a[0].get(k).get('Scale') === a[1].get(k).get('Scale') && a[0].get(k).get('Offset') === a[1].get(k).get('Offset'))));
  const UDim2 = new LuaTable(); G.set('UDim2', UDim2);
  UDim2.set('new', N('new', (a) => UD2(num(a[0]), num(a[1]), num(a[2]), num(a[3])))); UDim2.set('fromOffset', N('fo', (a) => UD2(0, num(a[0]), 0, num(a[1])))); UDim2.set('fromScale', N('fs', (a) => UD2(num(a[0]), 0, num(a[1]), 0)));
  const UDim = new LuaTable(); G.set('UDim', UDim); UDim.set('new', N('new', (a) => UD(num(a[0]), num(a[1]))));

  const C3Meta = mkMeta('Color3'); const C3 = (r, g, b) => { const t = new LuaTable(); t.set('R', r); t.set('G', g); t.set('B', b); t.meta = C3Meta; return t; };
  C3Meta.set('__eq', N('eq', (a) => ['R', 'G', 'B'].every(k => a[0].get(k) === a[1].get(k))));
  C3Meta.set('__index', N('idx', (a) => {
    if (a[1] === 'Lerp') return N('Lerp', (b) => { const x = b[0], y = b[1], t = b[2]; return C3(x.get('R') + (y.get('R') - x.get('R')) * t, x.get('G') + (y.get('G') - x.get('G')) * t, x.get('B') + (y.get('B') - x.get('B')) * t); });
    if (a[1] === 'ToHSV') return N('ToHSV', () => [0, 0, 1]);
    return undefined;
  }));
  const Color3 = new LuaTable(); G.set('Color3', Color3);
  Color3.set('fromRGB', N('fromRGB', (a) => C3(num(a[0]) / 255, num(a[1]) / 255, num(a[2]) / 255)));
  Color3.set('new', N('new', (a) => C3(num(a[0]), num(a[1]), num(a[2]))));
  Color3.set('fromHSV', N('fromHSV', () => C3(1, 1, 1)));
  Color3.set('fromHex', N('fromHex', (a) => { const h = String(a[0]).replace('#', ''); if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new LuaError('invalid hex'); return C3(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255); }));

  const simple = (name, ctor) => { const T = new LuaTable(); G.set(name, T); T.set('new', N('new', (a) => { const t = new LuaTable(); t.meta = mkMeta(name); a.forEach((v, i) => t.set(i + 1, v)); ctor && ctor(t, a); return t; })); return T; };
  simple('TweenInfo', (t, a) => { t.set('Time', a[0]); }); simple('Rect'); simple('NumberRange'); simple('NumberSequence'); simple('NumberSequenceKeypoint'); simple('ColorSequence'); simple('ColorSequenceKeypoint'); simple('Region3'); simple('Ray');
  simple('Random', null).get('new').fn = (a) => { const t = new LuaTable(); t.meta = mkMeta('Random'); t.meta.set('__index', N('i', (b) => b[1] === 'NextNumber' ? N('NextNumber', () => Math.random()) : (b[1] === 'NextInteger' ? N('NextInteger', (c) => Math.floor(Math.random() * (c[2] - c[1] + 1)) + c[1]) : undefined))); return t; };

  /* Enum */
  const enumItems = new Map();
  const EnumTop = new LuaTable(); G.set('Enum', EnumTop);
  const EnumItemMeta = mkMeta('EnumItem'); EnumItemMeta.set('__tostring', N('ts', (a) => 'Enum.' + a[0].get('EnumType') + '.' + a[0].get('Name')));
  const enumType = (tn) => { const t = new LuaTable(); t.meta = mkMeta('Enum'); t.meta.set('__index', N('idx', (a) => { const key = tn + '.' + a[1]; if (!enumItems.has(key)) { const it = new LuaTable(); it.set('Name', String(a[1])); it.set('EnumType', tn); it.set('Value', enumItems.size); it.meta = EnumItemMeta; enumItems.set(key, it); } return enumItems.get(key); })); return t; };
  const enumTypes = new Map();
  EnumTop.meta = mkMeta('Enums'); EnumTop.meta.set('__index', N('idx', (a) => { if (!enumTypes.has(a[1])) enumTypes.set(a[1], enumType(a[1])); return enumTypes.get(a[1]); }));

  /* typeof */
  G.set('typeof', N('typeof', (a) => { const v = a[0]; if (v instanceof LuaTable && v.meta) { const tn = v.meta.get('__typename'); if (tn) return tn; } if (v instanceof LuaTable && v.inst) return 'Instance'; return type(v); }));

  /* ---------------------------------------------------------------- Instance */
  const ISA = {
    Part: ['BasePart', 'PVInstance'], MeshPart: ['BasePart', 'PVInstance'], BasePart: ['PVInstance'], Model: ['PVInstance'], Tool: ['BackpackItem', 'Model', 'PVInstance'],
    RemoteEvent: ['BaseRemoteEvent'], RemoteFunction: [], BindableEvent: [], BindableFunction: [], IntValue: ['ValueBase'], NumberValue: ['ValueBase'], StringValue: ['ValueBase'], BoolValue: ['ValueBase'], ObjectValue: ['ValueBase'],
    Frame: ['GuiObject', 'GuiBase2d'], TextLabel: ['GuiObject', 'GuiLabel', 'GuiBase2d'], TextButton: ['GuiObject', 'GuiButton', 'GuiBase2d'], TextBox: ['GuiObject', 'GuiBase2d'], ImageLabel: ['GuiObject', 'GuiBase2d'], ImageButton: ['GuiObject', 'GuiButton', 'GuiBase2d'], ScrollingFrame: ['GuiObject', 'GuiBase2d'], ScreenGui: ['LayerCollector', 'GuiBase2d'],
    Attachment: [], Humanoid: [], ProximityPrompt: [], ClickDetector: [], Folder: [],
  };
  const SIGNALS = new Set(['ChildAdded', 'ChildRemoved', 'DescendantAdded', 'DescendantRemoving', 'Changed', 'AncestryChanged', 'Destroying', 'OnClientEvent', 'OnServerEvent', 'Event', 'MouseButton1Click', 'MouseButton1Down', 'MouseButton1Up', 'MouseButton2Click', 'MouseEnter', 'MouseLeave', 'MouseMoved', 'InputBegan', 'InputEnded', 'InputChanged', 'FocusLost', 'Focused', 'Activated', 'Triggered', 'MoveToFinished', 'CharacterAdded', 'CharacterRemoving', 'Died', 'Touched', 'MouseClick', 'TouchTap', 'SelectionChanged', 'Completed', 'Heartbeat', 'RenderStepped', 'Stepped', 'PlayerAdded', 'PlayerRemoving', 'Equipped', 'Unequipped', 'MouseWheelForward', 'MouseWheelBackward', 'TextChanged']);
  const DEFAULTS = {
    AbsoluteSize: () => V2(300, 200), AbsolutePosition: () => V2(0, 0), AbsoluteCanvasSize: () => V2(300, 400), TextBounds: () => V2(60, 12), ViewportSize: () => V2(1280, 720), CanvasPosition: () => V2(0, 0),
    Visible: () => true, ZIndex: () => 1, Rotation: () => 0, Text: () => '', Position: () => UD2(0, 0, 0, 0), Size: () => UD2(0, 100, 0, 100), LayoutOrder: () => 0, TextFits: () => true,
    BackgroundTransparency: () => 0, Active: () => true, Enabled: () => true, ClipsDescendants: () => false, AnchorPoint: () => V2(0, 0), AbsoluteWindowSize: () => V2(300, 200),
  };

  const InstMeta = new LuaTable(); InstMeta.set('__typename', 'Instance');
  class Inst {
    constructor(cls) {
      this.cls = cls; this.name = cls; this.parent = null; this.children = []; this.props = new Map(); this.attrs = new Map(); this.sigs = new Map(); this.destroyed = false;
      this.lua = new LuaTable(); this.lua.inst = this; this.lua.meta = InstMeta; mock.insts.push(this);
      if (/^(Int|Number)Value$/.test(cls)) this.props.set('Value', 0); if (cls === 'StringValue') this.props.set('Value', ''); if (cls === 'BoolValue') this.props.set('Value', false);
      if (cls === 'Part' || cls === 'MeshPart') { this.props.set('CFrame', CF(0, 0, 0)); this.props.set('Position', V3(0, 0, 0)); }
    }
    sig(name) { if (!this.sigs.has(name)) { const s = newSignal(); s.owner = this; s.obj = signalObj(s); this.sigs.set(name, s); } return this.sigs.get(name); }
    isA(c) { return c === this.cls || c === 'Instance' || (ISA[this.cls] || []).includes(c); }
    path() { const p = []; let c = this; while (c && c.cls !== 'DataModel') { p.unshift(c.name); c = c.parent; } return p.join('.'); }
    setParent(np) {
      const old = this.parent; if (old === np) return;
      if (old) { old.children = old.children.filter(c => c !== this); old.sigs.get('ChildRemoved') && fire(old.sigs.get('ChildRemoved'), [this.lua]); }
      this.parent = np;
      if (np) { np.children.push(this); const s = np.sigs.get('ChildAdded'); s && fire(s, [this.lua]); let a = np; while (a) { const d = a.sigs.get('DescendantAdded'); d && fire(d, [this.lua]); a = a.parent; } }
      const pc = this.sigs.get('prop:Parent'); pc && fire(pc, []);
    }
    all() { const out = []; const rec = (i) => { for (const c of i.children) { out.push(c); rec(c); } }; rec(this); return out; }
    destroy() { this.destroyed = true; const s = this.sigs.get('Destroying'); s && fire(s, []); for (const c of this.children.slice()) c.destroy(); this.setParent(null); }
    clone() { const n = new Inst(this.cls); n.name = this.name; this.props.forEach((v, k) => n.props.set(k, v)); this.attrs.forEach((v, k) => n.attrs.set(k, v)); for (const c of this.children) c.clone().setParent(n); return n; }
    get(key) {
      switch (key) { case 'Name': return this.name; case 'ClassName': return this.cls; case 'Parent': return this.parent ? this.parent.lua : undefined; }
      if (this.props.has(key)) return this.props.get(key);
      if (this.cls === 'DataModel' && key === 'workspace') return undefined;
      if (SIGNALS.has(key)) return this.sig(key).obj;
      const ch = this.children.find(c => c.name === key); if (ch) return ch.lua;
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return DEFAULTS[key]();
      return undefined;
    }
    set(key, v) {
      if (key === 'Parent') { this.setParent(v ? v.inst : null); return; }
      if (key === 'Name') { this.name = v; return; }
      const old = this.props.get(key);
      if (key === 'CFrame') { this.props.set('CFrame', v); this.props.set('Position', v.get('Position')); }
      else if (key === 'Position' && this.cls === 'Part') { this.props.set('Position', v); this.props.set('CFrame', CF(v.get('X'), v.get('Y'), v.get('Z'))); }
      else this.props.set(key, v);
      const ps = this.sigs.get('prop:' + key); if (ps && old !== v) fire(ps, []);
      const ch = this.sigs.get('Changed'); if (ch && old !== v) fire(ch, [this.isA('ValueBase') && key === 'Value' ? v : key]);
    }
  }
  mock.Inst = Inst;
  const wrap = (i) => i ? i.lua : undefined;
  const asInst = (t) => { if (!t || !t.inst) throw new LuaError('Expected Instance, got ' + type(t)); return t.inst; };

  const METHODS = {
    FindFirstChild: N('FindFirstChild', (a) => { const i = asInst(a[0]); const rec = a[2] === true; const find = (n) => { for (const c of n.children) { if (c.name === a[1]) return c; if (rec) { const r = find(c); if (r) return r; } } return null; }; return wrap(find(i)); }),
    FindFirstChildOfClass: N('FindFirstChildOfClass', (a) => wrap(asInst(a[0]).children.find(c => c.cls === a[1]))),
    FindFirstChildWhichIsA: N('FindFirstChildWhichIsA', (a) => wrap(asInst(a[0]).children.find(c => c.isA(a[1])))),
    FindFirstAncestor: N('FindFirstAncestor', (a) => { let c = asInst(a[0]).parent; while (c) { if (c.name === a[1]) return c.lua; c = c.parent; } }),
    WaitForChild: N('WaitForChild', function* (a) {
      const i = asInst(a[0]); const t0 = vm.now; const timeout = a[2] === undefined ? 5 : a[2];
      for (;;) { const c = i.children.find(x => x.name === a[1]); if (c) return [c.lua]; if (vm.now - t0 >= timeout) return [undefined]; yield { kind: 'wait', t: 0.1 }; }
    }, true),
    GetChildren: N('GetChildren', (a) => vm.newTable(asInst(a[0]).children.map(c => c.lua))),
    GetDescendants: N('GetDescendants', (a) => vm.newTable(asInst(a[0]).all().map(c => c.lua))),
    IsA: N('IsA', (a) => asInst(a[0]).isA(a[1])),
    GetFullName: N('GetFullName', (a) => asInst(a[0]).path()),
    IsDescendantOf: N('IsDescendantOf', (a) => { let c = asInst(a[0]).parent; while (c) { if (c === a[1].inst) return true; c = c.parent; } return false; }),
    Destroy: N('Destroy', (a) => { asInst(a[0]).destroy(); }),
    ClearAllChildren: N('ClearAllChildren', (a) => { for (const c of asInst(a[0]).children.slice()) c.destroy(); }),
    Clone: N('Clone', (a) => wrap(asInst(a[0]).clone())),
    GetAttribute: N('GetAttribute', (a) => asInst(a[0]).attrs.get(a[1])),
    SetAttribute: N('SetAttribute', (a) => { const i = asInst(a[0]); const old = i.attrs.get(a[1]); i.attrs.set(a[1], a[2]); const s = i.sigs.get('attr:' + a[1]); s && old !== a[2] && fire(s, []); }),
    GetAttributeChangedSignal: N('GetAttributeChangedSignal', (a) => asInst(a[0]).sig('attr:' + a[1]).obj),
    GetPropertyChangedSignal: N('GetPropertyChangedSignal', (a) => asInst(a[0]).sig('prop:' + a[1]).obj),
    GetPivot: N('GetPivot', (a) => asInst(a[0]).props.get('CFrame') || CF(0, 0, 0)),
    // remote / bindable
    FireServer: N('FireServer', (a) => { mock.remoteCalls.push({ inst: a[0].inst, kind: 'FireServer', args: a.slice(1) }); }),
    InvokeServer: N('InvokeServer', (a) => { mock.remoteCalls.push({ inst: a[0].inst, kind: 'InvokeServer', args: a.slice(1) }); const h = mock.invokeHandlers[a[0].inst.name]; return h ? h(a.slice(1)) : undefined; }),
    Fire: N('Fire', (a) => { const i = a[0].inst; mock.remoteCalls.push({ inst: i, kind: 'Fire', args: a.slice(1) }); fire(i.sig('Event'), a.slice(1)); }),
    Invoke: N('Invoke', (a) => { mock.remoteCalls.push({ inst: a[0].inst, kind: 'Invoke', args: a.slice(1) }); }),
    // humanoid
    MoveTo: N('MoveTo', (a) => { const i = a[0].inst; mock.moveCalls = mock.moveCalls || []; mock.moveCalls.push(a[1]); const root = i.parent && i.parent.children.find(c => c.name === 'HumanoidRootPart'); if (root) { vm.schedule(0.3, () => { root.set('CFrame', CF(a[1].get('X'), a[1].get('Y'), a[1].get('Z'))); fire(i.sig('MoveToFinished'), [true]); }); } }),
    EquipTool: N('EquipTool', (a) => { const i = a[0].inst; mock.equipped = a[1]; if (i.parent) a[1].inst.setParent(i.parent); }),
    UnequipTools: N('UnequipTools', () => { mock.equipped = undefined; }),
    TakeDamage: N('TakeDamage', () => { }),
    CaptureFocus: N('CaptureFocus', () => { }), ReleaseFocus: N('ReleaseFocus', () => { }),
    TweenSize: N('TweenSize', () => { }), TweenPosition: N('TweenPosition', () => { }), TweenSizeAndPosition: N('TweenSizeAndPosition', () => { }),
    GetMouse: N('GetMouse', () => undefined), SetPrimaryPartCFrame: N('SPPCF', () => { }), PivotTo: N('PivotTo', (a) => { a[0].inst.set('CFrame', a[1]); }),
    GetService: N('GetService', (a) => { const s = mock.services[a[1]]; if (!s) throw new LuaError(a[1] + ' is not a valid Service name'); return s.lua; }),
    HttpGet: N('HttpGet', (a) => { const u = String(a[1]); if (!(u in mock.http)) throw new LuaError('HttpGet failed: ' + u); return mock.http[u]; }),
    JSONEncode: N('JSONEncode', (a) => JSON.stringify(luaToJs(a[1]))), JSONDecode: N('JSONDecode', (a) => jsToLua(JSON.parse(a[1]))), GenerateGUID: N('GenerateGUID', () => 'GUID-' + Math.random().toString(36).slice(2)),
    Create: N('Create', (a) => { const target = a[1].inst, goals = a[3]; const tw = new Inst('Tween'); tw.tween = { target, goals }; return tw.lua; }),
    Play: N('Play', (a) => { const i = a[0].inst; if (i.tween) { const { target, goals } = i.tween; for (const k of [...goals.map.keys()]) target.set(k, goals.get(k)); vm.schedule(0.2, () => fire(i.sig('Completed'), [])); } }),
    Cancel: N('Cancel', () => { }),
    GetMouseLocation: N('GetMouseLocation', () => V2(100, 100)), IsKeyDown: N('IsKeyDown', () => false), GetFocusedTextBox: N('GetFocusedTextBox', () => undefined), IsStudio: N('IsStudio', () => false),
    GetTextSize: N('GetTextSize', () => V2(60, 12)), BindToRenderStep: N('B', () => { }), UnbindFromRenderStep: N('U', () => { }),
  };
  InstMeta.set('__index', N('idx', (a) => {
    const i = a[0].inst, k = a[1];
    if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(METHODS, k) && !i.props.has(k)) return METHODS[k];
    return i.get(k);
  }));
  InstMeta.set('__newindex', N('newidx', (a) => { a[0].inst.set(a[1], a[2]); }));
  InstMeta.set('__tostring', N('ts', (a) => a[0].inst.name));

  const InstanceT = new LuaTable(); G.set('Instance', InstanceT);
  InstanceT.set('new', N('new', (a) => {
    const i = new Inst(String(a[0])); if (a[1]) i.setParent(a[1].inst);
    if (i.cls === 'Humanoid') { i.props.set('Health', 100); }
    return i.lua;
  }));

  /* ---------------------------------------------------------------- konversi JSON */
  function luaToJs(v) {
    if (v instanceof LuaTable) {
      const n = v.length(); if (n > 0 && v.map.size === n) { const o = []; for (let i = 1; i <= n; i++) o.push(luaToJs(v.get(i))); return o; }
      const o = {}; for (const [k, val] of v.map) o[String(k)] = luaToJs(val); return o;
    }
    return v;
  }
  function jsToLua(v) {
    if (Array.isArray(v)) { const t = new LuaTable(); v.forEach((x, i) => t.set(i + 1, jsToLua(x))); return t; }
    if (v && typeof v === 'object') { const t = new LuaTable(); for (const k of Object.keys(v)) t.set(k, jsToLua(v[k])); return t; }
    return v === null ? undefined : v;
  }
  mock.luaToJs = luaToJs; mock.jsToLua = jsToLua; mock.V3 = V3; mock.CF = CF;

  /* ---------------------------------------------------------------- dunia game */
  const mk = (cls, name, parent) => { const i = new Inst(cls); i.name = name || cls; if (parent) i.setParent(parent); return i; };
  const game = new Inst('DataModel'); game.name = 'game'; mock.game = game;
  mock.services = {};
  for (const n of ['Workspace', 'Players', 'ReplicatedStorage', 'RunService', 'UserInputService', 'HttpService', 'TweenService', 'CoreGui', 'Lighting', 'StarterGui', 'TextService', 'GuiService', 'ContextActionService', 'StarterPack', 'MarketplaceService']) { const s = mk('Service_' + n, n, game); mock.services[n] = s; }
  game.props.set('PlaceId', opts.placeId === undefined ? 1234 : opts.placeId); game.props.set('GameId', opts.gameId === undefined ? 5678 : opts.gameId); game.props.set('JobId', 'job-1');
  const Players = mock.services.Players, RS = mock.services.ReplicatedStorage, WS = mock.services.Workspace;
  const lp = mk('Player', 'Tester', Players); Players.props.set('LocalPlayer', lp.lua); lp.props.set('UserId', 1);
  const backpack = mk('Backpack', 'Backpack', lp); mk('PlayerGui', 'PlayerGui', lp);
  mock.lp = lp;
  function spawnCharacter() {
    const ch = mk('Model', 'Tester'); ch.setParent(WS);
    const hrp = mk('Part', 'HumanoidRootPart', ch); hrp.set('CFrame', CF(0, 5, 0)); const hum = mk('Humanoid', 'Humanoid', ch);
    lp.props.set('Character', ch.lua); fire(lp.sig('CharacterAdded'), [ch.lua]); return ch;
  }
  mock.spawnCharacter = spawnCharacter; spawnCharacter();
  // ReplicatedStorage/Remotes
  const remotes = mk('Folder', 'Remotes', RS); mock.remotes = remotes;
  for (const n of ['Collect', 'Claim']) mk('RemoteEvent', n, remotes);
  mk('RemoteFunction', 'GetData', remotes);
  // leaderstats
  const ls = mk('Folder', 'leaderstats', lp); mk('IntValue', 'Quest', ls); mk('IntValue', 'Coins', ls);
  const items = mk('Folder', 'Items', WS); mock.items = items;
  mock.mk = mk; mock.CF = CF;
  mock.addCoin = (name) => { const p = mk('Part', name || 'Coin1', items); p.set('CFrame', CF(10, 5, 10)); return p; };

  /* ---------------------------------------------------------------- globals */
  G.set('game', game.lua); G.set('workspace', WS.lua);
  G.set('Game', game.lua);
  const has = (n) => !mock.executor || mock.executor.includes(n);
  const ex = (name, fn) => { if (has(name)) G.set(name, N(name, fn)); };
  ex('gethui', () => mock.services.CoreGui.lua);
  ex('getgenv', () => G);
  ex('setclipboard', (a) => { mock.clipboard = a[0]; });
  ex('writefile', (a) => { mock.files.set(a[0], a[1]); });
  ex('readfile', (a) => { if (!mock.files.has(a[0])) throw new LuaError('file not found'); return mock.files.get(a[0]); });
  ex('isfile', (a) => mock.files.has(a[0])); ex('isfolder', (a) => mock.folders.has(a[0])); ex('makefolder', (a) => { mock.folders.add(a[0]); });
  ex('delfile', (a) => { mock.files.delete(a[0]); });
  ex('fireproximityprompt', (a) => { (mock.prompts = mock.prompts || []).push(a[0]); });
  ex('fireclickdetector', (a) => { (mock.clicks = mock.clicks || []).push(a[0]); });
  ex('request', () => undefined);
  G.set('loadstring', N('loadstring', (a) => { try { return [vm.load(a[0], 'loaded')]; } catch (e) { return [undefined, e.value || e.message]; } }));
  G.set('wait', N('wait', function* (a) { yield { kind: 'wait', t: a[0] || 0.03 }; return [a[0] || 0.03]; }, true));
  G.set('spawn', N('spawn', (a) => vm.spawn(a[0], a.slice(1)))); G.set('delay', N('delay', (a) => { vm.schedule(a[0], () => vm.spawn(a[1], [])); }));

  /* ---------------------------------------------------------------- util uji */
  mock.http = mock.http || {};
  mock.find = (pred, root) => (root || game).all().filter(pred);
  mock.guiRoot = () => mock.services.CoreGui;
  mock.byText = (text, cls) => mock.guiRoot().all().filter(i => (!cls || i.isA(cls)) && typeof i.props.get('Text') === 'string' && i.props.get('Text').trim().replace(/ [▼▲]$/, '') === text);
  mock.click = (inst) => { fire(inst.sig('MouseButton1Click'), []); };
  mock.clickButton = (text) => { const b = mock.byText(text, 'TextButton')[0]; if (!b) throw new Error('tombol tidak ditemukan: ' + text); mock.click(b); };
  mock.toggleClick = (label) => { const lbl = mock.byText(label, 'TextLabel')[0]; if (!lbl) throw new Error('toggle tidak ditemukan: ' + label); const bg = lbl.parent; const btn = bg.children.find(c => c.cls === 'TextButton'); if (!btn) throw new Error('toggle tanpa tombol: ' + label); mock.click(btn); };
  mock.setText = (box, text) => { box.set('Text', text); fire(box.sig('FocusLost'), [true]); };
  mock.advance = (s) => { vm.advance(s); };
  mock.run = (src, name) => { const f = vm.load(src, name || 'main'); const th = vm.spawn(f, [], name || 'main'); return th; };
  return mock;
}

module.exports = { createEnv };
