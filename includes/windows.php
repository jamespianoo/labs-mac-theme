<!-- ================================ windows =============================== -->
<template id="tpl-labs" data-title="Labs" data-w="680" data-h="440" data-info="4 items|Weird projects">
  <div class="items">
    <button class="item" data-open="maps"><span class="art"><img src="img/icons/folder-map.webp" width="128" height="128" alt=""></span><span class="label">Maps</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/solar-system/"><span class="art site"><img src="img/icons/sites/labs-app.webp" width="128" height="128" alt=""></span><span class="label">Solar System</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/ganymede-synth-engine/"><span class="art site"><img src="img/icons/sites/labs-app.webp" width="128" height="128" alt=""></span><span class="label">Ganymede</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/flight-radar/"><span class="art site"><img src="img/icons/sites/labs-app.webp" width="128" height="128" alt=""></span><span class="label">Flight Radar</span></button>
  </div>
</template>

<template id="tpl-maps" data-title="Maps" data-w="626" data-h="404" data-info="3 items|London Underground, venues, gigs">
  <div class="items">
    <button class="item" data-href="https://labs.jamesbeckwith.com/tubemap/demo.php"><span class="art site"><img src="img/icons/sites/tube-symphony.webp" width="128" height="128" alt=""></span><span class="label">Tube Symphony</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/gig-map/"><span class="art site"><img src="img/icons/sites/gig-map.webp" width="128" height="128" alt=""></span><span class="label">Gig Map</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/dead-venues/"><span class="art site"><img src="img/icons/sites/dead-venues.webp" width="128" height="128" alt=""></span><span class="label">dead-venues.map</span></button>
  </div>
</template>

<template id="tpl-music" data-title="Music" data-w="560" data-h="360" data-info="2 items|Albums">
  <div class="items">
    <button class="item" data-open="album-se10"><span class="art"><img src="img/icons/sound.webp" width="128" height="128" alt=""></span><span class="label">SE10</span></button>
    <button class="item" data-open="album-ld"><span class="art"><img src="img/icons/sound.webp" width="128" height="128" alt=""></span><span class="label">Long Distance</span></button>
  </div>
</template>

<template id="tpl-player" data-title="SE10.aiff" data-w="420" data-h="300" data-info="Sound|Stereo|44.1 kHz">
  <div class="player">
    <div class="player-art"><img src="img/promo.png" data-promo alt=""></div>
    <div class="player-meta">
      <h2>SE10</h2>
      <p class="sub">James Beckwith</p>
      <p class="player-status" data-player-status>Stopped</p>
      <div class="player-controls">
        <button type="button" class="player-btn" data-player-play aria-label="Play">&#9654;</button>
        <div class="player-track" aria-hidden="true"><i data-player-bar></i></div>
      </div>
      <ul class="linklist player-links">
        <li><a href="https://jamesbeckwith.bandcamp.com/album/se10" target="_blank" rel="noopener">Bandcamp &rarr;</a></li>
        <li><a href="https://open.spotify.com/artist/2IKevWKWuhVBPlg7QtBDOd" target="_blank" rel="noopener">Spotify &rarr;</a></li>
      </ul>
    </div>
  </div>
</template>

<template id="tpl-album-se10" data-title="SE10" data-w="470" data-h="380" data-info="Album|Bandcamp, Spotify, Apple, Tidal, Qobuz">
  <div class="doc">
    <h2>SE10</h2>
    <p class="sub">James Beckwith</p>
    <p>Named for the postcode it was written in. Greenwich, south east London.</p>
    <ul class="linklist">
      <li><a href="https://jamesbeckwith.bandcamp.com/album/se10" target="_blank" rel="noopener">Bandcamp &rarr;</a></li>
      <li><a href="https://open.spotify.com/artist/2IKevWKWuhVBPlg7QtBDOd" target="_blank" rel="noopener">Spotify &rarr;</a></li>
      <li><a href="https://music.apple.com/gb/artist/james-beckwith/1499185416" target="_blank" rel="noopener">Apple Music &rarr;</a></li>
      <li><a href="https://tidal.com/artist/12732103" target="_blank" rel="noopener">Tidal &rarr;</a></li>
      <li><a href="https://open.qobuz.com/artist/2999610" target="_blank" rel="noopener">Qobuz &rarr;</a></li>
    </ul>
  </div>
