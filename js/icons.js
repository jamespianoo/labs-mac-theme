/* Icons, trash, layout, stickies */
(function (D) {
  'use strict';
  if (!D) return;

  function iconLabel(icon) {
    var label = icon && icon.querySelector('.label');
    return label ? label.textContent.trim() : '';
  }

  function updateTrashAppearance() {
    if (!D.trashIcon) return;
    var img = D.trashIcon.querySelector('.art img');
    var n = D.trashed ? D.trashed.children.length : 0;
    if (img) img.src = n ? 'img/icons/trash-full.webp' : 'img/icons/trash.webp';
    var emptyBtn = document.querySelector('[data-empty-trash]');
    if (emptyBtn) emptyBtn.classList.toggle('disabled', !n);
  }

  function fillTrash(host) {
    if (!host) return;
    host.innerHTML = '';
    var items = D.trashed ? Array.prototype.slice.call(D.trashed.children) : [];
    if (!items.length) {
      host.innerHTML = '<p class="empty-trash">The Trash is empty. Even the bad domain names are gone.</p>';
      return;
    }
    items.forEach(function (icon) {
      var id = icon.dataset.trashId || '';
      var name = iconLabel(icon);
      var art = icon.querySelector('.art');
      var b = D.el('<button class="item" data-restore="' + id + '"><span class="label"></span></button>');
      if (art) b.insertBefore(art.cloneNode(true), b.firstChild);
      b.querySelector('.label').textContent = name;
      host.appendChild(b);
    });
  }

  function refreshTrashWindow() {
    var n = D.trashed ? D.trashed.children.length : 0;
    var tpl = document.getElementById('tpl-trash');
    if (tpl) tpl.dataset.info = n + ' item' + (n === 1 ? '' : 's') + '|Desktop';
    if (!D.open.trash) return;
    var host = D.open.trash.el.querySelector('#trash-items');
    fillTrash(host);
    var bar = D.open.trash.el.querySelector('.infobar');
    if (bar) {
      bar.innerHTML = '<span>' + n + ' item' + (n === 1 ? '' : 's') + '</span><span class="mid">Desktop</span>';
    }
  }

  function moveToTrash(icon) {
    if (!icon || icon.dataset.trash || !D.trashed) return;
    if (icon.classList.contains('renaming')) return;
    var winName = icon.dataset.open;
    if (winName && D.open[winName] && winName !== 'trash') D.closeWindow(winName);
    if (!icon.dataset.trashId) icon.dataset.trashId = String(++D.trashSeq);
    icon.classList.remove('selected', 'dragging');
    D.trashed.appendChild(icon);
    updateTrashAppearance();
    refreshTrashWindow();
    savePositions();
  }

  function emptyTrash() {
    if (!D.trashed || !D.trashed.children.length) return;
    var items = Array.prototype.slice.call(D.trashed.children);
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
    D.trashed.innerHTML = '';
    updateTrashAppearance();
    refreshTrashWindow();
    savePositions();
    if (typeof D.beep === 'function') D.beep();
    showEgg(count, names);
  }

  function readGone() {
    try {
      var raw = localStorage.getItem(D.GONE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }
  function writeGone(list) {
    try { localStorage.setItem(D.GONE_KEY, JSON.stringify(list)); } catch (err) {}
  }
  function readClearedSeeds() {
    try {
      var raw = localStorage.getItem(D.SEED_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }
  function writeClearedSeeds(list) {
    try { localStorage.setItem(D.SEED_KEY, JSON.stringify(list)); } catch (err) {}
  }
  function purgeGoneFromPositions(gone) {
    var map = readPositions();
    if (!map) return;
    gone.forEach(function (id) { delete map[id]; });
    try { localStorage.setItem(D.POS_KEY, JSON.stringify(map)); } catch (err) {}
  }
  function applyGoneState() {
    var gone = readGone();
    if (D.iconsHost && gone.length) {
      gone.forEach(function (id) {
        var icon = D.iconsHost.querySelector('.icon[data-id="' + id + '"]');
        if (icon) icon.remove();
      });
    }
    if (D.trashed) {
      var seeds = readClearedSeeds();
      Array.prototype.slice.call(D.trashed.children).forEach(function (icon) {
        var sid = icon.dataset.trashId;
        if (sid && seeds.indexOf(sid) !== -1) icon.remove();
      });
    }
  }

  function showEgg(count, names) {
    var frame = D.openWindow('egg');
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
      D.closeWindow('egg');
    });
  }

  function restoreFromTrash(id) {
    var icon = D.trashed && D.trashed.querySelector('[data-trash-id="' + id + '"]');
    if (!icon || !D.iconsHost) return;
    D.iconsHost.appendChild(icon);
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
    D.iconsHost.appendChild(clone);
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
      : (/\.pdf$/i.test(name) ? 'PDF document'
      : (/\.png$/i.test(name) || icon.querySelector('.pagefile') ? 'PNG image'
      : (/\.txt$/i.test(name) ? 'Text document'
      : (/\.aiff$/i.test(name) ? 'Sound'
      : (/\.app$/i.test(name) ? 'Application'
      : (/\.map$/i.test(name) ? 'Map document' : 'Folder')))))));
    var where = icon && icon.parentNode === D.trashed ? 'Trash' : 'Desktop';
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
    D.openWindow(id);
  }

  function placeTrashCorner() {
    if (!D.trashIcon || D.small()) return;
    var w = D.trashIcon.offsetWidth || 128;
    var h = D.trashIcon.offsetHeight || 148;
    D.trashIcon.style.left = Math.max(8, D.desktop.clientWidth - w - 16) + 'px';
    D.trashIcon.style.top = Math.max(8, D.desktop.clientHeight - h - 12) + 'px';
  }

  function iconKey(icon) {
    return icon.dataset.id || icon.dataset.open || iconLabel(icon) || '';
  }

  function readPositions() {
    try {
      var raw = localStorage.getItem(D.POS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
  }

  function savePositions() {
    if (D.small() || !D.iconsHost) return;
    var map = {};
    D.iconsHost.querySelectorAll('.icon').forEach(function (icon) {
      var id = iconKey(icon);
      if (!id) return;
      map[id] = {
        left: parseInt(icon.style.left, 10) || 0,
        top: parseInt(icon.style.top, 10) || 0
      };
      if (icon.dataset.trash && icon.dataset.moved) map[id].moved = 1;
    });
    try { localStorage.setItem(D.POS_KEY, JSON.stringify(map)); } catch (err) {}
  }

  function applySavedPositions(map) {
    if (!map || !D.iconsHost) return { applied: 0, missing: [] };
    var applied = 0;
    var missing = [];
    D.iconsHost.querySelectorAll('.icon').forEach(function (icon) {
      var id = iconKey(icon);
      var pos = id && map[id];
      if (!pos || typeof pos.left !== 'number' || typeof pos.top !== 'number') {
        if (!icon.dataset.trash) missing.push(icon);
        return;
      }
      icon.style.left = pos.left + 'px';
      icon.style.top = pos.top + 'px';
      if (icon.dataset.trash && pos.moved) icon.dataset.moved = '1';
      applied++;
    });
    return { applied: applied, missing: missing };
  }

  function stickyRects() {
    if (!D.desktop) return [];
    var desk = D.desktop.getBoundingClientRect();
    return Array.prototype.map.call(document.querySelectorAll('#stickies [data-sticky]'), function (note) {
      if (note.hidden || note.style.display === 'none') return null;
      var r = note.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return null;
      return {
        x: r.left - desk.left,
        y: r.top - desk.top,
        w: r.width,
        h: r.height
      };
    }).filter(Boolean);
  }

  function overlapsRect(x, y, iw, ih, rect, gap) {
    gap = gap == null ? 12 : gap;
    return x + iw + gap > rect.x && x < rect.x + rect.w + gap &&
           y + ih + gap > rect.y && y < rect.y + rect.h + gap;
  }

  function overlapsAnySticky(x, y, iw, ih, stickies) {
    for (var i = 0; i < stickies.length; i++) {
      if (overlapsRect(x, y, iw, ih, stickies[i])) return true;
    }
    return false;
  }

  function wordmarkZone(W, H) {
    /* Keep clear of the centred JAMES BECKWITH hero */
    return {
      x0: W * 0.20,
      x1: W * 0.80,
      y0: H * 0.30,
      y1: H * 0.58
    };
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function sampleMidSpot(W, H, iw, ih, zone) {
    /* Prefer a ring around the wordmark: left / right / above / below — still fairly central */
    var pad = 16;
    var lane = Math.floor(Math.random() * 4);
    var x, y;
    var midX0 = W * 0.10;
    var midX1 = W * 0.90 - iw;
    var midY0 = H * 0.06;
    var midY1 = H * 0.86 - ih;
    if (lane === 0) {
      /* left of wordmark */
      x = midX0 + Math.random() * Math.max(8, zone.x0 - midX0 - iw * 0.35);
      y = H * 0.12 + Math.random() * Math.max(8, H * 0.62);
    } else if (lane === 1) {
      /* right of wordmark */
      x = zone.x1 + Math.random() * Math.max(8, midX1 - zone.x1);
      y = H * 0.12 + Math.random() * Math.max(8, H * 0.62);
    } else if (lane === 2) {
      /* above wordmark */
      x = W * 0.18 + Math.random() * Math.max(8, W * 0.64 - iw);
      y = midY0 + Math.random() * Math.max(8, zone.y0 - midY0 - ih * 0.2);
    } else {
      /* below wordmark */
      x = W * 0.18 + Math.random() * Math.max(8, W * 0.64 - iw);
      y = zone.y1 + Math.random() * Math.max(8, midY1 - zone.y1);
    }
    return {
      x: Math.round(clamp(x, pad, Math.max(pad, W - iw - pad))),
      y: Math.round(clamp(y, pad, Math.max(pad, H - ih - pad)))
    };
  }

  function sampleEdgeSpot(W, H, iw, ih) {
    var pad = 14;
    var edge = Math.floor(Math.random() * 4);
    var x, y;
    if (edge === 0) { /* far left */
      x = pad + Math.random() * Math.max(4, W * 0.12);
      y = pad + Math.random() * Math.max(4, H - ih - pad * 2);
    } else if (edge === 1) { /* far right */
      x = W * 0.82 + Math.random() * Math.max(4, W * 0.18 - iw - pad);
      y = pad + Math.random() * Math.max(4, H - ih - pad * 2);
    } else if (edge === 2) { /* top */
      x = pad + Math.random() * Math.max(4, W - iw - pad * 2);
      y = pad + Math.random() * Math.max(4, H * 0.12);
    } else { /* bottom */
      x = pad + Math.random() * Math.max(4, W - iw - pad * 2);
      y = H * 0.78 + Math.random() * Math.max(4, H * 0.22 - ih - pad);
    }
    return {
      x: Math.round(clamp(x, pad, Math.max(pad, W - iw - pad))),
      y: Math.round(clamp(y, pad, Math.max(pad, H - ih - pad)))
    };
  }

  function findClearSpot(iw, ih, placed, stickies, avoidWordmark, preferMid) {
    var pad = 12;
    var W = D.desktop.clientWidth, H = D.desktop.clientHeight;
    var zone = wordmarkZone(W, H);
    var x, y, t, i, p, spot;
    function blocked(px, py) {
      if (avoidWordmark && px + iw > zone.x0 && px < zone.x1 && py + ih > zone.y0 && py < zone.y1) return true;
      if (overlapsAnySticky(px, py, iw, ih, stickies)) return true;
      for (i = 0; i < placed.length; i++) {
        p = placed[i];
        if (Math.abs(p.x - px) < iw - 8 && Math.abs(p.y - py) < ih - 8) return true;
      }
      return false;
    }
    for (t = 0; t < 120; t++) {
      spot = preferMid ? sampleMidSpot(W, H, iw, ih, zone) : sampleEdgeSpot(W, H, iw, ih);
      x = spot.x; y = spot.y;
      if (!blocked(x, y)) return { x: x, y: y };
    }
    /* fallback: any clear spot on the desk */
    for (t = 0; t < 80; t++) {
      x = pad + Math.floor(Math.random() * Math.max(1, W - iw - pad * 2));
      y = pad + Math.floor(Math.random() * Math.max(1, H - ih - pad * 2));
      if (!blocked(x, y)) return { x: x, y: y };
    }
    var dx = iw, dy = ih;
    for (y = pad; y <= H - ih - pad; y += dy) {
      for (x = pad; x <= W - iw - pad; x += dx) {
        if (!blocked(x, y)) return { x: x, y: y };
      }
    }
    return { x: pad, y: pad };
  }

  function scatterIcons(force) {
    if (D.small() || !D.iconsHost) return;
    if (!force) {
      var saved = readPositions();
      if (saved) {
        var result = applySavedPositions(saved);
        if (result.applied > 0) {
          if (result.missing.length) {
            var iw = 128, ih = 148;
            var stickies = stickyRects();
            var placed = [];
            D.iconsHost.querySelectorAll('.icon').forEach(function (icon) {
              if (!icon.style.left && !icon.style.top) return;
              placed.push({
                x: parseInt(icon.style.left, 10) || 0,
                y: parseInt(icon.style.top, 10) || 0
              });
            });
            result.missing.forEach(function (icon) {
              var spot = findClearSpot(iw, ih, placed, stickies, true, true);
              icon.style.left = spot.x + 'px';
              icon.style.top = spot.y + 'px';
              placed.push({ x: spot.x, y: spot.y });
            });
            savePositions();
          }
          if (D.trashIcon && !D.trashIcon.dataset.moved) placeTrashCorner();
          resolveStickyOverlaps();
          return;
        }
      }
    }
    var list = Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon[data-scatter]'));
    if (!list.length) return;
    /* Shuffle so which 1–2 sit on the edge varies */
    for (var s = list.length - 1; s > 0; s--) {
      var j = Math.floor(Math.random() * (s + 1));
      var tmp = list[s]; list[s] = list[j]; list[j] = tmp;
    }
    var iw = 128, ih = 148;
    var stickies = stickyRects();
    var placed = [];
    var edgeSlots = Math.min(2, Math.max(1, Math.floor(list.length / 6)));
    list.forEach(function (icon, idx) {
      var preferMid = idx >= edgeSlots;
      var spot = findClearSpot(iw, ih, placed, stickies, true, preferMid);
      icon.style.left = spot.x + 'px';
      icon.style.top = spot.y + 'px';
      placed.push({ x: spot.x, y: spot.y });
    });
    placeTrashCorner();
    savePositions();
  }

  function resolveStickyOverlaps() {
    if (D.small() || !D.iconsHost) return;
    var stickies = stickyRects();
    if (!stickies.length) return;
    var iw = 128, ih = 148;
    var placed = [];
    var moved = false;
    Array.prototype.forEach.call(D.iconsHost.querySelectorAll('.icon:not(.trash)'), function (icon) {
      var x = parseInt(icon.style.left, 10) || 0;
      var y = parseInt(icon.style.top, 10) || 0;
      var hitSticky = overlapsAnySticky(x, y, iw, ih, stickies);
      var hitIcon = false;
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        if (Math.abs(p.x - x) < iw - 8 && Math.abs(p.y - y) < ih - 8) { hitIcon = true; break; }
      }
      if (hitSticky || hitIcon) {
        var spot = findClearSpot(iw, ih, placed, stickies, true, true);
        icon.style.left = spot.x + 'px';
        icon.style.top = spot.y + 'px';
        x = spot.x; y = spot.y;
        moved = true;
      }
      placed.push({ x: x, y: y });
    });
    if (moved) savePositions();
  }

  function arrangeIcons(mode) {
    var list = Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon:not(.trash)'));
    if (mode === 'name') {
      list.sort(function (a, b) { return iconLabel(a).localeCompare(iconLabel(b)); });
    }
    var iw = 128, ih = 148;
    var stickies = stickyRects();
    var placed = [];
    /* Clean Up: central cluster around the wordmark, still clear of the name */
    var W = D.desktop.clientWidth, H = D.desktop.clientHeight;
    var zone = wordmarkZone(W, H);
    var dx = 134, dy = 148;
    var slots = [];
    function addRow(y, xStart, xEnd) {
      for (var x = xStart; x <= xEnd - iw; x += dx) slots.push({ x: x, y: y });
    }
    /* left column band */
    for (var y = Math.round(H * 0.10); y < H * 0.78; y += dy) {
      addRow(y, Math.round(W * 0.08), Math.round(zone.x0 - 8));
    }
    /* right column band */
    for (y = Math.round(H * 0.10); y < H * 0.78; y += dy) {
      addRow(y, Math.round(zone.x1 + 8), Math.round(W * 0.92));
    }
    /* above / below bands */
    addRow(Math.round(H * 0.08), Math.round(W * 0.22), Math.round(W * 0.78));
    addRow(Math.round(zone.y1 + 12), Math.round(W * 0.22), Math.round(W * 0.78));
    var si = 0;
    list.forEach(function (icon) {
      var x, y, tries = 0, spot;
      do {
        if (si < slots.length) {
          x = slots[si].x;
          y = slots[si].y;
          si++;
        } else {
          spot = findClearSpot(iw, ih, placed, stickies, true, true);
          x = spot.x; y = spot.y;
        }
        tries++;
      } while (tries < 60 && (overlapsAnySticky(x, y, iw, ih, stickies) ||
        (x + iw > zone.x0 && x < zone.x1 && y + ih > zone.y0 && y < zone.y1)));
      if (overlapsAnySticky(x, y, iw, ih, stickies) ||
          (x + iw > zone.x0 && x < zone.x1 && y + ih > zone.y0 && y < zone.y1)) {
        spot = findClearSpot(iw, ih, placed, stickies, true, true);
        x = spot.x; y = spot.y;
      }
      icon.style.left = x + 'px';
      icon.style.top = y + 'px';
      placed.push({ x: x, y: y });
    });
    placeTrashCorner();
    if (D.trashIcon) delete D.trashIcon.dataset.moved;
    savePositions();
  }

  function overTrash(x, y) {
    if (!D.trashIcon) return false;
    var r = D.trashIcon.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function clearSel() {
    document.querySelectorAll('.icon.selected,.item.selected').forEach(function (n) {
      n.classList.remove('selected');
    });
  }

  function activate(node) {
    if (node.dataset.restore) return D.restoreFromTrash(node.dataset.restore);
    if (node.dataset.video) return D.openVideo(node.dataset.video);
    if (node.dataset.href) return window.open(node.dataset.href, '_blank', 'noopener');
    if (node.dataset.open) return D.openWindow(node.dataset.open);
  }

  function dragIcon(icon) {
    var on = false, moved = false, sx, sy, ox, oy;
    icon.addEventListener('pointerdown', function (e) {
      if (D.small() || e.button > 0 || icon.classList.contains('renaming')) return;
      if (typeof D.hideMenus === 'function') D.hideMenus();
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      ox = icon.offsetLeft; oy = icon.offsetTop;
      icon.setPointerCapture(e.pointerId);
      icon.classList.add('dragging');
      icon.style.zIndex = ++D.iconZ;
      clearSel(); icon.classList.add('selected');
      e.preventDefault();
    });
    icon.addEventListener('pointermove', function (e) {
      if (!on) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && dx * dx + dy * dy < 25) return;
      moved = true;
      var maxX = Math.max(0, D.desktop.clientWidth - icon.offsetWidth);
      var maxY = Math.max(0, D.desktop.clientHeight - icon.offsetHeight);
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

  function dragSticky(note) {
    var on = false, sx, sy, ox, oy;
    var bar = note.querySelector('.sticky-bar');
    if (bar) {
      if (!bar.querySelector('.sticky-close')) {
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'sticky-close';
        close.setAttribute('aria-label', 'Close note');
        bar.insertBefore(close, bar.firstChild);
      }
      if (!bar.querySelector('.sticky-zoom')) {
        var zoom = document.createElement('button');
        zoom.type = 'button';
        zoom.className = 'sticky-zoom';
        zoom.setAttribute('aria-label', 'Zoom note');
        bar.appendChild(zoom);
      }
      var closeBtn = bar.querySelector('.sticky-close');
      if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = '1';
        closeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          askCloseSticky(note);
        });
      }
      var zoomEl = bar.querySelector('.sticky-zoom');
      if (zoomEl && !zoomEl.dataset.bound) {
        zoomEl.dataset.bound = '1';
        zoomEl.addEventListener('click', function (e) {
          e.stopPropagation();
          note.classList.toggle('zoomed');
          note.classList.remove('shaded');
          if (typeof D.beep === 'function') D.beep();
        });
        zoomEl.addEventListener('dblclick', function (e) {
          e.stopPropagation();
          note.classList.toggle('shaded');
        });
      }
    }
    if (!note.querySelector('.sticky-body')) {
      var body = document.createElement('div');
      body.className = 'sticky-body';
      Array.prototype.slice.call(note.children).forEach(function (child) {
        if (!child.classList.contains('sticky-bar')) body.appendChild(child);
      });
      note.appendChild(body);
    }
    note.addEventListener('pointerdown', function (e) {
      if (D.small() || e.button > 0 || e.target.closest('a,.sticky-close,.sticky-zoom')) return;
      on = true; sx = e.clientX; sy = e.clientY;
      ox = note.offsetLeft; oy = note.offsetTop;
      note.setPointerCapture(e.pointerId);
      note.classList.add('dragging');
      note.style.zIndex = ++D.iconZ;
      e.preventDefault();
    });
    note.addEventListener('pointermove', function (e) {
      if (!on) return;
      var maxX = Math.max(0, D.desktop.clientWidth - note.offsetWidth);
      var maxY = Math.max(0, D.desktop.clientHeight - note.offsetHeight);
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
    if (!D.stickyAlert) return;
    D.stickyAlert.hidden = true;
    D.stickyPending = null;
  }

  function askCloseSticky(note) {
    if (!D.stickyAlert || !note) return;
    if (typeof D.hideMenus === 'function') D.hideMenus();
    D.stickyPending = note;
    D.stickyAlert.hidden = false;
    var saveBtn = D.stickyAlert.querySelector('[data-alert=save]');
    if (saveBtn) saveBtn.focus();
  }

  D.iconLabel = iconLabel;
  D.updateTrashAppearance = updateTrashAppearance;
  D.fillTrash = fillTrash;
  D.moveToTrash = moveToTrash;
  D.emptyTrash = emptyTrash;
  D.applyGoneState = applyGoneState;
  D.showEgg = showEgg;
  D.bindEgg = bindEgg;
  D.restoreFromTrash = restoreFromTrash;
  D.duplicateIcon = duplicateIcon;
  D.renameIcon = renameIcon;
  D.getInfo = getInfo;
  D.placeTrashCorner = placeTrashCorner;
  D.savePositions = savePositions;
  D.scatterIcons = scatterIcons;
  D.arrangeIcons = arrangeIcons;
  D.overTrash = overTrash;
  D.clearSel = clearSel;
  D.activate = activate;
  D.dragIcon = dragIcon;
  D.downloadSticky = downloadSticky;
  D.removeSticky = removeSticky;
  D.hideStickyAlert = hideStickyAlert;
  D.askCloseSticky = askCloseSticky;

  D.initIcons = function () {
    document.querySelectorAll('#icons .icon').forEach(function (icon) {
      dragIcon(icon);
      icon.dataset.dragBound = '1';
    });
    updateTrashAppearance();
    applyGoneState();
    updateTrashAppearance();
    scatterIcons(false);
    window.addEventListener('resize', function () {
      if (!D.small() && D.trashIcon && !D.trashIcon.dataset.moved) {
        placeTrashCorner();
        savePositions();
      }
    });
    document.querySelectorAll('[data-sticky]').forEach(dragSticky);
    if (D.stickyAlert) {
      D.stickyAlert.addEventListener('click', function (e) {
        if (e.target === D.stickyAlert) { hideStickyAlert(); return; }
        var btn = e.target.closest('[data-alert]');
        if (!btn || !D.stickyPending) return;
        var act = btn.dataset.alert;
        var note = D.stickyPending;
        if (act === 'cancel') { hideStickyAlert(); return; }
        if (act === 'save') downloadSticky(note);
        if (act === 'save' || act === 'discard') {
          removeSticky(note);
          hideStickyAlert();
        }
      });
    }
  };
})(window.JBDesk);
