/* Shared desk state — load first */
(function (global) {
  'use strict';
  var D = global.JBDesk = global.JBDesk || {};

  D.YT = ['qpRMLR7VkO8', 'QeW5kR0EGok', 'OR9yKC8f1Zs', '6REtACtGSJE', 'hacDUIS12Ho', 'ity7KgKlNbE'];
  D.desktop = document.getElementById('desktop');
  D.open = Object.create(null);
  D.z = 100;
  D.cascade = 0;
  D.volLevel = 0;
  D.audioCtx = null;
  D.playerTimer = null;
  D.iconZ = 1;
  D.openMenu = null;
  D.ctxMenu = document.getElementById('m-ctx');
  D.ctxTarget = null;
  D.iconsHost = document.getElementById('icons');
  D.trashed = document.getElementById('trashed');
  D.trashIcon = document.querySelector('.icon.trash');
  D.trashSeq = 0;
  D.POS_KEY = 'jb-desk-pos-v2';
  D.GONE_KEY = 'jb-desk-gone';
  D.SEED_KEY = 'jb-trash-seeds-cleared';
  D.clock12 = true;
  D.stickyAlert = document.getElementById('sticky-alert');
  D.stickyPending = null;
  D.clockEl = document.getElementById('menubar-clock');
  D.dateEl = document.getElementById('menubar-date');

  D.small = function () {
    return window.matchMedia('(max-width:820px)').matches;
  };

  D.el = function (html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
})(window);