</template>

<template id="tpl-album-ld" data-title="Long Distance" data-w="470" data-h="360" data-info="Album|Bandcamp, Spotify, Apple, Tidal, Qobuz">
  <div class="doc">
    <h2>Long Distance</h2>
    <p class="sub">James Beckwith</p>
    <p>Piano, synthesiser and composition.</p>
    <ul class="linklist">
      <li><a href="https://jamesbeckwith.bandcamp.com/album/long-distance" target="_blank" rel="noopener">Bandcamp &rarr;</a></li>
      <li><a href="https://open.spotify.com/artist/2IKevWKWuhVBPlg7QtBDOd" target="_blank" rel="noopener">Spotify &rarr;</a></li>
      <li><a href="https://music.apple.com/gb/artist/james-beckwith/1499185416" target="_blank" rel="noopener">Apple Music &rarr;</a></li>
    </ul>
  </div>
</template>

<template id="tpl-videos" data-title="Videos" data-w="600" data-h="420" data-info="6 items|YouTube">
  <div class="items" id="video-items"></div>
</template>

<template id="tpl-football" data-title="Football" data-w="520" data-h="330" data-info="2 items|Arsenal">
  <div class="doc" style="max-width:none">
    <p>Two sites built for the Arsenal fandom. Both answer one question, precisely.</p>
    <div class="items" style="margin-top:18px">
      <button class="item" data-href="https://www.whenissttotteringhamsday.com"><span class="art site"><img src="img/icons/sites/st-totteringham.webp" width="128" height="128" alt=""></span><span class="label">St Totteringham&#39;s Day</span></button>
      <button class="item" data-href="https://www.whenisinvinciblesday.com"><span class="art site"><img src="img/icons/sites/invincibles.webp" width="128" height="128" alt=""></span><span class="label">Invincibles Day</span></button>
    </div>
  </div>
</template>

<template id="tpl-piano" data-title="Piano Repair" data-w="540" data-h="360" data-info="2 items|Greenwich">
  <div class="doc" style="max-width:none">
    <p>Servicing and restoration of Fender Rhodes, Wurlitzer, Hohner Clavinet and Pianet. Tuning and repair of Steinway, Yamaha and other acoustic pianos.</p>
    <div class="items" style="margin-top:18px">
      <button class="item" data-href="https://www.jupitervintagepianos.com"><span class="art site"><img src="img/icons/sites/jupiter.webp" width="128" height="128" alt=""></span><span class="label">Jupiter Vintage Pianos</span></button>
      <button class="item" data-href="https://www.greenwichpianotuner.co.uk"><span class="art site"><img src="img/icons/sites/greenwich-piano.webp" width="128" height="128" alt=""></span><span class="label">Greenwich Piano Services</span></button>
    </div>
  </div>
</template>

<?php require __DIR__ . '/about.php'; ?>
<?php require __DIR__ . '/contact.php'; ?>

<template id="tpl-trash" data-title="Trash" data-w="480" data-h="340" data-info="4 items|Desktop">
  <div class="items" id="trash-items">
    <p class="empty-trash">The Trash is empty.</p>
  </div>
</template>

<template id="tpl-egg" data-title="Congratulations!" data-w="440" data-h="320" data-info="Special|Easter egg">
  <div class="doc egg">
    <p class="egg-kicker" aria-hidden="true">&#9733;</p>
    <h2>Congratulations!</h2>
    <p class="sub">You emptied the Trash</p>
    <p class="egg-lead">Somehow you tidied a desk that was never meant to stay tidy.</p>
    <!-- Easter egg body — format reserved; content TBD -->
    <div class="egg-slot" data-egg-slot>
      <p class="egg-todo">[ Easter egg content TBD ]</p>
    </div>
    <p class="egg-meta" data-egg-meta></p>
    <button type="button" class="egg-ok" data-egg-dismiss>OK</button>
  </div>
</template>

<template id="tpl-promo" data-title="promo.png" data-w="520" data-h="560" data-info="1 item|PNG image" data-nopad="1">
  <img class="fit" src="img/promo.png" data-promo alt="James Beckwith">
</template>
