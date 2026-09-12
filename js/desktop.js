/* Shared desk state — load first */
(function (global) {
  'use strict';
  var D = global.JBDesk = global.JBDesk || {};

  D.YT = ['qpRMLR7VkO8', 'QeW5kR0EGok', 'OR9yKC8f1Zs', '6REtACtGSJE', 'hacDUIS12Ho', 'ity7KgKlNbE'];
  D.YT_TITLES = {
    'qpRMLR7VkO8': 'A Time-Lapse Map of Every Death From the Coronavirus Pandemic (Up to July 2020)',
    'QeW5kR0EGok': 'Land Of The "Freer": A Music Timelapse of US Election 2020 (Lift Every Voice and Sing)',
    'OR9yKC8f1Zs': 'How To Play: Harder Better Faster Stronger on Vocoder (Daft Punk)',
    '6REtACtGSJE': 'Celeste - James Beckwith',
    'hacDUIS12Ho': 'Everybody Loves the Sunshine on a Rhodes MK8',
    'ity7KgKlNbE': 'Her Name Is Covid (feat. James Copus) - James Beckwith'
  };
  D.desktop = document.getElementById('desktop');
  D.open = Object.create(null);
  D.z = 100;
  D.cascade = 0;
  D.volLevel = 3;
  D.audioCtx = null;
  D.playerTimer = null;
  D.iconZ = 1;
  D.openMenu = null;
  D.ctxMenu = document.getElementById('m-ctx');
  D.ctxTarget = null;
  D.iconsHost = document.getElementById('icons');
  D.trashed = document.getElementById('trashed');
  D.shelved = document.getElementById('shelved');
  D.trashIcon = document.querySelector('.icon.trash');
  D.trashSeq = 0;
  D.POS_KEY = 'jb-desk-pos-v2';
  D.GONE_KEY = 'jb-desk-gone-v2';
  D.SEED_KEY = 'jb-trash-seeds-cleared';
  D.SHELF_KEY = 'jb-desk-shelf-v5';
  D.FOLDER_IDS = { labs: 1, maps: 1, music: 1, stream: 1, videos: 1, piano: 1, football: 1 };
  /* Only Trash is pinned / cannot be shelved into folders */
  D.PINNED_IDS = { trash: 1 };
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
