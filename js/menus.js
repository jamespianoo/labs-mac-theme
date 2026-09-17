/* Menus, context menu, and global interaction */
(function (D) {
  'use strict';
  if (!D) return;

  function showMenu(id, btn) {
    hideMenus();
    var m = document.getElementById(id); if (!m) return;
    if (id === 'm-label') {
      var sel = document.querySelector('#icons .icon.selected:not([data-trash])');
      var cur = sel ? (sel.getAttribute('data-tag') || '') : null;
      m.querySelectorAll('[data-tag]').forEach(function (b) {
        var t = b.getAttribute('data-tag') || '';
        b.classList.toggle('checked', cur !== null && t === cur);
        b.classList.toggle('disabled', !sel);
      });
    }
    if (id === 'm-theme') {
      var curTheme = typeof D.themeMode === 'function' ? D.themeMode() : (document.documentElement.getAttribute('data-theme') || 'dark');
      m.querySelectorAll('[data-theme-set]').forEach(function (b) {
        b.classList.toggle('checked', b.getAttribute('data-theme-set') === curTheme);
      });
    }
    if (id === 'm-file') {
      var eqOn = false;
      if (window.JBField && typeof window.JBField.getSettings === 'function') {
        eqOn = window.JBField.getSettings().showEq !== 'hide';
      }
      m.querySelectorAll('[data-eq-toggle]').forEach(function (b) {
        b.classList.toggle('checked', eqOn);
      });
    }
    m.hidden = false;
    var r = btn.getBoundingClientRect();
    var top = '35px';
    if (btn.closest('.status')) {
      m.style.left = Math.max(2, Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 4)) + 'px';
    } else {
      m.style.left = Math.max(2, r.left - 2) + 'px';
    }
    m.style.top = top;
    btn.setAttribute('aria-expanded', 'true');
    D.openMenu = { menu: m, btn: btn };
  }

  function hideMenus() {
    document.querySelectorAll('.menu').forEach(function (m) { m.hidden = true; });
    document.querySelectorAll('.menu-title, .status-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    D.openMenu = null;
    D.ctxTarget = null;
  }

  /* Move to Folder — flat list (no hover submenu) so it works the same on
     tap and click; this is the mobile-friendly stand-in for dragging an
     icon onto a folder. */
  var MOVE_TARGETS = [
    { name: 'projects', label: 'Projects' },
    { name: 'music', label: 'Music' },
    { name: 'videos', label: 'Videos' }
  ];
  function resolveMoveIcon(target) {
    if (!target) return null;
    if (target.classList.contains('item') && target.dataset.unshelf) {
      return (D.shelved && (D.shelved.querySelector('.icon[data-id="' + target.dataset.unshelf + '"]') || D.shelved.querySelector('.icon[data-open="' + target.dataset.unshelf + '"]'))) || null;
    }
    if (target.classList.contains('icon')) return target;
    return null;
  }
  function moveMenuHtml(target) {
    var icon = resolveMoveIcon(target);
    if (!icon || icon.classList.contains('trash') || icon.getAttribute('data-trash') != null) return '';
    var openName = icon.dataset.open || icon.dataset.id || '';
    if (D.DESK_PINNED_IDS && D.DESK_PINNED_IDS[openName]) return '';
    var shelf = icon.dataset.shelf || '';
    var opts = MOVE_TARGETS.filter(function (t) {
      if (t.name === shelf || t.name === openName) return false;
      if (openName && typeof D.isFolderAncestor === 'function') {
        if (D.isFolderAncestor(openName, t.name) || D.isFolderAncestor(t.name, openName)) return false;
      }
      return true;
    });
    if (!opts.length) return '';
    return opts.map(function (t) {
      return '<button type="button" data-ctx="move" data-folder="' + t.name + '">Move to ' + t.label + '</button>';
    }).join('');
  }

  function showCtx(x, y, target) {
    hideMenus();
    D.ctxTarget = target || null;
    var n = D.trashed ? D.trashed.children.length : 0;
    var html;
    if (target && (target.classList.contains('sticky') || target.hasAttribute('data-sticky'))) {
      html =
        '<button type="button" data-ctx="info">Get Info</button>' +
        '<button type="button" data-ctx="save-note">Save as Text\u2026</button>' +
        '<hr>' +
        '<button type="button" data-ctx="close-note">Close Note</button>';
    } else if (target && target.classList.contains('item')) {
      if (target.dataset.restore) {
        html =
          '<button type="button" data-ctx="putback">Put Back</button>' +
          '<button type="button" data-ctx="info">Get Info</button>';
      } else {
        var itemMulti = typeof D.selectedNodes === 'function' && D.selectedNodes().length > 1 && target.classList.contains('selected');
        var itemMoveHtml = itemMulti ? '' : moveMenuHtml(target);
        html =
          '<button type="button" data-ctx="open">' + (itemMulti ? 'Open ' + D.selectedNodes().length + ' Items' : 'Open') + '</button>' +
          '<button type="button" data-ctx="info">Get Info</button>' +
          '<hr>' +
          (itemMoveHtml ? itemMoveHtml + '<hr>' : '') +
          '<button type="button" data-ctx="trash">' + (itemMulti ? 'Move ' + D.selectedNodes().length + ' Items to Trash' : 'Move to Trash') + '</button>';
      }
    } else if (target && target.classList.contains('icon')) {
      if (target.classList.contains('trash') || target.getAttribute('data-trash') != null) {
        html =
          '<button type="button" data-ctx="open">Open</button>' +
          '<button type="button" data-ctx="info">Get Info</button>' +
          '<hr>' +
          '<button type="button" data-ctx="empty"' + (n ? '' : ' class="disabled"') + '>Empty Trash</button>';
      } else {
        var iconMulti = typeof D.selectedNodes === 'function' && D.selectedNodes().length > 1 && target.classList.contains('selected');
        var iconMoveHtml = iconMulti ? '' : moveMenuHtml(target);
        html =
          '<button type="button" data-ctx="open">' + (iconMulti ? 'Open ' + D.selectedNodes().length + ' Items' : 'Open') + '</button>' +
          '<button type="button" data-ctx="info">Get Info</button>' +
          '<hr>' +
          (iconMulti ? '' :
            '<button type="button" data-ctx="duplicate">Duplicate</button>' +
            '<button type="button" data-ctx="rename">Rename</button>' +
            '<hr>') +
          (iconMoveHtml ? iconMoveHtml + '<hr>' : '') +
          '<button type="button" data-ctx="trash">' + (iconMulti ? 'Move ' + D.selectedNodes().length + ' Items to Trash' : 'Move to Trash') + '</button>';
      }
    } else {
      html =
        '<button type="button" data-ctx="reset">Reset Desktop</button>' +
        '<hr>' +
        (D.small() ? '' :
          '<button type="button" data-ctx="cleanup">Clean Up</button>' +
          '<button type="button" data-ctx="byname">Arrange by Name</button>' +
          '<hr>') +
        '<button type="button" data-ctx="empty"' + (n ? '' : ' class="disabled"') + '>Empty Trash</button>';
    }
    D.ctxMenu.innerHTML = html;
    D.ctxMenu.hidden = false;
    var pad = 6;
    var w = D.ctxMenu.offsetWidth, h = D.ctxMenu.offsetHeight;
    D.ctxMenu.style.left = Math.min(x, window.innerWidth - w - pad) + 'px';
    D.ctxMenu.style.top = Math.min(y, window.innerHeight - h - pad) + 'px';
  }

  D.showMenu = showMenu;
  D.hideMenus = hideMenus;
  D.showCtx = showCtx;

  D.initMenus = function () {
    var leaveTimer = null;
    function clearLeave() {
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
    }
    function scheduleLeave() {
      clearLeave();
      leaveTimer = setTimeout(function () {
        leaveTimer = null;
        hideMenus();
      }, 120);
    }

    document.querySelectorAll('.menu-title, .status-btn[data-menu]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        clearLeave();
        if (D.openMenu && D.openMenu.btn === btn) hideMenus();
        else showMenu(btn.dataset.menu, btn);
      });
      btn.addEventListener('mouseenter', function () {
        if (!btn.dataset.menu) return;
        clearLeave();
        if (!D.openMenu || D.openMenu.btn !== btn) showMenu(btn.dataset.menu, btn);
      });
    });

    var bar = document.querySelector('.menubar');
    if (bar) {
      bar.addEventListener('mouseleave', function (e) {
        var to = e.relatedTarget;
        if (to && (to.closest && (to.closest('.menu') || to.closest('.menubar')))) return;
        scheduleLeave();
      });
      bar.addEventListener('mouseenter', clearLeave);
    }
    document.querySelectorAll('.menu').forEach(function (m) {
      if (m.classList.contains('ctx') || m.classList.contains('submenu')) return;
      m.addEventListener('mouseenter', clearLeave);
      m.addEventListener('mouseleave', function (e) {
        var to = e.relatedTarget;
        if (to && (to.closest && (to.closest('.menu') || to.closest('.menubar')))) return;
        scheduleLeave();
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

    if (D.ctxMenu) {
      D.ctxMenu.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ctx]');
        if (!b || b.classList.contains('disabled')) return;
        e.stopPropagation();
        var act = b.dataset.ctx;
        var target = D.ctxTarget;
        hideMenus();
        if (act === 'open' && target) {
          if (target.classList.contains('selected') && typeof D.activateSelected === 'function' && D.selectedNodes().length > 1) {
            D.activateSelected(target);
          } else {
            D.activate(target);
          }
        }
        else if (act === 'putback' && target && target.dataset.restore) D.restoreFromTrash(target.dataset.restore);
        else if (act === 'info') D.getInfo(target);
        else if (act === 'save-note' && target) D.downloadSticky(target);
        else if (act === 'close-note' && target) D.askCloseSticky(target);
        else if (act === 'rename' && target) D.renameIcon(target);
        else if (act === 'duplicate' && target) D.duplicateIcon(target);
        else if (act === 'trash' && target) {
          if (target.classList.contains('selected') && typeof D.trashSelected === 'function' && D.selectedNodes().length > 1) {
            D.trashSelected(target);
          } else if (target.classList.contains('item') && target.dataset.unshelf) {
            var shelved = D.shelved && (D.shelved.querySelector('.icon[data-id="' + target.dataset.unshelf + '"]') || D.shelved.querySelector('.icon[data-open="' + target.dataset.unshelf + '"]'));
            if (shelved) D.moveToTrash(shelved);
          } else {
            D.moveToTrash(target);
          }
        }
        else if (act === 'move' && target) {
          var moveIcon = resolveMoveIcon(target);
          if (moveIcon && typeof D.moveToFolder === 'function') D.moveToFolder(moveIcon, b.dataset.folder);
        }
        else if (act === 'empty') D.emptyTrash();
        else if (act === 'reset') D.resetDesktop();
        else if (act === 'cleanup') D.arrangeIcons('clean');
        else if (act === 'byname') D.arrangeIcons('name');
      });
    }

    function triggerGetInfo() {
      var sel = document.querySelector('.icon.selected, .item.selected');
      if (sel) {
        D.getInfo(sel);
        return;
      }
      var focused = document.activeElement;
      var sticky = focused && focused.closest ? focused.closest('.sticky, [data-sticky]') : null;
      if (sticky) {
        D.getInfo(sticky);
        return;
      }
      var openNames = Object.keys(D.open);
      if (openNames.length) {
        var topName = openNames[openNames.length - 1];
        var iconEl = document.querySelector('.icon[data-open="' + topName + '"], .icon[data-id="' + topName + '"]');
        if (iconEl) {
          D.getInfo(iconEl);
          return;
        }
      }
      var note = document.querySelector('.sticky');
      if (note) {
        D.getInfo(note);
        return;
      }
      D.getInfo(null);
    }

    document.addEventListener('contextmenu', function (e) {
      if (e.target.closest('.menubar') || e.target.closest('.menu')) return;
      var sticky = e.target.closest('.sticky, [data-sticky]');
      var item = e.target.closest('.item');
      var icon = e.target.closest('#icons .icon, #trashed .icon, .icon');
      var win = e.target.closest('.win');
      if (win && !item) return;
      if (!sticky && !item && !icon && !e.target.closest('.hero') && !e.target.closest('#desktop')) return;
      e.preventDefault();
      var target = sticky || item || icon || null;
      if (target && target.classList && (target.classList.contains('icon') || target.classList.contains('item'))) {
        if (!target.classList.contains('selected')) {
          D.clearSel();
          target.classList.add('selected');
        }
      }
      showCtx(e.clientX, e.clientY, target);
    });

    /* Long-press → same context menu (phones / tablets without right-click) */
    (function bindLongPressCtx() {
      var timer = null;
      var startX = 0, startY = 0, startTarget = null, startEl = null;
      var fired = false;
      var HOLD_MS = 500;
      var MOVE_PX = 12;

      function clear() {
        if (timer) { clearTimeout(timer); timer = null; }
        startTarget = null;
        startEl = null;
      }

      function resolveTarget(el) {
        if (!el || !el.closest) return null;
        if (el.closest('.menubar') || el.closest('.menu') || el.closest('.box')) return null;
        var sticky = el.closest('.sticky, [data-sticky]');
        var item = el.closest('.item');
        var icon = el.closest('#icons .icon, .win .item, .icon');
        if (item) return item;
        if (sticky) return sticky;
        if (icon && !icon.closest('.win')) return icon;
        if (el.closest('.hero') || el.closest('#desktop')) return null;
        return null;
      }

      document.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || e.pointerType === 'mouse') return;
        clear();
        fired = false;
        startX = e.clientX;
        startY = e.clientY;
        startEl = e.target;
        startTarget = resolveTarget(e.target);
        if (!startTarget && !(e.target.closest && (e.target.closest('.hero') || e.target.closest('#desktop')))) return;
        timer = setTimeout(function () {
          timer = null;
          fired = true;
          var target = startTarget;
          if (target && target.classList && (target.classList.contains('icon') || target.classList.contains('item'))) {
            if (!target.classList.contains('selected')) {
              D.clearSel();
              target.classList.add('selected');
            }
          }
          if (navigator.vibrate) try { navigator.vibrate(12); } catch (err) {}
          showCtx(startX, startY, target);
        }, HOLD_MS);
      }, { passive: true });

      document.addEventListener('pointermove', function (e) {
        if (!timer) return;
        var dx = e.clientX - startX, dy = e.clientY - startY;
        if (dx * dx + dy * dy > MOVE_PX * MOVE_PX) clear();
      }, { passive: true });

      function endPress(e) {
        if (fired) {
          if (e && e.cancelable) e.preventDefault();
          /* Suppress the click that follows a long-press open */
          var swallow = function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            document.removeEventListener('click', swallow, true);
          };
          document.addEventListener('click', swallow, true);
          setTimeout(function () {
            document.removeEventListener('click', swallow, true);
          }, 400);
        }
        clear();
        fired = false;
      }

      document.addEventListener('pointerup', endPress);
      document.addEventListener('pointercancel', endPress);
    })();

    document.addEventListener('click', function (e) {
      var node = e.target.closest('.icon,.item');
      if (node) {
        if (node.dataset.dragged) { delete node.dataset.dragged; e.preventDefault(); return; }
        if (node.closest && node.closest('.renaming')) return;
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          e.preventDefault();
          return;
        }
        var multi = typeof D.selectedNodes === 'function' && D.selectedNodes().length > 1 && node.classList.contains('selected');
        if (multi) {
          /* Keep multi-selection; open happens via Enter / Open / double-click */
          e.preventDefault();
          return;
        }
        if (!node.classList.contains('selected')) {
          D.clearSel();
          node.classList.add('selected');
        }
        D.activate(node);
        return;
      }
      if (!e.target.closest('.menubar') && !e.target.closest('.menu')) hideMenus();
      /* Don't wipe a marquee multi-select if the browser still fires click after drag */
      if (D.marqueeJustFinished || D.marqueeActive) return;
      if (!e.target.closest('.win') && !e.target.closest('.icon') && !e.target.closest('.marquee')) D.clearSel();
    });

    /* double-click still works; same as single-click open */
    document.addEventListener('dblclick', function (e) {
      var node = e.target.closest('.icon,.item');
      if (node) {
        if (node.dataset.dragged) { delete node.dataset.dragged; return; }
        e.preventDefault();
        if (node.classList.contains('selected') && typeof D.activateSelected === 'function' && D.selectedNodes().length > 1) {
          D.activateSelected(node);
          return;
        }
        if (!node.classList.contains('selected')) {
          D.clearSel();
          node.classList.add('selected');
        }
        D.activate(node);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (D.stickyAlert && !D.stickyAlert.hidden) {
        if (e.key === 'Escape') { e.preventDefault(); D.hideStickyAlert(); return; }
        if (e.key === 'Enter') {
          e.preventDefault();
          var note = D.stickyPending;
          if (!note) return;
          D.downloadSticky(note);
          D.removeSticky(note);
          D.hideStickyAlert();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (D.ctxMenu && !D.ctxMenu.hidden) { hideMenus(); return; }
        if (D.openMenu) { hideMenus(); return; }
        var renaming = document.querySelector('.icon.renaming input.rename');
        if (renaming) { renaming.blur(); return; }
        if (typeof D.selectedNodes === 'function' && D.selectedNodes().length) {
          D.clearSel();
          return;
        }
        var names = Object.keys(D.open);
        if (names.length) D.closeWindow(names[names.length - 1]);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I') && !e.shiftKey && !e.altKey) {
        if (!e.target.closest('input,textarea,[contenteditable=true]')) {
          e.preventDefault();
          triggerGetInfo();
          return;
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input,textarea,[contenteditable]')) {
        if (typeof D.trashSelected === 'function' && D.selectedNodes().length) {
          e.preventDefault();
          D.trashSelected();
          return;
        }
        var sel = document.querySelector('#icons .icon.selected:not([data-trash])');
        if (sel) { e.preventDefault(); D.moveToTrash(sel); return; }
      }
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('input,textarea,[contenteditable]')) {
        if (typeof D.activateSelected === 'function' && D.selectedNodes().length) {
          e.preventDefault();
          D.activateSelected();
          return;
        }
        var node = e.target.closest && e.target.closest('.icon,.item');
        if (node) { e.preventDefault(); D.activate(node); }
      }
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('.menu [data-open], .menubar [data-open]');
      if (b) { hideMenus(); D.openWindow(b.dataset.open); return; }
      if (e.target.closest('[data-close-all]')) { hideMenus(); D.closeAll(); }
      if (e.target.closest('[data-empty-trash]')) { hideMenus(); D.emptyTrash(); }
      if (e.target.closest('[data-cleanup]')) {
        hideMenus();
        if (!D.small()) D.arrangeIcons('clean');
        return;
      }
      if (e.target.closest('[data-arrange-name]')) {
        hideMenus();
        if (!D.small()) D.arrangeIcons('name');
        return;
      }
      var tagBtn = e.target.closest('#m-label [data-tag]');
      if (tagBtn) {
        hideMenus();
        var sel = document.querySelector('#icons .icon.selected:not([data-trash])');
        if (!sel) return;
        var tag = tagBtn.getAttribute('data-tag') || '';
        if (tag) sel.setAttribute('data-tag', tag);
        else sel.removeAttribute('data-tag');
        return;
      }
      if (e.target.closest('.menu a')) hideMenus();

      var themeSetBtn = e.target.closest('[data-theme-set]');
      if (themeSetBtn) {
        var newTheme = themeSetBtn.getAttribute('data-theme-set');
        if (typeof D.setTheme === 'function') {
          D.setTheme(newTheme);
        }
        hideMenus();
        return;
      }

      if (e.target.closest('[data-theme-toggle]')) {
        D.setTheme(D.currentTheme() === 'dark' ? 'light' : 'dark');
        hideMenus();
        return;
      }

      var eqBtn = e.target.closest('[data-eq-toggle]');
      if (eqBtn) {
        if (window.JBField && typeof window.JBField.getSettings === 'function' && typeof window.JBField.applySettings === 'function') {
          var cur = window.JBField.getSettings().showEq !== 'hide';
          window.JBField.applySettings({ showEq: cur ? 'hide' : 'show' });
        }
        hideMenus();
        return;
      }

      if (e.target.closest('[data-reset-desk]')) {
        hideMenus();
        if (typeof D.resetDesktop === 'function') {
          D.resetDesktop();
        }
        return;
      }

      if (e.target.closest('[data-clock-fmt]')) {
        D.clock12 = !D.clock12;
        var fmtBtn = document.querySelector('[data-clock-fmt]');
        if (fmtBtn) fmtBtn.textContent = D.clock12 ? '12-hour clock' : '24-hour clock';
        D.tickClock();
        hideMenus();
      }
    });
  };

  D.initMenus();
  if (typeof D.initIcons === 'function') D.initIcons();
  if (typeof D.initRoute === 'function') D.initRoute();
})(window.JBDesk);
