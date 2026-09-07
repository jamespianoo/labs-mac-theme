/* Theme, boot, beep, volume, player, clock */
(function (D) {
  'use strict';
  if (!D) return;

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function setTheme(theme) {
    var next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('jb-theme', next); } catch (err) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      var toLight = next === 'dark';
      btn.setAttribute('aria-label', toLight ? 'Switch to light mode' : 'Switch to dark mode');
      btn.title = toLight ? 'Light mode' : 'Dark mode';
    }
  }
  setTheme(currentTheme());

  function endBoot() {
    document.body.classList.remove('booting');
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) endBoot();
  else window.setTimeout(endBoot, 520);

  function beep() {
    if (!D.volLevel) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!D.audioCtx) D.audioCtx = new AC();
      if (D.audioCtx.state === 'suspended') D.audioCtx.resume();
      var gains = { 1: 0.04, 2: 0.07, 3: 0.11, 4: 0.16 };
      var o = D.audioCtx.createOscillator();
      var g = D.audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.value = gains[D.volLevel] || 0.08;
      o.connect(g); g.connect(D.audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, D.audioCtx.currentTime + 0.07);
      o.stop(D.audioCtx.currentTime + 0.08);
    } catch (err) {}
  }

  function setVolume(level, playBeep) {
    D.volLevel = Math.max(0, Math.min(4, level | 0));
    var muted = D.volLevel === 0;
    var btn = document.getElementById('status-vol');
    if (btn) btn.classList.toggle('is-muted', muted);
    var muteBtn = document.querySelector('[data-vol-mute]');
    if (muteBtn) muteBtn.classList.toggle('checked', muted);
    var slider = document.querySelector('.vol-slider');
    var fill = document.querySelector('.vol-fill');
    var thumb = document.querySelector('.vol-thumb');
    if (slider) slider.setAttribute('aria-valuenow', String(D.volLevel));
    var pct = (D.volLevel / 4) * 100;
    if (fill) fill.style.height = pct + '%';
    if (thumb) thumb.style.top = (100 - pct) + '%';
    if (playBeep && !muted) beep();
  }

  function bindPlayer(frame) {
    var btn = frame.querySelector('[data-player-play]');
    var status = frame.querySelector('[data-player-status]');
    var bar = frame.querySelector('[data-player-bar]');
    if (!btn) return;
    var playing = false;
    var progress = 0;
    function stopPlay() {
      playing = false;
      btn.classList.remove('is-playing');
      btn.innerHTML = '&#9654;';
      if (status) status.textContent = 'Stopped';
      if (D.playerTimer) { clearInterval(D.playerTimer); D.playerTimer = null; }
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (playing) { stopPlay(); return; }
      playing = true;
      btn.classList.add('is-playing');
      btn.textContent = 'II';
      if (status) status.textContent = 'Playing — open Bandcamp for the real thing';
      beep();
      if (D.playerTimer) clearInterval(D.playerTimer);
      D.playerTimer = setInterval(function () {
        progress = (progress + 1.6) % 100;
        if (bar) bar.style.width = progress + '%';
      }, 120);
    });
  }

  function tickClock() {
    var now = new Date();
    if (D.clockEl) {
      D.clockEl.textContent = now.toLocaleTimeString(undefined, {
        hour: 'numeric', minute: '2-digit', hour12: D.clock12
      });
    }
    if (D.dateEl) {
      D.dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  }
  tickClock();
  setInterval(tickClock, 15000);

  function bindVolumeSlider() {
    var slider = document.querySelector('.vol-slider');
    var rail = document.querySelector('.vol-rail');
    var muteBtn = document.querySelector('[data-vol-mute]');
    if (!slider || !rail) return;
    var dragging = false;
    var lastBeepLevel = -1;

    function levelFromY(clientY) {
      var r = rail.getBoundingClientRect();
      var t = (clientY - r.top) / r.height;
      t = Math.max(0, Math.min(1, t));
      return Math.round((1 - t) * 4);
    }
    function onMove(e) {
      if (!dragging) return;
      var next = levelFromY(e.clientY);
      setVolume(next, false);
      if (next !== lastBeepLevel && next > 0) { lastBeepLevel = next; beep(); }
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      setVolume(levelFromY(e.clientY), true);
      try { rail.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    rail.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      lastBeepLevel = -1;
      rail.setPointerCapture(e.pointerId);
      setVolume(levelFromY(e.clientY), false);
    });
    rail.addEventListener('pointermove', onMove);
    rail.addEventListener('pointerup', onUp);
    rail.addEventListener('pointercancel', onUp);
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setVolume(D.volLevel + 1, true); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setVolume(D.volLevel - 1, true); }
    });
    if (muteBtn) {
      muteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setVolume(D.volLevel === 0 ? 3 : 0, true);
      });
    }
    var volMenu = document.getElementById('m-vol');
    if (volMenu) {
      volMenu.addEventListener('click', function (e) { e.stopPropagation(); });
      volMenu.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }
    setVolume(0, false);
  }
  bindVolumeSlider();

  D.currentTheme = currentTheme;
  D.setTheme = setTheme;
  D.beep = beep;
  D.setVolume = setVolume;
  D.bindPlayer = bindPlayer;
  D.tickClock = tickClock;
})(window.JBDesk);
