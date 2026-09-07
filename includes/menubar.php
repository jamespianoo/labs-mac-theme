<div class="menubar">
    <button type="button" class="mark" data-open="about" aria-label="About James Beckwith">
      <img src="img/icons/jb.webp" width="20" height="20" alt="">
    </button>

    <div class="menus">
      <button class="menu-title" data-menu="m-file" aria-expanded="false" aria-haspopup="true">File</button>
      <button class="menu-title" data-menu="m-edit" aria-expanded="false" aria-haspopup="true">Listen</button>
      <button class="menu-title" data-menu="m-view" aria-expanded="false" aria-haspopup="true">View</button>
      <button class="menu-title" data-menu="m-special" aria-expanded="false" aria-haspopup="true">Special</button>
    </div>
    <div class="status">
      <button class="status-btn" data-menu="m-app" aria-expanded="false" aria-haspopup="true" aria-label="Application menu">
        <svg viewBox="0 0 14 14" aria-hidden="true"><rect x="1" y="2" width="12" height="10" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1 5h12" stroke="currentColor" stroke-width="1.4"/><rect x="3" y="7" width="3" height="3" fill="currentColor"/></svg>
      </button>
      <button class="status-btn is-muted" data-menu="m-vol" aria-expanded="false" aria-haspopup="true" aria-label="Volume" id="status-vol">
        <svg class="vol-icon" viewBox="0 0 16 14" aria-hidden="true">
          <path d="M2 5h3l4-3v10L5 9H2z" fill="currentColor"/>
          <g class="vol-waves" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
            <path d="M11 4.5c1.2 1 1.2 4 0 5"/>
            <path d="M13 2.5c2.2 1.8 2.2 7 0 9"/>
          </g>
          <g class="vol-x" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M11 4l4 6M15 4l-4 6"/>
          </g>
        </svg>
      </button>
      <button type="button" class="status-btn theme-toggle" id="theme-toggle" data-theme-toggle aria-label="Switch to light mode" title="Light mode">
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.591a.75.75 0 101.06 1.06l1.591-1.591zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.591-1.591a.75.75 0 10-1.06 1.06l1.591 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
        </svg>
      </button>
      <button class="status-btn clock" data-menu="m-clock" aria-expanded="false" aria-haspopup="true" id="menubar-clock">00:00</button>
    </div>
  </div>

  <div class="menu" id="m-file" hidden>
    <button data-open="about">About James Beckwith</button>
    <button data-open="readme">Open readme.txt</button>
    <hr>
    <div class="submenu-wrap">
      <button data-submenu="m-labs" aria-haspopup="true" aria-expanded="false">Labs<span>&#9656;</span></button>
      <div class="menu submenu" id="m-labs" hidden>
        <button data-open="labs">Open Labs folder</button>
        <hr>
        <a href="https://labs.jamesbeckwith.com/tubemap/demo.php" target="_blank" rel="noopener">Tube Symphony</a>
        <a href="https://labs.jamesbeckwith.com/gig-map/" target="_blank" rel="noopener">Gig Map</a>
        <a href="https://labs.jamesbeckwith.com/dead-venues/" target="_blank" rel="noopener">Dead Venues</a>
        <a href="https://labs.jamesbeckwith.com/solar-system/" target="_blank" rel="noopener">Solar System</a>
        <a href="https://labs.jamesbeckwith.com/ganymede-synth-engine/" target="_blank" rel="noopener">Ganymede</a>
        <a href="https://labs.jamesbeckwith.com/flight-radar/" target="_blank" rel="noopener">Flight Radar</a>
        <hr>
        <a href="https://labs.jamesbeckwith.com/" target="_blank" rel="noopener">All experiments</a>
      </div>
    </div>
    <a href="https://www.jupitervintagepianos.com" target="_blank" rel="noopener">Jupiter Vintage Pianos</a>
    <a href="https://www.greenwichpianotuner.co.uk" target="_blank" rel="noopener">Greenwich Piano Services</a>
    <hr>
    <a href="https://www.whenissttotteringhamsday.com" target="_blank" rel="noopener">St Totteringham&#39;s Day</a>
    <a href="https://www.whenisinvinciblesday.com" target="_blank" rel="noopener">Invincibles Day</a>
    <hr>
    <a href="mailto:james@jamesbeckwith.com">Contact&hellip;</a>
  </div>

  <div class="menu" id="m-edit" hidden>
    <button data-open="player">SE10.aiff</button>
    <hr>
    <a href="https://jamesbeckwith.bandcamp.com" target="_blank" rel="noopener">Bandcamp</a>
    <a href="https://open.spotify.com/artist/2IKevWKWuhVBPlg7QtBDOd" target="_blank" rel="noopener">Spotify</a>
    <a href="https://music.apple.com/gb/artist/james-beckwith/1499185416" target="_blank" rel="noopener">Apple Music</a>
    <a href="https://tidal.com/artist/12732103" target="_blank" rel="noopener">Tidal</a>
    <a href="https://open.qobuz.com/artist/2999610" target="_blank" rel="noopener">Qobuz</a>
    <hr>
    <button data-open="music">Releases&hellip;</button>
  </div>

  <div class="menu" id="m-view" hidden>
    <button data-open="labs">Labs</button>
    <button data-open="music">Music</button>
    <button data-open="videos">Videos</button>
    <button data-open="football">Football</button>
    <button data-open="piano">Piano Repair</button>
    <hr>
    <button data-open="readme">readme.txt</button>
    <button data-open="promo">promo.png</button>
    <button data-open="trash">Trash</button>
  </div>

  <div class="menu" id="m-special" hidden>
    <a href="https://www.instagram.com/iamjamesbeckwith" target="_blank" rel="noopener">Instagram</a>
    <a href="https://www.youtube.com/jamesbeckwith1" target="_blank" rel="noopener">YouTube</a>
    <a href="https://www.facebook.com/jamesbeckwith" target="_blank" rel="noopener">Facebook</a>
    <hr>
    <button data-cleanup>Clean Up</button>
    <button data-arrange-name>Arrange by Name</button>
    <hr>
    <button data-open="trash">Open Trash</button>
    <button data-empty-trash>Empty Trash</button>
    <hr>
    <button data-close-all>Close all windows</button>
  </div>

  <div class="menu status-menu" id="m-app" hidden>
    <button class="disabled" disabled>Finder</button>
    <hr>
    <button data-close-all>Hide others</button>
    <button data-close-all>Close all windows</button>
  </div>

  <div class="menu status-menu vol-menu" id="m-vol" hidden>
    <div class="vol-panel">
      <span class="vol-label">Sound</span>
      <div class="vol-slider" role="slider" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0" aria-label="Volume" tabindex="0">
        <div class="vol-rail">
          <i class="vol-fill"></i>
          <b class="vol-thumb"></b>
        </div>
        <div class="vol-ends" aria-hidden="true"><span>Max</span><span>Min</span></div>
      </div>
      <button type="button" class="vol-mute checked" data-vol-mute>Mute</button>
    </div>
  </div>

  <div class="menu status-menu" id="m-clock" hidden>
    <button type="button" id="menubar-date" class="disabled" disabled></button>
    <hr>
    <button type="button" data-clock-fmt>12-hour clock</button>
  </div>
