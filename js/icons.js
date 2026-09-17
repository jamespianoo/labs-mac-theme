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
    return isTrashProtected(icon);
  }

  function isTrashProtected(icon) {
    if (!icon || isTrashCan(icon)) return true;
    var id = icon.dataset.id || icon.dataset.open;
    return !!(id && D.NO_TRASH_IDS && D.NO_TRASH_IDS[id]);
  }

  function isDeskPinned(icon) {
    if (!icon || isTrashCan(icon)) return true;
    var id = icon.dataset.id || icon.dataset.open;
    if (id && D.DESK_PINNED_IDS && D.DESK_PINNED_IDS[id]) return true;
    return false;
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
    if (img) img.src = n ? 'img/icons/sys9-trash-full.png' : 'img/icons/sys9-trash-empty.png';
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
      var b = D.el('<button class="item" data-restore="' + id + '"><span class="label"></span><span class="putback-hint">Put Back</span></button>');
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
    if (!icon || isTrashProtected(icon) || !D.trashed) return;
    if (icon.classList.contains('renaming')) return;
    var winName = icon.dataset.open;
    var prevShelf = icon.dataset.shelf;
    if (winName && D.open[winName] && winName !== 'trash') D.closeWindow(winName);
    if (!icon.dataset.trashId) icon.dataset.trashId = String(++D.trashSeq);
    /* Remember where it came from so Put Back can restore it */
    icon.dataset.trashOrigin = prevShelf || 'desktop';
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
    /* Snapshot before protected folders bounce back onto the desk */
    var bare = deskIsBare();
    var count = 0;
    var names = [];
    var gone = readGone();
    var seeds = readClearedSeeds();
    items.forEach(function (icon) {
      if (icon.dataset.open && D.FOLDER_IDS && D.FOLDER_IDS[icon.dataset.open]) {
        /* Protect core site folders from permanent destruction */
        delete icon.dataset.trashId;
        delete icon.dataset.trashOrigin;
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
    /* Easter egg only when the desk was already bare (Trash alone) —
       emptying leftover seed files with icons still out does not count */
    if (count > 0 && bare) {
      if (window.JBField && typeof window.JBField.fireworks === 'function') {
        window.JBField.fireworks();
      }
      setTimeout(function () { showEgg(count, names); }, 720);
    }
  }

  function deskIsBare() {
    if (!D.iconsHost) return false;
    return !Array.prototype.some.call(D.iconsHost.children, function (icon) {
      return !isTrashCan(icon);
    });
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
    var origin = icon.dataset.trashOrigin || '';
    delete icon.dataset.trashId;
    delete icon.dataset.trashOrigin;
    delete icon.dataset.shelf;
    icon.classList.remove('selected', 'dragging');

    var putInFolder = origin && D.FOLDER_IDS && D.FOLDER_IDS[origin] && D.shelved
      && clientX == null && clientY == null;

    if (putInFolder) {
      /* Put Back to the folder it was deleted from */
      icon.dataset.shelf = origin;
      D.shelved.appendChild(icon);
      icon.style.left = '';
      icon.style.top = '';
      updateTrashAppearance();
      refreshTrashWindow();
      refreshFolderWindow(origin);
      saveShelfState();
      savePositions();
      if (typeof D.beep === 'function') D.beep();
      return;
    }

    /* Seeds / desktop origin / drag-out → desktop */
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

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function inferKind(target, label, isTrash, isFolder) {
    if (!target) return 'Desktop';
    if (isTrash) return 'Trash';
    if (isFolder) return 'Folder';
    if (/\.pdf$/i.test(label)) return 'PDF document';
    if (/\.png$/i.test(label) || (target.querySelector && target.querySelector('.pagefile'))) return 'PNG image';
    if (/\.html$/i.test(label)) return 'Web Application';
    if (/\.txt$/i.test(label)) return 'Text document';
    if (/\.aiff$/i.test(label)) return 'Sound';
    if (/\.app$/i.test(label)) return 'Application';
    if (/\.map$/i.test(label)) return 'Map document';
    if (target.dataset && target.dataset.video) return 'YouTube Video';
    return 'Document';
  }

  function resolveTaxonomy(target) {
    if (!target) {
      return {
        title: 'Desktop',
        kind: 'Desktop',
        where: 'Macintosh HD',
        description: 'The System 7 / Platinum desktop workspace.'
      };
    }

    var isSticky = target && target.nodeType === 1 && (target.classList.contains('sticky') || target.hasAttribute('data-sticky'));
    if (isSticky) {
      var noteId = (target.dataset && target.dataset.id) || 'welcome-note';
      var noteTax = (D.TAXONOMY && D.TAXONOMY.notes && (D.TAXONOMY.notes[noteId] || D.TAXONOMY.notes['welcome-note'])) || null;
      var title = (noteTax && noteTax.title) || stickyFileName(target) || 'Sticky Note';
      var desc = (noteTax && noteTax.description) || stickyPlainText(target) || 'Desktop sticky note.';
      return {
        id: noteId,
        title: title,
        kind: (noteTax && noteTax.kind) || 'Sticky Note',
        where: (noteTax && noteTax.where) || 'Desktop',
        description: desc,
        author: (noteTax && noteTax.author) || null,
        credit: (noteTax && noteTax.credit) || null,
        isSticky: true
      };
    }

    var rawId = target.dataset ? (target.dataset.id || target.dataset.unshelf || target.dataset.open || target.dataset.video || '') : '';
    var label = (target && target.nodeType === 1) ? (iconLabel(target) || (target.querySelector('.label') ? target.querySelector('.label').textContent.trim() : '')) : (typeof target === 'string' ? target : '');
    var openName = target.dataset ? target.dataset.open : '';
    var isFolder = !!(openName && D.FOLDER_IDS && D.FOLDER_IDS[openName]) || !!(rawId && D.FOLDER_IDS && D.FOLDER_IDS[rawId]);
    var isTrash = isTrashCan(target) || rawId === 'trash';

    var tax = null;
    var taxData = D.TAXONOMY;
    if (taxData) {
      if (isTrash && taxData.folders && taxData.folders.trash) {
        tax = taxData.folders.trash;
      } else if (isFolder && taxData.folders && (taxData.folders[openName] || taxData.folders[rawId])) {
        tax = taxData.folders[openName] || taxData.folders[rawId];
      } else if (taxData.files && taxData.files[rawId]) {
        tax = taxData.files[rawId];
      }

      if (!tax) {
        var query = [rawId, openName, label, label.replace(/\.(html|png|pdf|me|txt|aiff)$/i, '')].filter(Boolean);
        var categories = isFolder ? ['folders', 'files', 'notes'] : ['files', 'folders', 'notes'];
        for (var c = 0; c < categories.length && !tax; c++) {
          var catObj = taxData[categories[c]];
          if (!catObj) continue;
          for (var k in catObj) {
            if (!catObj.hasOwnProperty(k)) continue;
            var item = catObj[k];
            if (item.id === rawId || item.title === label) {
              tax = item;
              break;
            }
            if (item.aliases) {
              for (var a = 0; a < item.aliases.length; a++) {
                var alias = item.aliases[a];
                for (var q = 0; q < query.length; q++) {
                  if (alias.toLowerCase() === query[q].toLowerCase()) {
                    tax = item;
                    break;
                  }
                }
                if (tax) break;
              }
            }
            if (tax) break;
          }
        }
      }
    }

    if (!tax && /se10/i.test(label + ' ' + rawId)) {
      tax = taxData && taxData.files && taxData.files.se10;
    }
    if (!tax && /promo/i.test(label + ' ' + rawId)) {
      tax = taxData && taxData.files && taxData.files.promo;
    }

    var kind = (tax && tax.kind) || inferKind(target, label, isTrash, isFolder);

    var shelf = target.dataset ? target.dataset.shelf : null;
    var where = (tax && tax.where) || (shelf ? (shelf.charAt(0).toUpperCase() + shelf.slice(1)) : (target.parentNode === D.trashed ? 'Trash' : 'Desktop'));

    var title = (tax && tax.title) || label || rawId || 'Item';
    var desc = (tax && tax.description) || (isFolder ? 'Folder stored on the system.' : 'Item stored on the system.');
    var credit = (tax && tax.credit) || null;

    return {
      id: (tax && tax.id) || rawId,
      title: title,
      kind: kind,
      where: where,
      description: desc,
      credit: credit,
      author: (tax && tax.author) || null,
      isFolder: isFolder,
      isTrash: isTrash
    };
  }

  function getInfo(target) {
    if (target && target.dataset && target.dataset.restore && D.trashed) {
      var fromTrash = D.trashed.querySelector('[data-trash-id="' + target.dataset.restore + '"]');
      if (fromTrash) target = fromTrash;
    }
    var tax = resolveTaxonomy(target);
    var name = tax.title;
    var kind = tax.kind;
    var where = tax.where;
    var id = 'info-' + Date.now();

    var artHtml = '';
    if (tax.isSticky) {
      artHtml = '<svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1" fill="#f6e59a" stroke="#16171a" stroke-width="1.5"/><line x1="6" y1="8" x2="18" y2="8" stroke="#16171a" stroke-width="1.2"/><line x1="6" y1="12" x2="16" y2="12" stroke="#16171a" stroke-width="1.2"/><line x1="6" y1="16" x2="13" y2="16" stroke="#16171a" stroke-width="1.2"/></svg>';
    } else if (target && target.querySelector && target.querySelector('.art')) {
      artHtml = target.querySelector('.art').innerHTML;
    } else if (tax.isFolder || (target && target.dataset && D.FOLDER_IDS && D.FOLDER_IDS[target.dataset.open])) {
      artHtml = '<img src="img/icons/sys9-folder.png" width="44" height="44" alt="">';
    } else {
      artHtml = '<img src="img/icons/document.webp" width="44" height="44" alt="">';
    }

    var contentsRow = '';
    if (tax.isFolder) {
      var folderKey = (target && (target.dataset.id || target.dataset.open)) || tax.id;
      var count = 0;
      if (folderKey && typeof countShelved === 'function') {
        count = countShelved(folderKey);
      } else if (tax.id === 'trash' && D.trashed) {
        count = D.trashed.children.length;
      }
      contentsRow = '<dt>Contents:</dt><dd>' + count + ' item' + (count === 1 ? '' : 's') + '</dd>';
    }

    var creditRow = '';
    if (tax.credit) {
      var creditUrl = tax.credit.url || '';
      var creditText = tax.credit.text || tax.credit.author || 'Credit';
      if (creditUrl) {
        creditRow = '<dt>Credit:</dt><dd class="info-credit"><a href="' + escapeAttr(creditUrl) + '" target="_blank" rel="noopener">' + escapeHtml(creditText) + ' &nearr;</a></dd>';
      } else {
        creditRow = '<dt>Credit:</dt><dd class="info-credit">' + escapeHtml(creditText) + '</dd>';
      }
    } else if (tax.author) {
      creditRow = '<dt>Author:</dt><dd>' + escapeHtml(tax.author) + '</dd>';
    }

    var tpl = document.createElement('template');
    tpl.id = 'tpl-' + id;
    tpl.dataset.title = name + ' Info';
    tpl.dataset.w = '420';
    tpl.dataset.h = '350';
    tpl.dataset.info = 'Info|' + kind;
    tpl.innerHTML =
      '<div class="doc info-doc">' +
        '<div class="info-header">' +
          '<div class="info-art">' + artHtml + '</div>' +
          '<div class="info-title-wrap">' +
            '<h2 class="info-title">' + escapeHtml(name) + '</h2>' +
            '<span class="info-badge">' + escapeHtml(kind) + '</span>' +
          '</div>' +
        '</div>' +
        '<dl class="info-props">' +
          '<dt>Kind:</dt><dd>' + escapeHtml(kind) + '</dd>' +
          '<dt>Where:</dt><dd>' + escapeHtml(where) + '</dd>' +
          contentsRow +
          creditRow +
        '</dl>' +
        '<div class="info-desc-section">' +
          '<div class="info-desc-label">Description:</div>' +
          '<div class="info-desc-box"><p>' + escapeHtml(tax.description) + '</p></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(tpl);
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
      clampIconToDesk(icon);
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

  var liveWordmarkZone = null;
  var composeOnceOnWordmark = false;

  function wordmarkZone(W, H) {
    if (liveWordmarkZone) {
      return {
        x0: Math.max(0, liveWordmarkZone.x0),
        x1: Math.min(W, liveWordmarkZone.x1),
        y0: Math.max(0, liveWordmarkZone.y0),
        y1: Math.min(H, liveWordmarkZone.y1)
      };
    }
    /* Keep clear of the centred JAMES BECKWITH + subtitle pixel wordmark */
    return {
      x0: W * 0.16,
      x1: W * 0.84,
      y0: H * 0.28,
      y1: H * 0.58
    };
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  /* Real desk footprint — promo is ~3× a normal icon; using 128×148 for
     everything lets it run off the edge and sit on top of neighbours. */
  function iconSize(icon) {
    if (!icon) return { w: 128, h: 148 };
    var w = icon.offsetWidth;
    var h = icon.offsetHeight;
    if (w >= 8 && h >= 8) return { w: w, h: h };
    if (icon.dataset.id === 'promo' || icon.dataset.open === 'promo') return { w: 300, h: 330 };
    return { w: 128, h: 148 };
  }

  function overlapsPlaced(x, y, iw, ih, placed, gap) {
    gap = gap == null ? 12 : gap;
    var i, p, pw, ph;
    for (i = 0; i < placed.length; i++) {
      p = placed[i];
      pw = p.w || 128;
      ph = p.h || 148;
      if (x + iw + gap > p.x && x < p.x + pw + gap &&
          y + ih + gap > p.y && y < p.y + ph + gap) return true;
    }
    return false;
  }

  function clampIconToDesk(icon) {
    if (!D.desktop || !icon || D.small()) return;
    var size = iconSize(icon);
    var pad = 8;
    var maxX = Math.max(pad, D.desktop.clientWidth - size.w - pad);
    var maxY = Math.max(pad, D.desktop.clientHeight - size.h - pad);
    var x = parseInt(icon.style.left, 10);
    var y = parseInt(icon.style.top, 10);
    if (!isFinite(x)) x = pad;
    if (!isFinite(y)) y = pad;
    icon.style.left = clamp(x, pad, maxX) + 'px';
    icon.style.top = clamp(y, pad, maxY) + 'px';
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
    var x, y, t, spot;
    function blocked(px, py) {
      if (avoidWordmark && px + iw > zone.x0 && px < zone.x1 && py + ih > zone.y0 && py < zone.y1) return true;
      if (overlapsAnySticky(px, py, iw, ih, stickies)) return true;
      if (overlapsPlaced(px, py, iw, ih, placed)) return true;
      return false;
    }
    for (t = 0; t < 160; t++) {
      spot = preferMid ? sampleMidSpot(W, H, iw, ih, zone) : sampleEdgeSpot(W, H, iw, ih);
      x = spot.x; y = spot.y;
      if (!blocked(x, y)) return { x: x, y: y };
    }
    /* fallback: any clear spot on the desk */
    for (t = 0; t < 100; t++) {
      x = pad + Math.floor(Math.random() * Math.max(1, W - iw - pad * 2));
      y = pad + Math.floor(Math.random() * Math.max(1, H - ih - pad * 2));
      if (!blocked(x, y)) return { x: x, y: y };
    }
    var dx = Math.max(48, Math.floor(iw * 0.45));
    var dy = Math.max(48, Math.floor(ih * 0.45));
    for (y = pad; y <= H - ih - pad; y += dy) {
      for (x = pad; x <= W - iw - pad; x += dx) {
        if (!blocked(x, y)) return { x: x, y: y };
      }
    }
    return {
      x: pad,
      y: pad
    };
  }

  function collectPlaced(except) {
    var placed = [];
    if (!D.iconsHost) return placed;
    D.iconsHost.querySelectorAll('.icon').forEach(function (icon) {
      if (icon === except) return;
      if (!icon.style.left && !icon.style.top) return;
      var size = iconSize(icon);
      placed.push({
        x: parseInt(icon.style.left, 10) || 0,
        y: parseInt(icon.style.top, 10) || 0,
        w: size.w,
        h: size.h
      });
    });
    return placed;
  }

  function resolveIconOverlaps() {
    if (D.small() || !D.iconsHost) return;
    var stickies = stickyRects();
    var moved = false;
    /* Largest first so promo claims a clear seat, then others move around it */
    var list = Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon:not(.trash)'));
    list.sort(function (a, b) {
      var sa = iconSize(a), sb = iconSize(b);
      return (sb.w * sb.h) - (sa.w * sa.h);
    });
    var placed = [];
    list.forEach(function (icon) {
      clampIconToDesk(icon);
      var size = iconSize(icon);
      var x = parseInt(icon.style.left, 10) || 0;
      var y = parseInt(icon.style.top, 10) || 0;
      var bad = overlapsAnySticky(x, y, size.w, size.h, stickies) ||
        overlapsPlaced(x, y, size.w, size.h, placed);
      if (bad) {
        var spot = findClearSpot(size.w, size.h, placed, stickies, true, icon.dataset.id !== 'promo');
        icon.style.left = spot.x + 'px';
        icon.style.top = spot.y + 'px';
        clampIconToDesk(icon);
        x = parseInt(icon.style.left, 10) || spot.x;
        y = parseInt(icon.style.top, 10) || spot.y;
        moved = true;
      }
      placed.push({ x: x, y: y, w: size.w, h: size.h });
    });
    if (D.trashIcon && !D.trashIcon.dataset.moved) placeTrashCorner();
    if (moved) savePositions();
  }

  /* Core desk composition — same format as phone/tablet:
     folders across the top, wordmark in the middle, promo + files below.
     Absolute coords so drag / marquee / Clean Up keep working. */
  var STACK_CORE = { projects: 1, music: 1, videos: 1, promo: 1, about: 1, contact: 1 };

  function composeStackedLayout() {
    if (D.small() || !D.iconsHost || !D.desktop) return;
    if (!liveWordmarkZone) composeOnceOnWordmark = true;
    var W = D.desktop.clientWidth;
    var H = D.desktop.clientHeight;
    var zone = wordmarkZone(W, H);
    var pad = Math.max(20, Math.round(W * 0.05));
    var contentW = Math.min(W - pad * 2, Math.max(520, Math.round(W * 0.68)));
    var contentLeft = Math.round((W - contentW) / 2);
    var colW = contentW / 3;
    var gap = Math.max(14, Math.round(H * 0.018));

    function byId(id) {
      return D.iconsHost.querySelector('.icon[data-id="' + id + '"]');
    }
    function place(icon, x, y) {
      if (!icon || isTrashCan(icon)) return;
      icon.style.left = Math.round(x) + 'px';
      icon.style.top = Math.round(y) + 'px';
      clampIconToDesk(icon);
    }
    function centerInCol(icon, col, y) {
      if (!icon) return;
      var size = iconSize(icon);
      var x = contentLeft + col * colW + (colW - size.w) / 2;
      place(icon, x, y);
    }

    var folders = [byId('projects'), byId('music'), byId('videos')].filter(Boolean);
    var folderH = folders.length ? iconSize(folders[0]).h : 148;
    var topY = clamp(Math.round(zone.y0 - folderH - gap), pad, Math.max(pad, H - folderH - pad));
    folders.forEach(function (icon, i) { centerInCol(icon, i, topY); });

    var promo = byId('promo');
    var about = byId('about');
    var contact = byId('contact');
    var promoSize = promo ? iconSize(promo) : { w: 300, h: 330 };
    var aboutSize = about ? iconSize(about) : { w: 128, h: 148 };
    var contactSize = contact ? iconSize(contact) : { w: 128, h: 148 };
    var fileGapX = Math.max(44, Math.round(colW * 0.30));
    var bottomBlockH = Math.max(promoSize.h, aboutSize.h, contactSize.h);
    var bottomY = clamp(Math.round(zone.y1 + gap), pad, Math.max(pad, H - bottomBlockH - pad));

    /* Promo nudged left; about + contact share one row to its right */
    var promoX = contentLeft - Math.round(colW * 0.18);
    promoX = clamp(promoX, pad, Math.max(pad, W - promoSize.w - pad));
    if (promo) place(promo, promoX, bottomY);

    var filesY = bottomY + Math.max(0, Math.round((promoSize.h - aboutSize.h) / 2));
    var filesX = (promo ? promoX + promoSize.w : contentLeft) + Math.max(108, Math.round(colW * 0.82));
    if (about) place(about, filesX, filesY);
    if (contact) place(contact, filesX + aboutSize.w + fileGapX, filesY);

    if (D.trashIcon && !D.trashIcon.dataset.moved) placeTrashCorner();
  }

  function placeExtraIcons(list) {
    if (!list || !list.length) return;
    var stickies = stickyRects();
    var placed = collectPlaced();
    list.sort(function (a, b) {
      var sa = iconSize(a), sb = iconSize(b);
      return (sb.w * sb.h) - (sa.w * sa.h);
    });
    list.forEach(function (icon) {
      var size = iconSize(icon);
      var spot = findClearSpot(size.w, size.h, placed, stickies, true, icon.dataset.id !== 'promo');
      icon.style.left = spot.x + 'px';
      icon.style.top = spot.y + 'px';
      clampIconToDesk(icon);
      placed.push({
        x: parseInt(icon.style.left, 10) || spot.x,
        y: parseInt(icon.style.top, 10) || spot.y,
        w: size.w,
        h: size.h
      });
    });
  }

  function scatterIcons(force) {
    if (D.small() || !D.iconsHost) return;
    if (!force) {
      var saved = readPositions();
      if (saved) {
        var result = applySavedPositions(saved);
        if (result.applied > 0) {
          if (result.missing.length) {
            placeExtraIcons(result.missing);
            savePositions();
          }
          if (D.trashIcon && !D.trashIcon.dataset.moved) placeTrashCorner();
          resolveStickyOverlaps();
          resolveIconOverlaps();
          return;
        }
      }
    }
    composeStackedLayout();
    var extras = Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon[data-scatter]')).filter(function (icon) {
      return !STACK_CORE[icon.dataset.id];
    });
    placeExtraIcons(extras);
    placeTrashCorner();
    resolveIconOverlaps();
    savePositions();
  }

  function resolveStickyOverlaps() {
    if (D.small() || !D.iconsHost) return;
    var stickies = stickyRects();
    if (!stickies.length) return;
    var placed = [];
    var moved = false;
    var list = Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon:not(.trash)'));
    list.sort(function (a, b) {
      var sa = iconSize(a), sb = iconSize(b);
      return (sb.w * sb.h) - (sa.w * sa.h);
    });
    list.forEach(function (icon) {
      var size = iconSize(icon);
      var x = parseInt(icon.style.left, 10) || 0;
      var y = parseInt(icon.style.top, 10) || 0;
      var hitSticky = overlapsAnySticky(x, y, size.w, size.h, stickies);
      var hitIcon = overlapsPlaced(x, y, size.w, size.h, placed);
      if (hitSticky || hitIcon) {
        var spot = findClearSpot(size.w, size.h, placed, stickies, true, icon.dataset.id !== 'promo');
        icon.style.left = spot.x + 'px';
        icon.style.top = spot.y + 'px';
        clampIconToDesk(icon);
        x = parseInt(icon.style.left, 10) || spot.x;
        y = parseInt(icon.style.top, 10) || spot.y;
        moved = true;
      }
      placed.push({ x: x, y: y, w: size.w, h: size.h });
    });
    if (moved) savePositions();
  }

  function arrangeIcons(mode) {
    var list = Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon:not(.trash)'));
    var stickies = stickyRects();
    var placed = [];
    var W = D.desktop.clientWidth, H = D.desktop.clientHeight;
    var zone = wordmarkZone(W, H);
    var pad = 12;
    var defaultW = 128, defaultH = 148;

    /* Arrange by Name: one centred row just above the JAMES BECKWITH wordmark */
    if (mode === 'name') {
      list.sort(function (a, b) { return iconLabel(a).localeCompare(iconLabel(b)); });
      var n = list.length;
      var cellW = 134;
      var maxSpan = Math.max(defaultW, W - pad * 2);
      if (n > 1) {
        cellW = Math.min(cellW, Math.floor((maxSpan - defaultW) / (n - 1)));
        cellW = Math.max(96, cellW);
      }
      var span = n > 0 ? (n - 1) * cellW + defaultW : 0;
      var startX = Math.round((W - span) / 2);
      startX = clamp(startX, pad, Math.max(pad, W - span - pad));
      var rowY = Math.round(zone.y0 - defaultH - 10);
      rowY = clamp(rowY, pad, Math.max(pad, H - defaultH - pad));
      list.forEach(function (icon, i) {
        var size = iconSize(icon);
        var x = startX + i * cellW;
        var y = rowY;
        if (overlapsAnySticky(x, y, size.w, size.h, stickies) ||
            overlapsPlaced(x, y, size.w, size.h, placed) ||
            size.w > defaultW * 1.4) {
          var spot = findClearSpot(size.w, size.h, placed, stickies, true, icon.dataset.id !== 'promo');
          x = spot.x; y = spot.y;
        }
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';
        clampIconToDesk(icon);
        placed.push({
          x: parseInt(icon.style.left, 10) || x,
          y: parseInt(icon.style.top, 10) || y,
          w: size.w,
          h: size.h
        });
      });
      placeTrashCorner();
      if (D.trashIcon) delete D.trashIcon.dataset.moved;
      savePositions();
      return;
    }

    /* Clean Up: restore stacked phone/tablet composition; park extras around it */
    composeStackedLayout();
    var extras = list.filter(function (icon) { return !STACK_CORE[icon.dataset.id]; });
    placeExtraIcons(extras);
    placeTrashCorner();
    if (D.trashIcon) delete D.trashIcon.dataset.moved;
    resolveIconOverlaps();
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
    return !!(name && canDropIntoFolder(name));
  }

  function canDropIntoFolder(folderName) {
    if (!folderName || !D.FOLDER_IDS || !D.FOLDER_IDS[folderName]) return false;
    if (D.HIDDEN_IDS && D.HIDDEN_IDS[folderName]) return false;
    /* Labs stays curated on the wide desktop — no drag-in from desk or other folders */
    if (!D.small() && folderName === 'labs') return false;
    return true;
  }

  var DRAG_Z = 10000;

  function dragLiftZ(el) {
    if (el) el.style.zIndex = String(DRAG_Z);
  }

  function dragRestoreZ(el) {
    if (el) el.style.zIndex = '';
  }

  function deskIconCoords(icon) {
    if (!icon || !D.desktop) return { ox: 0, oy: 0 };
    var desk = D.desktop.getBoundingClientRect();
    var rect = icon.getBoundingClientRect();
    return {
      ox: rect.left - desk.left,
      oy: rect.top - desk.top
    };
  }

  function liftDeskIconForDrag(icon) {
    if (!icon || !D.desktop) return deskIconCoords(icon);
    var coords = deskIconCoords(icon);
    if (icon.parentNode !== D.desktop) D.desktop.appendChild(icon);
    icon.style.left = coords.ox + 'px';
    icon.style.top = coords.oy + 'px';
    dragLiftZ(icon);
    return coords;
  }

  function restoreDeskIconHost(icon) {
    if (!icon || !D.iconsHost) return;
    if (D.trashed && D.trashed.contains(icon)) return;
    if (D.shelved && D.shelved.contains(icon)) return;
    var left = parseInt(icon.style.left, 10) || 0;
    var top = parseInt(icon.style.top, 10) || 0;
    if (icon.parentNode !== D.iconsHost) D.iconsHost.appendChild(icon);
    icon.style.left = left + 'px';
    icon.style.top = top + 'px';
    dragRestoreZ(icon);
  }

  function dragProbeEls(dragging) {
    var els = [];
    if (dragging) els.push(dragging);
    document.querySelectorAll('#icons .icon.dragging, #desktop > .icon.dragging, .win .item.dragging').forEach(function (n) {
      if (els.indexOf(n) === -1) els.push(n);
    });
    return els;
  }

  function isDragParticipant(el, dragEls) {
    if (!el || !dragEls.length) return false;
    for (var i = 0; i < dragEls.length; i++) {
      if (el === dragEls[i] || dragEls[i].contains(el) || el.contains(dragEls[i])) return true;
    }
    return false;
  }

  function dragContextName(el) {
    if (!el || !el.dataset) return '';
    if (el.classList.contains('item') && el.dataset.unshelf) {
      var shelved = findShelvedIcon(el.dataset.unshelf);
      if (shelved && shelved.dataset.open) return shelved.dataset.open;
    }
    if (el.dataset.open) return el.dataset.open;
    if (el.dataset.id && D.FOLDER_IDS && D.FOLDER_IDS[el.dataset.id]) return el.dataset.id;
    if (el.dataset.unshelf) return el.dataset.unshelf;
    return el.dataset.id || '';
  }

  function folderNameFromDeskIcon(icon) {
    if (!icon) return null;
    var name = icon.dataset.open || icon.dataset.id;
    return (name && canDropIntoFolder(name)) ? name : null;
  }

  function isTrashDragSource(el) {
    if (!el) return false;
    if (isTrashCan(el)) return true;
    if (el.classList && el.classList.contains('item') && el.dataset.restore) return true;
    if (el.dataset && el.dataset.unshelf) {
      var ic = findShelvedIcon(el.dataset.unshelf);
      if (ic && D.trashed && D.trashed.contains(ic)) return true;
    }
    return false;
  }

  function isTrashDrag(dragEls) {
    for (var i = 0; i < dragEls.length; i++) {
      if (isTrashDragSource(dragEls[i])) return true;
    }
    return false;
  }

  function createShelfGhost(sourceEl) {
    var ghost = sourceEl.cloneNode(true);
    ghost.classList.add('shelf-drag');
    var rect = sourceEl.getBoundingClientRect();
    var cs = window.getComputedStyle(sourceEl);
    var iconSize = cs.getPropertyValue('--icon-size').trim() || '80px';
    ghost.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'z-index:' + DRAG_Z,
      'pointer-events:none',
      'margin:0',
      'box-sizing:border-box',
      'width:' + Math.round(rect.width) + 'px',
      'height:' + Math.round(rect.height) + 'px',
      '--icon-size:' + iconSize
    ].join(';');
    document.body.appendChild(ghost);
    return ghost;
  }

  function positionShelfGhost(ghost, sourceEl, clientX, clientY) {
    var rect = sourceEl.getBoundingClientRect();
    ghost.style.transform = 'translate(' +
      (clientX - rect.width / 2) + 'px,' +
      (clientY - rect.height / 2) + 'px)';
  }

  function clearDropTargets() {
    document.querySelectorAll('.drop-target').forEach(function (n) {
      n.classList.remove('drop-target');
    });
  }

  function dropTargetAt(x, y, dragging) {
    var dragEls = dragProbeEls(dragging);
    var hidden = dragEls.map(function (el) {
      return { el: el, prev: el.style.pointerEvents };
    });
    document.querySelectorAll('.shelf-drag').forEach(function (g) {
      hidden.push({ el: g, prev: g.style.pointerEvents || 'none' });
    });
    hidden.forEach(function (h) { h.el.style.pointerEvents = 'none'; });
    var el = document.elementFromPoint(x, y);
    hidden.forEach(function (h) { h.el.style.pointerEvents = h.prev; });
    if (!el) return null;

    var draggingName = dragging ? dragContextName(dragging) : '';
    var trashDrag = isTrashDrag(dragEls);

    /* 1. Desktop icon */
    var deskIcon = el.closest('#icons .icon') || el.closest('#desktop > .icon');
    if (deskIcon && !isDragParticipant(deskIcon, dragEls)) {
      if (isTrashCan(deskIcon)) return { type: 'trash', el: deskIcon };
      var fName = folderNameFromDeskIcon(deskIcon);
      if (fName && !trashDrag) {
        if (draggingName && isFolderAncestor(draggingName, fName)) return null;
        if (draggingName && isFolderAncestor(fName, draggingName)) return null;
        return { type: 'folder', name: fName, el: deskIcon };
      }
    }

    /* 2. Folder item inside open window */
    var winItem = el.closest('.win .item');
    if (winItem && !isDragParticipant(winItem, dragEls)) {
      var itemFolder = winItem.dataset.open || (winItem.dataset.unshelf && D.FOLDER_IDS && D.FOLDER_IDS[winItem.dataset.unshelf] ? winItem.dataset.unshelf : null);
      if (itemFolder && canDropIntoFolder(itemFolder) && !trashDrag) {
        if (draggingName && isFolderAncestor(draggingName, itemFolder)) return null;
        if (draggingName && isFolderAncestor(itemFolder, draggingName)) return null;
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
      if (name && canDropIntoFolder(name) && !trashDrag) {
        if (draggingName && isFolderAncestor(draggingName, name)) return null;
        if (draggingName && isFolderAncestor(name, draggingName)) return null;
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
        if (D.DESK_PINNED_IDS && D.DESK_PINNED_IDS[id]) return;
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
    if (name === 'labs') {
      applyLabsGate(D.open[name].el);
      return;
    }
    var host = D.open[name].el.querySelector('#video-items') || D.open[name].el.querySelector('.items');
    if (!host) return;
    host.innerHTML = '';
    fillFolderShelf(host, name);
    var n = host.querySelectorAll('.item').length;
    var bar = D.open[name].el.querySelector('.infobar');
    if (bar && bar.firstElementChild) {
      bar.firstElementChild.textContent = n + ' item' + (n === 1 ? '' : 's');
    }
    if (!D.small()) layoutFolderWindow(D.open[name].el, name);
    if (typeof D.updateScrollbars === 'function') {
      D.updateScrollbars(D.open[name].el);
    }
  }

  var LABS_ACCESS_KEY = 'jb-labs-access';
  var LABS_TUBE_ID = 'item-tube-symphony-lab';

  function getLabsAccess() {
    try {
      var v = sessionStorage.getItem(LABS_ACCESS_KEY);
      return v === 'all' || v === 'tube' ? v : '';
    } catch (err) {
      return '';
    }
  }

  function setLabsAccess(level) {
    try {
      if (level === 'all' || level === 'tube') sessionStorage.setItem(LABS_ACCESS_KEY, level);
      else sessionStorage.removeItem(LABS_ACCESS_KEY);
    } catch (err) {}
  }

  function checkLabsCreds(user, pass) {
    user = String(user || '').trim();
    pass = String(pass || '');
    if (user === 'jamespianoo11' && pass === 'San@ndreas!69') return 'all';
    if (user === 'h0l0deck' && pass === 'h0l0deck') return 'tube';
    return '';
  }

  function labsIconAllowed(icon, level) {
    if (!icon || !level) return false;
    if (level === 'all') return true;
    if (level === 'tube') return icon.dataset.id === LABS_TUBE_ID;
    return false;
  }

  function updateLabsInfobar(frame, level, count) {
    if (!frame) return;
    var bar = frame.querySelector('.infobar');
    if (!bar) return;
    var left = bar.firstElementChild;
    var mid = bar.querySelector('.mid') || bar.children[1];
    if (left) {
      if (!level) left.textContent = 'Locked';
      else left.textContent = count + ' item' + (count === 1 ? '' : 's');
    }
    if (mid) {
      mid.textContent = !level ? 'Enter password' : (level === 'tube' ? 'Guest access' : 'Experiments');
    }
  }

  function bindLabsLogin(frame) {
    if (!frame || frame._labsLoginBound) return;
    var form = frame.querySelector('[data-labs-login]');
    if (!form) return;
    frame._labsLoginBound = true;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var user = form.querySelector('[name=user]');
      var pass = form.querySelector('[name=pass]');
      var err = frame.querySelector('[data-labs-err]');
      var level = checkLabsCreds(user && user.value, pass && pass.value);
      if (!level) {
        if (err) err.hidden = false;
        if (pass) { pass.value = ''; pass.focus(); }
        if (typeof D.beep === 'function') D.beep();
        return;
      }
      if (err) err.hidden = true;
      setLabsAccess(level);
      applyLabsGate(frame, { justUnlocked: true });
      if (typeof D.beep === 'function') D.beep();
    });
  }

  function applyLabsGate(frame, opts) {
    opts = opts || {};
    if (!frame) return;
    var level = getLabsAccess();
    var gate = frame.querySelector('[data-labs-gate]');
    var items = frame.querySelector('[data-labs-items]') || frame.querySelector('.items');
    bindLabsLogin(frame);

    if (!level) {
      if (gate) gate.hidden = false;
      if (items) {
        items.hidden = true;
        items.innerHTML = '';
      }
      updateLabsInfobar(frame, '', 0);
      var user = frame.querySelector('#labs-user');
      if (user && opts.focus !== false) {
        setTimeout(function () { try { user.focus(); } catch (err) {} }, 40);
      }
      if (typeof D.updateScrollbars === 'function') D.updateScrollbars(frame);
      return;
    }

    if (gate) gate.hidden = true;
    if (items) {
      items.hidden = false;
      items.innerHTML = '';
      fillFolderShelf(items, 'labs');
    }
    var n = items ? items.querySelectorAll('.item').length : 0;
    updateLabsInfobar(frame, level, n);

    if (opts.justUnlocked && !D.small() && D.desktop) {
      var tpl = document.getElementById('tpl-labs');
      var w = Math.min(parseInt((tpl && tpl.dataset.w) || '680', 10), D.desktop.clientWidth - 40);
      var h = Math.min(parseInt((tpl && tpl.dataset.h) || '460', 10), D.desktop.clientHeight - 40);
      frame.style.width = w + 'px';
      frame.style.height = h + 'px';
      var maxX = Math.max(8, D.desktop.clientWidth - w - 8);
      var maxY = Math.max(8, D.desktop.clientHeight - h - 8);
      frame.style.left = Math.max(8, Math.min(frame.offsetLeft, maxX)) + 'px';
      frame.style.top = Math.max(8, Math.min(frame.offsetTop, maxY)) + 'px';
    }
    if (!D.small()) layoutFolderWindow(frame, 'labs');
    if (typeof D.updateScrollbars === 'function') D.updateScrollbars(frame);
  }

  function readWinPositions() {
    try {
      var raw = localStorage.getItem(D.WIN_POS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) { return {}; }
  }

  function writeWinPositions(map) {
    try { localStorage.setItem(D.WIN_POS_KEY, JSON.stringify(map)); } catch (err) {}
  }

  function winItemSize(item) {
    if (!item) return { w: 128, h: 148 };
    var w = item.offsetWidth;
    var h = item.offsetHeight;
    if (w >= 8 && h >= 8) return { w: w, h: h };
    if (item.classList.contains('video-item')) return { w: 190, h: 175 };
    return { w: 128, h: 148 };
  }

  function clampItemToHost(item, host) {
    if (!item || !host || D.small()) return;
    var size = winItemSize(item);
    var pad = 8;
    var maxX = Math.max(pad, host.clientWidth - size.w - pad);
    var maxY = Math.max(pad, host.scrollHeight - size.h - pad);
    var x = parseInt(item.style.left, 10);
    var y = parseInt(item.style.top, 10);
    if (!isFinite(x)) x = pad;
    if (!isFinite(y)) y = pad;
    item.style.left = clamp(x, pad, maxX) + 'px';
    item.style.top = clamp(y, pad, maxY) + 'px';
  }

  function syncHostMinHeight(host) {
    if (!host || !host.classList.contains('items-free')) return;
    var maxBottom = 160;
    host.querySelectorAll('.item').forEach(function (item) {
      var y = parseInt(item.style.top, 10) || 0;
      var h = item.offsetHeight || 148;
      maxBottom = Math.max(maxBottom, y + h + 16);
    });
    host.style.minHeight = maxBottom + 'px';
  }

  function saveWinPositions(folderName, host) {
    if (D.small() || !folderName || !host) return;
    var map = readWinPositions();
    if (!map[folderName]) map[folderName] = {};
    host.querySelectorAll('.item').forEach(function (item) {
      var id = item.dataset.unshelf;
      if (!id) return;
      map[folderName][id] = {
        left: parseInt(item.style.left, 10) || 0,
        top: parseInt(item.style.top, 10) || 0
      };
    });
    writeWinPositions(map);
  }

  function clearWinPosition(folderName, id) {
    if (!folderName || !id) return;
    var map = readWinPositions();
    if (map[folderName] && map[folderName][id]) {
      delete map[folderName][id];
      writeWinPositions(map);
    }
  }

  function folderWindowBodyAt(x, y, folderName) {
    if (!D.open || !folderName || !D.open[folderName]) return null;
    var body = D.open[folderName].el.querySelector('.win-body');
    if (!body) return null;
    var rect = body.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
    return body;
  }

  function folderHostExtent(host) {
    if (!host) return { w: 360, h: 200 };
    syncHostMinHeight(host);
    return {
      w: Math.max(360, host.scrollWidth + 24),
      h: Math.max(200, host.scrollHeight + 16)
    };
  }

  function winPosValid(pos) {
    return !!(pos && typeof pos.left === 'number' && typeof pos.top === 'number' &&
      (pos.left !== 0 || pos.top !== 0));
  }

  function hostLayoutWidth(host) {
    var w = host.clientWidth;
    if (w > 100) return w;
    var body = host.closest('.win-body');
    if (body && body.clientWidth > 100) {
      var cs = window.getComputedStyle(body);
      var pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      return body.clientWidth - pad;
    }
    var win = host.closest('.win');
    if (win && win.clientWidth > 100) return win.clientWidth - 56;
    return 520;
  }

  function scatterFolderItems(host) {
    if (!host || D.small()) return;
    var pad = 4;
    var gapX = 8;
    var gapY = 20;
    var isVideo = !!host.querySelector('.video-item');
    var itemW = isVideo ? 190 : 128;
    var itemH = isVideo ? 175 : 148;
    var colW = itemW + gapX;
    var rowH = itemH + gapY;
    var hostW = hostLayoutWidth(host);
    var cols = Math.max(1, Math.floor((hostW - pad * 2 + gapX) / colW));
    var i = 0;
    host.querySelectorAll('.item').forEach(function (item) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      item.style.left = (pad + col * colW) + 'px';
      item.style.top = (pad + row * rowH) + 'px';
      i++;
    });
    syncHostMinHeight(host);
  }

  function resolveItemOverlapsInHost(host, folderName) {
    if (D.small() || !host) return;
    var placed = [];
    var moved = false;
    var list = Array.prototype.slice.call(host.querySelectorAll('.item'));
    list.sort(function (a, b) {
      var sa = winItemSize(a), sb = winItemSize(b);
      return (sb.w * sb.h) - (sa.w * sa.h);
    });
    list.forEach(function (item) {
      clampItemToHost(item, host);
      var size = winItemSize(item);
      var x = parseInt(item.style.left, 10) || 0;
      var y = parseInt(item.style.top, 10) || 0;
      if (overlapsPlaced(x, y, size.w, size.h, placed, 8)) {
        var pad = 12;
        syncHostMinHeight(host);
        var hostW = hostLayoutWidth(host);
        var hostH = Math.max(host.scrollHeight, 240);
        var found = false;
        var tryX, tryY, t;
        for (t = 0; t < 80; t++) {
          tryX = pad + Math.floor(Math.random() * Math.max(1, hostW - size.w - pad * 2));
          tryY = pad + Math.floor(Math.random() * Math.max(1, hostH - size.h - pad * 2));
          if (!overlapsPlaced(tryX, tryY, size.w, size.h, placed, 8)) {
            x = tryX; y = tryY; found = true; moved = true; break;
          }
        }
        if (!found) {
          for (tryY = pad; tryY <= hostH - size.h - pad && !found; tryY += 48) {
            for (tryX = pad; tryX <= hostW - size.w - pad; tryX += 48) {
              if (!overlapsPlaced(tryX, tryY, size.w, size.h, placed, 8)) {
                x = tryX; y = tryY; found = true; moved = true; break;
              }
            }
          }
        }
        item.style.left = x + 'px';
        item.style.top = y + 'px';
        clampItemToHost(item, host);
        x = parseInt(item.style.left, 10) || x;
        y = parseInt(item.style.top, 10) || y;
      }
      placed.push({ x: x, y: y, w: size.w, h: size.h });
    });
    if (moved) saveWinPositions(folderName, host);
    syncHostMinHeight(host);
  }

  function applyWinPositions(host, folderName) {
    if (D.small() || !host || !folderName) return;
    scatterFolderItems(host);
    syncHostMinHeight(host);
  }

  function layoutFolderWindow(frame, folderName) {
    if (D.small() || !frame || !folderName) return;
    var host = frame.querySelector('#video-items') || frame.querySelector('.items');
    if (!host || host.hidden || !host.classList.contains('items-free')) return;
    if (!host.querySelector('.item')) return;
    applyWinPositions(host, folderName);
  }

  function fillFolderShelf(host, folderName) {
    if (!host || !D.shelved || !folderName) return;
    if (D.small()) {
      host.classList.remove('items-free');
      if (folderName === 'videos' || host.id === 'video-items') {
        host.style.gridTemplateColumns = 'repeat(auto-fit,minmax(190px,190px))';
        host.style.justifyContent = 'center';
      }
    } else {
      host.classList.add('items-free');
      host.style.gridTemplateColumns = '';
      host.style.justifyContent = '';
    }
    var labsLevel = folderName === 'labs' ? getLabsAccess() : '';
    if (folderName === 'labs' && !labsLevel) return;
    Array.prototype.forEach.call(D.shelved.children, function (icon) {
      if (icon.dataset.shelf !== folderName) return;
      if (folderName === 'labs' && !labsIconAllowed(icon, labsLevel)) return;
      var id = iconKey(icon);
      if (D.HIDDEN_IDS && D.HIDDEN_IDS[id]) return;
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
      bindShelfItemDrag(b, icon, host, folderName);
    });
  }

  function moveToFolder(icon, folderName) {
    if (!icon || !folderName || !D.shelved || !canDropIntoFolder(folderName)) return;
    if (isTrashCan(icon) || isDeskPinned(icon)) return;
    if (D.trashed && D.trashed.contains(icon)) return;
    if (icon.dataset.open === folderName) return;
    if (icon.dataset.open && isFolderAncestor(icon.dataset.open, folderName)) return;
    if (icon.dataset.open && isFolderAncestor(folderName, icon.dataset.open)) return;

    var prevFolder = icon.dataset.shelf;
    if (prevFolder === folderName) return;
    if (prevFolder) clearWinPosition(prevFolder, iconKey(icon));

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

  function selectedIcons() {
    return Array.prototype.slice.call(document.querySelectorAll('#icons .icon.selected'));
  }

  function selectedItems() {
    return Array.prototype.slice.call(document.querySelectorAll('.win .item.selected'));
  }

  function selectedNodes() {
    return selectedIcons().concat(selectedItems());
  }

  function activate(node) {
    /* Trash contents: on touch, tap Put Back; otherwise select-only (context menu) */
    if (!node) return;
    if (node.dataset.restore) {
      if (D.small() || D.coarse()) {
        D.restoreFromTrash(node.dataset.restore);
        clearSel();
      }
      return;
    }
    if (node.dataset.unshelf) {
      var shelved = findShelvedIcon(node.dataset.unshelf);
      if (shelved) return activate(shelved);
    }
    if (node.dataset.video) {
      D.openVideo(node.dataset.video);
      clearSel();
      return;
    }
    if (node.dataset.href) {
      window.open(node.dataset.href, '_blank', 'noopener');
      clearSel();
      return;
    }
    if (node.dataset.open) {
      D.openWindow(node.dataset.open);
      /* Don't leave the icon stuck in the selected (dimmed + label chip) look */
      clearSel();
    }
  }

  function activateSelected(preferred) {
    var nodes = selectedNodes();
    if (!nodes.length && preferred) nodes = [preferred];
    nodes.forEach(function (node) {
      if (isTrashCan(node)) {
        if (node.dataset.open) D.openWindow(node.dataset.open);
        return;
      }
      activate(node);
    });
    clearSel();
  }

  function trashSelected(preferred) {
    var icons = selectedIcons().filter(function (icon) {
      return !isTrashCan(icon) && !isTrashProtected(icon);
    });
    if (!icons.length && preferred && preferred.classList.contains('icon') && !isTrashCan(preferred) && !isTrashProtected(preferred)) {
      icons = [preferred];
    }
    /* Also trash folder-window items that map back to shelved icons */
    selectedItems().forEach(function (item) {
      if (item.dataset.restore) return;
      var id = item.dataset.unshelf;
      var icon = id ? findShelvedIcon(id) : null;
      if (icon && icons.indexOf(icon) === -1 && !isTrashCan(icon) && !isTrashProtected(icon)) icons.push(icon);
    });
    icons.forEach(function (icon) { moveToTrash(icon); });
    return icons.length;
  }

  function rectsIntersect(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function bindMarquee(host, getCandidates) {
    if (!host || host.dataset.marqueeBound) return;
    host.dataset.marqueeBound = '1';
    var tracking = false, armed = false, sx = 0, sy = 0, box = null, hostRect = null, ptrId = null;

    function cleanup() {
      tracking = false;
      var wasArmed = armed;
      armed = false;
      if (ptrId != null) {
        try { host.releasePointerCapture(ptrId); } catch (err) {}
      }
      ptrId = null;
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      if (box && box.parentNode) box.remove();
      box = null;
      hostRect = null;
      /* Keep suppress flags until after bubble-phase field/menu handlers */
      if (wasArmed) {
        D.marqueeJustFinished = true;
        /* Cover sync click after pointerup and a short async gap */
        setTimeout(function () {
          D.marqueeActive = false;
          D.marqueeJustFinished = false;
        }, 120);
      } else {
        D.marqueeActive = false;
      }
    }

    function updateBox(clientX, clientY) {
      if (!box || !hostRect) return;
      var x1 = Math.min(sx, clientX) - hostRect.left + host.scrollLeft;
      var y1 = Math.min(sy, clientY) - hostRect.top + host.scrollTop;
      var x2 = Math.max(sx, clientX) - hostRect.left + host.scrollLeft;
      var y2 = Math.max(sy, clientY) - hostRect.top + host.scrollTop;
      box.style.left = x1 + 'px';
      box.style.top = y1 + 'px';
      box.style.width = Math.max(1, x2 - x1) + 'px';
      box.style.height = Math.max(1, y2 - y1) + 'px';
      var selRect = box.getBoundingClientRect();
      getCandidates().forEach(function (el) {
        if (isTrashCan(el)) return;
        el.classList.toggle('selected', rectsIntersect(selRect, el.getBoundingClientRect()));
      });
    }

    function arm(e) {
      if (armed) return;
      armed = true;
      D.marqueeActive = true;
      D.marqueeJustFinished = false;
      if (typeof D.hideMenus === 'function') D.hideMenus();
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) clearSel();
      hostRect = host.getBoundingClientRect();
      box = document.createElement('div');
      box.className = 'marquee';
      host.appendChild(box);
      try { host.setPointerCapture(e.pointerId); } catch (err) {}
      /* Drag-select wins — no click burst / piano hold from this gesture */
      if (window.JBField && typeof window.JBField.cancelPointer === 'function') {
        window.JBField.cancelPointer();
      }
      updateBox(e.clientX, e.clientY);
    }

    function onMove(e) {
      if (!tracking || (ptrId != null && e.pointerId !== ptrId)) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!armed && (dx * dx + dy * dy) < 36) return;
      if (!armed) arm(e);
      updateBox(e.clientX, e.clientY);
      if (e.cancelable) e.preventDefault();
    }

    function onUp(e) {
      if (!tracking || (ptrId != null && e.pointerId !== ptrId)) return;
      cleanup();
    }

    host.addEventListener('pointerdown', function (e) {
      if (D.small() || e.button > 0) return;
      /* Empty surface only — not icons/items/chrome (keep button.box, not all buttons) */
      if (e.target.closest('.icon, .item, .sticky, .marquee, input, textarea, button.box, a, .edge, .corner, .vbar, .hbar, .titlebar, .infobar')) return;
      if (host === D.desktop) {
        if (!e.target.closest('#desktop')) return;
      } else if (!host.contains(e.target)) {
        return;
      }
      /* Do not stopPropagation — short clicks must reach the pixel field burst */
      tracking = true;
      armed = false;
      sx = e.clientX;
      sy = e.clientY;
      ptrId = e.pointerId;
      D.marqueeActive = false;
      D.marqueeJustFinished = false;
      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
      window.addEventListener('pointercancel', onUp, true);
    });
  }

  function bindDesktopMarquee() {
    if (!D.desktop) return;
    bindMarquee(D.desktop, function () {
      return D.iconsHost ? Array.prototype.slice.call(D.iconsHost.querySelectorAll('.icon')) : [];
    });
  }

  function bindFolderMarquee(frame) {
    if (!frame) return;
    var body = frame.querySelector('.win-body');
    if (!body) return;
    bindMarquee(body, function () {
      return Array.prototype.slice.call(body.querySelectorAll('.item:not([data-restore])'));
    });
  }

  function dragIcon(icon) {
    var on = false, moved = false, sx, sy, group = null;
    icon.addEventListener('pointerdown', function (e) {
      /* Stacked phone/tablet layout — icons stay put */
      if (D.small() || e.button > 0 || icon.classList.contains('renaming')) return;
      if (typeof D.hideMenus === 'function') D.hideMenus();

      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        icon.classList.toggle('selected');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!icon.classList.contains('selected')) {
        clearSel();
        icon.classList.add('selected');
      }

      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      group = selectedIcons().map(function (el) {
        return { el: el, ox: el.offsetLeft, oy: el.offsetTop, lifted: false };
      });
      if (!group.some(function (g) { return g.el === icon; })) {
        group = [{ el: icon, ox: icon.offsetLeft, oy: icon.offsetTop, lifted: false }];
      }
      icon.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    icon.addEventListener('pointermove', function (e) {
      if (!on || !group) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      var thresh = D.coarse() ? 100 : 25;
      if (!moved && dx * dx + dy * dy < thresh) return;
      if (!moved) {
        moved = true;
        if (D.touchDesk()) icon.style.touchAction = 'none';
        group.forEach(function (g) {
          var coords = liftDeskIconForDrag(g.el);
          g.ox = coords.ox;
          g.oy = coords.oy;
          g.lifted = true;
          g.el.classList.add('dragging');
        });
        D.iconZ = DRAG_Z;
      }
      group.forEach(function (g) {
        var maxX = Math.max(0, D.desktop.clientWidth - g.el.offsetWidth);
        var maxY = Math.max(0, D.desktop.clientHeight - g.el.offsetHeight);
        g.el.style.left = Math.max(0, Math.min(g.ox + dx, maxX)) + 'px';
        g.el.style.top = Math.max(0, Math.min(g.oy + dy, maxY)) + 'px';
      });
      highlightDropTarget(dropTargetAt(e.clientX, e.clientY, icon));
    });
    function end(e) {
      if (!on) return;
      on = false;
      if (D.touchDesk()) icon.style.touchAction = '';
      var list = group || [{ el: icon, ox: 0, oy: 0, lifted: false }];
      group = null;
      list.forEach(function (g) { g.el.classList.remove('dragging'); });
      try { icon.releasePointerCapture(e.pointerId); } catch (err) {}
      var target = moved ? dropTargetAt(e.clientX, e.clientY, icon) : null;
      clearDropTargets();
      if (!moved) return;

      list.forEach(function (g) { g.el.dataset.dragged = '1'; });
      if (isTrashCan(icon)) icon.dataset.moved = '1';
      if (target && target.type === 'trash') {
        list.forEach(function (g) {
          if (!isTrashProtected(g.el)) moveToTrash(g.el);
        });
      } else if (target && target.type === 'folder' && target.name && !isTrashCan(icon)) {
        list.forEach(function (g) {
          if (!isTrashCan(g.el) && !isDeskPinned(g.el)) moveToFolder(g.el, target.name);
        });
      } else {
        list.forEach(function (g) {
          clampIconToDesk(g.el);
        });
        resolveIconOverlaps();
        savePositions();
        list.forEach(function (g) { restoreDeskIconHost(g.el); });
      }
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { icon.addEventListener(t, end); });
  }

  function bindShelfItemDragTouch(itemBtn, icon) {
    if (!itemBtn || !icon || itemBtn.dataset.shelfDragBound) return;
    itemBtn.dataset.shelfDragBound = '1';
    var on = false, moved = false, sx, sy, ghost = null;
    itemBtn.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      if (typeof D.hideMenus === 'function') D.hideMenus();
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        itemBtn.classList.toggle('selected');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!itemBtn.classList.contains('selected')) {
        clearSel();
        itemBtn.classList.add('selected');
      }
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      itemBtn.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    });
    itemBtn.addEventListener('pointermove', function (e) {
      if (!on) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      var thresh = D.coarse() ? 100 : 25;
      if (!moved && dx * dx + dy * dy < thresh) return;
      if (!moved) {
        moved = true;
        ghost = createShelfGhost(itemBtn);
        itemBtn.style.opacity = '0.35';
      }
      positionShelfGhost(ghost, itemBtn, e.clientX, e.clientY);
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
        /* Open on click — same path as desk icons (menus.js), not pointerup */
        return;
      }
      itemBtn.dataset.dragged = '1';
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

  function dragWinItem(itemBtn, icon, host, folderName) {
    if (!itemBtn || !icon || !host || itemBtn.dataset.shelfDragBound) return;
    itemBtn.dataset.shelfDragBound = '1';
    var on = false, moved = false, sx, sy, group = null, ghost = null;

    itemBtn.addEventListener('pointerdown', function (e) {
      if (D.small() || e.button > 0) return;
      if (typeof D.hideMenus === 'function') D.hideMenus();
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        itemBtn.classList.toggle('selected');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!itemBtn.classList.contains('selected')) {
        clearSel();
        itemBtn.classList.add('selected');
      }
      on = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      group = selectedItems().filter(function (el) { return host.contains(el); }).map(function (el) {
        return {
          el: el,
          ox: parseInt(el.style.left, 10) || 0,
          oy: parseInt(el.style.top, 10) || 0
        };
      });
      if (!group.some(function (g) { return g.el === itemBtn; })) {
        group = [{
          el: itemBtn,
          ox: parseInt(itemBtn.style.left, 10) || 0,
          oy: parseInt(itemBtn.style.top, 10) || 0
        }];
      }
      itemBtn.setPointerCapture(e.pointerId);
      group.forEach(function (g) {
        g.el.classList.add('dragging');
        dragLiftZ(g.el);
      });
      e.preventDefault();
      e.stopPropagation();
    });

    itemBtn.addEventListener('pointermove', function (e) {
      if (!on || !group) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      var thresh = D.coarse() ? 100 : 25;
      if (!moved && dx * dx + dy * dy < thresh) return;
      moved = true;
      var hostRect = host.getBoundingClientRect();
      var pad = 10;
      var inHost = e.clientX >= hostRect.left - pad && e.clientX <= hostRect.right + pad &&
        e.clientY >= hostRect.top - pad && e.clientY <= hostRect.bottom + pad;
      if (!inHost) {
        if (!ghost) {
          ghost = createShelfGhost(itemBtn);
          group.forEach(function (g) { g.el.style.opacity = '0.35'; });
        }
        positionShelfGhost(ghost, itemBtn, e.clientX, e.clientY);
        highlightDropTarget(dropTargetAt(e.clientX, e.clientY, ghost));
        return;
      }
      if (ghost) {
        ghost.remove();
        ghost = null;
        group.forEach(function (g) { g.el.style.opacity = ''; });
      }
      group.forEach(function (g) {
        var size = winItemSize(g.el);
        var maxX = Math.max(0, host.clientWidth - size.w);
        var maxY = Math.max(0, host.scrollHeight - size.h);
        g.el.style.left = Math.max(0, Math.min(g.ox + dx, maxX)) + 'px';
        g.el.style.top = Math.max(0, Math.min(g.oy + dy, maxY)) + 'px';
      });
      syncHostMinHeight(host);
      highlightDropTarget(dropTargetAt(e.clientX, e.clientY, itemBtn));
    });

    function end(e) {
      if (!on) return;
      on = false;
      var list = group || [{ el: itemBtn, ox: 0, oy: 0 }];
      var probe = ghost || itemBtn;
      group = null;
      list.forEach(function (g) {
        g.el.classList.remove('dragging');
        g.el.style.opacity = '';
        dragRestoreZ(g.el);
      });
      if (ghost && ghost.parentNode) ghost.remove();
      ghost = null;
      try { itemBtn.releasePointerCapture(e.pointerId); } catch (err) {}
      var target = moved ? dropTargetAt(e.clientX, e.clientY, probe) : null;
      clearDropTargets();
      if (!moved) return;

      list.forEach(function (g) { g.el.dataset.dragged = '1'; });

      if (target && target.type === 'trash') {
        list.forEach(function (g) {
          var ic = findShelvedIcon(g.el.dataset.unshelf);
          if (ic && !isTrashProtected(ic)) moveToTrash(ic);
        });
        return;
      }
      if (target && target.type === 'folder' && target.name && target.name !== folderName) {
        list.forEach(function (g) {
          var ic = findShelvedIcon(g.el.dataset.unshelf);
          if (ic && !isDeskPinned(ic) && !(D.trashed && D.trashed.contains(ic))) moveToFolder(ic, target.name);
        });
        return;
      }

      if (folderWindowBodyAt(e.clientX, e.clientY, folderName)) {
        list.forEach(function (g) { clampItemToHost(g.el, host); });
        resolveItemOverlapsInHost(host, folderName);
        saveWinPositions(folderName, host);
        syncHostMinHeight(host);
        return;
      }

      var ic = findShelvedIcon(itemBtn.dataset.unshelf);
      if (ic && !(D.trashed && D.trashed.contains(ic))) unshelfToDesktop(ic, e.clientX, e.clientY);
    }
    ['pointerup', 'pointercancel'].forEach(function (t) { itemBtn.addEventListener(t, end); });
  }

  function bindShelfItemDrag(itemBtn, icon, host, folderName) {
    if (!itemBtn || !icon) return;
    if (D.small()) bindShelfItemDragTouch(itemBtn, icon);
    else dragWinItem(itemBtn, icon, host, folderName);
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
      var thresh = D.coarse() ? 100 : 25;
      if (!moved && dx * dx + dy * dy < thresh) return;
      if (!moved) {
        moved = true;
        ghost = createShelfGhost(itemBtn);
        itemBtn.style.opacity = '0.35';
      }
      positionShelfGhost(ghost, itemBtn, e.clientX, e.clientY);
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
        clearSel();
        itemBtn.classList.add('selected');
        return;
      }
      itemBtn.dataset.dragged = '1';
      if (target && target.type === 'trash') {
        /* released in trash -> stays in trash */
      } else {
        /* trash items only go back to the desk, never into folders/windows */
        if (trashId) {
          delete icon.dataset.trashOrigin;
          restoreFromTrash(trashId, e.clientX, e.clientY);
        }
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

  function resetDesktop() {
    try {
      localStorage.removeItem(D.POS_KEY);
      localStorage.removeItem(D.SHELF_KEY);
      localStorage.removeItem(D.GONE_KEY);
      localStorage.removeItem(D.SEED_KEY);
      localStorage.removeItem(D.WIN_POS_KEY);
      sessionStorage.removeItem(LABS_ACCESS_KEY);
    } catch (err) {}
    if (typeof D.closeAll === 'function') D.closeAll();
    if (typeof D.clearSel === 'function') D.clearSel();
    window.location.reload();
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
  D.resolveTaxonomy = resolveTaxonomy;
  D.placeTrashCorner = placeTrashCorner;
  D.savePositions = savePositions;
  D.scatterIcons = scatterIcons;
  D.arrangeIcons = arrangeIcons;
  D.composeStackedLayout = composeStackedLayout;
  D.overTrash = overTrash;
  D.clearSel = clearSel;
  D.selectedIcons = selectedIcons;
  D.selectedNodes = selectedNodes;
  D.activate = activate;
  D.activateSelected = activateSelected;
  D.trashSelected = trashSelected;
  D.bindFolderMarquee = bindFolderMarquee;
  D.dragIcon = dragIcon;
  D.countShelved = countShelved;
  D.fillFolderShelf = fillFolderShelf;
  D.applyWinPositions = applyWinPositions;
  D.layoutFolderWindow = layoutFolderWindow;
  D.folderHostExtent = folderHostExtent;
  D.saveWinPositions = saveWinPositions;
  D.applyLabsGate = applyLabsGate;
  D.moveToFolder = moveToFolder;
  D.unshelfToDesktop = unshelfToDesktop;
  D.isFolderAncestor = isFolderAncestor;
  D.refreshFolderWindow = refreshFolderWindow;
  D.downloadSticky = downloadSticky;
  D.removeSticky = removeSticky;
  D.hideStickyAlert = hideStickyAlert;
  D.askCloseSticky = askCloseSticky;
  D.resetDesktop = resetDesktop;

  D.initIcons = function () {
    window.addEventListener('jb-pixel-grid', function (e) {
      var d = e.detail || {};
      if (!D.desktop) return;
      var rect = D.desktop.getBoundingClientRect();
      var padX = (d.width || rect.width * 0.5) * 0.08;
      var padY = (d.height || 80) * 0.25;
      liveWordmarkZone = {
        x0: (d.x || 0) - rect.left - padX,
        y0: (d.y || 0) - rect.top - padY,
        x1: (d.x || 0) - rect.left + (d.width || rect.width * 0.6) + padX,
        y1: (d.y || 0) - rect.top + (d.height || 100) + padY
      };
      /* First paint often lands before the wordmark metrics — nudge once */
      if (composeOnceOnWordmark && !D.small()) {
        composeOnceOnWordmark = false;
        composeStackedLayout();
        savePositions();
      }
    });
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
    bindDesktopMarquee();
    updateTrashAppearance();
    scatterIcons(false);
    window.addEventListener('resize', function () {
      if (!D.small() && D.trashIcon && !D.trashIcon.dataset.moved) {
        placeTrashCorner();
      }
      if (!D.small() && D.iconsHost) {
        D.iconsHost.querySelectorAll('.icon').forEach(clampIconToDesk);
        resolveIconOverlaps();
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
