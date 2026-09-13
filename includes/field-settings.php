<template id="tpl-field-settings" data-title="Pixel Field" data-w="420" data-h="520" data-info="Settings|Desktop">
  <div class="doc field-settings" data-field-settings>
    <h2>Pixel Field</h2>
    <p class="sub">Desktop atmosphere</p>
    <p>Tweak the Omarchy-style pixel field. Changes apply live and save to this browser.</p>

    <label class="field-row">
      <span>Pixel size <em data-fs-val="cellSize"></em></span>
      <input type="range" min="6" max="16" step="1" data-fs="cellSize">
    </label>
    <label class="field-row">
      <span>Cursor glow <em data-fs-val="cursorGlow"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="cursorGlow">
    </label>
    <label class="field-row">
      <span>Cursor reach <em data-fs-val="cursorReach"></em></span>
      <input type="range" min="6" max="24" step="1" data-fs="cursorReach">
    </label>
    <label class="field-row">
      <span>Cursor trail <em data-fs-val="trail"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="trail">
    </label>
    <label class="field-row">
      <span>Click ripples <em data-fs-val="clickPower"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="clickPower">
    </label>
    <label class="field-row">
      <span>Ambient dust <em data-fs-val="ambient"></em></span>
      <input type="range" min="0" max="1.2" step="0.05" data-fs="ambient">
    </label>
    <label class="field-row">
      <span>EQ amount <em data-fs-val="eqAmount"></em></span>
      <input type="range" min="0" max="1.2" step="0.05" data-fs="eqAmount">
    </label>
    <label class="field-row">
      <span>EQ bands <em data-fs-val="eqBands"></em></span>
      <input type="range" min="4" max="24" step="1" data-fs="eqBands">
    </label>
    <label class="field-row">
      <span>Idle motion <em data-fs-val="motion"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="motion">
    </label>

    <div class="field-actions">
      <button type="button" class="field-btn" data-fs-reset>Reset defaults</button>
    </div>
  </div>
</template>
