/* What the field's hi-fi EQ hears. Nothing is ever played aloud.

   Bands are log-spaced from 20 Hz (band 0) to 20 kHz (last band), the way a
   spectrum analyser on a mixing desk reads a track, and levels are in
   decibels scaled 0..1.

   By default a generated mix drives it: a spectral model of a full track
   rather than audio. Kick and bass fill the lows (with the bass ducking
   under each kick), a snare lands on two and four, hi-hats tick in the top
   octaves, piano chords and a lead line sit in the mids, all over a pink,
   rolled-off mix bed with a little analyser shimmer.

   If the field host carries data-track="<url>", that timeline is used
   instead. It is produced offline from a real recording, with the same
   20 Hz - 20 kHz log bands:
     { "fps": 30, "bands": 32, "frames": N,
       "data": base64 of N*bands bytes (0..255 per band per frame),
       "beats": base64 of N bytes (0..255 beat strength per frame) } */
(function () {
  'use strict';

  var BANDS = 32;
  var LOW_HZ = 20, HIGH_HZ = 20000;
  var OCTAVES = Math.log(HIGH_HZ / LOW_HZ) / Math.LN2;   /* ~10 */
  var BANDS_PER_OCTAVE = BANDS / OCTAVES;
  var DB_FLOOR = -36, DB_RANGE = 34;

  var out = { bands: new Float32Array(BANDS), beat: 0 };
  var energy = new Float32Array(BANDS);

  /* ------------------------------------------------------------- helpers */
  function bandOf(hz) {
    return (Math.log(hz / LOW_HZ) / Math.LN2) * BANDS_PER_OCTAVE - 0.5;
  }

  function midiHz(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  /* Add power at a frequency, spread over neighbouring bands.
     width is in octaves (standard deviation). */
  function add(hz, power, width) {
    if (power <= 0) return;
    var pos = bandOf(hz);
    var sd = Math.max(0.35, width * BANDS_PER_OCTAVE);
    var reach = Math.ceil(sd * 2.5);
    var lo = Math.max(0, Math.floor(pos - reach)), hi = Math.min(BANDS - 1, Math.ceil(pos + reach));
    for (var b = lo; b <= hi; b++) {
      var d = (b - pos) / sd;
      energy[b] += power * Math.exp(-0.5 * d * d);
    }
  }

  function hash(a, b) {
    var h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  /* A pink mix bed: flat through the low mids, sloping down above. */
  function bedDb(hz) {
    return hz < 250 ? 0 : -3.5 * (Math.log(hz / 250) / Math.LN2);
  }
  /* The whole mix then rolls off at both ends, like a mastered track:
     nothing much below 35 Hz, and falling away above 10 kHz. */
  function edgeDb(hz) {
    if (hz < 35) return -12 * (Math.log(35 / hz) / Math.LN2);
    if (hz > 10000) return -18 * (Math.log(hz / 10000) / Math.LN2);
    return 0;
  }
  var bed = new Float32Array(BANDS);
  var edge = new Float32Array(BANDS);
  (function () {
    for (var b = 0; b < BANDS; b++) {
      var hz = LOW_HZ * Math.pow(2, (b + 0.5) / BANDS_PER_OCTAVE);
      bed[b] = Math.pow(10, bedDb(hz) / 10);
      edge[b] = Math.pow(10, edgeDb(hz) / 10);
    }
  })();

  /* ---------------------------------------------------------- the track */
  var BPM = 96;
  var BEAT = 60 / BPM;
  var BAR = 4 * BEAT;
  var CHORDS = [
    [45, [0, 3, 7]],   /* A minor */
    [41, [0, 4, 7]],   /* F */
    [48, [0, 4, 7]],   /* C */
    [43, [0, 4, 7]],   /* G */
    [45, [0, 3, 7]],
    [41, [0, 4, 7]],
    [38, [0, 3, 7]],   /* D minor */
    [40, [0, 4, 7]]    /* E */
  ];
  var LOOP = CHORDS.length * BAR;
  var LEAD = [12, 10, 7, 5, 7, 3, 2, 0];   /* one lead note per half bar, above the root */

  /* Seconds since the most recent hit on a grid of `step` beats, offset by
     `at` beats. */
  function since(t, step, at) {
    var s = step * BEAT, o = at * BEAT;
    return ((t - o) % s + s) % s;
  }

  function sampleGenerated(seconds) {
    var t = seconds % LOOP;
    var barIndex = Math.floor(t / BAR);
    var inBar = t - barIndex * BAR;
    var chord = CHORDS[barIndex];
    var root = chord[0], shape = chord[1];
    /* The back half of the loop plays fuller */
    var full = barIndex >= 4 ? 1 : 0.7;
    var b, i;

    for (b = 0; b < BANDS; b++) energy[b] = bed[b] * 0.0012 * full;

    /* Kick on every beat, a little softer off the downbeats */
    var kickAge = since(t, 1, 0);
    var kickVel = Math.floor(t / BEAT) % 2 === 0 ? 1 : 0.8;
    var kick = kickVel * Math.exp(-kickAge / 0.11);
    add(58 + 40 * Math.exp(-kickAge / 0.03), 1.1 * kick, 0.35);
    add(3200, 0.012 * kickVel * Math.exp(-kickAge / 0.015), 0.6);

    /* Bass follows the root, ducking under the kick */
    var duck = 1 - 0.7 * Math.exp(-kickAge / 0.14);
    var bassHz = midiHz(root - 12);
    add(bassHz, 0.32 * duck * full, 0.12);
    add(bassHz * 2, 0.12 * duck * full, 0.12);
    add(bassHz * 3, 0.05 * duck * full, 0.15);

    /* Snare on two and four: body and crack */
    var snareAge = since(t, 2, 1);
    add(210, 0.2 * Math.exp(-snareAge / 0.07), 0.3);
    add(3800, 0.07 * Math.exp(-snareAge / 0.12), 1.2);

    /* Hats: eighths with sixteenth ghosts; an open hat closes each bar */
    var hat8 = since(t, 0.5, 0.5);
    var hat16 = since(t, 0.25, 0.25);
    add(8500, 0.02 * Math.exp(-hat8 / 0.04), 0.5);
    add(11000, 0.006 * full * Math.exp(-hat16 / 0.02), 0.45);
    var openAge = inBar - 3.5 * BEAT;
    if (openAge >= 0) add(9000, 0.025 * Math.exp(-openAge / 0.3), 0.8);
    add(15000, 0.0012 * full, 0.4);   /* air */

    /* Piano chords: struck on one, restruck on the "and" of two */
    var chordAge = inBar < 1.5 * BEAT ? inBar : inBar - 1.5 * BEAT;
    var chordVel = inBar < 1.5 * BEAT ? 1 : 0.7;
    for (i = 0; i < 3; i++) {
      var hz = midiHz(root + 12 + shape[i]);
      var ring = chordVel * Math.exp(-chordAge / 1.1);
      add(hz, 0.1 * ring, 0.08);
      add(hz * 2, 0.045 * ring, 0.1);
      add(hz * 3, 0.02 * ring * Math.exp(-chordAge / 0.4), 0.12);
      add(hz * 5, 0.008 * ring * Math.exp(-chordAge / 0.2), 0.15);
    }

    /* Lead line in the back half, with vibrato and a presence formant */
    if (full === 1) {
      var half = Math.floor(inBar / (2 * BEAT));
      var noteAge = inBar - half * 2 * BEAT;
      var leadHz = midiHz(root + 24 + LEAD[(barIndex * 2 + half) % LEAD.length]) * (1 + 0.006 * Math.sin(seconds * 34));
      var swell = Math.min(1, noteAge / 0.08) * (0.7 + 0.3 * Math.exp(-noteAge / 0.6));
      add(leadHz, 0.07 * swell, 0.06);
      add(leadHz * 2, 0.03 * swell, 0.08);
      add(2600, 0.012 * swell, 0.5);
    }

    /* Analyser shimmer: a touch of per-band variation each frame */
    var frame = Math.floor(seconds * 30);
    for (b = 0; b < BANDS; b++) {
      var db = 10 * Math.log(energy[b] * edge[b] * (0.75 + 0.5 * hash(frame, b)) + 1e-9) / Math.LN10;
      out.bands[b] = Math.max(0, Math.min(1, (db - DB_FLOOR) / DB_RANGE));
    }
    out.beat = kickAge < 0.06 ? kickVel : 0;
    return out;
  }

  /* ----------------------------------------------------------- timeline */
  var track = null;

  function decode(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function load(url) {
    if (!url || typeof fetch !== 'function') return;
    fetch(url, { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (json) {
        if (!json || !json.frames || !json.data) return;
        track = {
          fps: json.fps || 30,
          bands: json.bands || BANDS,
          frames: json.frames,
          data: decode(json.data),
          beats: json.beats ? decode(json.beats) : null
        };
      })
      .catch(function () {});
  }

  function sampleTrack(seconds) {
    var pos = (seconds * track.fps) % track.frames;
    var f0 = Math.floor(pos), f1 = (f0 + 1) % track.frames, mix = pos - f0;
    var i;
    for (i = 0; i < BANDS; i++) {
      var src = Math.min(track.bands - 1, Math.floor((i / BANDS) * track.bands));
      var a = track.data[f0 * track.bands + src], b = track.data[f1 * track.bands + src];
      out.bands[i] = (a + (b - a) * mix) / 255;
    }
    out.beat = track.beats ? track.beats[f0] / 255 : 0;
    return out;
  }

  window.JBFieldMusic = {
    BANDS: BANDS,
    LOW_HZ: LOW_HZ,
    HIGH_HZ: HIGH_HZ,
    load: load,
    /* Bands and beat at a rAF time in ms. */
    sample: function (ms) {
      return track ? sampleTrack(ms / 1000) : sampleGenerated(ms / 1000);
    }
  };
})();
