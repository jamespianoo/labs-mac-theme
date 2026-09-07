(function () {
  'use strict';

  var YT = ['qpRMLR7VkO8','QeW5kR0EGok','OR9yKC8f1Zs','6REtACtGSJE','hacDUIS12Ho','ity7KgKlNbE'];

  var desktop = document.getElementById('desktop');
  var open = Object.create(null);
  var z = 100, cascade = 0;
  var small = function () { return window.matchMedia('(max-width:820px)').matches; };
  var volLevel = 0; /* 0 = mute, 1–4 = levels */
  var audioCtx = null;
  var playerTimer = null;

  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /* ------------------------------------------------------ theme + boot + beep */
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
    if (!volLevel) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var gains = { 1: 0.04, 2: 0.07, 3: 0.11, 4: 0.16 };
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.value = gains[volLevel] || 0.08;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);
      o.stop(audioCtx.currentTime + 0.08);
    } catch (err) {}
  }

  function setVolume(level, playBeep) {
    volLevel = Math.max(0, Math.min(4, level | 0));
    var muted = volLevel === 0;
    var btn = document.getElementById('status-vol');
    if (btn) btn.classList.toggle('is-muted', muted);
    var muteBtn = document.querySelector('[data-vol-mute]');
    if (muteBtn) muteBtn.classList.toggle('checked', muted);
    var slider = document.querySelector('.vol-slider');
    var fill = document.querySelector('.vol-fill');
    var thumb = document.querySelector('.vol-thumb');
    if (slider) slider.setAttribute('aria-valuenow', String(volLevel));
    var pct = (volLevel / 4) * 100;
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
      if (playerTimer) { clearInterval(playerTimer); playerTimer = null; }
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (playing) { stopPlay(); return; }
      playing = true;
      btn.classList.add('is-playing');
      btn.textContent = 'II';
      if (status) status.textContent = 'Playing — open Bandcamp for the real thing';
      beep();
      if (playerTimer) clearInterval(playerTimer);
      playerTimer = setInterval(function () {
        progress = (progress + 1.6) % 100;
        if (bar) bar.style.width = progress + '%';
      }, 120);
    });
  }

  /* ------------------------------------------------------------- windows */
  function openWindow(name) {
    if (open[name]) { focus(name); beep(); return open[name].el; }
    var tpl = document.getElementById('tpl-' + name);
    if (!tpl) return null;

    var title = tpl.dataset.title || name;
    var info = (tpl.dataset.info || '').split('|').filter(Boolean);

    var frame = el(
      '<section class="win" role="dialog" aria-label="' + title + '" tabindex="-1">' +
        '<div class="titlebar">' +
          '<button class="box" data-act="close" aria-label="Close ' + title + '"></button>' +
          '<div class="tb-title"><span></span></div>' +
          '<button class="box zoom" data-act="zoom" aria-label="Zoom to fit"></button>' +
        '</div>' +
        (info.length ? '<div class="infobar">' +
          info.map(function (s, i) {
            return '<span class="' + (i === 0 ? '' : (i === info.length - 1 && info.length > 2 ? 'right' : 'mid')) + '">' + s + '</span>';
          }).join('') + '</div>' : '') +
        '<div class="win-inner">' +
          '<div class="win-body"></div>' +
          '<div class="vbar" aria-hidden="true"><i></i><u><b></b></u><i></i></div>' +
        '</div>' +
        '<div class="hbar" aria-hidden="true"><i></i><u><b></b></u><i></i><span class="corner"></span></div>' +
      '</section>'
    );
    frame.querySelector('.tb-title span').textContent = title;

    var body = frame.querySelector('.win-body');
    if (tpl.dataset.nopad) { body.style.padding = '0'; body.style.display = 'flex'; }
    body.appendChild(tpl.content.cloneNode(true));
    // the photo is embedded once, on the desktop icon; every other use points at that copy
    var srcImg = document.querySelector('.pagefile img');
    if (srcImg) body.querySelectorAll('[data-promo]').forEach(function (i) { i.src = srcImg.src; });
    if (name === 'videos') fillVideos(body.querySelector('#video-items') || body.querySelector('.items'));
    if (name === 'trash') fillTrash(body.querySelector('#trash-items'));
    if (name === 'player') bindPlayer(frame);
    if (name === 'egg') bindEgg(frame);

    if (!small()) {
      var w = Math.min(parseInt(tpl.dataset.w || '560', 10), desktop.clientWidth - 40);
      var h = Math.min(parseInt(tpl.dataset.h || '380', 10), desktop.clientHeight - 40);
      var spot = findWindowSpot(w, h);
      frame.style.width = w + 'px';
      frame.style.height = h + 'px';
      frame.style.left = spot.left + 'px';
      frame.style.top = spot.top + 'px';
    }

    desktop.appendChild(frame);
    open[name] = { el: frame, prev: null };

    frame.querySelector('[data-act=close]').addEventListener('click', function (e) { e.stopPropagation(); closeWindow(name); });
    frame.querySelector('[data-act=zoom]').addEventListener('click', function (e) { e.stopPropagation(); zoom(name); });
    frame.addEventListener('pointerdown', function () { focus(name); });
    bindScrollbars(frame);
    drag(frame, name);
    resize(frame, name);
    focus(name);
    beep();
    frame.focus({ preventScroll: true });
    return frame;
  }

  function rectsOverlap(a, b, pad) {
    pad = pad || 0;
    return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x ||
             a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
  }

  function occupiedWindowRects() {
    return Object.keys(open).map(function (k) {
      var el = open[k].el;
      return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    });
  }

  function cascadeSpot(w, h, margin, maxX, maxY) {
    var off = (cascade++ % 6) * 26;
    return {
      left: Math.max(margin, Math.min(300 + off, maxX)),
      top: Math.max(margin, Math.min(70 + off, maxY))
    };
  }

  function findWindowSpot(w, h) {
    var margin = 8;
    var gap = 10;
    var maxX = Math.max(margin, desktop.clientWidth - w - 16);
    var maxY = Math.max(margin, desktop.clientHeight - h - 16);
    var occupied = occupiedWindowRects();

    if (!occupied.length) {
      return { left: Math.min(36, maxX), top: Math.min(28, maxY) };
    }

    var step = 28;
    var y, x, i, cand, hit;
    for (y = margin; y <= maxY; y += step) {
      for (x = margin; x <= maxX; x += step) {
        cand = { x: x, y: y, w: w, h: h };
        hit = false;
        for (i = 0; i < occupied.length; i++) {
          if (rectsOverlap(cand, occupied[i], gap)) { hit = true; break; }
        }
        if (!hit) return { left: x, top: y };
      }
    }

    return cascadeSpot(w, h, margin, maxX, maxY);
  }

  function closeWindow(name) {
    var w = open[name]; if (!w) return;
    w.el.remove(); delete open[name];
    var rest = Object.keys(open);
    if (rest.length) focus(rest[rest.length - 1]);
  }
  function closeAll() { Object.keys(open).forEach(closeWindow); }

  function focus(name) {
    Object.keys(open).forEach(function (k) { open[k].el.classList.toggle('inactive', k !== name); });
    if (open[name]) open[name].el.style.zIndex = ++z;
  }

  function zoom(name) {
    var w = open[name]; if (!w || small()) return;
    var f = w.el;
    if (w.prev) {
      f.style.left = w.prev.left; f.style.top = w.prev.top;
      f.style.width = w.prev.width; f.style.height = w.prev.height;
      w.prev = null;
      return;
    }
    w.prev = { left: f.style.left, top: f.style.top, width: f.style.width, height: f.style.height };
    var fit = fitSizeForFrame(f, name);
    var left = Math.max(8, Math.min(f.offsetLeft, desktop.clientWidth - fit.w - 8));
    var top = Math.max(8, Math.min(f.offsetTop, desktop.clientHeight - fit.h - 8));
    f.style.width = fit.w + 'px';
    f.style.height = fit.h + 'px';
    f.style.left = left + 'px';
    f.style.top = top + 'px';
  }

  /* System 7 zoom: size to content / folder icons, not the whole desktop */
  function fitSizeForFrame(frame, name) {
    var body = frame.querySelector('.win-body');
    var maxW = Math.max(280, desktop.clientWidth - 24);
    var maxH = Math.max(160, desktop.clientHeight - 24);
    var minW = 280;
    var minH = 160;
    var chromeW = Math.max(16, frame.offsetWidth - (body ? body.clientWidth : frame.clientWidth));
    var chromeH = Math.max(44, frame.offsetHeight - (body ? body.clientHeight : frame.clientHeight));
    var w = minW;
    var h = minH;

    var items = body && body.querySelector('.items');
    if (items) {
      var n = items.querySelectorAll('.item').length;
      if (!n) {
        w = 360;
        h = 220;
      } else {
        var cols = n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 2 : n <= 6 ? 3 : n <= 9 ? 3 : 4;
        var rows = Math.ceil(n / cols);
        var cellW = 160;
        var cellH = 112;
        var padX = 36;
        var padY = 52;
        w = cols * cellW + padX + chromeW;
        h = rows * cellH + padY + chromeH;
      }
    } else {
      var tpl = document.getElementById('tpl-' + name);
      var tw = tpl ? parseInt(tpl.dataset.w || '0', 10) : 0;
      var th = tpl ? parseInt(tpl.dataset.h || '0', 10) : 0;
      var oldW = frame.style.width;
      var oldH = frame.style.height;
      var probeW = Math.min(tw || 520, maxW);
      frame.style.width = probeW + 'px';
      frame.style.height = Math.min(240, maxH) + 'px';
      var sh = body ? body.scrollHeight : 200;
      var sw = body ? Math.max(body.scrollWidth, probeW - chromeW) : probeW;
      frame.style.width = oldW;
      frame.style.height = oldH;
      w = Math.max(sw + chromeW, tw || minW);
      h = Math.max(sh + chromeH, Math.min(th || minH, maxH));
      /* image / nopad windows: prefer template size */
      if (tpl && tpl.dataset.nopad && tw && th) {
        w = tw;
        h = th;
      }
    }

    return {
      w: Math.max(minW, Math.min(Math.round(w), maxW)),
      h: Math.max(minH, Math.min(Math.round(h), maxH))
    };
  }

  function bindScrollbars(frame) {
    var body = frame.querySelector('.win-body');
    var v = frame.querySelector('.vbar');
    var h = frame.querySelector('.hbar');
    if (!body || !v || !h) return;
    var step = 40;
    v.children[0].addEventListener('click', function (e) { e.stopPropagation(); body.scrollTop -= step; });
    v.children[2].addEventListener('click', function (e) { e.stopPropagation(); body.scrollTop += step; });
    h.children[0].addEventListener('click', function (e) { e.stopPropagation(); body.scrollLeft -= step; });
    h.children[2].addEventListener('click', function (e) { e.stopPropagation(); body.scrollLeft += step; });
  }

  function drag(frame, name) {
    var bar = frame.querySelector('.titlebar'), on = false, sx, sy, ox, oy;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.box') || small()) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = frame.offsetLeft; oy = frame.offsetTop;
      bar.setPointerCapture(e.pointerId); focus(name);
      frame.classList.add('dragging'); e.preventDefault();
    });
    bar.addEventListener('pointermove', function (e) {
      if (!on) return;
      frame.style.left = Math.max(-frame.offsetWidth + 90, Math.min(ox + e.clientX - sx, desktop.clientWidth - 70)) + 'px';
      frame.style.top = Math.max(0, Math.min(oy + e.clientY - sy, desktop.clientHeight - 26)) + 'px';
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      bar.addEventListener(t, function (e) {
        on = false; frame.classList.remove('dragging');
        try { bar.releasePointerCapture(e.pointerId); } catch (err) {}
      });
    });
    bar.addEventListener('dblclick', function (e) { if (!e.target.closest('.box')) zoom(name); });
  }

  function resize(frame, name) {
    var handle = frame.querySelector('.corner'), on = false, sx, sy, ow, oh;
    if (!handle) return;
    handle.addEventListener('pointerdown', function (e) {
      if (small() || e.button > 0) return;
      on = true; sx = e.clientX; sy = e.clientY;
      ow = frame.offsetWidth; oh = frame.offsetHeight;
      handle.setPointerCapture(e.pointerId);
      focus(name);
      if (open[name]) open[name].prev = null;
      frame.classList.add('resizing');
      e.preventDefault();
      e.stopPropagation();
    });
    handle.addEventListener('pointermove', function (e) {
      if (!on) return;
      var maxW = Math.max(260, desktop.clientWidth - frame.offsetLeft);
      var maxH = Math.max(160, desktop.clientHeight - frame.offsetTop);
      frame.style.width = Math.max(260, Math.min(ow + (e.clientX - sx), maxW)) + 'px';
      frame.style.height = Math.max(160, Math.min(oh + (e.clientY - sy), maxH)) + 'px';
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      handle.addEventListener(t, function (e) {
        on = false; frame.classList.remove('resizing');
        try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
      });
    });
  }

  function fillVideos(host) {
    if (!host || host.dataset.filled) return;
    host.dataset.filled = '1';
    host.style.gridTemplateColumns = 'repeat(auto-fill,minmax(180px,1fr))';
    YT.forEach(function (id, i) {
      var b = el('<button class="item" data-video="' + id + '">' +
                 '<img class="thumb" src="https://img.youtube.com/vi/' + id + '/mqdefault.jpg" alt="" loading="lazy">' +
                 '<span class="label">video-0' + (i + 1) + '.mp4</span></button>');
      host.appendChild(b);
    });
  }

  function openVideo(id) {
    var name = 'video-' + id;
    if (open[name]) { focus(name); return; }
    var tpl = document.createElement('template');
    tpl.id = 'tpl-' + name;
    tpl.dataset.title = id + '.mp4';
    tpl.dataset.w = '600'; tpl.dataset.h = '400'; tpl.dataset.nopad = '1';
    tpl.innerHTML = '<div class="embed" style="width:100%"><iframe src="https://www.youtube-nocookie.com/embed/' + id +
                    '" title="Video" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    document.body.appendChild(tpl);
    openWindow(name);
  }

  /* --------------------------------------------------------------- menus */
  var openMenu = null;
  var ctxMenu = document.getElementById('m-ctx');
  var ctxTarget = null;
  var iconsHost = document.getElementById('icons');
  var trashed = document.getElementById('trashed');
  var trashIcon = document.querySelector('.icon.trash');
  var trashSeq = 0;

  function showMenu(id, btn) {
    hideMenus();
    var m = document.getElementById(id); if (!m) return;
    m.hidden = false;
    var r = btn.getBoundingClientRect();
    var top = '29px';
    if (btn.closest('.status')) {
      m.style.left = Math.max(2, Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 4)) + 'px';
    } else {
      m.style.left = Math.max(2, r.left - 2) + 'px';
    }
    m.style.top = top;
    btn.setAttribute('aria-expanded', 'true');
    openMenu = { menu: m, btn: btn };
  }
  function hideMenus() {
    document.querySelectorAll('.menu').forEach(function (m) { m.hidden = true; });
    document.querySelectorAll('.menu-title, .status-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    openMenu = null;
    ctxTarget = null;
  }

  document.querySelectorAll('.menu-title, .status-btn[data-menu]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (openMenu && openMenu.btn === btn) hideMenus();
      else showMenu(btn.dataset.menu, btn);
    });
    // once a menu is open, sliding across the bar switches menus - as it did
    btn.addEventListener('mouseenter', function () {
      if (openMenu && openMenu.btn !== btn && btn.dataset.menu) showMenu(btn.dataset.menu, btn);
    });
  });

  document.querySelectorAll('[data-submenu]').forEach(function (btn) {
    var sub = document.getElementById(btn.dataset.submenu);
    var wrap = btn.closest('.submenu-wrap');
    function show(v) { sub.hidden = !v; btn.setAttribute('aria-expanded', String(v)); }
    wrap.addEventListener('mouseenter', function () { show(true); });
    wrap.addEventListener('mouseleave', function () { show(false); });
    btn.addEventListener('click', function (e) { e.stopPropagation(); show(sub.hidden); });
  });

  /* ----------------------------------------------------- trash + context */
  function iconLabel(icon) {
    var label = icon && icon.querySelector('.label');
    return label ? label.textContent.trim() : '';
  }

  function updateTrashAppearance() {
    if (!trashIcon) return;
    var img = trashIcon.querySelector('img.art');
    var n = trashed ? trashed.children.length : 0;
    if (img) img.src = n ? 'img/icons/trash-full.webp' : 'img/icons/trash.webp';
    var emptyBtn = document.querySelector('[data-empty-trash]');
    if (emptyBtn) emptyBtn.classList.toggle('disabled', !n);
  }

  function fillTrash(host) {
    if (!host) return;
    host.innerHTML = '';
    var items = trashed ? Array.prototype.slice.call(trashed.children) : [];
    if (!items.length) {
      host.innerHTML = '<p class="empty-trash">The Trash is empty. Even the bad domain names are gone.</p>';
      return;
    }
    items.forEach(function (icon) {
      var id = icon.dataset.trashId || '';
      var name = iconLabel(icon);
      var art = icon.querySelector('.art');
      var b = el('<button class="item" data-restore="' + id + '"><span class="label"></span></button>');
      if (art) b.insertBefore(art.cloneNode(true), b.firstChild);
      b.querySelector('.label').textContent = name;
      host.appendChild(b);
    });
  }

  function refreshTrashWindow() {
    var n = trashed ? trashed.children.length : 0;
    var tpl = document.getElementById('tpl-trash');
    if (tpl) tpl.dataset.info = n + ' item' + (n === 1 ? '' : 's') + '|Desktop';
    if (!open.trash) return;
    var host = open.trash.el.querySelector('#trash-items');
    fillTrash(host);
    var bar = open.trash.el.querySelector('.infobar');
    if (bar) {
      bar.innerHTML = '<span>' + n + ' item' + (n === 1 ? '' : 's') + '</span><span class="mid">Desktop</span>';
    }
  }

  function moveToTrash(icon) {
    if (!icon || icon.dataset.trash || !trashed) return;
    if (icon.classList.contains('renaming')) return;
    var winName = icon.dataset.open;
    if (winName && open[winName] && winName !== 'trash') closeWindow(winName);
    if (!icon.dataset.trashId) icon.dataset.trashId = String(++trashSeq);
    icon.classList.remove('selected', 'dragging');
    trashed.appendChild(icon);
    updateTrashAppearance();
    refreshTrashWindow();
    savePositions();
  }

  function emptyTrash() {
    if (!trashed || !trashed.children.length) return;
    var items = Array.prototype.slice.call(trashed.children);
    var count = items.length;
    var names = [];
    var gone = readGone();
    var seeds = readClearedSeeds();
    items.forEach(function (icon) {
      var id = icon.dataset.id;
      var label = iconLabel(icon);
      if (label) names.push(label);
      if (id && gone.indexOf(id) === -1) gone.push(id);
      if (icon.dataset.trashId && String(icon.dataset.trashId).indexOf('seed-') === 0) {
        if (seeds.indexOf(icon.dataset.trashId) === -1) seeds.push(icon.dataset.trashId);
      }
    });
    writeGone(gone);
    writeClearedSeeds(seeds);
    purgeGoneFromPositions(gone);
    trashed.innerHTML = '';
    updateTrashAppearance();
    refreshTrashWindow();
    savePositions();
    beep();
    showEgg(count, names);
  }

  var GONE_KEY = 'jb-desk-gone';
  var SEED_KEY = 'jb-trash-seeds-cleared';

  function readGone() {
    try {
      var raw = localStorage.getItem(GONE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }
  function writeGone(list) {
    try { localStorage.setItem(GONE_KEY, JSON.stringify(list)); } catch (err) {}
  }
  function readClearedSeeds() {
    try {
      var raw = localStorage.getItem(SEED_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }
  function writeClearedSeeds(list) {
    try { localStorage.setItem(SEED_KEY, JSON.stringify(list)); } catch (err) {}
  }
  function purgeGoneFromPositions(gone) {
    var map = readPositions();
    if (!map) return;
    gone.forEach(function (id) { delete map[id]; });
    try { localStorage.setItem(POS_KEY, JSON.stringify(map)); } catch (err) {}
  }
  function applyGoneState() {
    var gone = readGone();
    if (iconsHost && gone.length) {
      gone.forEach(function (id) {
        var icon = iconsHost.querySelector('.icon[data-id="' + id + '"]');
        if (icon) icon.remove();
      });
    }
    if (trashed) {
      var seeds = readClearedSeeds();
      Array.prototype.slice.call(trashed.children).forEach(function (icon) {
        var sid = icon.dataset.trashId;
        if (sid && seeds.indexOf(sid) !== -1) icon.remove();
      });
    }
  }

  function showEgg(count, names) {
    var frame = openWindow('egg');
    if (!frame) return;
    var meta = frame.querySelector('[data-egg-meta]');
    if (meta) {
      meta.textContent = count + ' item' + (count === 1 ? '' : 's') + ' permanently erased'
        + (names && names.length ? ': ' + names.slice(0, 4).join(', ') + (names.length > 4 ? '…' : '') : '');
    }
  }

  function bindEgg(frame) {
    var ok = frame.querySelector('[data-egg-dismiss]');
    if (!ok || ok.dataset.bound) return;
    ok.dataset.bound = '1';
    ok.addEventListener('click', function (e) {
      e.stopPropagation();
      closeWindow('egg');
    });
  }

  function restoreFromTrash(id) {
    var icon = trashed && trashed.querySelector('[data-trash-id="' + id + '"]');
    if (!icon || !iconsHost) return;
    iconsHost.appendChild(icon);
    if (!icon.dataset.dragBound) {
      dragIcon(icon);
      icon.dataset.dragBound = '1';
    }
    if (!icon.style.left || !icon.style.top) {
      icon.style.left = (40 + Math.floor(Math.random() * 80)) + 'px';
      icon.style.top = (40 + Math.floor(Math.random() * 80)) + 'px';
    }
    if (!icon.dataset.id && !icon.dataset.open) {
      icon.dataset.id = 'restored-' + (icon.dataset.trashId || Date.now());
    }
    icon.setAttribute('data-scatter', '');
    updateTrashAppearance();
    refreshTrashWindow();
    savePositions();
  }

  function duplicateIcon(icon) {
    if (!icon || icon.dataset.trash) return;
    var clone = icon.cloneNode(true);
    clone.classList.remove('selected', 'dragging', 'renaming');
    delete clone.dataset.dragged;
    delete clone.dataset.trashId;
    var label = clone.querySelector('.label');
    if (label) label.textContent = iconLabel(icon) + ' copy';
    clone.style.left = (icon.offsetLeft + 28) + 'px';
    clone.style.top = (icon.offsetTop + 28) + 'px';
    iconsHost.appendChild(clone);
    dragIcon(clone);
    clone.dataset.dragBound = '1';
    clearSel();
    clone.classList.add('selected');
  }

  function renameIcon(icon) {
    if (!icon || icon.dataset.trash || icon.classList.contains('renaming')) return;
    var label = icon.querySelector('.label');
    if (!label) return;
    var prev = label.textContent;
    icon.classList.add('renaming', 'selected');
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'rename';
    input.value = prev;
    input.setAttribute('aria-label', 'Rename');
    label.replaceWith(input);
    input.focus();
    input.select();
    var done = false;
    function finish(commit) {
      if (done) return;
      done = true;
      var span = document.createElement('span');
      span.className = 'label';
      span.textContent = commit ? (input.value.trim() || prev) : prev;
      if (input.parentNode) input.replaceWith(span);
      icon.classList.remove('renaming');
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      e.stopPropagation();
    });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
    input.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    input.addEventListener('blur', function () { finish(true); });
  }

  function getInfo(icon) {
    var name = icon ? iconLabel(icon) : 'Desktop';
    var kind = !icon ? 'Desktop'
      : (icon.dataset.trash ? 'Trash'
      : (icon.querySelector('.pagefile') ? 'PNG image'
      : (/\.pdf$/i.test(name) ? 'PDF document'
      : (/\.txt$/i.test(name) ? 'Text document'
      : (/\.aiff$/i.test(name) ? 'Sound'
      : (/\.app$/i.test(name) ? 'Application'
      : (/\.map$/i.test(name) ? 'Map document' : 'Folder')))))));
    var where = icon && icon.parentNode === trashed ? 'Trash' : 'Desktop';
    var id = 'info-' + Date.now();
    var tpl = document.createElement('template');
    tpl.id = 'tpl-' + id;
    tpl.dataset.title = 'Info';
    tpl.dataset.w = '360';
    tpl.dataset.h = '280';
    tpl.dataset.info = 'Get Info|' + name;
    tpl.innerHTML =
      '<div class="doc info-doc">' +
        '<h2></h2>' +
        '<dl>' +
          '<dt>Kind:</dt><dd></dd>' +
          '<dt>Where:</dt><dd></dd>' +
          '<dt>Created:</dt><dd>Monday, 7 September 2026</dd>' +
          '<dt>Modified:</dt><dd>Monday, 7 September 2026</dd>' +
        '</dl>' +
      '</div>';
    document.body.appendChild(tpl);
    var doc = tpl.content;
    doc.querySelector('h2').textContent = name;
    var dds = doc.querySelectorAll('dd');
    dds[0].textContent = kind;
    dds[1].textContent = where;
    openWindow(id);
  }

  function placeTrashCorner() {
    if (!trashIcon || small()) return;
    var w = trashIcon.offsetWidth || 112;
    var h = trashIcon.offsetHeight || 128;
    trashIcon.style.left = Math.max(8, desktop.clientWidth - w - 16) + 'px';
    trashIcon.style.top = Math.max(8, desktop.clientHeight - h - 12) + 'px';
  }

  var POS_KEY = 'jb-desk-pos';

  function iconKey(icon) {
    return icon.dataset.id || icon.dataset.open || iconLabel(icon) || '';
  }

  function readPositions() {
    try {
      var raw = localStorage.getItem(POS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
  }

  function savePositions() {
    if (small() || !iconsHost) return;
    var map = {};
    iconsHost.querySelectorAll('.icon').forEach(function (icon) {
      var id = iconKey(icon);
      if (!id) return;
      map[id] = {
        left: parseInt(icon.style.left, 10) || 0,
        top: parseInt(icon.style.top, 10) || 0
      };
      if (icon.dataset.trash && icon.dataset.moved) map[id].moved = 1;
    });
    try { localStorage.setItem(POS_KEY, JSON.stringify(map)); } catch (err) {}
  }

  function applySavedPositions(map) {
    if (!map || !iconsHost) return false;
    var applied = 0;
    iconsHost.querySelectorAll('.icon').forEach(function (icon) {
      var id = iconKey(icon);
      var pos = id && map[id];
      if (!pos || typeof pos.left !== 'number' || typeof pos.top !== 'number') return;
      icon.style.left = pos.left + 'px';
      icon.style.top = pos.top + 'px';
      if (icon.dataset.trash && pos.moved) icon.dataset.moved = '1';
      applied++;
    });
    return applied > 0;
  }

  function scatterIcons(force) {
    if (small() || !iconsHost) return;
    if (!force) {
      var saved = readPositions();
      if (saved && applySavedPositions(saved)) {
        if (trashIcon && !trashIcon.dataset.moved) placeTrashCorner();
        return;
      }
    }
    var list = Array.prototype.slice.call(iconsHost.querySelectorAll('.icon[data-scatter]'));
    if (!list.length) return;
    var pad = 12;
    var iw = 112, ih = 128;
    var W = desktop.clientWidth, H = desktop.clientHeight;
    /* keep clear of the centred wordmark */
    var zx0 = W * 0.28, zx1 = W * 0.72, zy0 = H * 0.28, zy1 = H * 0.62;
    var placed = [];
    function hits(x, y) {
      if (x + iw > zx0 && x < zx1 && y + ih > zy0 && y < zy1) return true;
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        if (Math.abs(p.x - x) < iw - 8 && Math.abs(p.y - y) < ih - 8) return true;
      }
      return false;
    }
    list.forEach(function (icon) {
      var x = pad, y = pad, ok = false;
      for (var t = 0; t < 80; t++) {
        x = pad + Math.floor(Math.random() * Math.max(1, W - iw - pad * 2));
        y = pad + Math.floor(Math.random() * Math.max(1, H - ih - pad * 2));
        if (!hits(x, y)) { ok = true; break; }
      }
      if (!ok) {
        var i = placed.length;
        x = pad + (i % 3) * iw;
        y = pad + Math.floor(i / 3) * ih;
      }
      icon.style.left = x + 'px';
      icon.style.top = y + 'px';
      placed.push({ x: x, y: y });
    });
    placeTrashCorner();
    savePositions();
  }

  function arrangeIcons(mode) {
    var list = Array.prototype.slice.call(iconsHost.querySelectorAll('.icon:not(.trash)'));
    if (mode === 'name') {
      list.sort(function (a, b) { return iconLabel(a).localeCompare(iconLabel(b)); });
    }
    var col = 0, row = 0, x0 = 24, y0 = 20, dx = 120, dy = 132;
    var cols = Math.max(1, Math.floor((desktop.clientWidth - x0 - 140) / dx));
    list.forEach(function (icon) {
      icon.style.left = (x0 + col * dx) + 'px';
      icon.style.top = (y0 + row * dy) + 'px';
      col++;
      if (col >= cols) { col = 0; row++; }
    });
    placeTrashCorner();
    if (trashIcon) delete trashIcon.dataset.moved;
    savePositions();
  }

  function overTrash(x, y) {
    if (!trashIcon) return false;
    var r = trashIcon.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function showCtx(x, y, target) {
    hideMenus();
    ctxTarget = target || null;
    var n = trashed ? trashed.children.length : 0;
    var html;
    if (target && target.classList.contains('icon')) {
      if (target.dataset.trash) {
        html =
          '<button type="button" data-ctx="open">Open</button>' +
          '<button type="button" data-ctx="info">Get Info</button>' +
          '<hr>' +
          '<button type="button" data-ctx="empty"' + (n ? '' : ' class="disabled"') + '>Empty Trash</button>';
      } else {
        html =
          '<button type="button" data-ctx="open">Open</button>' +
          '<button type="button" data-ctx="info">Get Info</button>' +
          '<hr>' +
          '<button type="button" data-ctx="duplicate">Duplicate</button>' +
          '<button type="button" data-ctx="rename">Rename</button>' +
          '<hr>' +
          '<button type="button" data-ctx="trash">Move to Trash</button>';
      }
    } else {
      html =
        '<button type="button" data-ctx="cleanup">Clean Up</button>' +
        '<button type="button" data-ctx="byname">Arrange by Name</button>' +
        '<hr>' +
        '<button type="button" data-ctx="empty"' + (n ? '' : ' class="disabled"') + '>Empty Trash</button>';
    }
    ctxMenu.innerHTML = html;
    ctxMenu.hidden = false;
    var pad = 6;
    var w = ctxMenu.offsetWidth, h = ctxMenu.offsetHeight;
    ctxMenu.style.left = Math.min(x, window.innerWidth - w - pad) + 'px';
    ctxMenu.style.top = Math.min(y, window.innerHeight - h - pad) + 'px';
  }

  if (ctxMenu) {
    ctxMenu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ctx]');
      if (!b || b.classList.contains('disabled')) return;
      e.stopPropagation();
      var act = b.dataset.ctx;
      var target = ctxTarget;
      hideMenus();
      if (act === 'open' && target) activate(target);
      else if (act === 'info') getInfo(target);
      else if (act === 'rename' && target) renameIcon(target);
      else if (act === 'duplicate' && target) duplicateIcon(target);
      else if (act === 'trash' && target) moveToTrash(target);
      else if (act === 'empty') emptyTrash();
      else if (act === 'cleanup') arrangeIcons('clean');
      else if (act === 'byname') arrangeIcons('name');
    });
  }

  document.addEventListener('contextmenu', function (e) {
    if (e.target.closest('.menubar') || e.target.closest('.menu') || e.target.closest('.win')) return;
    if (!e.target.closest('.hero') && !e.target.closest('#desktop')) return;
    e.preventDefault();
    var icon = e.target.closest('#icons .icon');
    showCtx(e.clientX, e.clientY, icon || null);
  });

  /* ---------------------------------------------------------- interaction */
  function clearSel() { document.querySelectorAll('.icon.selected,.item.selected').forEach(function (n) { n.classList.remove('selected'); }); }
  function activate(node) {
    if (node.dataset.restore) return restoreFromTrash(node.dataset.restore);
    if (node.dataset.video) return openVideo(node.dataset.video);
    if (node.dataset.href) return window.open(node.dataset.href, '_blank', 'noopener');
    if (node.dataset.open) return openWindow(node.dataset.open);
  }

  var iconZ = 1;
  function dragIcon(icon) {
    var on = false, moved = false, sx, sy, ox, oy;
    icon.addEventListener('pointerdown', function (e) {
      if (small() || e.button > 0 || icon.classList.contains('renaming')) return;
      hideMenus();
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      ox = icon.offsetLeft; oy = icon.offsetTop;
      icon.setPointerCapture(e.pointerId);
      icon.classList.add('dragging');
      icon.style.zIndex = ++iconZ;
      clearSel(); icon.classList.add('selected');
      e.preventDefault();
    });
    icon.addEventListener('pointermove', function (e) {
      if (!on) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && dx * dx + dy * dy < 25) return;
      moved = true;
      var maxX = Math.max(0, desktop.clientWidth - icon.offsetWidth);
      var maxY = Math.max(0, desktop.clientHeight - icon.offsetHeight);
      icon.style.left = Math.max(0, Math.min(ox + dx, maxX)) + 'px';
      icon.style.top = Math.max(0, Math.min(oy + dy, maxY)) + 'px';
    });
    function end(e) {
      if (!on) return;
      on = false;
      icon.classList.remove('dragging');
      try { icon.releasePointerCapture(e.pointerId); } catch (err) {}
      if (moved) {
        icon.dataset.dragged = '1';
        if (icon.dataset.trash) icon.dataset.moved = '1';
        if (!icon.dataset.trash && overTrash(e.clientX, e.clientY)) moveToTrash(icon);
        savePositions();
      }
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { icon.addEventListener(t, end); });
  }
  document.querySelectorAll('#icons .icon').forEach(function (icon) {
    dragIcon(icon);
    icon.dataset.dragBound = '1';
  });
  updateTrashAppearance();
  applyGoneState();
  updateTrashAppearance();
  scatterIcons(false);
  window.addEventListener('resize', function () {
    if (!small() && trashIcon && !trashIcon.dataset.moved) {
      placeTrashCorner();
      savePositions();
    }
  });

  function dragSticky(note) {
    var on = false, sx, sy, ox, oy;
    var bar = note.querySelector('.sticky-bar');
    if (bar && !bar.querySelector('.sticky-close')) {
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'sticky-close';
      close.setAttribute('aria-label', 'Close note');
      close.addEventListener('click', function (e) {
        e.stopPropagation();
        askCloseSticky(note);
      });
      bar.appendChild(close);
    }
    note.addEventListener('pointerdown', function (e) {
      if (small() || e.button > 0 || e.target.closest('a,.sticky-close')) return;
      on = true; sx = e.clientX; sy = e.clientY;
      ox = note.offsetLeft; oy = note.offsetTop;
      note.setPointerCapture(e.pointerId);
      note.classList.add('dragging');
      note.style.zIndex = ++iconZ;
      e.preventDefault();
    });
    note.addEventListener('pointermove', function (e) {
      if (!on) return;
      var maxX = Math.max(0, desktop.clientWidth - note.offsetWidth);
      var maxY = Math.max(0, desktop.clientHeight - note.offsetHeight);
      note.style.left = Math.max(0, Math.min(ox + e.clientX - sx, maxX)) + 'px';
      note.style.top = Math.max(0, Math.min(oy + e.clientY - sy, maxY)) + 'px';
    });
    function end(e) {
      if (!on) return;
      on = false;
      note.classList.remove('dragging');
      try { note.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { note.addEventListener(t, end); });
  }

  var stickyAlert = document.getElementById('sticky-alert');
  var stickyPending = null;

  function stickyPlainText(note) {
    return Array.prototype.map.call(note.querySelectorAll('p'), function (p) {
      return p.textContent.trim();
    }).filter(Boolean).join('\n\n');
  }

  function stickyFileName(note) {
    var first = (note.querySelector('p') || {}).textContent || 'Untitled Note';
    var base = first.replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, ' ') || 'Untitled Note';
    if (base.length > 40) base = base.slice(0, 40).trim();
    return base + '.txt';
  }

  function downloadSticky(note) {
    var blob = new Blob([stickyPlainText(note) + '\n'], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = stickyFileName(note);
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function removeSticky(note) {
    if (note && note.parentNode) note.remove();
  }

  function hideStickyAlert() {
    if (!stickyAlert) return;
    stickyAlert.hidden = true;
    stickyPending = null;
  }

  function askCloseSticky(note) {
    if (!stickyAlert || !note) return;
    hideMenus();
    stickyPending = note;
    stickyAlert.hidden = false;
    var saveBtn = stickyAlert.querySelector('[data-alert=save]');
    if (saveBtn) saveBtn.focus();
  }

  if (stickyAlert) {
    stickyAlert.addEventListener('click', function (e) {
      if (e.target === stickyAlert) { hideStickyAlert(); return; }
      var btn = e.target.closest('[data-alert]');
      if (!btn || !stickyPending) return;
      var act = btn.dataset.alert;
      var note = stickyPending;
      if (act === 'cancel') { hideStickyAlert(); return; }
      if (act === 'save') downloadSticky(note);
      if (act === 'save' || act === 'discard') {
        removeSticky(note);
        hideStickyAlert();
      }
    });
  }

  document.querySelectorAll('[data-sticky]').forEach(dragSticky);

  document.addEventListener('click', function (e) {
    var node = e.target.closest('.icon,.item');
    if (node) {
      if (node.dataset.dragged) { delete node.dataset.dragged; e.preventDefault(); return; }
      if (node.closest && node.closest('.renaming')) return;
      clearSel();
      node.classList.add('selected');
      activate(node);
      return;
    }
    if (!e.target.closest('.menubar') && !e.target.closest('.menu')) hideMenus();
    if (!e.target.closest('.win') && !e.target.closest('.icon')) clearSel();
  });

  /* double-click still works; same as single-click open */
  document.addEventListener('dblclick', function (e) {
    var node = e.target.closest('.icon,.item');
    if (node) {
      if (node.dataset.dragged) { delete node.dataset.dragged; return; }
      e.preventDefault();
      clearSel();
      node.classList.add('selected');
      activate(node);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (stickyAlert && !stickyAlert.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); hideStickyAlert(); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        var note = stickyPending;
        if (!note) return;
        downloadSticky(note);
        removeSticky(note);
        hideStickyAlert();
      }
      return;
    }
    if (e.key === 'Escape') {
      if (ctxMenu && !ctxMenu.hidden) { hideMenus(); return; }
      if (openMenu) { hideMenus(); return; }
      var renaming = document.querySelector('.icon.renaming input.rename');
      if (renaming) { renaming.blur(); return; }
      var names = Object.keys(open);
      if (names.length) closeWindow(names[names.length - 1]);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input,textarea,[contenteditable]')) {
      var sel = document.querySelector('#icons .icon.selected:not([data-trash])');
      if (sel) { e.preventDefault(); moveToTrash(sel); return; }
    }
    var node = e.target.closest && e.target.closest('.icon,.item');
    if (node && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); activate(node); }
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.menu [data-open], .menubar [data-open]');
    if (b) { hideMenus(); openWindow(b.dataset.open); return; }
    if (e.target.closest('[data-close-all]')) { hideMenus(); closeAll(); }
    if (e.target.closest('[data-empty-trash]')) { hideMenus(); emptyTrash(); }
    if (e.target.closest('[data-cleanup]')) { hideMenus(); arrangeIcons('clean'); return; }
    if (e.target.closest('[data-arrange-name]')) { hideMenus(); arrangeIcons('name'); return; }
    if (e.target.closest('.menu a')) hideMenus();

    if (e.target.closest('[data-theme-toggle]')) {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
      hideMenus();
      return;
    }
    if (e.target.closest('[data-clock-fmt]')) {
      clock12 = !clock12;
      var fmtBtn = document.querySelector('[data-clock-fmt]');
      if (fmtBtn) fmtBtn.textContent = clock12 ? '12-hour clock' : '24-hour clock';
      tickClock();
      hideMenus();
    }
  });

  /* ----------------------------------------------------------- volume slider */
  (function bindVolumeSlider() {
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
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setVolume(volLevel + 1, true); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setVolume(volLevel - 1, true); }
    });
    if (muteBtn) {
      muteBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setVolume(volLevel === 0 ? 3 : 0, true);
      });
    }
    var volMenu = document.getElementById('m-vol');
    if (volMenu) {
      volMenu.addEventListener('click', function (e) { e.stopPropagation(); });
      volMenu.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }
    setVolume(0, false);
  })();

  /* ----------------------------------------------------------- menubar clock */
  var clockEl = document.getElementById('menubar-clock');
  var dateEl = document.getElementById('menubar-date');
  var clock12 = true;
  function tickClock() {
    var now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString(undefined, {
        hour: 'numeric', minute: '2-digit', hour12: clock12
      });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  }
  tickClock();
  setInterval(tickClock, 15000);

  window.JB = { open: openWindow, close: closeWindow, closeAll: closeAll };
})();
