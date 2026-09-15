<div class="menubar">
    <button type="button" class="mark" data-open="about" aria-label="About James Beckwith">
      <img src="img/icons/jb-white.webp" width="20" height="20" alt="">
    </button>

    <div class="menus">
      <button class="menu-title" data-menu="m-file" aria-expanded="false" aria-haspopup="true">File</button>
      <button class="menu-title" data-menu="m-edit" aria-expanded="false" aria-haspopup="true">Listen</button>
      <button class="menu-title" data-menu="m-go" aria-expanded="false" aria-haspopup="true">Go</button>
      <button class="menu-title" data-menu="m-socials" aria-expanded="false" aria-haspopup="true">Socials</button>
    </div>
    <div class="status">
      <button type="button" class="status-btn reset-menu-btn" data-menu="m-reset" aria-expanded="false" aria-haspopup="true" aria-label="Reset Desktop" title="Reset Desktop" id="status-reset">
        <svg class="icon-reset" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.75.75 0 0 1 1.36-.632A6.5 6.5 0 1 1 8 1.5V0l3 2.25-3 2.25V3z" clip-rule="evenodd"/>
        </svg>
      </button>
      <button type="button" class="status-btn theme-menu-btn" data-menu="m-theme" aria-expanded="false" aria-haspopup="true" aria-label="Appearance" title="Appearance" id="status-theme">
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M12 1.8v2.7M12 19.5v2.7M1.8 12h2.7M19.5 12h2.7M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M4.8 19.2l1.9-1.9M17.3 6.7l1.9-1.9"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="menu" id="m-file" hidden>
    <button data-open="about">About James Beckwith</button>
    <button data-open="contact">Contact&hellip;</button>
    <button type="button" data-eq-toggle>EQ Visualiser</button>
    <hr>
    <button type="button" data-cleanup>Clean Up</button>
    <button type="button" data-arrange-name>Arrange by Name</button>
    <button type="button" data-close-all>Close all windows</button>
    <hr>
    <button type="button" data-empty-trash>Empty Trash</button>
  </div>

  <div class="menu" id="m-edit" hidden>
    <a href="https://jamesbeckwith.bandcamp.com/album/se10" target="_blank" rel="noopener">SE10</a>
    <a href="https://jamesbeckwith.bandcamp.com/album/long-distance" target="_blank" rel="noopener">Long Distance</a>
    <hr>
    <a href="https://music.apple.com/gb/artist/james-beckwith/1499185416" target="_blank" rel="noopener">Apple Music</a>
    <a href="https://jamesbeckwith.bandcamp.com" target="_blank" rel="noopener">Bandcamp</a>
    <a href="https://open.qobuz.com/artist/2999610" target="_blank" rel="noopener">QoBuz</a>
    <a href="https://open.spotify.com/artist/2IKevWKWuhVBPlg7QtBDOd" target="_blank" rel="noopener">Spotify</a>
    <a href="https://tidal.com/artist/12732103" target="_blank" rel="noopener">Tidal</a>
  </div>

  <div class="menu" id="m-go" hidden>
    <button data-open="labs">Labs</button>
    <button data-open="maps">Maps</button>
    <button data-open="videos">Videos</button>
    <button data-open="football">Football</button>
    <button data-open="piano">Piano Repair</button>
    <hr>
    <button data-open="contact">contact.me</button>
    <button data-open="promo">promo.png</button>
  </div>

  <div class="menu" id="m-socials" hidden>
    <a href="https://www.instagram.com/iamjamesbeckwith" target="_blank" rel="noopener">Instagram</a>
    <a href="https://www.youtube.com/jamesbeckwith1" target="_blank" rel="noopener">YouTube</a>
    <a href="https://www.facebook.com/jamesbeckwith" target="_blank" rel="noopener">Facebook</a>
    <a href="https://jamesbeckwith.bandcamp.com" target="_blank" rel="noopener">Bandcamp</a>
  </div>

  <div class="menu status-menu reset-menu" id="m-reset" hidden>
    <button type="button" data-reset-desk>Reset Desktop</button>
  </div>

  <div class="menu status-menu theme-menu" id="m-theme" hidden>
    <button type="button" data-theme-set="auto" class="theme-choice-btn">
      <span class="theme-check" aria-hidden="true">&#10003;</span>
      <svg class="theme-icon icon-auto" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zM3.75 12A8.25 8.25 0 0112 3.75v16.5A8.25 8.25 0 013.75 12z" clip-rule="evenodd"/>
      </svg>
      <span class="theme-label">Auto</span>
    </button>
    <button type="button" data-theme-set="light" class="theme-choice-btn">
      <span class="theme-check" aria-hidden="true">&#10003;</span>
      <svg class="theme-icon icon-sun" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M12 1.8v2.7M12 19.5v2.7M1.8 12h2.7M19.5 12h2.7M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M4.8 19.2l1.9-1.9M17.3 6.7l1.9-1.9"/></svg>
      <span class="theme-label">Light Mode</span>
    </button>
    <button type="button" data-theme-set="dark" class="theme-choice-btn">
      <span class="theme-check" aria-hidden="true">&#10003;</span>
      <svg class="theme-icon icon-moon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>
      </svg>
      <span class="theme-label">Dark Mode</span>
    </button>
  </div>
