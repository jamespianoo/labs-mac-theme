/* Dark coral chunky pixel field — Omarchy-class interaction */
(function () {
  'use strict';

  var host = document.querySelector('.pixel-field');
  var canvas = host && host.querySelector('canvas');
  if (!host || !canvas) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var STORAGE_KEY = 'jb-field-settings';
  var DEFAULTS = {
    cellSize: 9,          /* Omarchy ~8.7–9px CSS cells */
    cursorGlow: 1,        /* 0–2 */
    cursorReach: 14,      /* cells */
    trail: 1,             /* 0–2 continuous trail */
    clickPower: 1,        /* 0–2 */
    ambient: 0.55,        /* sparse digital dust */
    eqAmount: 0.45,       /* sparse musical EQ */
    eqBands: 12,          /* fewer bands = sparser */
    motion: 1             /* idle wander */
  };

  var settings = loadSettings();
  var CELL = settings.cellSize;

  var BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
  ];

  var palette = {
    bg: '#0e1014', dim: '#2a3038', mid: '#5a6470',
    lit: '#c45a5e', hover: '#E8545C', crest: '#f0a8ab',
    text: '#f2f2f2'
  };

  var dpr = 1, cssW = 0, cssH = 0, pxW = 0, pxH = 0, cols = 0, rows = 0;
  var edgeMask = null, noise = null, rand = null;
  var mouse = { x: -1e4, y: -1e4, strength: 0, target: 0 };
  var trail = [];
  var auto = { x: 0, y: 0, strength: 0 };
  var ripples = [];
  var charging = null;
  var eq = new Float32Array(24);
  var eqPhase = new Float32Array(24);
  var raf = 0, last = 0, visible = true;
  var markName = null;
  var markSub = [];
  var subBox = null;
  var markBounds = null;

  function loadSettings() {
    var out = {};
    var k;
    for (k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k];
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return out;
      var parsed = JSON.parse(raw);
      for (k in out) {
        if (parsed[k] != null && isFinite(Number(parsed[k]))) out[k] = Number(parsed[k]);
      }
    } catch (e) {}
    out.cellSize = clamp(Math.round(out.cellSize), 6, 16);
    out.eqBands = clamp(Math.round(out.eqBands), 4, 24);
    return out;
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function applySettings(next) {
    var k;
    for (k in DEFAULTS) {
      if (next && next[k] != null && isFinite(Number(next[k]))) settings[k] = Number(next[k]);
    }
    settings.cellSize = clamp(Math.round(settings.cellSize), 6, 16);
    settings.eqBands = clamp(Math.round(settings.eqBands), 4, 24);
    CELL = settings.cellSize;
    saveSettings();
    rebuildGrid();
    if (reduced) draw(performance.now());
    else start();
    window.dispatchEvent(new CustomEvent('jb-field-settings-changed', { detail: getSettings() }));
  }

  function getSettings() {
    var o = {}, k;
    for (k in settings) o[k] = settings[k];
    return o;
  }

  function resetSettings() {
    applySettings(DEFAULTS);
  }

  window.JBField = {
    getSettings: getSettings,
    applySettings: applySettings,
    resetSettings: resetSettings,
    defaults: function () {
      var o = {}, k;
      for (k in DEFAULTS) o[k] = DEFAULTS[k];
      return o;
    },
    bindPanel: bindPanel
  };

  function bindPanel(root) {
    if (!root || root.dataset.fsBound) return;
    root.dataset.fsBound = '1';
    function sync() {
      var cur = getSettings();
      root.querySelectorAll('[data-fs]').forEach(function (input) {
        var key = input.getAttribute('data-fs');
        if (cur[key] == null) return;
        input.value = String(cur[key]);
        var label = root.querySelector('[data-fs-val="' + key + '"]');
        if (label) label.textContent = String(cur[key]);
      });
    }
    sync();
    root.addEventListener('input', function (e) {
      var input = e.target.closest('[data-fs]');
      if (!input) return;
      var key = input.getAttribute('data-fs');
      var next = {};
      next[key] = Number(input.value);
      applySettings(next);
      var label = root.querySelector('[data-fs-val="' + key + '"]');
      if (label) label.textContent = String(getSettings()[key]);
    });
    var resetBtn = root.querySelector('[data-fs-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        resetSettings();
        sync();
      });
    }
    window.addEventListener('jb-field-settings-changed', sync);
  }

  function readPalette() {
    var s = getComputedStyle(document.documentElement);
    function v(name, fallback) {
      return (s.getPropertyValue(name) || '').trim() || fallback;
    }
    palette.bg = v('--field-bg', palette.bg);
    palette.dim = v('--field-dim', palette.dim);
    palette.mid = v('--field-mid', palette.mid);
    palette.lit = v('--field-lit', palette.lit);
    palette.hover = v('--field-hover', palette.hover);
    palette.crest = v('--field-crest', palette.crest);
    palette.text = v('--field-text', palette.text);
  }

  function mulberry(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6d2b79f5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildNoise() {
    var n = 128;
    var rng = mulberry(10407530);
    var grid = new Float32Array(n * n);
    var i;
    for (i = 0; i < grid.length; i++) grid[i] = rng();
    var pass;
    for (pass = 0; pass < 2; pass++) {
      var next = new Float32Array(n * n);
      var y, x;
      for (y = 0; y < n; y++) {
        for (x = 0; x < n; x++) {
          var sum = 0, oy, ox;
          for (oy = -1; oy <= 1; oy++) {
            for (ox = -1; ox <= 1; ox++) {
              sum += grid[((y + oy + n) % n) * n + ((x + ox + n) % n)];
            }
          }
          next[y * n + x] = sum / 9;
        }
      }
      grid = next;
    }
    var lo = Infinity, hi = -Infinity;
    for (i = 0; i < grid.length; i++) {
      if (grid[i] < lo) lo = grid[i];
      if (grid[i] > hi) hi = grid[i];
    }
    var span = hi - lo || 1;
    for (i = 0; i < grid.length; i++) grid[i] = (grid[i] - lo) / span;
    noise = grid;
    rand = new Float32Array(4096);
    rng = mulberry(663316);
    for (i = 0; i < rand.length; i++) rand[i] = rng();
  }

  function sampleNoise(x, y) {
    var n = 128;
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = x - x0, fy = y - y0;
    var x1 = (x0 % n + n) % n, y1 = (y0 % n + n) % n;
    var x2 = (x1 + 1) % n, y2 = (y1 + 1) % n;
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    var a = noise[y1 * n + x1], b = noise[y1 * n + x2];
    var c = noise[y2 * n + x1], d = noise[y2 * n + x2];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }

  /* ----------------------------------------------------------------
     Wordmark: 5x9 proportional pixel caps. The name sits on the
     field's own pixel size; the strapline runs at a third of it.
     ---------------------------------------------------------------- */
  var MARK_ROWS = 9;
  var MARK_FONT = {
    A: ['00100', '01110', '11011', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10011', '10001', '10011', '11110', '10011', '10001', '10011', '11110'],
    C: ['01110', '11011', '10001', '10000', '10000', '10000', '10001', '11011', '01110'],
    E: ['11111', '10000', '10000', '10000', '11110', '10000', '10000', '10000', '11111'],
    H: ['10001', '10001', '10001', '10001', '11111', '10001', '10001', '10001', '10001'],
    I: ['1111', '0110', '0110', '0110', '0110', '0110', '0110', '0110', '1111'],
    J: ['01111', '00001', '00001', '00001', '00001', '00001', '10001', '11011', '01110'],
    K: ['10001', '10011', '10110', '11100', '11100', '11100', '10110', '10011', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['100001', '110011', '111111', '111111', '101101', '100001', '100001', '100001', '100001'],
    N: ['10001', '11001', '11001', '10101', '10101', '10101', '10011', '10011', '10001'],
    O: ['01110', '11011', '10001', '10001', '10001', '10001', '10001', '11011', '01110'],
    P: ['11110', '10011', '10001', '10011', '11110', '10000', '10000', '10000', '10000'],
    S: ['01110', '11011', '10001', '11000', '01110', '00011', '10001', '11011', '01110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100', '00100', '00100'],
    W: ['100001', '100001', '100001', '100001', '101101', '101101', '111111', '110011', '010010'],
    '/': ['00001', '00001', '00010', '00010', '00100', '00100', '01000', '01000', '10000'],
    ' ': ['00', '00', '00', '00', '00', '00', '00', '00', '00']
  };

  var NAME_TEXT = 'JAMES BECKWITH';
  var SUB_TOKENS = [
    { text: 'PIANO', tone: 'white' },
    { text: '/', tone: 'accent' },
    { text: 'COMPOSITION', tone: 'white' },
    { text: '/', tone: 'accent' },
    { text: 'TECHNICIAN', tone: 'accent' },
    { text: '/', tone: 'accent' },
    { text: 'LABS', tone: 'white' }
  ];
  var SUB_WORD_GAP = 6;

  /* Set a string with 1-pixel letter gaps; returns ink coords + extents */
  function buildLine(text) {
    var chars = String(text).toUpperCase().split('');
    var ink = [], x = 0, i, r, c, g, line;
    for (i = 0; i < chars.length; i++) {
      g = MARK_FONT[chars[i]];
      if (!g) continue;
      if (x) x += 1;
      for (r = 0; r < MARK_ROWS; r++) {
        line = g[r];
        for (c = 0; c < line.length; c++) {
          if (line.charAt(c) === '1') ink.push([x + c, r]);
        }
      }
      x += g[0].length;
    }
    return { ink: ink, width: x, height: MARK_ROWS };
  }

  function layoutWordmark() {
    var rect = host.getBoundingClientRect();
    if (rect.width < 1) return;
    var maxW = Math.min(rect.width * 0.88, 1160);

    var name = buildLine(NAME_TEXT);
    var scale = CELL;
    if (name.width * scale > maxW) scale = Math.max(3, Math.floor(maxW / name.width));

    var tokens = [], subW = 0, i, line;
    for (i = 0; i < SUB_TOKENS.length; i++) {
      line = buildLine(SUB_TOKENS[i].text);
      if (subW) subW += SUB_WORD_GAP;
      tokens.push({ line: line, ox: subW, tone: SUB_TOKENS[i].tone });
      subW += line.width;
    }
    var subScale = Math.max(1, Math.round(scale / 3));
    while (subScale > 1 && subW * subScale > maxW) subScale -= 1;

    var nameW = name.width * scale;
    var nameH = MARK_ROWS * scale;
    var subH = MARK_ROWS * subScale;
    var gap = Math.max(2, Math.round(scale * 2.5));
    var totalH = nameH + gap + subH;
    var top = Math.round(rect.height * 0.4 - totalH / 2);
    var nameX = Math.round((rect.width - nameW) / 2);
    /* Align to the field grid so name pixels sit in step with the dust */
    if (scale === CELL) {
      nameX = Math.round(nameX / CELL) * CELL;
      top = Math.round(top / CELL) * CELL;
    }

    var nameMask = new Uint8Array(name.width * MARK_ROWS);
    for (i = 0; i < name.ink.length; i++) nameMask[name.ink[i][1] * name.width + name.ink[i][0]] = 1;
    markName = {
      ink: name.ink, mask: nameMask, width: name.width, height: MARK_ROWS,
      x: nameX, y: top, scale: scale
    };
    markSub = [];
    if (subW * subScale <= rect.width) {
      var subX = Math.round(nameX + (nameW - subW * subScale) / 2);
      var subY = top + nameH + gap;
      for (i = 0; i < tokens.length; i++) {
        markSub.push({
          ink: tokens[i].line.ink,
          width: tokens[i].line.width,
          height: MARK_ROWS,
          x: subX + tokens[i].ox * subScale,
          y: subY,
          scale: subScale,
          tone: tokens[i].tone
        });
      }
      subBox = { x0: subX, x1: subX + subW * subScale, y0: subY, y1: subY + subH };
    } else subBox = null;

    markBounds = { x: nameX, y: top, w: Math.max(nameW, subW * subScale), h: totalH };
  }

  /* Keep dust out from under the type so letter edges stay crisp */
  function maskWordmark(cx, cy) {
    if (subBox && cx >= subBox.x0 - CELL && cx <= subBox.x1 + CELL &&
        cy >= subBox.y0 - CELL && cy <= subBox.y1 + CELL) return true;
    if (!markName) return false;
    var gx = Math.floor((cx - markName.x) / markName.scale);
    var gy = Math.floor((cy - markName.y) / markName.scale);
    if (gx < 0 || gy < 0 || gx >= markName.width || gy >= markName.height) return false;
    return markName.mask[gy * markName.width + gx] === 1;
  }

  function paintMark(block, color) {
    ctx.fillStyle = color;
    var s = block.scale * dpr;
    var bx = block.x * dpr, by = block.y * dpr;
    var size = Math.ceil(s);
    var ink = block.ink, i;
    for (i = 0; i < ink.length; i++) {
      ctx.fillRect(Math.round(bx + ink[i][0] * s), Math.round(by + ink[i][1] * s), size, size);
    }
  }

  function drawWordmark() {
    if (markName) paintMark(markName, palette.hover);
    var i;
    for (i = 0; i < markSub.length; i++) {
      paintMark(markSub[i], markSub[i].tone === 'white' ? palette.text : palette.hover);
    }
  }

  function rebuildGrid() {
    CELL = settings.cellSize;
    var rect = host.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    pxW = Math.round(cssW * dpr);
    pxH = Math.round(cssH * dpr);
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    layoutWordmark();
    cols = Math.ceil(cssW / CELL) + 2;
    rows = Math.ceil(cssH / CELL) + 2;
    edgeMask = new Float32Array(cols * rows);
    var r, c;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var nx = (c / cols) * 2 - 1;
        var ny = (r / rows) * 2 - 1;
        var dist = Math.sqrt(nx * nx + ny * ny * 0.82);
        /* Omarchy: sparse dust — stronger toward edges/bottom, quiet center */
        var edge = Math.min(1, Math.max(0, (dist - 0.4) / 0.85));
        var bottom = Math.pow(r / rows, 1.35);
        edgeMask[r * cols + c] = (edge * edge * 0.75 + bottom * 0.55) * 0.85;
      }
    }
    var pageRect = host.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('jb-pixel-grid', {
      detail: {
        x: (markBounds ? markBounds.x : cssW * 0.15) + pageRect.left,
        y: (markBounds ? markBounds.y : cssH * 0.34) + pageRect.top,
        cw: CELL, ch: CELL,
        width: markBounds ? markBounds.w : cssW * 0.7,
        height: markBounds ? markBounds.h : cssH * 0.12
      }
    }));
  }

  function uiBlocks(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return false;
    return !!(el.closest && el.closest('.menubar, .win, .icon, .sticky, .alert, .context-menu, [data-no-stamp]'));
  }

  function pointerLocal(e) {
    var rect = host.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
      clientX: e.clientX,
      clientY: e.clientY
    };
  }

  function onMove(e) {
    if (!finePointer) return;
    var p = pointerLocal(e);
    mouse.x = p.x;
    mouse.y = p.y;
    trail.push({ x: p.x, y: p.y, born: performance.now() });
    if (trail.length > 28) trail.shift();
    if (!charging && !uiBlocks(e.clientX, e.clientY)) mouse.target = 1;
    else if (!charging) mouse.target = 0.35;
  }

  function onDown(e) {
    if (uiBlocks(e.clientX, e.clientY)) return;
    var p = pointerLocal(e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.target = 0;
    charging = { x: p.x, y: p.y, start: performance.now() };
  }

  function onUp() {
    if (!charging) return;
    var life = Math.min(1, (performance.now() - charging.start) / 850);
    var power = settings.clickPower;
    ripples.push({
      x: charging.x, y: charging.y, born: performance.now(),
      from: 0.5 + life * 0.4,
      to: (2.4 + life * 4.2) * (0.7 + power * 0.5),
      life: 0.7 + life * 0.65,
      amp: (0.8 + life * 0.5) * (0.6 + power * 0.5)
    });
    charging = null;
    mouse.target = finePointer ? 0.55 : 0;
  }

  /* Sparse musical EQ — kick / snare / hat style, not a solid wall */
  function tickEq(t) {
    var bands = settings.eqBands;
    var i;
    var bar = Math.floor(t * 2) % 8;
    var kick = (bar === 0 || bar === 4) ? 1 : 0.08;
    var snare = (bar === 2 || bar === 6) ? 0.85 : 0.05;
    var hat = (bar % 2 === 1) ? 0.35 + 0.25 * Math.sin(t * 18) : 0.06;
    for (i = 0; i < bands; i++) {
      var pos = i / Math.max(1, bands - 1);
      var target = 0;
      if (pos < 0.22) target = kick * (0.75 + 0.25 * Math.sin(t * 3.1 + eqPhase[i]));
      else if (pos < 0.55) target = snare * (0.45 + 0.35 * Math.abs(Math.sin(t * 2.2 + i)));
      else target = hat * (0.25 + 0.4 * rand[(i * 17 + Math.floor(t * 4)) & 4095]);
      /* leave many bands quiet */
      if (rand[i * 13 & 4095] > 0.55 + settings.eqAmount * 0.25) target *= 0.12;
      target *= settings.eqAmount;
      var rise = target > eq[i];
      eq[i] += (target - eq[i]) * (rise ? 0.45 : 0.1);
    }
    for (i = bands; i < eq.length; i++) eq[i] *= 0.85;
  }

  function draw(ts) {
    if (!visible) { raf = 0; return; }
    if (!reduced && ts - last < 16) {
      raf = requestAnimationFrame(draw);
      return;
    }
    last = ts;
    var t = ts / 1000;
    readPalette();

    if (!reduced) {
      if (settings.motion > 0.05) {
        auto.x = pxW * (0.5 + 0.42 * Math.sin(t * 0.48));
        auto.y = pxH * (0.5 + 0.32 * Math.sin(t * 0.31 + 1.2));
        auto.strength = (0.28 + 0.18 * Math.sin(t * 0.85)) * settings.motion;
      } else auto.strength = 0;
      tickEq(t);
      /* Continuous smooth follow — Omarchy-like lerp */
      mouse.strength += (mouse.target - mouse.strength) * 0.18;
    } else {
      auto.strength = 0;
      mouse.strength = 0;
    }

    trail = trail.filter(function (p) { return ts - p.born < 420; });

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, pxW, pxH);

    var cellPx = CELL * dpr;
    var lights = [];
    var glowMul = settings.cursorGlow;
    var reachCells = settings.cursorReach;

    if (mouse.strength > 0.02 && glowMul > 0.02) {
      lights.push({
        x: mouse.x, y: mouse.y,
        strength: mouse.strength * glowMul,
        reach: reachCells * cellPx * (0.55 + 0.45 * mouse.strength)
      });
    }
    /* Continuous trail lights */
    if (settings.trail > 0.05 && trail.length > 1) {
      var ti, step = Math.max(1, Math.floor(trail.length / 8));
      for (ti = 0; ti < trail.length; ti += step) {
        var tp = trail[ti];
        var age = 1 - (ts - tp.born) / 420;
        lights.push({
          x: tp.x, y: tp.y,
          strength: age * 0.35 * settings.trail * glowMul,
          reach: reachCells * cellPx * 0.45 * age
        });
      }
    }
    if (!reduced && auto.strength > 0.02) {
      lights.push({
        x: auto.x, y: auto.y,
        strength: auto.strength * 0.5 * glowMul,
        reach: reachCells * cellPx * 0.65
      });
    }

    var stamps = [];
    if (charging) {
      var charge = Math.min(1, (ts - charging.start) / 850);
      stamps.push({
        x: charging.x, y: charging.y,
        cell: cellPx * (0.4 + charge * 1.6) * settings.clickPower,
        amp: 0.9
      });
    }
    ripples = ripples.filter(function (r) { return (ts - r.born) / 1000 < r.life; });
    ripples.forEach(function (r) {
      var n = (ts - r.born) / 1000 / r.life;
      var ease = 1 - Math.pow(1 - n, 3);
      stamps.push({
        x: r.x, y: r.y,
        cell: cellPx * (r.from + (r.to - r.from) * ease),
        amp: r.amp * Math.pow(1 - n, 1.55)
      });
    });

    var bands = settings.eqBands;
    var r, c;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var x = c * CELL, y = r * CELL;
        var px = x * dpr, py = y * dpr;

        if (maskWordmark(x + CELL / 2, y + CELL / 2)) continue;

        var mask = edgeMask[r * cols + c] || 0;
        var n1 = sampleNoise(c / 8 + t * 0.1, r / 8 - t * 0.045);
        var n2 = sampleNoise(c / 16 - t * 0.06, r / 16 + t * 0.035);
        var ambient = mask * (0.18 + 0.5 * n1 * n1 + 0.15 * n2) * settings.ambient;

        var glow = 0, li;
        for (li = 0; li < lights.length; li++) {
          var L = lights[li];
          var dx = px + cellPx / 2 - L.x;
          var dy = py + cellPx / 2 - L.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < L.reach) {
            var g = 1 - dist / L.reach;
            g = g * g * L.strength;
            if (g > glow) glow = g;
          }
        }

        var stamp = 0;
        for (li = 0; li < stamps.length; li++) {
          var S = stamps[li];
          var ring = Math.abs(Math.sqrt(
            Math.pow(px + cellPx / 2 - S.x, 2) + Math.pow(py + cellPx / 2 - S.y, 2)
          ) - S.cell * 0.55);
          if (ring < cellPx * 1.25) {
            var s = (1 - ring / (cellPx * 1.25)) * S.amp;
            if (s > stamp) stamp = s;
          }
        }

        var eqBoost = 0;
        if (!reduced && settings.eqAmount > 0.02) {
          var band = Math.max(0, Math.min(bands - 1, Math.floor((c / cols) * bands)));
          /* Sparse: only light a subset of columns */
          if ((band + Math.floor(t * 2)) % 3 !== 0 && eq[band] < 0.35) {
            /* skip quiet mid bands often */
          } else {
            var h = eq[band] * rows * 0.28;
            var fromBottom = rows - 1 - r;
            if (fromBottom < h) {
              eqBoost = eq[band] * Math.pow(1 - fromBottom / (h || 1), 0.85);
            }
          }
        }

        var energy = ambient + glow * 0.85 + stamp * 1.15 + eqBoost * 0.9;
        var thresh = 0.82 * ((BAYER[(r & 7) * 8 + (c & 7)] + 0.5) / 64) + 0.18 * rand[(r * 37 + c * 11) & 4095];
        if (energy <= thresh) continue;

        var peak = Math.max(glow, stamp, eqBoost * 0.75);
        ctx.fillStyle = peak > 0.5 ? palette.crest : peak > 0.22 ? palette.hover : peak > 0.1 ? palette.lit : palette.dim;
        if (peak < 0.06 && ambient > 0.1) ctx.fillStyle = palette.mid;
        ctx.fillRect(Math.round(px), Math.round(py), Math.ceil(cellPx), Math.ceil(cellPx));
      }
    }

    drawWordmark();

    if (!reduced) raf = requestAnimationFrame(draw);
  }

  function start() {
    if (raf) return;
    if (reduced) { draw(performance.now()); return; }
    raf = requestAnimationFrame(draw);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  buildNoise();
  var i;
  for (i = 0; i < eqPhase.length; i++) eqPhase[i] = Math.random() * 6.28;
  readPalette();
  rebuildGrid();
  start();

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  window.addEventListener('pointercancel', onUp, { passive: true });
  window.addEventListener('jb-theme', function () {
    readPalette();
    if (reduced) draw(performance.now());
  });
  window.addEventListener('jb-field-settings', function (e) {
    applySettings((e && e.detail) || {});
  });

  var ro = new ResizeObserver(function () {
    rebuildGrid();
    if (reduced) draw(performance.now());
    else start();
  });
  ro.observe(host);

  var io = new IntersectionObserver(function (entries) {
    visible = entries[0] && entries[0].isIntersecting;
    if (visible) start();
    else stop();
  }, { rootMargin: '64px' });
  io.observe(host);
})();
