(function () {
  'use strict';

  var YT = ['qpRMLR7VkO8','QeW5kR0EGok','OR9yKC8f1Zs','6REtACtGSJE','hacDUIS12Ho','ity7KgKlNbE'];

  var desktop = document.getElementById('desktop');
  var open = Object.create(null);
  var z = 100, cascade = 0;
  var small = function () { return window.matchMedia('(max-width:820px)').matches; };

  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  /* ------------------------------------------------------------- windows */
  function openWindow(name) {
    if (open[name]) { focus(name); return open[name]; }
    var tpl = document.getElementById('tpl-' + name);
    if (!tpl) return null;

    var title = tpl.dataset.title || name;
    var info = (tpl.dataset.info || '').split('|').filter(Boolean);

    var frame = el(
      '<section class="win" role="dialog" aria-label="' + title + '" tabindex="-1">' +
        '<div class="titlebar">' +
          '<button class="box" data-act="close" aria-label="Close ' + title + '"></button>' +
          '<div class="tb-title"><span></span></div>' +
          '<button class="box zoom" data-act="zoom" aria-label="Zoom ' + title + '"></button>' +
        '</div>' +
        (info.length ? '<div class="infobar">' +
          info.map(function (s, i) {
            return '<span class="' + (i === 0 ? '' : (i === info.length - 1 && info.length > 2 ? 'right' : 'muted')) + '">' + s + '</span>';
          }).join('') + '</div>' : '') +
        '<div class="win-inner">' +
          '<div class="win-body"></div>' +
          '<div class="vbar"><i></i><u></u><i></i></div>' +
        '</div>' +
        '<div class="hbar"><i></i><u></u><i></i><span class="corner"></span></div>' +
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

    if (!small()) {
      var w = Math.min(parseInt(tpl.dataset.w || '560', 10), desktop.clientWidth - 40);
      var h = Math.min(parseInt(tpl.dataset.h || '380', 10), desktop.clientHeight - 40);
      var off = (cascade++ % 6) * 26;
      frame.style.width = w + 'px';
      frame.style.height = h + 'px';
      frame.style.left = Math.max(8, Math.min(300 + off, desktop.clientWidth - w - 16)) + 'px';
      frame.style.top = Math.max(8, Math.min(70 + off, desktop.clientHeight - h - 16)) + 'px';
    }

    desktop.appendChild(frame);
    open[name] = { el: frame, prev: null };

    frame.querySelector('[data-act=close]').addEventListener('click', function (e) { e.stopPropagation(); closeWindow(name); });
    frame.querySelector('[data-act=zoom]').addEventListener('click', function (e) { e.stopPropagation(); zoom(name); });
    frame.addEventListener('pointerdown', function () { focus(name); });
    drag(frame, name);
    focus(name);
    frame.focus({ preventScroll: true });
    return frame;
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
    } else {
      w.prev = { left: f.style.left, top: f.style.top, width: f.style.width, height: f.style.height };
      f.style.left = '16px'; f.style.top = '16px';
      f.style.width = (desktop.clientWidth - 32) + 'px';
      f.style.height = (desktop.clientHeight - 32) + 'px';
    }
  }

  function drag(frame, name) {
    var bar = frame.querySelector('.titlebar'), on = false, sx, sy, ox, oy;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.box') || small()) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = frame.offsetLeft; oy = frame.offsetTop;
      bar.setPointerCapture(e.pointerId); focus(name); e.preventDefault();
    });
    bar.addEventListener('pointermove', function (e) {
      if (!on) return;
      frame.style.left = Math.max(-frame.offsetWidth + 90, Math.min(ox + e.clientX - sx, desktop.clientWidth - 70)) + 'px';
      frame.style.top = Math.max(0, Math.min(oy + e.clientY - sy, desktop.clientHeight - 26)) + 'px';
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
      bar.addEventListener(t, function (e) { on = false; try { bar.releasePointerCapture(e.pointerId); } catch (err) {} });
    });
    bar.addEventListener('dblclick', function (e) { if (!e.target.closest('.box')) zoom(name); });
  }

  function fillVideos(host) {
    if (!host || host.dataset.filled) return;
    host.dataset.filled = '1';
    host.style.gridTemplateColumns = 'repeat(auto-fill,minmax(180px,1fr))';
    YT.forEach(function (id, i) {
      var b = el('<button class="item" data-video="' + id + '">' +
                 '<img src="https://img.youtube.com/vi/' + id + '/mqdefault.jpg" alt="" loading="lazy" style="width:100%;height:auto;aspect-ratio:16/9">' +
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
  function showMenu(id, btn) {
    hideMenus();
    var m = document.getElementById(id); if (!m) return;
    m.hidden = false;
    var r = btn.getBoundingClientRect();
    m.style.left = Math.max(2, r.left - 2) + 'px';
    m.style.top = '29px';
    btn.setAttribute('aria-expanded', 'true');
    openMenu = { menu: m, btn: btn };
  }
  function hideMenus() {
    document.querySelectorAll('.menu').forEach(function (m) { m.hidden = true; });
    document.querySelectorAll('.menu-title').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    openMenu = null;
  }

  document.querySelectorAll('.menu-title').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (openMenu && openMenu.btn === btn) hideMenus();
      else showMenu(btn.dataset.menu, btn);
    });
    // once a menu is open, sliding across the bar switches menus - as it did
    btn.addEventListener('mouseenter', function () { if (openMenu && openMenu.btn !== btn) showMenu(btn.dataset.menu, btn); });
  });

  document.querySelectorAll('[data-submenu]').forEach(function (btn) {
    var sub = document.getElementById(btn.dataset.submenu);
    var wrap = btn.closest('.submenu-wrap');
    function show(v) { sub.hidden = !v; btn.setAttribute('aria-expanded', String(v)); }
    wrap.addEventListener('mouseenter', function () { show(true); });
    wrap.addEventListener('mouseleave', function () { show(false); });
    btn.addEventListener('click', function (e) { e.stopPropagation(); show(sub.hidden); });
  });

  /* ---------------------------------------------------------- interaction */
  function clearSel() { document.querySelectorAll('.icon.selected,.item.selected').forEach(function (n) { n.classList.remove('selected'); }); }
  function activate(node) {
    if (node.dataset.video) return openVideo(node.dataset.video);
    if (node.dataset.href) return window.open(node.dataset.href, '_blank', 'noopener');
    if (node.dataset.open) return openWindow(node.dataset.open);
  }

  document.addEventListener('click', function (e) {
    var node = e.target.closest('.icon,.item');
    if (node) { clearSel(); node.classList.add('selected'); if (small()) activate(node); return; }
    if (!e.target.closest('.menubar') && !e.target.closest('.menu')) hideMenus();
    if (!e.target.closest('.win')) clearSel();
  });

  document.addEventListener('dblclick', function (e) {
    var node = e.target.closest('.icon,.item');
    if (node) { e.preventDefault(); activate(node); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (openMenu) { hideMenus(); return; }
      var names = Object.keys(open);
      if (names.length) closeWindow(names[names.length - 1]);
      return;
    }
    var node = e.target.closest && e.target.closest('.icon,.item');
    if (node && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); activate(node); }
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.menu [data-open]');
    if (b) { hideMenus(); openWindow(b.dataset.open); return; }
    if (e.target.closest('[data-close-all]')) { hideMenus(); closeAll(); }
    if (e.target.closest('.menu a')) hideMenus();
  });

  window.JB = { open: openWindow, close: closeWindow, closeAll: closeAll };
})();
