/* Shared desk state — load first */
(function (global) {
  'use strict';
  var D = global.JBDesk = global.JBDesk || {};

  D.YT = ['qpRMLR7VkO8', 'QeW5kR0EGok', 'OR9yKC8f1Zs', '6REtACtGSJE', 'hacDUIS12Ho', 'ity7KgKlNbE'];
  D.YT_TITLES = {
    'qpRMLR7VkO8': 'Timelapse of Every Death from Covid',
    'QeW5kR0EGok': 'US Election 2020 Timelapse',
    'OR9yKC8f1Zs': 'Harder Better Faster Stronger on Vocoder',
    '6REtACtGSJE': 'Celeste',
    'hacDUIS12Ho': 'Everybody Loves the Sunshine',
    'ity7KgKlNbE': 'Her Name Is Covid'
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
  D.marqueeActive = false;
  D.marqueeJustFinished = false;
  D.POS_KEY = 'jb-desk-pos-v2';
  D.GONE_KEY = 'jb-desk-gone-v2';
  D.SEED_KEY = 'jb-trash-seeds-cleared-v2';
  D.SHELF_KEY = 'jb-desk-shelf-v6';
  D.FOLDER_IDS = { projects: 1, labs: 1, maps: 1, music: 1, stream: 1, videos: 1, piano: 1, football: 1 };
  /* Only Trash is pinned / cannot be shelved into folders */
  D.PINNED_IDS = { trash: 1 };
  D.clock12 = true;
  D.stickyAlert = document.getElementById('sticky-alert');
  D.stickyPending = null;
  D.clockEl = document.getElementById('menubar-clock');
  D.dateEl = document.getElementById('menubar-date');
  D.TAXONOMY = null;
  try {
    var taxScript = document.getElementById('jb-taxonomy');
    if (taxScript && taxScript.textContent.trim()) {
      D.TAXONOMY = JSON.parse(taxScript.textContent);
    }
  } catch (err) {
    console.warn('Could not parse jb-taxonomy', err);
  }

  D.MQ_SMALL = '(max-width:820px)';
  D.MQ_COARSE = '(pointer: coarse)';

  D.small = function () {
    return window.matchMedia(D.MQ_SMALL).matches;
  };

  D.coarse = function () {
    return window.matchMedia(D.MQ_COARSE).matches;
  };

  /* Wide tablet / touch laptop: keep the desk metaphor, touch-first chrome */
  D.touchDesk = function () {
    return !D.small() && D.coarse();
  };

  D.syncModeClass = function () {
    var root = document.documentElement;
    root.classList.toggle('mode-small', D.small());
    root.classList.toggle('mode-coarse', D.coarse());
    root.classList.toggle('mode-touch-desk', D.touchDesk());
  };

  D.onViewportModeChange = function (fn) {
    if (typeof fn !== 'function') return;
    var mqSmall = window.matchMedia(D.MQ_SMALL);
    var mqCoarse = window.matchMedia(D.MQ_COARSE);
    var last = D.small() + ':' + D.coarse();
    function check() {
      D.syncModeClass();
      var next = D.small() + ':' + D.coarse();
      if (next === last) return;
      last = next;
      fn();
    }
    if (mqSmall.addEventListener) {
      mqSmall.addEventListener('change', check);
      mqCoarse.addEventListener('change', check);
    } else {
      mqSmall.addListener(check);
      mqCoarse.addListener(check);
    }
    window.addEventListener('orientationchange', function () {
      setTimeout(check, 50);
    });
  };

  D.el = function (html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  D.syncModeClass();
})(window);
