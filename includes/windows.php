<!-- ================================ windows =============================== -->
<template id="tpl-labs" data-title="Labs" data-w="680" data-h="460" data-info="10 items|Experiments">
  <div class="items"></div>
</template>

<template id="tpl-maps" data-title="Maps" data-w="660" data-h="420" data-info="4 items|London Underground, venues, gigs">
  <div class="items"></div>
</template>

<template id="tpl-music" data-title="Music" data-w="560" data-h="400" data-info="3 items|Bandcamp &amp; streaming">
  <div class="items"></div>
</template>

<template id="tpl-stream" data-title="Streaming" data-w="640" data-h="400" data-info="4 items|Listen">
  <div class="items"></div>
</template>

<template id="tpl-videos" data-title="Videos" data-w="680" data-h="460" data-info="6 items|YouTube">
  <div class="items" id="video-items"></div>
</template>

<template id="tpl-football" data-title="Football" data-w="520" data-h="330" data-info="2 items|Arsenal">
  <div class="doc" style="max-width:none">
    <p>Two sites built for the Arsenal fandom. Both answer one question, precisely.</p>
    <div class="items" style="margin-top:18px"></div>
  </div>
</template>

<template id="tpl-piano" data-title="Piano Repair" data-w="540" data-h="360" data-info="2 items|Greenwich">
  <div class="doc" style="max-width:none">
    <p>Servicing and restoration of Fender Rhodes, Wurlitzer, Hohner Clavinet and Pianet. Tuning and repair of Steinway, Yamaha and other acoustic pianos.</p>
    <div class="items" style="margin-top:18px"></div>
  </div>
</template>

<?php require __DIR__ . '/about.php'; ?>
<?php require __DIR__ . '/contact.php'; ?>

<template id="tpl-trash" data-title="Trash" data-w="480" data-h="340" data-info="0 items|Desktop">
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

<template id="tpl-se10-png" data-title="se10.png" data-w="520" data-h="560" data-info="1 item|PNG image" data-nopad="1">
  <img class="fit" src="img/se10.png" alt="SE10">
</template>
