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
  var FOLDER_SLUGS = {
    music: 'music',
    football: 'football',
    labs: 'labs',
    maps: 'maps',
    videos: 'videos',
    piano: 'piano',
    stream: 'stream',
    about: 'about',
    contact: 'contact',
    trash: 'trash'
  };

  var SLUG_MAP = {
    music: 'music',
    football: 'football',
    labs: 'labs',
    maps: 'maps',
    videos: 'videos',
    piano: 'piano',
    'piano-repair': 'piano',
    stream: 'stream',
    streaming: 'stream',
    about: 'about',
    'about-me': 'about',
    contact: 'contact',
    trash: 'trash'
  };

  function getAppBase() {
    var p = window.location.pathname;
    if (p.indexOf('/mac-theme') !== -1) {
      var m = p.match(/^(\/.*?)?\/mac-theme(?:\/.*)?$/);
      return (m && m[1] ? m[1] : '') + '/mac-theme';
    }
    return '';
  }

  function getUrlForSlug(slug) {
    var base = getAppBase();
    if (!slug) {
      return (base || '') + '/';
    }
    return (base ? base : '') + '/' + slug;
  }

  function getSlugFromPath() {
    var params = new URLSearchParams(window.location.search);
    var p = params.get('folder') || params.get('p');
    if (p) return p.toLowerCase().trim();

    var path = window.location.pathname;
    path = path.replace(/^\/mac-theme(?:\/|$)/, '/');
    var parts = path.split('/').filter(Boolean);
    if (parts.length >= 1) {
      return parts[0].toLowerCase().trim();
    }
    return '';
  }

  function assignOpts(opts, extra) {
    var out = {};
    var k;
    if (opts) {
      for (k in opts) {
        if (Object.prototype.hasOwnProperty.call(opts, k)) out[k] = opts[k];
      }
    }
    if (extra) {
      for (k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k];
      }
    }
    return out;
  }

  function updateRoute(name, opts) {
    opts = opts || {};
    var slug = (name && FOLDER_SLUGS[name]) || '';
    if (!slug && name && name.indexOf('video-') === 0) {
      slug = 'videos';
    }
    var targetUrl = getUrlForSlug(slug);
    var currentPath = window.location.pathname;

    var title = '';
    if (name) {
      var tpl = document.getElementById('tpl-' + name);
      title = (tpl && tpl.dataset.title) || name;
    }
    document.title = title ? 'James Beckwith | ' + title : 'James Beckwith';

    if (opts.silent) return;
    if (currentPath === targetUrl && !window.location.search) return;

    if (opts.replace) {
      try {
        window.history.replaceState({ window: name || null, slug: slug }, '', targetUrl);
      } catch (err) {}
    } else {
      try {
        window.history.pushState({ window: name || null, slug: slug }, '', targetUrl);
      } catch (err) {}
    }
  }

  function openWindow(name, opts) {
    opts = opts || {};
    if (D.open[name]) {
      focus(name, opts);
      D.beep();
      return D.open[name].el;
    }
    var tpl = document.getElementById('tpl-' + name);
    if (!tpl) return null;

    var title = tpl.dataset.title || name;
    if (name === 'trash') {
      var trashN = D.trashed ? D.trashed.children.length : 0;
      tpl.dataset.info = trashN + ' item' + (trashN === 1 ? '' : 's') + '|Desktop';
    } else if (D.FOLDER_IDS && D.FOLDER_IDS[name]) {
      var count = typeof D.countShelved === 'function' ? D.countShelved(name) : 0;
      var sub = (tpl.dataset.info || '').split('|')[1] || '';
      tpl.dataset.info = count + ' item' + (count === 1 ? '' : 's') + (sub ? '|' + sub : '');
    }
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
        '<div class="hbar" aria-hidden="true"><i></i><u><b></b></u><i></i></div>' +
        '<span class="corner" aria-hidden="true"></span>' +
      '</section>'
    );
    frame.querySelector('.tb-title span').textContent = title;

    var body = frame.querySelector('.win-body');
    if (tpl.dataset.nopad) { body.style.padding = '0'; body.style.display = 'flex'; }
    body.appendChild(tpl.content.cloneNode(true));
    // the photo is embedded once, on the desktop icon; every other use points at that copy
    var srcImg = document.querySelector('.pagefile img');
    if (srcImg) body.querySelectorAll('[data-promo]').forEach(function (i) { i.src = srcImg.src; });
    if (name === 'trash' && typeof D.fillTrash === 'function') D.fillTrash(body.querySelector('#trash-items'));
    if (D.FOLDER_IDS && D.FOLDER_IDS[name] && typeof D.fillFolderShelf === 'function') {
      D.fillFolderShelf(body.querySelector('#video-items') || body.querySelector('.items'), name);
    }
    if (name === 'player') D.bindPlayer(frame);
    if (name.indexOf('video-') === 0) {
      frame.classList.add('win-media-player');
      bindMediaPlayer(frame, name.slice(6));
    }
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
    focus(name, assignOpts(opts, { fromOpen: true }));
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

  function closeWindow(name, opts) {
    opts = opts || {};
    var w = D.open[name]; if (!w) return;
    if (w.el && typeof w.el._cleanupMediaPlayer === 'function') {
      try { w.el._cleanupMediaPlayer(); } catch (err) {}
    }
    if (w.el && w.el._scrollRO) {
      try { w.el._scrollRO.disconnect(); } catch (err) {}
      delete w.el._scrollRO;
    }
    w.el.remove(); delete D.open[name];
    var rest = Object.keys(D.open);
    if (rest.length) {
      focus(rest[rest.length - 1], opts);
    } else {
      if (!opts.silent && !opts.fromPopState) {
        updateRoute('', opts.replace ? { replace: true } : {});
      } else {
        document.title = 'James Beckwith';
      }
    }
  }

  function closeAll() {
    Object.keys(D.open).forEach(function (k) { closeWindow(k, { silent: true }); });
    updateRoute('');
  }

  function focus(name, opts) {
    opts = opts || {};
    Object.keys(D.open).forEach(function (k) { D.open[k].el.classList.toggle('inactive', k !== name); });
    if (D.open[name]) D.open[name].el.style.zIndex = ++D.z;

    if (!opts.silent && !opts.fromPopState) {
      if (opts.fromInit) {
        updateRoute(name, { replace: true });
      } else if (opts.fromOpen) {
        updateRoute(name);
      } else {
        updateRoute(name, { replace: true });
      }
    }
  }

  function zoom(name) {
    var w = D.open[name]; if (!w || D.small()) return;
    var f = w.el;
    if (w.prev) {
      f.style.left = w.prev.left; f.style.top = w.prev.top;
      f.style.width = w.prev.width; f.style.height = w.prev.height;
      w.prev = null;
      updateScrollbars(f);
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
    updateScrollbars(f);
  }

  /* System 7 zoom: size to content / folder icons, not the whole desktop */
  function fitSizeForFrame(frame, name) {
    var body = frame.querySelector('.win-body');
    var maxW = Math.max(280, D.desktop.clientWidth - 24);
    var maxH = Math.max(160, D.desktop.clientHeight - 24);
    var minW = 280;
    var minH = 160;
    var chromeW = Math.max(4, frame.offsetWidth - (body ? body.clientWidth : frame.clientWidth));
    var chromeH = Math.max(24, frame.offsetHeight - (body ? body.clientHeight : frame.clientHeight));
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
        var cellW = hasThumbs ? 200 : 160;
        var cellH = hasThumbs ? 185 : 118;
        var padX = 40;
        var padY = 56;
        items.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(' + (hasThumbs ? '180px' : '152px') + ', 1fr))';
        w = cols * cellW + padX + chromeW;
        h = rows * cellH + padY + chromeH;
        /* verify against real scroll size after applying grid */
        frame.style.width = Math.min(w, maxW) + 'px';
        frame.style.height = Math.min(h, maxH) + 'px';
        w = Math.max(w, body.scrollWidth + chromeW + 2);
        h = Math.max(h, body.scrollHeight + chromeH + 4);
      }
    } else {
      var tpl = document.getElementById('tpl-' + name);
      var tw = tpl ? parseInt(tpl.dataset.w || '0', 10) : 0;
      var th = tpl ? parseInt(tpl.dataset.h || '0', 10) : 0;
      if (tpl && tpl.dataset.nopad && tw && th) {
        w = tw;
        h = th;
      } else {
        /* Probe tall so content height isn’t clipped, then hug .doc / form */
        var probeW = Math.min(tw || 520, maxW);
        frame.style.width = probeW + 'px';
        frame.style.height = maxH + 'px';
        var content = body && body.firstElementChild;
        var cs = body ? window.getComputedStyle(body) : null;
        var padX = cs ? (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) : 28;
        var padY = cs ? (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0) : 40;
        var cw = content ? Math.max(content.scrollWidth, content.offsetWidth) : probeW - padX;
        var ch = content ? Math.max(content.scrollHeight, content.offsetHeight) : 200;
        h = Math.ceil(ch + padY + chromeH + 4);
        if (name === 'contact' || (content && content.classList && content.classList.contains('contact-doc'))) {
          w = Math.ceil(cw + padX + chromeW);
        } else {
          w = Math.max(probeW, tw || minW);
        }
      }
    }

    return {
      w: Math.max(minW, Math.min(Math.round(w), maxW)),
      h: Math.max(minH, Math.min(Math.round(h), maxH))
    };
  }

  function updateScrollbars(frame) {
    if (!frame) return;
    var body = frame.querySelector('.win-body');
    if (!body) return;

    var canScrollY = body.scrollHeight > (body.clientHeight + 2);
    var canScrollX = body.scrollWidth > (body.clientWidth + 2);

    frame.classList.toggle('has-vbar', canScrollY);
    frame.classList.toggle('has-hbar', canScrollX);

    if (canScrollY) updateVThumb(frame, body);
    if (canScrollX) updateHThumb(frame, body);
  }

  function updateVThumb(frame, body) {
    var v = frame.querySelector('.vbar');
    if (!v) return;
    var track = v.querySelector('u');
    var thumb = track ? track.querySelector('b') : null;
    if (!track || !thumb) return;

    var trackH = track.clientHeight;
    if (trackH <= 0) return;

    var sH = body.scrollHeight;
    var cH = body.clientHeight;
    var sT = body.scrollTop;

    if (sH <= cH + 2) {
      thumb.style.display = 'none';
      return;
    }
    thumb.style.display = 'block';

    var ratio = cH / sH;
    var thumbH = Math.max(16, Math.min(trackH - 4, Math.round(trackH * ratio)));
    var maxScroll = sH - cH;
    var maxTrack = trackH - thumbH;
    var top = maxScroll > 0 ? Math.round((sT / maxScroll) * maxTrack) : 0;
    top = Math.max(0, Math.min(top, maxTrack));

    thumb.style.height = thumbH + 'px';
    thumb.style.top = top + 'px';
  }

  function updateHThumb(frame, body) {
    var h = frame.querySelector('.hbar');
    if (!h) return;
    var track = h.querySelector('u');
    var thumb = track ? track.querySelector('b') : null;
    if (!track || !thumb) return;

    var trackW = track.clientWidth;
    if (trackW <= 0) return;

    var sW = body.scrollWidth;
    var cW = body.clientWidth;
    var sL = body.scrollLeft;

    if (sW <= cW + 2) {
      thumb.style.display = 'none';
      return;
    }
    thumb.style.display = 'block';

    var ratio = cW / sW;
    var thumbW = Math.max(16, Math.min(trackW - 4, Math.round(trackW * ratio)));
    var maxScroll = sW - cW;
    var maxTrack = trackW - thumbW;
    var left = maxScroll > 0 ? Math.round((sL / maxScroll) * maxTrack) : 0;
    left = Math.max(0, Math.min(left, maxTrack));

    thumb.style.width = thumbW + 'px';
    thumb.style.left = left + 'px';
  }

  function bindScrollbars(frame) {
    var body = frame.querySelector('.win-body');
    var v = frame.querySelector('.vbar');
    var h = frame.querySelector('.hbar');
    if (!body || !v || !h) return;

    var step = 48;
    var vUp = v.firstElementChild;
    var vDown = v.lastElementChild;
    var vTrack = v.querySelector('u');
    var vThumb = vTrack ? vTrack.querySelector('b') : null;

    var hLeft = h.firstElementChild;
    var hRight = h.lastElementChild;
    var hTrack = h.querySelector('u');
    var hThumb = hTrack ? hTrack.querySelector('b') : null;

    if (vUp) vUp.addEventListener('click', function (e) { e.stopPropagation(); body.scrollTop -= step; });
    if (vDown) vDown.addEventListener('click', function (e) { e.stopPropagation(); body.scrollTop += step; });
    if (hLeft) hLeft.addEventListener('click', function (e) { e.stopPropagation(); body.scrollLeft -= step; });
    if (hRight) hRight.addEventListener('click', function (e) { e.stopPropagation(); body.scrollLeft += step; });

    if (vTrack) {
      vTrack.addEventListener('pointerdown', function (e) {
        if (e.target.closest('b')) return;
        e.stopPropagation();
        var rect = vTrack.getBoundingClientRect();
        var clickY = e.clientY - rect.top;
        var thumbTop = vThumb ? vThumb.offsetTop : 0;
        var pageSize = Math.max(step, body.clientHeight - 40);
        if (clickY < thumbTop) {
          body.scrollTop -= pageSize;
        } else {
          body.scrollTop += pageSize;
        }
      });
    }

    if (hTrack) {
      hTrack.addEventListener('pointerdown', function (e) {
        if (e.target.closest('b')) return;
        e.stopPropagation();
        var rect = hTrack.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var thumbLeft = hThumb ? hThumb.offsetLeft : 0;
        var pageSize = Math.max(step, body.clientWidth - 40);
        if (clickX < thumbLeft) {
          body.scrollLeft -= pageSize;
        } else {
          body.scrollLeft += pageSize;
        }
      });
    }

    if (vThumb) {
      var draggingV = false, startY = 0, startScrollY = 0;
      vThumb.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        e.stopPropagation();
        e.preventDefault();
        draggingV = true;
        startY = e.clientY;
        startScrollY = body.scrollTop;
        vThumb.setPointerCapture(e.pointerId);
      });
      vThumb.addEventListener('pointermove', function (e) {
        if (!draggingV) return;
        var trackH = vTrack.clientHeight;
        var thumbH = vThumb.offsetHeight;
        var maxTrack = trackH - thumbH;
        var maxScroll = body.scrollHeight - body.clientHeight;
        if (maxTrack <= 0 || maxScroll <= 0) return;
        var delta = e.clientY - startY;
        body.scrollTop = startScrollY + (delta / maxTrack) * maxScroll;
      });
      var endV = function (e) {
        if (!draggingV) return;
        draggingV = false;
        try { vThumb.releasePointerCapture(e.pointerId); } catch (err) {}
      };
      vThumb.addEventListener('pointerup', endV);
      vThumb.addEventListener('pointercancel', endV);
    }

    if (hThumb) {
      var draggingH = false, startX = 0, startScrollX = 0;
      hThumb.addEventListener('pointerdown', function (e) {
        if (e.button > 0) return;
        e.stopPropagation();
        e.preventDefault();
        draggingH = true;
        startX = e.clientX;
        startScrollX = body.scrollLeft;
        hThumb.setPointerCapture(e.pointerId);
      });
      hThumb.addEventListener('pointermove', function (e) {
        if (!draggingH) return;
        var trackW = hTrack.clientWidth;
        var thumbW = hThumb.offsetWidth;
        var maxTrack = trackW - thumbW;
        var maxScroll = body.scrollWidth - body.clientWidth;
        if (maxTrack <= 0 || maxScroll <= 0) return;
        var delta = e.clientX - startX;
        body.scrollLeft = startScrollX + (delta / maxTrack) * maxScroll;
      });
      var endH = function (e) {
        if (!draggingH) return;
        draggingH = false;
        try { hThumb.releasePointerCapture(e.pointerId); } catch (err) {}
      };
      hThumb.addEventListener('pointerup', endH);
      hThumb.addEventListener('pointercancel', endH);
    }

    body.addEventListener('scroll', function () {
      updateScrollbars(frame);
    });

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        updateScrollbars(frame);
      });
      ro.observe(body);
      frame._scrollRO = ro;
    }

    requestAnimationFrame(function () {
      updateScrollbars(frame);
    });
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
      updateScrollbars(frame);
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      handle.addEventListener(t, function (e) {
        on = false; frame.classList.remove('resizing');
        try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
        updateScrollbars(frame);
      });
    });
  }

  function formatMediaTime(sec) {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    sec = Math.floor(sec);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    var h = Math.floor(m / 60);
    if (h > 0) {
      m = m % 60;
      return h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function bindMediaPlayer(frame, id) {
    if (!frame || frame._mediaPlayerBound) return;
    frame._mediaPlayerBound = true;

    var iframe = frame.querySelector('.media-player-iframe');
    var playBtn = frame.querySelector('.media-btn-play');
    var rewindBtn = frame.querySelector('.media-btn-rewind');
    var forwardBtn = frame.querySelector('.media-btn-forward');
    var muteBtn = frame.querySelector('.media-btn-mute');
    var fsBtn = frame.querySelector('.media-btn-fs');
    var rail = frame.querySelector('.media-timeline-rail');
    var fill = frame.querySelector('.media-timeline-fill');
    var thumb = frame.querySelector('.media-timeline-thumb');
    var curTimeEl = frame.querySelector('.media-time-cur');
    var durTimeEl = frame.querySelector('.media-time-dur');
    var iconPlay = playBtn ? playBtn.querySelector('.icon-play') : null;
    var iconPause = playBtn ? playBtn.querySelector('.icon-pause') : null;
    var iconVol = muteBtn ? muteBtn.querySelector('.icon-vol') : null;
    var iconMuted = muteBtn ? muteBtn.querySelector('.icon-muted') : null;

    var isPlaying = true;
    var isMuted = false;
    var currentTime = 0;
    var duration = 0;
    var tickTimer = null;

    function postCmd(func, args) {
      if (!iframe || !iframe.contentWindow) return;
      try {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: func,
          args: args || []
        }), '*');
      } catch (err) {}
    }

    function setPlayingState(playing) {
      isPlaying = !!playing;
      if (iconPlay && iconPause) {
        iconPlay.hidden = isPlaying;
        iconPause.hidden = !isPlaying;
      }
      if (playBtn) {
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        playBtn.classList.toggle('is-playing', isPlaying);
      }
      if (isPlaying) {
        startTimer();
      } else {
        stopTimer();
      }
    }

    function setMuteState(muted) {
      isMuted = !!muted;
      if (iconVol && iconMuted) {
        iconVol.hidden = isMuted;
        iconMuted.hidden = !isMuted;
      }
      if (muteBtn) {
        muteBtn.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
        muteBtn.classList.toggle('is-muted', isMuted);
      }
    }

    function updateTimelineUI() {
      if (curTimeEl) curTimeEl.textContent = formatMediaTime(currentTime);
      if (durTimeEl && duration > 0) durTimeEl.textContent = formatMediaTime(duration);
      var pct = duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
      if (fill) fill.style.width = pct + '%';
      if (thumb) thumb.style.left = pct + '%';
      if (rail) rail.setAttribute('aria-valuenow', Math.round(pct));
    }

    function startTimer() {
      if (tickTimer) return;
      tickTimer = setInterval(function () {
        if (!isPlaying) return;
        currentTime += 0.5;
        if (duration > 0 && currentTime > duration) currentTime = duration;
        updateTimelineUI();
      }, 500);
    }

    function stopTimer() {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
    }

    if (playBtn) {
      playBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (isPlaying) {
          postCmd('pauseVideo');
          setPlayingState(false);
        } else {
          postCmd('playVideo');
          setPlayingState(true);
        }
      });
    }

    if (rewindBtn) {
      rewindBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        currentTime = Math.max(0, currentTime - 10);
        postCmd('seekTo', [currentTime, true]);
        updateTimelineUI();
      });
    }

    if (forwardBtn) {
      forwardBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        currentTime = duration > 0 ? Math.min(duration, currentTime + 10) : currentTime + 10;
        postCmd('seekTo', [currentTime, true]);
        updateTimelineUI();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        setMuteState(!isMuted);
        postCmd(isMuted ? 'mute' : 'unMute');
      });
    }

    if (rail) {
      function seekFromEvent(e) {
        var rect = rail.getBoundingClientRect();
        if (rect.width <= 0) return;
        var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (duration > 0) {
          currentTime = pct * duration;
          postCmd('seekTo', [currentTime, true]);
          updateTimelineUI();
        }
      }
      rail.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        seekFromEvent(e);
        function onMove(ev) { seekFromEvent(ev); }
        function onUp() {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        }
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    }

    if (fsBtn) {
      fsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var screen = frame.querySelector('.media-player-screen');
        var target = screen || iframe;
        if (!target) return;
        if (document.fullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen();
        } else {
          if (target.requestFullscreen) target.requestFullscreen();
          else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
        }
      });
    }

    function onMessage(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;
        if (data.event === 'onStateChange') {
          // 1: playing, 2: paused, 0: ended
          if (data.info === 1) {
            setPlayingState(true);
          } else if (data.info === 2 || data.info === 0) {
            setPlayingState(false);
          }
        } else if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            currentTime = data.info.currentTime;
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            duration = data.info.duration;
          }
          if (typeof data.info.muted === 'boolean') {
            setMuteState(data.info.muted);
          }
          updateTimelineUI();
        }
      } catch (err) {}
    }

    window.addEventListener('message', onMessage);

    if (iframe) {
      iframe.addEventListener('load', function () {
        postCmd('listening');
      });
    }

    setPlayingState(true);
    startTimer();

    frame._cleanupMediaPlayer = function () {
      stopTimer();
      window.removeEventListener('message', onMessage);
    };
  }

  function fillVideos(host) {
    if (!host || host.dataset.filled) return;
    host.dataset.filled = '1';
    host.style.gridTemplateColumns = 'repeat(auto-fill,minmax(190px,1fr))';
    D.YT.forEach(function (id) {
      var title = (D.YT_TITLES && D.YT_TITLES[id]) || (id + '.mp4');
      var b = D.el(
        '<button class="item video-item" data-video="' + id + '">' +
          '<div class="video-thumb-frame">' +
            '<img class="thumb" src="https://img.youtube.com/vi/' + id + '/mqdefault.jpg" alt="" loading="lazy">' +
            '<span class="video-play-badge" aria-label="Play">' +
              '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>' +
            '</span>' +
          '</div>' +
          '<span class="label"></span>' +
        '</button>'
      );
      b.querySelector('.label').textContent = title;
      host.appendChild(b);
    });
  }

  function openVideo(id) {
    var name = 'video-' + id;
    // Close other open video player to avoid multiple audio tracks playing simultaneously
    Object.keys(D.open).forEach(function (k) {
      if (k.indexOf('video-') === 0 && k !== name) {
        closeWindow(k, { silent: true });
      }
    });

    if (D.open[name]) { focus(name); return D.open[name].el; }

    var title = (D.YT_TITLES && D.YT_TITLES[id]) || (id + '.mp4');
    var safeTitle = title.replace(/"/g, '&quot;');

    var tpl = document.getElementById('tpl-' + name);
    if (!tpl) {
      tpl = document.createElement('template');
      tpl.id = 'tpl-' + name;
      tpl.dataset.title = 'Media Player — ' + title;
      tpl.dataset.info = 'Media Player|QuickTime Movie|Stereo Audio';
      tpl.dataset.w = '640';
      tpl.dataset.h = '476';
      tpl.dataset.nopad = '1';
      tpl.innerHTML =
        '<div class="media-player-app">' +
          '<div class="media-player-screen">' +
            '<iframe class="media-player-iframe" ' +
              'src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1" ' +
              'title="' + safeTitle + '" ' +
              'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
              'allowfullscreen>' +
            '</iframe>' +
          '</div>' +
          '<div class="media-player-dock">' +
            '<div class="media-timeline-row">' +
              '<div class="media-timeline-rail" role="slider" aria-label="Seek video" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">' +
                '<div class="media-timeline-fill" style="width:0%"></div>' +
                '<div class="media-timeline-thumb" style="left:0%"></div>' +
              '</div>' +
              '<div class="media-timeline-time">' +
                '<span class="media-time-cur">0:00</span> / <span class="media-time-dur">--:--</span>' +
              '</div>' +
            '</div>' +
            '<div class="media-controls-row">' +
              '<div class="media-ctrl-left">' +
                '<button type="button" class="media-btn media-btn-play is-playing" aria-label="Pause" title="Play / Pause">' +
                  '<span class="icon-play" hidden>&#9654;</span>' +
                  '<span class="icon-pause">&#10074;&#10074;</span>' +
                '</button>' +
                '<button type="button" class="media-btn media-btn-rewind" aria-label="Rewind 10 seconds" title="Rewind 10s">' +
                  '<span>&#9664;&#9664;</span>' +
                '</button>' +
                '<button type="button" class="media-btn media-btn-forward" aria-label="Forward 10 seconds" title="Forward 10s">' +
                  '<span>&#9654;&#9654;</span>' +
                '</button>' +
                '<button type="button" class="media-btn media-btn-mute" aria-label="Mute / Unmute" title="Mute / Unmute">' +
                  '<span class="icon-vol">' +
                    '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zm-2.5-1.23L6.5 6.5H2v11h4.5l5 4.5V2z"/></svg>' +
                  '</span>' +
                  '<span class="icon-muted" hidden>' +
                    '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M12 2L7 6.5H2v11h5l5 4.5V2zm7.5 10c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM16.5 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' +
                  '</span>' +
                '</button>' +
              '</div>' +
              '<div class="media-ctrl-center" title="' + safeTitle + '">' +
                '<span class="media-now-playing">Movie:</span> ' +
                '<span class="media-dock-title">' + safeTitle + '</span>' +
              '</div>' +
              '<div class="media-ctrl-right">' +
                '<a href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener" class="media-btn media-btn-yt" title="Watch on YouTube">' +
                  '<span>YouTube &nearr;</span>' +
                '</a>' +
                '<button type="button" class="media-btn media-btn-fs" aria-label="Fullscreen" title="Fullscreen">' +
                  '<span>&#x26F6;</span>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(tpl);
    }
    var frame = openWindow(name);
    return frame;
  }

  function initRoute() {
    var initial = (document.body && document.body.dataset.initialSlug) || getSlugFromPath();
    if (initial) {
      var winName = SLUG_MAP[initial];
      if (winName) {
        openWindow(winName, { fromInit: true });
      }
    }
  }

  window.addEventListener('popstate', function () {
    var slug = getSlugFromPath();
    var winName = slug ? SLUG_MAP[slug] : null;
    if (winName) {
      if (D.open[winName]) {
        focus(winName, { fromPopState: true });
      } else {
        openWindow(winName, { fromPopState: true });
      }
    } else {
      Object.keys(D.open).forEach(function (k) {
        if (FOLDER_SLUGS[k]) {
          closeWindow(k, { fromPopState: true });
        }
      });
      document.title = 'James Beckwith';
    }
  });

  D.openWindow = openWindow;
  D.closeWindow = closeWindow;
  D.closeAll = closeAll;
  D.focus = focus;
  D.zoom = zoom;
  D.fillVideos = fillVideos;
  D.openVideo = openVideo;
  D.updateScrollbars = updateScrollbars;
  D.bindContactForm = bindContactForm;
  D.initRoute = initRoute;
  D.updateRoute = updateRoute;
  D.getSlugFromPath = getSlugFromPath;

  window.JB = { open: openWindow, close: closeWindow, closeAll: closeAll };
})(window.JBDesk);
