/* Pixel field: dithered coral dust on one lattice with the name.
   The cursor glows, a click throws a small burst, holding gathers a swarm
   into a piano that grows until release bursts it, a hi-fi spectrum sits
   low on the desk, and the name plays an entrance effect
   (js/pixel-effects.js). */
(function () {
  'use strict';

  var host = document.querySelector('.pixel-field');
  var canvas = host && host.querySelector('canvas');
  var G = window.JBGlyphs;
  if (!host || !canvas || !G) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var FX = window.JBFieldEffects || null;
  var MUSIC = window.JBFieldMusic || null;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------ settings */
  var STORAGE_KEY = 'jb-field-v2';
  var DEFAULTS = {
    cellSize: 8,         /* field and name pixel size, CSS px */
    density: 1,          /* resting dust */
    twinkle: 1,          /* per-pixel shimmer */
    cursor: 1,           /* cursor glow strength and reach */
    stampSize: 1,        /* the held piano's largest size */
    music: 1,            /* hi-fi EQ display; 0 hides it */
    grid: 1,             /* graph-paper grid strength; 0 hides it */
    gridCells: 6,        /* field cells per grid square */
    nameShade: 'gradient',
    entrance: 'random',
    entranceSpeed: 1
  };
  var RANGES = {
    cellSize: [5, 14], density: [0, 2], twinkle: [0, 2], cursor: [0, 2],
    stampSize: [0.5, 2], music: [0, 2], grid: [0, 2], gridCells: [3, 12], entranceSpeed: [0.4, 2.5]
  };
  var CHOICES = {
    nameShade: ['gradient', 'ivory', 'solid'],
    entrance: ['random', 'none'].concat(FX ? FX.list().map(function (e) { return e.id; }) : [])
  };

  /* Resting ink per row of the name, top to bottom. */
  var SHADES = {
    gradient: ['crest', 'crest', 'hover', 'hover', 'hover', 'hover', 'hover', 'hover', 'lit', 'lit', 'lit', 'lit', 'lit'],
    ivory: ['text', 'text', 'text', 'crest', 'crest', 'crest', 'hover', 'hover', 'hover', 'hover', 'lit', 'lit', 'lit'],
    solid: ['hover']
  };

  var settings = sanitize(readStored());

  function readStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function sanitize(input) {
    var out = {}, k;
    for (k in DEFAULTS) {
      var v = input && input[k] != null ? input[k] : DEFAULTS[k];
      if (CHOICES[k]) out[k] = CHOICES[k].indexOf(String(v)) >= 0 ? String(v) : DEFAULTS[k];
      else {
        var n = Number(v);
        if (!isFinite(n)) n = DEFAULTS[k];
        out[k] = Math.max(RANGES[k][0], Math.min(RANGES[k][1], n));
      }
    }
    out.cellSize = Math.round(out.cellSize);
    out.gridCells = Math.round(out.gridCells);
    return out;
  }

  function getSettings() {
    var o = {}, k;
    for (k in settings) o[k] = settings[k];
    return o;
  }

  function applySettings(next) {
    var merged = getSettings(), k;
    for (k in next) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) merged[k] = next[k];
    var before = settings;
    settings = sanitize(merged);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
    if (before.cellSize !== settings.cellSize) layout();
    buildRestInks();
    redrawIfStill();
    window.dispatchEvent(new CustomEvent('jb-field-settings-changed', { detail: getSettings() }));
  }

  /* --------------------------------------------------------------- panel */
  function formatValue(key, value) {
    if (CHOICES[key]) return '';
    if (key === 'gridCells') return value + ' cells';
    return key === 'cellSize' ? value + 'px' : Number(value).toFixed(2).replace(/\.?0+$/, '');
  }

  function bindPanel(root) {
    if (!root || root.dataset.fsBound) return;
    root.dataset.fsBound = '1';

    var effectSelect = root.querySelector('select[data-fs="entrance"]');
    if (effectSelect && FX && effectSelect.options.length <= 2) {
      FX.list().forEach(function (e) {
        var opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.label;
        effectSelect.appendChild(opt);
      });
    }

    function sync() {
      var cur = getSettings();
      root.querySelectorAll('[data-fs]').forEach(function (input) {
        var key = input.getAttribute('data-fs');
        if (cur[key] == null) return;
        input.value = String(cur[key]);
        var label = root.querySelector('[data-fs-val="' + key + '"]');
        if (label) label.textContent = formatValue(key, cur[key]);
      });
    }
    sync();

    function onChange(e) {
      var input = e.target.closest('[data-fs]');
      if (!input) return;
      var next = {};
      next[input.getAttribute('data-fs')] = input.value;
      applySettings(next);
      if (input.getAttribute('data-fs') === 'entrance' || input.getAttribute('data-fs') === 'nameShade') replay();
    }
    root.addEventListener('input', onChange);
    root.addEventListener('change', function (e) {
      if (e.target.tagName === 'SELECT') return;
      onChange(e);
    });

    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-fs-reset]')) {
        applySettings(DEFAULTS);
        replay();
      } else if (e.target.closest('[data-fs-replay]')) {
        replay();
      }
    });
    window.addEventListener('jb-field-settings-changed', sync);
  }

  window.JBField = {
    getSettings: getSettings,
    applySettings: applySettings,
    resetSettings: function () { applySettings(DEFAULTS); },
    defaults: function () { return sanitize({}); },
    replay: function () { replay(); },
    bindPanel: bindPanel
  };

  /* ------------------------------------------------------------- palette */
  var palette = {};
  function readPalette() {
    var s = getComputedStyle(document.documentElement);
    function v(name, fallback) { return (s.getPropertyValue(name) || '').trim() || fallback; }
    palette.bg = v('--field-bg', '#0e1014');
    palette.grid = v('--field-grid', '#161a20');
    palette.dim = v('--field-dim', '#2a3038');
    palette.mid = v('--field-mid', '#5a6470');
    palette.lit = v('--field-lit', '#c45a5e');
    palette.hover = v('--field-hover', '#E8545C');
    palette.crest = v('--field-crest', '#f0a8ab');
    palette.text = v('--field-text', '#f2f2f2');
  }

  /* Rects are gathered per ink and filled once each: a handful of fills a
     frame rather than thousands of fillStyle switches. */
  var INKS = ['dim', 'mid', 'lit', 'hover', 'crest', 'text'];
  var buckets = {};
  INKS.forEach(function (ink) { buckets[ink] = []; });

  function push(ink, x, y, w, h) {
    var b = buckets[ink];
    b.push(x, y, w, h);
  }

  function flush() {
    var i, j, b;
    for (i = 0; i < INKS.length; i++) {
      b = buckets[INKS[i]];
      if (!b.length) continue;
      ctx.fillStyle = palette[INKS[i]];
      ctx.beginPath();
      for (j = 0; j < b.length; j += 4) ctx.rect(b[j], b[j + 1], b[j + 2], b[j + 3]);
      ctx.fill();
      b.length = 0;
    }
  }

  /* --------------------------------------------------------------- noise */
  var BAYER = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
  ];
  var NOISE = 128;

  function lcg(seed) {
    var state = seed >>> 0;
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function buildNoise(seed) {
    var rnd = lcg(seed), field = new Float32Array(NOISE * NOISE), i, pass, x, y, dx, dy;
    for (i = 0; i < field.length; i++) field[i] = rnd();
    for (pass = 0; pass < 2; pass++) {
      var next = new Float32Array(NOISE * NOISE);
      for (y = 0; y < NOISE; y++) {
        for (x = 0; x < NOISE; x++) {
          var sum = 0;
          for (dy = -1; dy <= 1; dy++) {
            for (dx = -1; dx <= 1; dx++) sum += field[((y + dy + NOISE) % NOISE) * NOISE + (x + dx + NOISE) % NOISE];
          }
          next[y * NOISE + x] = sum / 9;
        }
      }
      field = next;
    }
    var lo = Infinity, hi = -Infinity;
    for (i = 0; i < field.length; i++) { if (field[i] < lo) lo = field[i]; if (field[i] > hi) hi = field[i]; }
    for (i = 0; i < field.length; i++) field[i] = (field[i] - lo) / (hi - lo || 1);
    return field;
  }

  function buildJitter(seed) {
    var rnd = lcg(seed), tile = new Float32Array(4096), i;
    for (i = 0; i < tile.length; i++) tile[i] = rnd();
    return tile;
  }

  var noise = buildNoise(0xe8545c);
  var jitter = buildJitter(0x1d2b3a);

  function sample(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    var x0 = ((xi % NOISE) + NOISE) % NOISE, y0 = ((yi % NOISE) + NOISE) % NOISE;
    var x1 = (x0 + 1) % NOISE, y1 = (y0 + 1) % NOISE;
    var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    var a = noise[y0 * NOISE + x0], b = noise[y0 * NOISE + x1];
    var c = noise[y1 * NOISE + x0], d = noise[y1 * NOISE + x1];
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
  }

  /* -------------------------------------------------------------- the name */
  var NAME = 'JAMES BECKWITH';
  var SUB = [
    { text: 'PIANO', ink: 'text' }, { text: '/', ink: 'hover' },
    { text: 'COMPOSITION', ink: 'text' }, { text: '/', ink: 'hover' },
    { text: 'TECHNICIAN', ink: 'hover' }, { text: '/', ink: 'hover' },
    { text: 'LABS', ink: 'text' }
  ];
  var SUB_WORD_GAP = 6;
  var SUB_SCALE = 3;      /* strapline pixels per field cell */
  var SUB_GAP_ROWS = 3;   /* cells between name and strapline */

  var EQ_BAR_W = 2;       /* cells per bar */
  var EQ_GAP = 1;         /* cells between bars */
  var EQ_SEGS = 10;       /* LED segments per bar, one cell each with a gap */
  var EQ_FOOT = 1;        /* cells between the display and the bottom edge */
  var EQ_RISE = 0.55, EQ_FALL = 0.04;
  var PEAK_HOLD = 650, PEAK_GRAVITY = 0.004;

  function toWord(bitmap) {
    var mask = new Uint8Array(bitmap.width * bitmap.height), cells = [], r, c;
    for (r = 0; r < bitmap.height; r++) {
      for (c = 0; c < bitmap.width; c++) {
        if (bitmap.rows[r].charAt(c) === '1') { mask[r * bitmap.width + c] = 1; cells.push([c, r]); }
      }
    }
    return { rows: bitmap.rows, width: bitmap.width, height: bitmap.height, mask: mask, cells: cells };
  }

  var wordOneLine = toWord(G.setText(G.DISPLAY, NAME));
  var wordTwoLines = toWord(G.stack(NAME.split(' ').map(function (w) { return G.setText(G.DISPLAY, w); }), 3));

  var strap = (function () {
    var ink = [], x = 0, i, r, c;
    for (i = 0; i < SUB.length; i++) {
      var line = G.setText(G.SMALL, SUB[i].text);
      if (i) x += SUB_WORD_GAP;
      for (r = 0; r < line.height; r++) {
        for (c = 0; c < line.width; c++) if (line.rows[r].charAt(c) === '1') ink.push(x + c, r, i);
      }
      x += line.width;
    }
    return { ink: ink, width: x, height: G.SMALL.height };
  })();

  var stamps = {};
  Object.keys(G.STAMPS).forEach(function (k) {
    var rows = G.STAMPS[k];
    stamps[k] = { rows: rows, width: rows[0].length, height: rows.length };
  });

  /* ------------------------------------------------------------ geometry */
  var dpr = 1, W = 0, H = 0;
  var word = wordOneLine;
  var cw = 10;            /* device px per cell, fractional */
  var ox = 0, oy = 0;     /* device px of the name's top-left cell */
  var cMin = 0, rMin = 0, cols = 0, rows = 0;
  var ramp = new Float32Array(0);
  var strapBox = null;    /* in cells: c0, c1, r0, r1 */
  var eqBox = null;       /* in cells: c0, r0 (top), bars, barW, gap, segs */
  var restInks = [];

  function buildRestInks() {
    var bands = SHADES[settings.nameShade] || SHADES.gradient, r;
    restInks = [];
    for (r = 0; r < word.height; r++) {
      /* Two-line names shade each line on its own */
      var local = word === wordTwoLines ? (r >= G.DISPLAY.height + 3 ? r - G.DISPLAY.height - 3 : Math.min(r, G.DISPLAY.height - 1)) : r;
      restInks.push(bands[Math.min(bands.length - 1, Math.floor((local / G.DISPLAY.height) * bands.length))]);
    }
  }

  function layout() {
    var box = host.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return false;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nw = Math.round(box.width * dpr), nh = Math.round(box.height * dpr);
    /* Resetting canvas.width clears it, so only when the size changed */
    if (nw !== W || nh !== H) {
      W = nw; H = nh;
      canvas.width = W; canvas.height = H;
    }
    canvas.style.width = box.width + 'px';
    canvas.style.height = box.height + 'px';

    /* The pixel size is the setting, shrunk only when the name would not
       fit; a name squeezed well below it breaks onto two lines instead. */
    var avail = box.width * 0.9;
    var fitOne = avail / wordOneLine.width;
    var cell = Math.min(settings.cellSize, fitOne);
    var nextWord = wordOneLine;
    if (fitOne < settings.cellSize * 0.7) {
      nextWord = wordTwoLines;
      cell = Math.min(settings.cellSize, avail / wordTwoLines.width);
    }
    if (nextWord !== word) {
      word = nextWord;
      entrance = null;
    }
    cw = cell * dpr;

    var strapCells = Math.ceil(strap.width / SUB_SCALE);
    var showStrap = strapCells * cell <= box.width * 0.94;
    var strapRows = Math.ceil(strap.height / SUB_SCALE);
    var totalRows = word.height + (showStrap ? SUB_GAP_ROWS + strapRows : 0);

    ox = Math.round((W - word.width * cw) / 2);
    oy = Math.round((box.height * 0.4 - (totalRows * cell) / 2) * dpr);

    strapBox = null;
    if (showStrap) {
      var c0 = Math.round((word.width - strapCells) / 2);
      var r0 = word.height + SUB_GAP_ROWS;
      strapBox = { c0: c0, c1: c0 + strapCells, r0: r0, r1: r0 + strapRows };
    }

    /* Hi-fi display: LED bars across the whole foot of the desk, sized in
       whole cells so every segment is identical, centred on the spare. */
    var firstCol = Math.ceil(-ox / cw);
    var span = Math.floor((W - ox) / cw) - firstCol;
    var bars = Math.floor((span + EQ_GAP) / (EQ_BAR_W + EQ_GAP));
    eqBox = null;
    if (bars >= 8) {
      var eqCols = bars * (EQ_BAR_W + EQ_GAP) - EQ_GAP;
      var eqRows = EQ_SEGS * 2 - 1;
      var bottomRow = Math.floor((H - oy) / cw) - 1 - EQ_FOOT;
      if (eqLevel.length < bars) {
        eqLevel = new Float32Array(bars);
        eqPeak = new Float32Array(bars);
        eqPeakAt = new Float32Array(bars);
        eqPeakVel = new Float32Array(bars);
      }
      eqBox = {
        c0: firstCol + Math.floor((span - eqCols) / 2),
        r0: bottomRow - eqRows + 1,
        bars: bars, cols: eqCols, rows: eqRows
      };
      /* Keep it clear of the strapline on short screens */
      if (strapBox && eqBox.r0 < strapBox.r1 + 6) eqBox = null;
    }

    cMin = -Math.ceil(ox / cw) - 1;
    rMin = -Math.ceil(oy / cw) - 1;
    cols = Math.ceil((W - ox) / cw) - cMin + 1;
    rows = Math.ceil((H - oy) / cw) - rMin + 1;

    /* Dust gathers toward the edges, stays clear of the centre and fades
       out under the menubar. */
    ramp = new Float32Array(cols * rows);
    var r, c;
    for (r = 0; r < rows; r++) {
      var y = oy + (rMin + r + 0.5) * cw;
      var ny = (y / H) * 2 - 1;
      var clear = 1;
      for (c = 0; c < cols; c++) {
        var x = ox + (cMin + c + 0.5) * cw;
        var nx = (x / W) * 2 - 1;
        var rr = Math.sqrt(nx * nx + ny * ny * 0.82);
        var eased = Math.min(1, Math.max(0, (rr - 0.4) / 0.85));
        ramp[r * cols + c] = eased * eased * clear;
      }
    }

    buildRestInks();

    window.dispatchEvent(new CustomEvent('jb-pixel-grid', {
      detail: {
        x: box.left + ox / dpr,
        y: box.top + oy / dpr,
        cw: cell, ch: cell,
        width: word.width * cell,
        height: totalRows * cell
      }
    }));
    return true;
  }

  /* ---------------------------------------------------- live interaction */
  var CURSOR_CELLS = 12;
  var HUSH_REACH = 96;
  var CLICK_MS = 160;              /* a press shorter than this is a click */
  var GATHER_S = 0.9;              /* swarm to fully formed piano */
  var GROW_S = 3.2;                /* smallest to largest while held */
  var PIANO_FROM = 0.75, PIANO_MAX = 3; /* field cells per piano pixel */
  var PARTICLE_CAP = 1800;
  var BANDS = MUSIC ? MUSIC.BANDS : 32;

  var pointer = { x: -1e4, y: -1e4 };
  var strength = 0, targetStrength = 0;
  var holding = null;     /* { x, y, start, swarm } device px, ms */
  var particles = [];
  var wordPress = false;
  var entrance = null;
  var entrancePending = !reduced;
  var eqLevel = new Float32Array(0);
  var eqPeak = new Float32Array(0);
  var eqPeakAt = new Float32Array(0);
  var eqPeakVel = new Float32Array(0);
  var visible = true;

  var CONTROLS = 'a, button, input, select, textarea, label, [role="button"], .menubar, .menu, .win, .icon, .sticky, .alert-layer, .context-menu, [data-no-stamp]';
  var QUIET = '.menubar, .win:not([hidden]), .menu:not([hidden]), .context-menu:not([hidden])';
  var quietRects = [], quietAt = -1;
  var desktopEl = document.getElementById('desktop');

  function refreshQuiet(now) {
    if (now - quietAt < 200) return;
    quietAt = now;
    quietRects = [];
    document.querySelectorAll(QUIET).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width >= 1 && r.height >= 1) quietRects.push(r);
    });
  }

  /* 1 in open desk, easing to 0 against the menubar and windows */
  function strengthAt(clientX, clientY) {
    var nearest = Infinity, i;
    for (i = 0; i < quietRects.length; i++) {
      var q = quietRects[i];
      var dx = Math.max(q.left - clientX, 0, clientX - q.right);
      var dy = Math.max(q.top - clientY, 0, clientY - q.bottom);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < nearest) nearest = d;
    }
    return nearest >= HUSH_REACH ? 1 : Math.pow(nearest / HUSH_REACH, 3);
  }

  function onWordAt(x, y) {
    return x >= ox && y >= oy && x < ox + word.width * cw && y < oy + word.height * cw;
  }

  function replay() {
    if (reduced) return;
    entrance = null;
    entrancePending = true;
  }

  function beginEntrance() {
    entrancePending = false;
    entrance = FX && settings.entrance !== 'none'
      ? FX.create(settings.entrance, word, settings.entranceSpeed)
      : null;
  }

  /* ---------------------------------------------------------------- draw */
  var glows = [];
  var piano = stamps.keys;
  var pianoBox = null;    /* cells covered by a formed piano, kept clear of dust */

  function easeOut(n) { return 1 - Math.pow(1 - n, 3); }
  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

  /* Every lit piano pixel gets a swarm particle: where it orbits the press
     before gathering, and how late it arrives. */
  function makeSwarm() {
    var list = [], lx, ly;
    for (ly = 0; ly < piano.height; ly++) {
      for (lx = 0; lx < piano.width; lx++) {
        var code = piano.rows[ly].charCodeAt(lx);
        if (code === 48) continue;
        list.push({
          lx: lx, ly: ly, fill: code - 48,
          angle: Math.random() * Math.PI * 2,
          radius: 0.25 + Math.random() * 0.55,
          spin: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9),
          delay: Math.random(),
          phase: Math.random() * 6.283
        });
      }
    }
    return list;
  }

  /* The held piano this frame. Piano pixels are a whole number of device
     pixels, so every key is the same width at every size while it grows
     smoothly; stray swarm particles stay on the field lattice.
     Calls fn(x, y, size, ink) in device px for every pixel. */
  function eachPianoPixel(time, fn) {
    var held = (time - holding.start - CLICK_MS) / 1000;
    if (held < 0) return null;
    var g = clamp01(held / GROW_S);
    var grow = g * g * (3 - 2 * g);
    var maxK = PIANO_MAX * settings.stampSize;
    var pw = Math.max(2, Math.round(cw * (PIANO_FROM + (maxK - PIANO_FROM) * grow)));
    var x0 = Math.round(holding.x - (piano.width * pw) / 2);
    var y0 = Math.round(holding.y - (piano.height * pw) / 2);
    var spread = piano.width * pw * 0.75 + 6 * cw;
    var t = time / 1000, formed = 0, i;
    for (i = 0; i < holding.swarm.length; i++) {
      var q = holding.swarm[i];
      var a = easeOut(clamp01((held - q.delay * GATHER_S * 0.45) / (GATHER_S * 0.55)));
      if (a >= 1) {
        formed++;
        fn(x0 + q.lx * pw, y0 + q.ly * pw, pw, q.fill === 2 ? 'hover' : 'lit');
        continue;
      }
      var ang = q.angle + t * q.spin;
      var sx = holding.x + Math.cos(ang) * q.radius * spread;
      var sy = holding.y + Math.sin(ang) * q.radius * spread * 0.6;
      var tx = x0 + (q.lx + 0.5) * pw, ty = y0 + (q.ly + 0.5) * pw;
      var wob = (1 - a) * 1.5 * cw;
      /* Snap the travelling particle to the lattice */
      var col = Math.round((sx + (tx - sx) * a + Math.sin(t * 5 + q.phase) * wob - ox) / cw - 0.5);
      var row = Math.round((sy + (ty - sy) * a + Math.cos(t * 4 + q.phase) * wob - oy) / cw - 0.5);
      var xl = ox + col * cw, yt = oy + row * cw;
      fn(Math.round(xl), Math.round(yt), Math.round(xl + cw) - Math.round(xl), a > 0.5 ? 'lit' : 'mid');
    }
    return {
      x0: x0, y0: y0, x1: x0 + piano.width * pw, y1: y0 + piano.height * pw,
      formed: formed / holding.swarm.length
    };
  }

  /* Particles live in device px; velocity in px per second */
  function spawn(x, y, vx, vy, life, size, ink, now) {
    if (particles.length >= PARTICLE_CAP) particles.shift();
    particles.push({ x: x, y: y, vx: vx, vy: vy, life: life, size: size, ink: ink, born: now });
  }

  /* A quick click: a small ring of sparks from the pressed cell */
  function clickBurst(x, y, now) {
    var col = Math.floor((x - ox) / cw), row = Math.floor((y - oy) / cw);
    var cx = ox + (col + 0.5) * cw, cy = oy + (row + 0.5) * cw, n = 14, i;
    for (i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 + Math.random() * 0.35;
      var speed = (5 + Math.random() * 5) * cw;
      spawn(cx, cy, Math.cos(ang) * speed, Math.sin(ang) * speed, 0.35 + Math.random() * 0.2, cw,
        i % 3 === 0 ? 'crest' : 'hover', now);
    }
    spawn(cx, cy, 0, 0, 0.12, cw * 2, 'crest', now);
  }

  /* Release: every piano pixel flies outward from where it is now */
  function pianoBurst(now) {
    var hx = holding.x, hy = holding.y;
    eachPianoPixel(now, function (x, y, size, ink) {
      var mx = x + size / 2, my = y + size / 2;
      var dx = mx - hx, dy = my - hy;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var speed = (6 + Math.random() * 14) * cw + d * 0.35;
      spawn(mx, my, (dx / d + (Math.random() - 0.5) * 0.6) * speed,
        (dy / d + (Math.random() - 0.5) * 0.6) * speed,
        0.45 + Math.random() * 0.45, size, ink === 'hover' ? 'crest' : 'hover', now);
    });
    clickBurst(hx, hy, now);
  }

  function drawParticles(time) {
    var alive = [], i;
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      /* Born from a pointer event, a moment after this frame's clock */
      var age = Math.max(0, (time - p.born) / 1000 / p.life);
      if (age >= 1) continue;
      alive.push(p);
      var travel = p.life * easeOut(age);
      var size = Math.max(cw, p.size * (1 - age * age));
      /* Snap to the lattice once shrunk to a single cell */
      var x = p.x + p.vx * travel - size / 2, y = p.y + p.vy * travel - size / 2;
      var col = Math.round((x - ox) / cw), row = Math.round((y - oy) / cw);
      if (size <= cw * 1.01) { x = ox + col * cw; y = oy + row * cw; }
      /* Fade by stepping down the inks, then an ordered dissolve */
      if (age > 0.6 && (age - 0.6) / 0.4 > (BAYER[(row & 7) * 8 + (col & 7)] + 0.5) / 64) continue;
      var rx = Math.round(x), ry = Math.round(y), s = Math.round(size);
      push(age < 0.3 ? p.ink : age < 0.65 ? 'lit' : 'mid', rx, ry, s, s);
    }
    particles = alive;
  }

  function glowAt(cx, cy) {
    var best = 0, i;
    for (i = 0; i < glows.length; i++) {
      var g = glows[i];
      var dx = cx - g.x, dy = cy - g.y;
      if (dx > g.reach || dx < -g.reach || dy > g.reach || dy < -g.reach) continue;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < g.reach) {
        var f = 1 - d / g.reach;
        var a = f * f * g.strength;
        if (a > best) best = a;
      }
    }
    return best;
  }

  function restInkAtRow(row) {
    return restInks[Math.max(0, Math.min(restInks.length - 1, row))] || 'hover';
  }

  function wordInk(cx, cy, row) {
    var crest = glowAt(cx, cy);
    return crest > 0.45 ? 'crest' : crest > 0.12 ? 'hover' : restInkAtRow(row);
  }

  function cellRect(ink, col, row) {
    var xl = ox + col * cw, yt = oy + row * cw;
    var x = Math.round(xl), y = Math.round(yt);
    push(ink, x, y, Math.round(xl + cw) - x, Math.round(yt + cw) - y);
  }

  function emitEffect(col, row, ink, kind, weight) {
    var xl = ox + col * cw, yt = oy + row * cw;
    var x = Math.round(xl), y = Math.round(yt);
    var w = Math.round(xl + cw) - x, h = Math.round(yt + cw) - y;
    if (ink === 'rest') ink = wordInk(xl + cw / 2, yt + cw / 2, row);
    if (kind === 'block') {
      push(ink, x, y, w, h);
    } else if (kind === 'bar') {
      var sw = Math.max(1, Math.round(cw / 5));
      push(ink, x + Math.round((w - sw) / 2), y, sw, h);
    } else if (kind === 'dash') {
      var sh = Math.max(1, Math.round(cw / 5));
      push(ink, x, y + Math.round((h - sh) / 2), w, sh);
    } else {
      var size = Math.max(1, Math.round(w * Math.sqrt(weight || 0.3)));
      push(ink, x + Math.round((w - size) / 2), y + Math.round((h - size) / 2), size, size);
    }
  }

  /* Graph paper: hairlines on the lattice every few cells, anchored to the
     name so the squares frame its pixels. Dust and type paint over it. */
  function drawGrid() {
    var step = settings.gridCells * cw;
    var line = Math.max(1, Math.round(dpr));
    var x, y, k;
    ctx.globalAlpha = Math.min(1, settings.grid);
    ctx.fillStyle = palette.grid;
    ctx.beginPath();
    for (k = Math.ceil(-ox / step); (x = ox + k * step) < W; k++) ctx.rect(Math.round(x), 0, line, H);
    for (k = Math.ceil(-oy / step); (y = oy + k * step) < H; k++) ctx.rect(0, Math.round(y), W, line);
    ctx.fill();
    /* Above 1 the lines thicken rather than darken past the token */
    if (settings.grid > 1.01) {
      ctx.globalAlpha = settings.grid - 1;
      ctx.beginPath();
      for (k = Math.ceil(-ox / step); (x = ox + k * step) < W; k++) ctx.rect(Math.round(x) + line, 0, line, H);
      for (k = Math.ceil(-oy / step); (y = oy + k * step) < H; k++) ctx.rect(0, Math.round(y) + line, W, line);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawEq() {
    var i, sg, dx;
    for (i = 0; i < eqBox.bars; i++) {
      var c0 = eqBox.c0 + i * (EQ_BAR_W + EQ_GAP);
      var lit = reduced ? 0 : Math.round(eqLevel[i] * EQ_SEGS);
      var peak = reduced ? -1 : Math.min(EQ_SEGS - 1, Math.round(eqPeak[i] * EQ_SEGS) - 1);
      for (sg = 0; sg < EQ_SEGS; sg++) {
        var row = eqBox.r0 + eqBox.rows - 1 - sg * 2;
        var ink;
        if (sg < lit) ink = sg >= EQ_SEGS - 2 ? 'crest' : sg >= EQ_SEGS - 4 ? 'hover' : 'lit';
        else if (sg === peak && peak >= lit) ink = 'text';
        else continue;
        for (dx = 0; dx < EQ_BAR_W; dx++) cellRect(ink, c0 + dx, row);
      }
    }
  }

  function draw(time) {
    var t = reduced ? 0 : time / 1000;
    var booting = document.body.classList.contains('booting');
    refreshQuiet(time);

    if (entrancePending && !booting && !reduced) beginEntrance();
    if (entrance && !entrance.advance(time)) entrance = null;
    var nameBusy = !!entrance || (entrancePending && !reduced);

    strength += (targetStrength - strength) * 0.3;

    /* Hi-fi EQ ballistics: fast attack, steady fall, peaks hold then drop */
    var showEq = eqBox && MUSIC && settings.music > 0.01;
    if (showEq && !reduced) {
      var heard = MUSIC.sample(time);
      var i, n = eqBox.bars;
      for (i = 0; i < n; i++) {
        var pos = (i / (n - 1)) * (BANDS - 1);
        var b0 = Math.floor(pos), b1 = Math.min(BANDS - 1, b0 + 1), f = pos - b0;
        /* Neighbouring bars share bands on a wide screen; a little flutter
           each keeps them from moving in lockstep */
        var flutter = 0.78 + 0.22 * sample(i * 0.9, time * 0.003);
        var target = Math.min(1, (heard.bands[b0] * (1 - f) + heard.bands[b1] * f) * flutter * settings.music);
        if (target > eqLevel[i]) eqLevel[i] += (target - eqLevel[i]) * EQ_RISE;
        else eqLevel[i] = Math.max(target, eqLevel[i] - EQ_FALL);
        if (eqLevel[i] >= eqPeak[i]) {
          eqPeak[i] = eqLevel[i];
          eqPeakAt[i] = time;
          eqPeakVel[i] = 0;
        } else if (time - eqPeakAt[i] > PEAK_HOLD) {
          eqPeakVel[i] += PEAK_GRAVITY;
          eqPeak[i] = Math.max(eqLevel[i], eqPeak[i] - eqPeakVel[i]);
        }
      }
    }

    var reachBase = CURSOR_CELLS * cw * (0.6 + 0.4 * settings.cursor);
    glows.length = 0;
    if (strength > 0.01 && settings.cursor > 0.01) {
      glows.push({ x: pointer.x, y: pointer.y, strength: strength * settings.cursor, reach: reachBase * (0.45 + 0.55 * strength) });
    }

    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
    if (settings.grid > 0.01) drawGrid();

    var density = settings.density * 0.62;
    var twinkle = settings.twinkle * 0.18;
    pianoBox = null;
    if (holding) {
      var formed = eachPianoPixel(time, function () {});
      if (formed && formed.formed > 0.6) pianoBox = formed;
    }
    var r, c;
    for (r = 0; r < rows; r++) {
      var row = rMin + r;
      var yTop = oy + row * cw;
      var y = Math.round(yTop);
      var ch = Math.round(yTop + cw) - y;
      var cy = yTop + cw / 2;
      var inWordRow = row >= 0 && row < word.height;
      var inStrapRow = strapBox && row >= strapBox.r0 - 1 && row < strapBox.r1 + 1;


      for (c = 0; c < cols; c++) {
        var col = cMin + c;
        if (inWordRow && col >= 0 && col < word.width && word.mask[row * word.width + col]) continue;
        if (inStrapRow && col >= strapBox.c0 - 1 && col < strapBox.c1 + 1) continue;
        if (pianoBox && ox + (col + 1) * cw > pianoBox.x0 && ox + col * cw < pianoBox.x1 &&
            yTop + cw > pianoBox.y0 && yTop < pianoBox.y1) continue;

        var shade = ramp[r * cols + c];
        var lum = 0;
        if (shade > 0.002) {
          var u = col / 9, v = row / 9;
          var base = 0.6 * sample(u - t * 0.12, v - t * 0.04) + 0.4 * sample(u * 0.55 + t * 0.07, v * 0.55 + t * 0.05);
          var tw = 0.5 + 0.5 * Math.sin(t * 1.1 + jitter[(row * 37 + col * 11) & 4095] * 6.283);
          lum = shade * (0.3 + 0.52 * base * base + twinkle * tw) * density;
        }

        var xLeft = ox + col * cw;
        var cx = xLeft + cw / 2;

        /* The glow replaces the drifting dust rather than adding to it, so
           the pixels under the cursor hold steady instead of flickering */
        var glow = glows.length ? glowAt(cx, cy) : 0;
        if (glow * 0.6 > lum) lum = glow * 0.6;

        /* Bayer keeps structure where energy is high; the jitter tile
           scatters the resting dust so it never reads as a lattice. */
        var threshold = 0.78 * ((BAYER[(row & 7) * 8 + (col & 7)] + 0.5) / 64) + 0.22 * jitter[(row & 63) * 64 + (col & 63)];
        if (lum <= threshold) continue;

        var heat = glow;
        var x = Math.round(xLeft);
        push(heat > 0.34 ? 'lit' : heat > 0.1 ? 'mid' : 'dim', x, y, Math.round(xLeft + cw) - x, ch);
      }
    }
    if (showEq) drawEq();
    flush();

    /* The name at rest, or the entrance making it */
    if (entrance) {
      entrance.frame(emitEffect);
    } else if (!nameBusy) {
      var cells = word.cells, k;
      var quiet = glows.every(function (g) {
        return g.x < ox - g.reach || g.x > ox + word.width * cw + g.reach ||
          g.y < oy - g.reach || g.y > oy + word.height * cw + g.reach;
      });
      for (k = 0; k < cells.length; k++) {
        var wc = cells[k][0], wr = cells[k][1];
        cellRect(quiet ? restInkAtRow(wr) : wordInk(ox + (wc + 0.5) * cw, oy + (wr + 0.5) * cw, wr), wc, wr);
      }
    }

    /* The held piano and any bursts fly over everything */
    if (holding) {
      eachPianoPixel(time, function (x, y, size, ink) { push(ink, x, y, size, size); });
    }
    if (particles.length) drawParticles(time);

    /* Strapline, typed in as the entrance finishes */
    if (strapBox) {
      var reveal = entrance ? Math.max(0, (entrance.progress() - 0.55) / 0.45) : nameBusy ? 0 : 1;
      var limit = reveal * strap.width;
      var sp = cw / SUB_SCALE;
      var sx0 = ox + strapBox.c0 * cw, sy0 = oy + strapBox.r0 * cw;
      var ink = strap.ink, n;
      for (n = 0; n < ink.length; n += 3) {
        if (ink[n] >= limit) continue;
        var pxl = sx0 + ink[n] * sp, pyt = sy0 + ink[n + 1] * sp;
        var px = Math.round(pxl), py = Math.round(pyt);
        push(SUB[ink[n + 2]].ink, px, py, Math.round(pxl + sp) - px, Math.round(pyt + sp) - py);
      }
    }
    flush();
  }

  /* ----------------------------------------------------------- the loop */
  var frame = 0, lastDraw = 0;
  function loop(time) {
    frame = requestAnimationFrame(loop);
    if (time - lastDraw < 25) return;
    lastDraw = time;
    draw(time);
  }

  function redrawIfStill() {
    if (reduced) draw(0);
  }

  function locate(e) {
    var box = host.getBoundingClientRect();
    return {
      inside: e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom,
      x: (e.clientX - box.left) * dpr,
      y: (e.clientY - box.top) * dpr
    };
  }

  function onControl(target) {
    return target instanceof Element && target.closest(CONTROLS) !== null;
  }

  function onPointerMove(e) {
    if (!visible) return;
    var p = locate(e);
    refreshQuiet(performance.now());
    if (!holding) targetStrength = p.inside ? strengthAt(e.clientX, e.clientY) : 0;
    var overWord = p.inside && !reduced && onWordAt(p.x, p.y) && !onControl(e.target);
    if (desktopEl) desktopEl.classList.toggle('over-name', overWord);
    if (!p.inside) return;
    pointer.x = p.x;
    pointer.y = p.y;
    if (reduced) draw(0);
  }

  function onPointerDown(e) {
    if (!visible || e.button > 0) return;
    var p = locate(e);
    if (!p.inside || onControl(e.target)) return;
    pointer.x = p.x;
    pointer.y = p.y;
    if (onWordAt(p.x, p.y)) {
      wordPress = true;
      return;
    }
    wordPress = false;
    if (reduced) return;
    targetStrength = 0;
    holding = { x: p.x, y: p.y, start: performance.now(), swarm: makeSwarm() };
  }

  function onPointerUp(e) {
    if (wordPress) {
      wordPress = false;
      var w = locate(e);
      if (w.inside && onWordAt(w.x, w.y)) replay();
      return;
    }
    if (!holding) return;
    if (finePointer) {
      var p = locate(e);
      targetStrength = p.inside ? strengthAt(e.clientX, e.clientY) : 0;
    }
    var now = performance.now();
    if (now - holding.start < CLICK_MS) clickBurst(holding.x, holding.y, now);
    else pianoBurst(now);
    holding = null;
  }

  function onPointerCancel() {
    holding = null;
    wordPress = false;
  }

  readPalette();
  if (MUSIC && host.dataset.track) MUSIC.load(host.dataset.track);

  var drawing = false;
  function startDrawing() {
    if (drawing) return;
    drawing = true;
    if (reduced) draw(0);
    else frame = requestAnimationFrame(loop);
  }
  if (layout()) startDrawing();

  if (finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerCancel, { passive: true });
  window.addEventListener('contextmenu', onPointerCancel, { passive: true });

  window.addEventListener('jb-theme', function () {
    readPalette();
    if (reduced) draw(0);
    else replay();
  });
  window.addEventListener('jb-field-settings', function (e) {
    applySettings((e && e.detail) || {});
  });

  new ResizeObserver(function () {
    if (!layout()) return;
    startDrawing();
    /* Repaint in the same tick so a drag-resize never shows a cleared buffer */
    draw(reduced ? 0 : performance.now());
  }).observe(host);

  new IntersectionObserver(function (entries) {
    visible = !!(entries[0] && entries[0].isIntersecting);
    if (reduced) return;
    if (visible && !frame && drawing) frame = requestAnimationFrame(loop);
    else if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '64px' }).observe(host);
})();
