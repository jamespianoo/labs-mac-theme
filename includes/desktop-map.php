<?php $fieldTrack = is_file(__DIR__ . '/../data/field-track.json') ? 'data/field-track.json' : ''; ?>
<div class="pixel-field" aria-hidden="true"<?= $fieldTrack !== '' ? ' data-track="' . htmlspecialchars($fieldTrack, ENT_QUOTES, 'UTF-8') . '"' : '' ?>>
  <canvas class="pixel-field-canvas" width="800" height="600"></canvas>
</div>
