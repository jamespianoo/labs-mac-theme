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
    D.openMenu = { menu: m, btn: btn };
  }

  function hideMenus() {
    document.querySelectorAll('.menu').forEach(function (m) { m.hidden = true; });
    document.querySelectorAll('.menu-title, .status-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    D.openMenu = null;
    D.ctxTarget = null;
  }

  function showCtx(x, y, target) {
    hideMenus();
    D.ctxTarget = target || null;
    var n = D.trashed ? D.trashed.children.length : 0;
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
    document.querySelectorAll('.menu-title, .status-btn[data-menu]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (D.openMenu && D.openMenu.btn === btn) hideMenus();
        else showMenu(btn.dataset.menu, btn);
      });
      // once a menu is open, sliding across the bar switches menus - as it did
      btn.addEventListener('mouseenter', function () {
        if (D.openMenu && D.openMenu.btn !== btn && btn.dataset.menu) showMenu(btn.dataset.menu, btn);
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
        if (act === 'open' && target) D.activate(target);
        else if (act === 'info') D.getInfo(target);
        else if (act === 'rename' && target) D.renameIcon(target);
        else if (act === 'duplicate' && target) D.duplicateIcon(target);
        else if (act === 'trash' && target) D.moveToTrash(target);
        else if (act === 'empty') D.emptyTrash();
        else if (act === 'cleanup') D.arrangeIcons('clean');
        else if (act === 'byname') D.arrangeIcons('name');
      });
    }

    document.addEventListener('contextmenu', function (e) {
      if (e.target.closest('.menubar') || e.target.closest('.menu') || e.target.closest('.win')) return;
      if (!e.target.closest('.hero') && !e.target.closest('#desktop')) return;
      e.preventDefault();
      var icon = e.target.closest('#icons .icon');
      showCtx(e.clientX, e.clientY, icon || null);
    });

    document.addEventListener('click', function (e) {
      var node = e.target.closest('.icon,.item');
      if (node) {
        if (node.dataset.dragged) { delete node.dataset.dragged; e.preventDefault(); return; }
        if (node.closest && node.closest('.renaming')) return;
        D.clearSel();
        node.classList.add('selected');
        D.activate(node);
        return;
      }
      if (!e.target.closest('.menubar') && !e.target.closest('.menu')) hideMenus();
      if (!e.target.closest('.win') && !e.target.closest('.icon')) D.clearSel();
    });

    /* double-click still works; same as single-click open */
    document.addEventListener('dblclick', function (e) {
      var node = e.target.closest('.icon,.item');
      if (node) {
        if (node.dataset.dragged) { delete node.dataset.dragged; return; }
        e.preventDefault();
        D.clearSel();
        node.classList.add('selected');
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
        var names = Object.keys(D.open);
        if (names.length) D.closeWindow(names[names.length - 1]);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input,textarea,[contenteditable]')) {
        var sel = document.querySelector('#icons .icon.selected:not([data-trash])');
        if (sel) { e.preventDefault(); D.moveToTrash(sel); return; }
      }
      var node = e.target.closest && e.target.closest('.icon,.item');
      if (node && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); D.activate(node); }
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('.menu [data-open], .menubar [data-open]');
      if (b) { hideMenus(); D.openWindow(b.dataset.open); return; }
      if (e.target.closest('[data-close-all]')) { hideMenus(); D.closeAll(); }
      if (e.target.closest('[data-empty-trash]')) { hideMenus(); D.emptyTrash(); }
      if (e.target.closest('[data-cleanup]')) { hideMenus(); D.arrangeIcons('clean'); return; }
      if (e.target.closest('[data-arrange-name]')) { hideMenus(); D.arrangeIcons('name'); return; }
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

      if (e.target.closest('[data-theme-toggle]')) {
        D.setTheme(D.currentTheme() === 'dark' ? 'light' : 'dark');
        hideMenus();
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
})(window.JBDesk);
