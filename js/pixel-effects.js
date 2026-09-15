/* Name entrance effects for the pixel field.

   Each effect is a pure function of progress: frame(p, word, emit)
   is called with p running 0..1 and emits cells in word coordinates:

     emit(col, row, ink, kind, weight)
       ink    'rest' (the name's own resting ink) | 'crest' | 'hover' | 'lit' | 'mid' | 'dim'
       kind   'block' whole cell | 'mark' smaller square (weight 0..1 = share of cell)
              'bar' thin vertical stroke | 'dash' thin horizontal stroke

   Cells may land outside the word; the field paints them over its dust.
   Once p reaches 1 the field draws the resting name itself, so an effect
   should have every lit cell at 'rest' by the end.

   To add an effect: register it below with an id, a label, a duration (ms
   at speed 1) and a frame function. */
(function () {
  'use strict';

  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
  function easeOut(n) { return 1 - Math.pow(1 - n, 3); }
  function easeInOut(n) { return n < 0.5 ? 4 * n * n * n : 1 - Math.pow(-2 * n + 2, 3) / 2; }

  /* Stable 0..1 hash of two integers. */
  function hash(a, b) {
    var h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  var EFFECTS = {};
  var ORDER = [];

  function register(id, def) {
    if (!EFFECTS[id]) ORDER.push(id);
    EFFECTS[id] = def;
  }

  /* Glissando: columns drop in left to right like hammers striking,
     each flashing on impact over a key-bed line. */
  register('hammer', {
    label: 'Hammer glissando',
    duration: 1900,
    frame: function (p, word, emit) {
      var cells = word.cells, i, c, r;
      for (i = 0; i < cells.length; i++) {
        c = cells[i][0]; r = cells[i][1];
        var delay = (c / word.width) * 0.68 + hash(c, 7) * 0.04;
        var q = (p - delay) / 0.2;
        if (q <= 0) continue;
        if (q < 1) {
          var fall = Math.round((1 - q * q) * (word.height + 4));
          emit(c, r - fall, 'hover', 'block', 1);
        } else if (q < 1.45) {
          emit(c, r, q < 1.2 ? 'crest' : 'hover', 'block', 1);
        } else {
          emit(c, r, 'rest', 'block', 1);
        }
      }
      for (c = 0; c < word.width; c++) {
        var d2 = (c / word.width) * 0.68;
        var k = (p - d2) / 0.2 - 1;
        if (k > 0 && k < 0.8) emit(c, word.height + 1, k < 0.3 ? 'lit' : 'mid', 'dash', 1);
      }
    }
  });

  /* Decrypt: cells flicker as noise, then lock into place one by one. */
  register('decrypt', {
    label: 'Decrypt',
    duration: 2100,
    frame: function (p, word, emit) {
      var tick = Math.floor(p * 26);
      var cells = word.cells, i, c, r;
      for (i = 0; i < cells.length; i++) {
        c = cells[i][0]; r = cells[i][1];
        var appear = hash(i, 1) * 0.3;
        var lock = 0.3 + hash(i, 2) * 0.58;
        if (p < appear) continue;
        if (p < lock) {
          var h = hash(i, tick);
          if (h < 0.18) continue;
          emit(c, r, h > 0.75 ? 'lit' : 'mid', 'mark', 0.2 + 0.5 * hash(tick, i));
        } else if (p < lock + 0.05) {
          emit(c, r, 'crest', 'block', 1);
        } else {
          emit(c, r, 'rest', 'block', 1);
        }
      }
      if (p < 0.85) {
        for (r = -1; r <= word.height; r++) {
          for (c = -2; c < word.width + 2; c++) {
            if (r >= 0 && r < word.height && c >= 0 && c < word.width && word.mask[r * word.width + c]) continue;
            if (hash(c + 97, r + 31) > 0.05 || hash(c * 3 + tick, r) < 0.5) continue;
            emit(c, r, 'dim', 'mark', 0.2);
          }
        }
      }
    }
  });

  /* Sweep: a bright beam crosses the name, leaving it lit and shedding
     sparks that fall away behind it. */
  register('sweep', {
    label: 'Light sweep',
    duration: 1700,
    frame: function (p, word, emit) {
      var run = clamp01(p / 0.82);
      var beamAt = function (n) { return -4 + easeInOut(n) * (word.width + 8); };
      var beam = beamAt(run);
      var cells = word.cells, i, c, r;
      for (i = 0; i < cells.length; i++) {
        c = cells[i][0]; r = cells[i][1];
        if (c > beam + 1) continue;
        var behind = beam - c;
        emit(c, r, behind < 1.5 ? 'crest' : behind < 5 ? 'hover' : 'rest', 'block', 1);
      }
      if (run < 1) {
        var bc = Math.round(beam);
        for (r = -3; r < word.height + 3; r++) emit(bc, r, 'crest', 'bar', 1);
        var now = Math.floor(run * 60), k;
        for (k = 0; k < 18; k++) {
          var born = now - k;
          if (born < 0) break;
          var age = k / 60;
          var n = born * 13;
          var sx = beamAt(born / 60) - hash(n, 1) * age * 70;
          var sy = hash(n, 2) * word.height + Math.pow(age * 18, 2) * 0.35;
          emit(Math.round(sx), Math.round(sy), k < 5 ? 'crest' : 'lit', 'mark', 0.35 * (1 - k / 18));
        }
      }
    }
  });

  /* Rise: the name's columns fill like EQ bars from the centre out, then
     drain from the top to leave the letters behind. */
  register('rise', {
    label: 'EQ rise',
    duration: 2300,
    frame: function (p, word, emit) {
      var c, r;
      for (c = 0; c < word.width; c++) {
        var from = Math.abs(c / word.width - 0.5) * 0.5 + hash(c, 3) * 0.04;
        var fill = easeOut(clamp01((p - from * 0.6) / 0.32));
        var bounce = 1 + 0.18 * Math.sin(fill * Math.PI) * hash(c, 4);
        var level = fill * bounce * word.height;
        var drain = easeInOut(clamp01((p - 0.52 - from * 0.35) / 0.3)) * (word.height + 1);
        var top = word.height - Math.ceil(level);
        for (r = 0; r < word.height; r++) {
          var lit = word.mask[r * word.width + c] === 1;
          if (word.height - 1 - r >= level) continue;
          if (lit) emit(c, r, drain > 0 ? 'rest' : r === top ? 'crest' : 'hover', 'block', 1);
          else if (r >= drain) emit(c, r, r === top || r === Math.ceil(drain) ? 'mid' : 'dim', 'block', 1);
        }
        if (fill > 0 && drain <= 0 && top - 2 >= -3) emit(c, top - 2, 'lit', 'dash', 1);
      }
    }
  });

  /* Scatter: every cell flies in from somewhere across the desk. */
  register('scatter', {
    label: 'Scatter',
    duration: 1800,
    frame: function (p, word, emit) {
      var cells = word.cells, i;
      for (i = 0; i < cells.length; i++) {
        var c = cells[i][0], r = cells[i][1];
        var delay = hash(i, 5) * 0.4;
        var q = clamp01((p - delay) / 0.5);
        if (q <= 0) continue;
        var e = easeOut(q);
        var sx = c + (hash(i, 6) - 0.5) * 90 * (1 - e);
        var sy = r + (hash(i, 8) - 0.5) * 40 * (1 - e);
        if (q < 1) emit(Math.round(sx), Math.round(sy), q > 0.85 ? 'crest' : 'lit', q < 0.6 ? 'mark' : 'block', 0.45);
        else emit(c, r, p - delay - 0.5 < 0.06 ? 'hover' : 'rest', 'block', 1);
      }
    }
  });

  var lastPicked = '';

  /* Start an effect over a word ({rows, width, height, mask, cells}).
     Returns null for 'none' or an unknown id. */
  function create(id, word, speed) {
    if (id === 'random') {
      var pool = ORDER.filter(function (x) { return x !== lastPicked; });
      id = pool[Math.floor(Math.random() * pool.length)];
    }
    var def = EFFECTS[id];
    if (!def) return null;
    lastPicked = id;
    var length = def.duration / Math.max(0.1, speed || 1);
    var start = -1;
    var progress = 0;
    return {
      id: id,
      progress: function () { return progress; },
      /* Advance to a rAF time (ms). False once the effect has played out. */
      advance: function (time) {
        if (start < 0) start = time;
        progress = clamp01((time - start) / length);
        return progress < 1;
      },
      frame: function (emit) { def.frame(progress, word, emit); }
    };
  }

  window.JBFieldEffects = {
    list: function () {
      return ORDER.map(function (id) { return { id: id, label: EFFECTS[id].label }; });
    },
    create: create,
    register: register
  };
})();
