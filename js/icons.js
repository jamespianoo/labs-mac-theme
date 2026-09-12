/* Icons, trash, layout, stickies */
(function (D) {
  'use strict';
  if (!D) return;

  function iconLabel(icon) {
    var label = icon && icon.querySelector('.label');
    return label ? label.textContent.trim() : '';
  }

  function isTrashCan(icon) {
    return !!(icon && (icon.classList.contains('trash') || icon.getAttribute('data-trash') != null));
  }

  function isPinned(icon) {
    if (!icon || !D.PINNED_IDS) return false;
    var id = icon.dataset.id || icon.dataset.open;
    return !!(id && D.PINNED_IDS[id]);
  }

  function ensureTrashOnDesktop() {
    if (!D.iconsHost) return;
    var can = D.trashIcon || document.querySelector('.icon.trash');
    if (!can) return;
    D.trashIcon = can;
    if (can.parentNode !== D.iconsHost) {
      D.iconsHost.appendChild(can);
      delete can.dataset.trashId;
      can.classList.remove('selected', 'dragging');
    }
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
      host.innerHTML = '<p class="empty-trash">The Trash is empty.</p>';
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
      bindTrashItemDrag(b, icon);
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
    if (!icon || isTrashCan(icon) || isPinned(icon) || !D.trashed) return;
    if (icon.classList.contains('renaming')) return;
    var winName = icon.dataset.open;
    var prevShelf = icon.dataset.shelf;
    if (winName && D.open[winName] && winName !== 'trash') D.closeWindow(winName);
    if (!icon.dataset.trashId) icon.dataset.trashId = String(++D.trashSeq);
    icon.classList.remove('selected', 'dragging');
    delete icon.dataset.shelf;
    D.trashed.appendChild(icon);
    saveShelfState();
    updateTrashAppearance();
    refreshTrashWindow();
    if (prevShelf) refreshFolderWindow(prevShelf);
    savePositions();
  }

  function emptyTrash() {
    ensureTrashOnDesktop();
    if (!D.trashed || !D.trashed.children.length) return;
    var items = Array.prototype.slice.call(D.trashed.children).filter(function (icon) {
      return !isTrashCan(icon);
    });
    if (!items.length) return;
    var count = 0;
    var names = [];
    var gone = readGone();
    var seeds = readClearedSeeds();
    items.forEach(function (icon) {
      if (icon.dataset.open && D.FOLDER_IDS && D.FOLDER_IDS[icon.dataset.open]) {
        /* Protect core site folders from permanent destruction */
        delete icon.dataset.trashId;
        delete icon.dataset.shelf;
        D.iconsHost.appendChild(icon);
        icon.setAttribute('data-scatter', '');
        return;
      }
      count++;
      var id = iconKey(icon);
      var label = iconLabel(icon);
      if (label) names.push(label);
      if (id && gone.indexOf(id) === -1) gone.push(id);
      if (icon.dataset.trashId && String(icon.dataset.trashId).indexOf('seed-') === 0) {
        if (seeds.indexOf(icon.dataset.trashId) === -1) seeds.push(icon.dataset.trashId);
      }
      icon.remove();
    });
    writeGone(gone);
    writeClearedSeeds(seeds);
    purgeGoneFromPositions(gone);
    saveShelfState();
    updateTrashAppearance();
    refreshTrashWindow();
    savePositions();
    if (typeof D.beep === 'function') D.beep();
    if (count > 0) showEgg(count, names);
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
    if (gone.length) {
      gone.forEach(function (id) {
        if (D.PINNED_IDS && D.PINNED_IDS[id]) return;
        var icon = (D.iconsHost && (D.iconsHost.querySelector('.icon[data-id="' + id + '"]') || D.iconsHost.querySelector('.icon[data-open="' + id + '"]')))
          || (D.shelved && (D.shelved.querySelector('.icon[data-id="' + id + '"]') || D.shelved.querySelector('.icon[data-open="' + id + '"]')));
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

  function restoreFromTrash(id, clientX, clientY) {
    var icon = D.trashed && D.trashed.querySelector('[data-trash-id="' + id + '"]');
    if (!icon || !D.iconsHost) return;
    delete icon.dataset.trashId;
    delete icon.dataset.shelf;
    D.iconsHost.appendChild(icon);
    if (!icon.dataset.dragBound) {
      dragIcon(icon);
      icon.dataset.dragBound = '1';
    }
    if (clientX != null && clientY != null && D.desktop) {
      var desk = D.desktop.getBoundingClientRect();
      var iw = icon.offsetWidth || 80;
      var ih = icon.offsetHeight || 80;
      var x = clientX - desk.left - iw / 2;
      var y = clientY - desk.top - ih / 2;
      var maxX = Math.max(0, D.desktop.clientWidth - iw);
      var maxY = Math.max(0, D.desktop.clientHeight - ih);
      icon.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
      icon.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    } else if (!icon.style.left || !icon.style.top) {
      icon.style.left = (40 + Math.floor(Math.random() * 80)) + 'px';
      icon.style.top = (40 + Math.floor(Math.random() * 80)) + 'px';
    }
    if (!icon.dataset.id && !icon.dataset.open) {
      icon.dataset.id = 'restored-' + Date.now();
    }
    icon.setAttribute('data-scatter', '');
    updateTrashAppearance();
    refreshTrashWindow();
    saveShelfState();
    savePositions();
    if (typeof D.beep === 'function') D.beep();
  }

  function duplicateIcon(icon) {
    if (!icon || isTrashCan(icon)) return;
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
    if (!icon || isTrashCan(icon) || icon.classList.contains('renaming')) return;
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
      : (isTrashCan(icon) ? 'Trash'
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
      if (isTrashCan(icon) && icon.dataset.moved) map[id].moved = 1;
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
        if (!isTrashCan(icon)) missing.push(icon);
        return;
      }
      icon.style.left = pos.left + 'px';
      icon.style.top = pos.top + 'px';
      if (isTrashCan(icon) && pos.moved) icon.dataset.moved = '1';
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
    var t = dropTargetAt(x, y, null);
    return !!(t && t.type === 'trash');
  }

  function isFolderAncestor(ancestorName, folderName) {
    if (!ancestorName || !folderName) return false;
    if (ancestorName === folderName) return true;
    var cur = folderName;
    var visited = {};
    while (cur && !visited[cur]) {
      visited[cur] = true;
      var icon = findShelvedIcon(cur) || (D.iconsHost && (D.iconsHost.querySelector('.icon[data-open="' + cur + '"]') || D.iconsHost.querySelector('.icon[data-id="' + cur + '"]')));
      if (!icon) break;
      var parent = icon.dataset.shelf;
      if (!parent) break;
      if (parent === ancestorName) return true;
      cur = parent;
    }
    return false;
  }

  function isFolderDropTarget(el) {
    if (!el || isTrashCan(el)) return false;
    var name = el.dataset.open || (el.dataset.unshelf && D.FOLDER_IDS && D.FOLDER_IDS[el.dataset.unshelf] ? el.dataset.unshelf : null);
    return !!(name && D.FOLDER_IDS && D.FOLDER_IDS[name]);
  }

  function clearDropTargets() {
    document.querySelectorAll('.drop-target').forEach(function (n) {
      n.classList.remove('drop-target');
    });
  }

  function dropTargetAt(x, y, dragging) {
    var prev = dragging ? dragging.style.pointerEvents : '';
    if (dragging) dragging.style.pointerEvents = 'none';
    var el = document.elementFromPoint(x, y);
    if (dragging) dragging.style.pointerEvents = prev;
    if (!el) return null;

    var draggingName = dragging ? (dragging.dataset.open || dragging.dataset.unshelf || '') : '';

    /* 1. Desktop icon */
    var deskIcon = el.closest('#icons .icon');
    if (deskIcon && deskIcon !== dragging) {
      if (isTrashCan(deskIcon)) return { type: 'trash', el: deskIcon };
      var fName = deskIcon.dataset.open;
      if (fName && D.FOLDER_IDS && D.FOLDER_IDS[fName]) {
        if (draggingName && isFolderAncestor(draggingName, fName)) return null;
        return { type: 'folder', name: fName, el: deskIcon };
      }
    }

    /* 2. Folder item inside open window */
    var winItem = el.closest('.win .item');
    if (winItem && winItem !== dragging) {
      var itemFolder = winItem.dataset.open || (winItem.dataset.unshelf && D.FOLDER_IDS && D.FOLDER_IDS[winItem.dataset.unshelf] ? winItem.dataset.unshelf : null);
      if (itemFolder && D.FOLDER_IDS && D.FOLDER_IDS[itemFolder]) {
        if (draggingName && isFolderAncestor(draggingName, itemFolder)) return null;
        return { type: 'folder', name: itemFolder, el: winItem };
      }
    }

    /* 3. Open window */
    var win = el.closest('.win');
    if (win && D.open) {
      var name = null;
      Object.keys(D.open).forEach(function (k) {
        if (D.open[k] && D.open[k].el === win) name = k;
      });
      if (name === 'trash') return { type: 'trash', el: win };
      if (name && D.FOLDER_IDS && D.FOLDER_IDS[name]) {
        if (draggingName && isFolderAncestor(draggingName, name)) return null;
        return { type: 'folder', name: name, el: win };
      }
    }
    return null;
  }

  function highlightDropTarget(target) {
    clearDropTargets();
    if (target && target.el) target.el.classList.add('drop-target');
  }

  function readShelfMap() {
    try {
      var raw = localStorage.getItem(D.SHELF_KEY);
      var map = raw ? JSON.parse(raw) : {};
      return map && typeof map === 'object' ? map : {};
    } catch (err) { return {}; }
  }

  function writeShelfMap(map) {
    try { localStorage.setItem(D.SHELF_KEY, JSON.stringify(map)); } catch (err) {}
  }

  function saveShelfState() {
    if (!D.shelved) return;
    var map = {};
    Array.prototype.forEach.call(D.shelved.children, function (icon) {
      var folder = icon.dataset.shelf;
      var id = iconKey(icon);
      if (!folder || !id) return;
      if (!map[folder]) map[folder] = [];
      map[folder].push(id);
    });
    writeShelfMap(map);
  }

  function countShelved(folder) {
    if (!D.shelved || !folder) return 0;
    var count = 0;
    for (var i = 0; i < D.shelved.children.length; i++) {
      if (D.shelved.children[i].dataset.shelf === folder) count++;
    }
    return count;
  }

  function applyShelfState() {
    if (!D.shelved || !D.iconsHost) return;
    var raw = null;
    try { raw = localStorage.getItem(D.SHELF_KEY); } catch (e) {}
    if (raw === null) {
      /* First run: HTML markup defines initial shelf positions */
      return;
    }
    var map = readShelfMap();
    var targetShelfForId = {};
    Object.keys(map).forEach(function (folder) {
      if (!D.FOLDER_IDS[folder]) return;
      (map[folder] || []).forEach(function (id) {
        if (D.PINNED_IDS && D.PINNED_IDS[id]) return;
        targetShelfForId[id] = folder;
      });
    });

    var allIcons = Array.prototype.slice.call(D.iconsHost.children).concat(
      Array.prototype.slice.call(D.shelved.children)
    );

    allIcons.forEach(function (icon) {
      if (isTrashCan(icon)) return;
      var id = iconKey(icon);
      if (!id) return;
      var dest = targetShelfForId[id];
      if (dest) {
        icon.dataset.shelf = dest;
        if (icon.parentNode !== D.shelved) D.shelved.appendChild(icon);
      } else {
        if (icon.dataset.shelf) delete icon.dataset.shelf;
        if (icon.parentNode !== D.iconsHost) {
          D.iconsHost.appendChild(icon);
          if (!icon.dataset.dragBound) {
            dragIcon(icon);
            icon.dataset.dragBound = '1';
          }
        }
      }
    });
  }

  function refreshFolderWindow(name) {
    if (!name || !D.open[name]) return;
    var host = D.open[name].el.querySelector('#video-items') || D.open[name].el.querySelector('.items');
    if (!host) return;
    host.innerHTML = '';
    fillFolderShelf(host, name);
    var n = host.querySelectorAll('.item').length;
    var bar = D.open[name].el.querySelector('.infobar');
    if (bar && bar.firstElementChild) {
      bar.firstElementChild.textContent = n + ' item' + (n === 1 ? '' : 's');
    }
  }

  function fillFolderShelf(host, folderName) {
    if (!host || !D.shelved || !folderName) return;
    if (folderName === 'videos' || host.id === 'video-items') {
      host.style.gridTemplateColumns = 'repeat(auto-fill,minmax(190px,1fr))';
    }
    Array.prototype.forEach.call(D.shelved.children, function (icon) {
      if (icon.dataset.shelf !== folderName) return;
      var id = iconKey(icon);
      var art = icon.querySelector('.art');
      var b = D.el('<button class="item" type="button"><span class="label"></span></button>');
      b.dataset.unshelf = id;
      if (icon.dataset.open) b.dataset.open = icon.dataset.open;
      if (icon.dataset.href) b.dataset.href = icon.dataset.href;
      if (icon.dataset.video) b.dataset.video = icon.dataset.video;
      if (icon.dataset.tag) b.dataset.tag = icon.dataset.tag;

      if (folderName === 'videos' || host.id === 'video-items' || icon.dataset.video) {
        b.classList.add('video-item');
        var thumb = art ? art.querySelector('img') : null;
        var frame = D.el(
          '<div class="video-thumb-frame">' +
            '<span class="video-play-badge" aria-label="Play">' +
              '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>' +
            '</span>' +
          '</div>'
        );
        if (thumb) {
          var imgClone = thumb.cloneNode(true);
          imgClone.className = 'thumb';
          frame.insertBefore(imgClone, frame.firstChild);
        }
        b.insertBefore(frame, b.firstChild);
      } else if (art) {
        b.insertBefore(art.cloneNode(true), b.firstChild);
      }
      var labelText = (icon.dataset.video && D.YT_TITLES && D.YT_TITLES[icon.dataset.video]) || iconLabel(icon);
      if (icon.dataset.video && D.YT_TITLES && D.YT_TITLES[icon.dataset.video]) {
        var iconLbl = icon.querySelector('.label');
        if (iconLbl) iconLbl.textContent = labelText;
      }
      b.querySelector('.label').textContent = labelText;
      host.appendChild(b);
      bindShelfItemDrag(b, icon);
    });
  }

  function moveToFolder(icon, folderName) {
    if (!icon || !folderName || !D.shelved || !D.FOLDER_IDS[folderName]) return;
    if (isTrashCan(icon) || isPinned(icon)) return;
    if (icon.dataset.open === folderName) return;
    if (icon.dataset.open && isFolderAncestor(icon.dataset.open, folderName)) return;

    var prevFolder = icon.dataset.shelf;
    if (prevFolder === folderName) return;

    var winName = icon.dataset.open;
    if (winName && D.open[winName]) D.closeWindow(winName);

    icon.classList.remove('selected', 'dragging', 'drop-target');
    icon.dataset.shelf = folderName;
    D.shelved.appendChild(icon);

    saveShelfState();
    savePositions();

    if (prevFolder && prevFolder !== folderName) refreshFolderWindow(prevFolder);
    refreshFolderWindow(folderName);
    if (typeof D.beep === 'function') D.beep();
  }

  function unshelfToDesktop(icon, clientX, clientY) {
    if (!icon || !D.iconsHost || !D.desktop) return;
    var prevFolder = icon.dataset.shelf;
    delete icon.dataset.shelf;
    icon.classList.remove('selected', 'dragging', 'drop-target');
    D.iconsHost.appendChild(icon);
    if (!icon.dataset.dragBound) {
      dragIcon(icon);
      icon.dataset.dragBound = '1';
    }
    var desk = D.desktop.getBoundingClientRect();
    var iw = icon.offsetWidth || 80;
    var ih = icon.offsetHeight || 80;
    var x = (clientX != null ? clientX - desk.left : 40) - iw / 2;
    var y = (clientY != null ? clientY - desk.top : 40) - ih / 2;
    var maxX = Math.max(0, D.desktop.clientWidth - iw);
    var maxY = Math.max(0, D.desktop.clientHeight - ih);
    icon.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    icon.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    icon.setAttribute('data-scatter', '');
    saveShelfState();
    savePositions();
    if (prevFolder) refreshFolderWindow(prevFolder);
    if (typeof D.beep === 'function') D.beep();
  }

  function findShelvedIcon(id) {
    if (!D.shelved || !id) return null;
    var icon = D.shelved.querySelector('.icon[data-id="' + id + '"]')
      || D.shelved.querySelector('.icon[data-open="' + id + '"]');
    if (icon) return icon;
    for (var i = 0; i < D.shelved.children.length; i++) {
      if (iconLabel(D.shelved.children[i]) === id) return D.shelved.children[i];
    }
    return null;
  }

  function applyDrop(icon, target, clientX, clientY) {
    if (!icon || !target) return false;
    if (target.type === 'trash') {
      moveToTrash(icon);
      return true;
    }
    if (target.type === 'folder' && target.name) {
      moveToFolder(icon, target.name);
      return true;
    }
    return false;
  }

  function clearSel() {
    document.querySelectorAll('.icon.selected,.item.selected').forEach(function (n) {
      n.classList.remove('selected');
    });
  }

  function activate(node) {
    if (node.dataset.restore) return D.restoreFromTrash(node.dataset.restore);
    if (node.dataset.unshelf) {
      var shelved = findShelvedIcon(node.dataset.unshelf);
      if (shelved) return activate(shelved);
    }
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
      highlightDropTarget(dropTargetAt(e.clientX, e.clientY, icon));
    });
    function end(e) {
      if (!on) return;
      on = false;
      icon.classList.remove('dragging');
      try { icon.releasePointerCapture(e.pointerId); } catch (err) {}
      var target = moved ? dropTargetAt(e.clientX, e.clientY, icon) : null;
      clearDropTargets();
      if (moved) {
        icon.dataset.dragged = '1';
        if (isTrashCan(icon)) icon.dataset.moved = '1';
        if (!isTrashCan(icon) && applyDrop(icon, target, e.clientX, e.clientY)) {
          /* moved into trash or folder */
        } else {
          savePositions();
        }
      }
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { icon.addEventListener(t, end); });
  }

  function bindShelfItemDrag(itemBtn, icon) {
    if (!itemBtn || !icon || itemBtn.dataset.shelfDragBound) return;
    itemBtn.dataset.shelfDragBound = '1';
    var on = false, moved = false, sx, sy, ghost = null;
    itemBtn.addEventListener('pointerdown', function (e) {
      if (D.small() || e.button > 0) return;
      if (typeof D.hideMenus === 'function') D.hideMenus();
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      itemBtn.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });
    itemBtn.addEventListener('pointermove', function (e) {
      if (!on) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && dx * dx + dy * dy < 25) return;
      if (!moved) {
        moved = true;
        ghost = itemBtn.cloneNode(true);
        ghost.classList.add('shelf-drag');
        var gw = itemBtn.offsetWidth || 100;
        ghost.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;pointer-events:none;margin:0;width:' + gw + 'px';
        document.body.appendChild(ghost);
        itemBtn.style.opacity = '0.35';
      }
      ghost.style.transform = 'translate(' + (e.clientX - (itemBtn.offsetWidth || 100) / 2) + 'px,' + (e.clientY - 40) + 'px)';
      highlightDropTarget(dropTargetAt(e.clientX, e.clientY, ghost));
    });
    function end(e) {
      if (!on) return;
      on = false;
      try { itemBtn.releasePointerCapture(e.pointerId); } catch (err) {}
      itemBtn.style.opacity = '';
      var target = moved ? dropTargetAt(e.clientX, e.clientY, ghost) : null;
      clearDropTargets();
      if (ghost && ghost.parentNode) ghost.remove();
      ghost = null;
      if (!moved) {
        clearSel();
        itemBtn.classList.add('selected');
        itemBtn.dataset.justActivated = '1';
        setTimeout(function () { delete itemBtn.dataset.justActivated; }, 150);
        activate(itemBtn);
        return;
      }
      itemBtn.dataset.dragged = '1';
      var prevFolder = icon.dataset.shelf;
      if (target && target.type === 'trash') {
        moveToTrash(icon);
      } else if (target && target.type === 'folder' && target.name) {
        moveToFolder(icon, target.name);
      } else {
        /* drop on desktop / empty space → put back on desk */
        unshelfToDesktop(icon, e.clientX, e.clientY);
      }
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { itemBtn.addEventListener(t, end); });
  }

  function bindTrashItemDrag(itemBtn, icon) {
    if (!itemBtn || !icon || itemBtn.dataset.trashDragBound) return;
    itemBtn.dataset.trashDragBound = '1';
    var on = false, moved = false, sx, sy, ghost = null;
    itemBtn.addEventListener('pointerdown', function (e) {
      if (D.small() || e.button > 0) return;
      if (typeof D.hideMenus === 'function') D.hideMenus();
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      itemBtn.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });
    itemBtn.addEventListener('pointermove', function (e) {
      if (!on) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && dx * dx + dy * dy < 25) return;
      if (!moved) {
        moved = true;
        ghost = itemBtn.cloneNode(true);
        ghost.classList.add('shelf-drag');
        var gw = itemBtn.offsetWidth || 100;
        ghost.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;pointer-events:none;margin:0;width:' + gw + 'px';
        document.body.appendChild(ghost);
        itemBtn.style.opacity = '0.35';
      }
      ghost.style.transform = 'translate(' + (e.clientX - (itemBtn.offsetWidth || 100) / 2) + 'px,' + (e.clientY - 40) + 'px)';
      highlightDropTarget(dropTargetAt(e.clientX, e.clientY, ghost));
    });
    function end(e) {
      if (!on) return;
      on = false;
      try { itemBtn.releasePointerCapture(e.pointerId); } catch (err) {}
      itemBtn.style.opacity = '';
      var target = moved ? dropTargetAt(e.clientX, e.clientY, ghost) : null;
      clearDropTargets();
      if (ghost && ghost.parentNode) ghost.remove();
      ghost = null;
      var trashId = icon.dataset.trashId || itemBtn.dataset.restore;
      if (!moved) {
        if (trashId) restoreFromTrash(trashId);
        return;
      }
      itemBtn.dataset.dragged = '1';
      if (target && target.type === 'folder' && target.name) {
        if (trashId) restoreFromTrash(trashId);
        moveToFolder(icon, target.name);
      } else if (target && target.type === 'trash') {
        /* released in trash -> stays in trash */
      } else {
        /* dropped on desktop */
        if (trashId) restoreFromTrash(trashId, e.clientX, e.clientY);
      }
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { itemBtn.addEventListener(t, end); });
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
  D.countShelved = countShelved;
  D.fillFolderShelf = fillFolderShelf;
  D.moveToFolder = moveToFolder;
  D.unshelfToDesktop = unshelfToDesktop;
  D.isFolderAncestor = isFolderAncestor;
  D.refreshFolderWindow = refreshFolderWindow;
  D.downloadSticky = downloadSticky;
  D.removeSticky = removeSticky;
  D.hideStickyAlert = hideStickyAlert;
  D.askCloseSticky = askCloseSticky;

  D.initIcons = function () {
    ensureTrashOnDesktop();
    if (!D.shelved) D.shelved = document.getElementById('shelved');
    updateTrashAppearance();
    applyGoneState();
    applyShelfState();
    applyGoneState();
    document.querySelectorAll('#icons .icon').forEach(function (icon) {
      if (!icon.dataset.dragBound) {
        dragIcon(icon);
        icon.dataset.dragBound = '1';
      }
    });
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
