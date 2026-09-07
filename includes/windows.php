<!-- ================================ windows =============================== -->
<template id="tpl-maps" data-title="Maps" data-w="626" data-h="404" data-info="3 items|London Underground, venues, gigs|Labs">
  <div class="items">
    <button class="item" data-href="https://labs.jamesbeckwith.com/tubemap/demo.php"><svg><use href="#i-route"/></svg><span class="label">Tube Symphony</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/gig-map/"><svg><use href="#i-pin"/></svg><span class="label">Gig Map</span></button>
    <button class="item" data-href="https://labs.jamesbeckwith.com/dead-venues/"><svg><use href="#i-ghost"/></svg><span class="label">Dead Venues</span></button>
  </div>
</template>

<template id="tpl-music" data-title="Music" data-w="560" data-h="360" data-info="2 items|Albums">
  <div class="items">
    <button class="item" data-open="album-se10"><svg><use href="#i-play"/></svg><span class="label">SE10</span></button>
    <button class="item" data-open="album-ld"><svg><use href="#i-play"/></svg><span class="label">Long Distance</span></button>
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
      <button class="item" data-href="https://www.whenissttotteringhamsday.com"><svg><use href="#i-globe"/></svg><span class="label">St Totteringham&#39;s Day</span></button>
      <button class="item" data-href="https://www.whenisinvinciblesday.com"><svg><use href="#i-globe"/></svg><span class="label">Invincibles Day</span></button>
    </div>
  </div>
</template>

<template id="tpl-piano" data-title="Piano Repair" data-w="540" data-h="360" data-info="2 items|Greenwich">
  <div class="doc" style="max-width:none">
    <p>Servicing and restoration of Fender Rhodes, Wurlitzer, Hohner Clavinet and Pianet. Tuning and repair of Steinway, Yamaha and other acoustic pianos.</p>
    <div class="items" style="margin-top:18px">
      <button class="item" data-href="https://www.jupitervintagepianos.com"><svg><use href="#i-globe"/></svg><span class="label">Jupiter Vintage Pianos</span></button>
      <button class="item" data-href="https://www.greenwichpianotuner.co.uk"><svg><use href="#i-globe"/></svg><span class="label">Greenwich Piano Services</span></button>
    </div>
  </div>
</template>

<template id="tpl-about" data-title="About" data-w="580" data-h="430" data-info="Read only|jamesbeckwith.com">
  <div class="doc">
    <figure class="portrait">
      <img src="img/promo.png" data-promo alt="James Beckwith">
      <figcaption>promo.png</figcaption>
    </figure>
    <h2>James Beckwith</h2>
    <p class="sub">Piano &amp; composition — London</p>
    <p>Jazz pianist, composer and piano technician based in Greenwich, south east London. Two albums out — SE10 and Long Distance — and a working life split between the bandstand and the workshop.</p>
    <p>Studied jazz at Leeds College of Music, then an MMus in Composition at Trinity Laban. Previously at Steinway &amp; Sons. Has headlined Ronnie Scott&#39;s and performed at Saffron Hall.</p>
    <hr>
    <p>Away from the piano stool: restoring Rhodes, Wurlitzer and Clavinet, tuning acoustics across south east London, and building map-based compositions — the Underground as a synthesiser, venues that no longer exist, the solar system as a score.</p>
  </div>
</template>

<template id="tpl-promo" data-title="promo.png" data-w="520" data-h="560" data-info="1 item|PNG image" data-nopad="1">
  <img class="fit" src="img/promo.png" data-promo alt="James Beckwith">
</template>
