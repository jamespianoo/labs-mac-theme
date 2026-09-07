/* Window open/close, drag, resize, scrollbars, videos, contact form */
(function (D) {
  'use strict';
  if (!D) return;

  function bindContactForm(body) {
    var form = body.querySelector('#ajax-contact');
    var response = body.querySelector('#form-response');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      if (response) response.innerHTML = '<p class="busy">Sending&hellip;</p>';
      if (btn) btn.disabled = true;
      fetch('includes/contact-process.php', { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.text(); })
        .then(function (data) {
          if (data.trim() === 'success') {
            if (response) response.innerHTML = '<p class="ok">Thanks! Your message has been sent.</p>';
            form.style.display = 'none';
            D.beep();
          } else {
            if (response) response.innerHTML = '<p class="err">' + (data || 'Something went wrong.') + '</p>';
            if (btn) btn.disabled = false;
          }
        })
        .catch(function () {
          if (response) response.innerHTML = '<p class="err">Connection error. Please try again.</p>';
          if (btn) btn.disabled = false;
        });
    });
  }

  /* ------------------------------------------------------------- windows */
  function openWindow(name) {
    if (D.open[name]) { focus(name); D.beep(); return D.open[name].el; }
    var tpl = document.getElementById('tpl-' + name);
    if (!tpl) return null;

    var title = tpl.dataset.title || name;
    var info = (tpl.dataset.info || '').split('|').filter(Boolean);

    var frame = D.el(
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
    if (name === 'trash' && typeof D.fillTrash === 'function') D.fillTrash(body.querySelector('#trash-items'));
    if (name === 'player') D.bindPlayer(frame);
    if (name === 'egg' && typeof D.bindEgg === 'function') D.bindEgg(frame);
    if (name === 'contact') bindContactForm(body);

    if (!D.small()) {
      var w = Math.min(parseInt(tpl.dataset.w || '560', 10), D.desktop.clientWidth - 40);
      var h = Math.min(parseInt(tpl.dataset.h || '380', 10), D.desktop.clientHeight - 40);
      frame.style.width = w + 'px';
      frame.style.height = h + 'px';
      frame.style.left = '-9999px';
      frame.style.top = '0';
      D.desktop.appendChild(frame);
      /* Fit folders and document windows to their content on open */
      if (!tpl.dataset.nopad && (body.querySelector('.items') || body.querySelector('.doc'))) {
        var fit = fitSizeForFrame(frame, name);
        w = fit.w;
        h = fit.h;
        frame.style.width = w + 'px';
        frame.style.height = h + 'px';
      }
      var spot = findWindowSpot(w, h);
      frame.style.left = spot.left + 'px';
      frame.style.top = spot.top + 'px';
    } else {
      D.desktop.appendChild(frame);
    }
    D.open[name] = { el: frame, prev: null };

    frame.querySelector('[data-act=close]').addEventListener('click', function (e) { e.stopPropagation(); closeWindow(name); });
    frame.querySelector('[data-act=zoom]').addEventListener('click', function (e) { e.stopPropagation(); zoom(name); });
    frame.addEventListener('pointerdown', function () { focus(name); });
    bindScrollbars(frame);
    drag(frame, name);
    resize(frame, name);
    focus(name);
    D.beep();
    frame.focus({ preventScroll: true });
    return frame;
  }

  function rectsOverlap(a, b, pad) {
    pad = pad || 0;
    return !(a.x + a.w + pad <= b.x || b.x + b.w + pad <= a.x ||
             a.y + a.h + pad <= b.y || b.y + b.h + pad <= a.y);
  }

  function occupiedWindowRects() {
    return Object.keys(D.open).map(function (k) {
      var el = D.open[k].el;
      return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    });
  }

  function cascadeSpot(w, h, margin, maxX, maxY) {
    var off = (D.cascade++ % 6) * 26;
    return {
      left: Math.max(margin, Math.min(300 + off, maxX)),
      top: Math.max(margin, Math.min(70 + off, maxY))
    };
  }

  function findWindowSpot(w, h) {
    var margin = 8;
    var gap = 10;
    var maxX = Math.max(margin, D.desktop.clientWidth - w - 16);
    var maxY = Math.max(margin, D.desktop.clientHeight - h - 16);
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
    var w = D.open[name]; if (!w) return;
    w.el.remove(); delete D.open[name];
    var rest = Object.keys(D.open);
    if (rest.length) focus(rest[rest.length - 1]);
  }
  function closeAll() { Object.keys(D.open).forEach(closeWindow); }

  function focus(name) {
    Object.keys(D.open).forEach(function (k) { D.open[k].el.classList.toggle('inactive', k !== name); });
    if (D.open[name]) D.open[name].el.style.zIndex = ++D.z;
  }

  function zoom(name) {
    var w = D.open[name]; if (!w || D.small()) return;
    var f = w.el;
    if (w.prev) {
      f.style.left = w.prev.left; f.style.top = w.prev.top;
      f.style.width = w.prev.width; f.style.height = w.prev.height;
      w.prev = null;
      return;
    }
    w.prev = { left: f.style.left, top: f.style.top, width: f.style.width, height: f.style.height };
    var fit = fitSizeForFrame(f, name);
    var left = Math.max(8, Math.min(f.offsetLeft, D.desktop.clientWidth - fit.w - 8));
    var top = Math.max(8, Math.min(f.offsetTop, D.desktop.clientHeight - fit.h - 8));
    f.style.width = fit.w + 'px';
    f.style.height = fit.h + 'px';
    f.style.left = left + 'px';
    f.style.top = top + 'px';
  }

  /* System 7 zoom: size to content / folder icons, not the whole desktop */
  function fitSizeForFrame(frame, name) {
    var body = frame.querySelector('.win-body');
    var maxW = Math.max(280, D.desktop.clientWidth - 24);
    var maxH = Math.max(160, D.desktop.clientHeight - 24);
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
        var hasThumbs = !!items.querySelector('.item img.thumb');
        var cellW = hasThumbs ? 180 : 160;
        var cellH = hasThumbs ? 168 : 118;
        var padX = 40;
        var padY = 56;
        items.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(152px, 1fr))';
        w = cols * cellW + padX + chromeW;
        h = rows * cellH + padY + chromeH;
        /* verify against real scroll size after applying grid */
        frame.style.width = Math.min(w, maxW) + 'px';
        frame.style.height = Math.min(h, maxH) + 'px';
        w = Math.max(w, body.scrollWidth + chromeW);
        h = Math.max(h, body.scrollHeight + chromeH);
      }
    } else {
      var tpl = document.getElementById('tpl-' + name);
      var tw = tpl ? parseInt(tpl.dataset.w || '0', 10) : 0;
      var th = tpl ? parseInt(tpl.dataset.h || '0', 10) : 0;
      if (tpl && tpl.dataset.nopad && tw && th) {
        w = tw;
        h = th;
      } else {
        var probeW = Math.min(tw || 520, maxW);
        frame.style.width = probeW + 'px';
        frame.style.height = maxH + 'px';
        var content = body && body.firstElementChild;
        var sh = body ? body.scrollHeight : 200;
        if (content) sh = Math.max(sh, content.scrollHeight, content.offsetHeight);
        w = Math.max(probeW, tw || minW);
        h = sh + chromeH + 4;
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
      if (e.target.closest('.box') || D.small()) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = frame.offsetLeft; oy = frame.offsetTop;
      bar.setPointerCapture(e.pointerId); focus(name);
      frame.classList.add('dragging'); e.preventDefault();
    });
    bar.addEventListener('pointermove', function (e) {
      if (!on) return;
      frame.style.left = Math.max(-frame.offsetWidth + 90, Math.min(ox + e.clientX - sx, D.desktop.clientWidth - 70)) + 'px';
      frame.style.top = Math.max(0, Math.min(oy + e.clientY - sy, D.desktop.clientHeight - 26)) + 'px';
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
      if (D.small() || e.button > 0) return;
      on = true; sx = e.clientX; sy = e.clientY;
      ow = frame.offsetWidth; oh = frame.offsetHeight;
      handle.setPointerCapture(e.pointerId);
      focus(name);
      if (D.open[name]) D.open[name].prev = null;
      frame.classList.add('resizing');
      e.preventDefault();
      e.stopPropagation();
    });
    handle.addEventListener('pointermove', function (e) {
      if (!on) return;
      var maxW = Math.max(260, D.desktop.clientWidth - frame.offsetLeft);
      var maxH = Math.max(160, D.desktop.clientHeight - frame.offsetTop);
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
    D.YT.forEach(function (id, i) {
      var b = D.el('<button class="item" data-video="' + id + '">' +
                 '<img class="thumb" src="https://img.youtube.com/vi/' + id + '/mqdefault.jpg" alt="" loading="lazy">' +
                 '<span class="label">video-0' + (i + 1) + '.mp4</span></button>');
      host.appendChild(b);
    });
  }

  function openVideo(id) {
    var name = 'video-' + id;
    if (D.open[name]) { focus(name); return; }
    var tpl = document.createElement('template');
    tpl.id = 'tpl-' + name;
    tpl.dataset.title = id + '.mp4';
    tpl.dataset.w = '600'; tpl.dataset.h = '400'; tpl.dataset.nopad = '1';
    tpl.innerHTML = '<div class="embed" style="width:100%"><iframe src="https://www.youtube-nocookie.com/embed/' + id +
                    '" title="Video" allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    document.body.appendChild(tpl);
    openWindow(name);
  }

  D.openWindow = openWindow;
  D.closeWindow = closeWindow;
  D.closeAll = closeAll;
  D.focus = focus;
  D.zoom = zoom;
  D.fillVideos = fillVideos;
  D.openVideo = openVideo;
  D.bindContactForm = bindContactForm;

  window.JB = { open: openWindow, close: closeWindow, closeAll: closeAll };
})(window.JBDesk);
