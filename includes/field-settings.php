<template id="tpl-field-settings" data-title="Pixel Field" data-w="440" data-h="600" data-info="Settings|Desktop">
  <div class="doc field-settings" data-field-settings>
    <h2>Pixel Field</h2>
    <p class="sub">Desktop atmosphere</p>
    <p>Changes apply live and save to this browser. Click the name on the desktop to replay its entrance.</p>

    <h3 class="field-group">Name</h3>
    <label class="field-row">
      <span>Entrance</span>
      <select data-fs="entrance">
        <option value="random">Random each time</option>
        <option value="none">None</option>
      </select>
    </label>
    <label class="field-row">
      <span>Entrance speed <em data-fs-val="entranceSpeed"></em></span>
      <input type="range" min="0.4" max="2.5" step="0.05" data-fs="entranceSpeed">
    </label>
    <label class="field-row">
      <span>Shading</span>
      <select data-fs="nameShade">
        <option value="gradient">Coral gradient</option>
        <option value="ivory">Ivory to coral</option>
        <option value="solid">Solid coral</option>
      </select>
    </label>

    <h3 class="field-group">Field</h3>
    <label class="field-row">
      <span>Pixel size <em data-fs-val="cellSize"></em></span>
      <input type="range" min="5" max="14" step="1" data-fs="cellSize">
    </label>
    <label class="field-row">
      <span>Dust <em data-fs-val="density"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="density">
    </label>
    <label class="field-row">
      <span>Twinkle <em data-fs-val="twinkle"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="twinkle">
    </label>
    <label class="field-row">
      <span>Grid <em data-fs-val="grid"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="grid">
    </label>
    <label class="field-row">
      <span>Grid square <em data-fs-val="gridCells"></em></span>
      <input type="range" min="3" max="12" step="1" data-fs="gridCells">
    </label>
    <label class="field-row">
      <span>Hi-fi EQ <em data-fs-val="music"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="music">
    </label>

    <h3 class="field-group">Interaction</h3>
    <label class="field-row">
      <span>Cursor glow <em data-fs-val="cursor"></em></span>
      <input type="range" min="0" max="2" step="0.05" data-fs="cursor">
    </label>
    <label class="field-row">
      <span>Piano size <em data-fs-val="stampSize"></em></span>
      <input type="range" min="0.5" max="2" step="0.05" data-fs="stampSize">
    </label>

    <div class="field-actions">
      <button type="button" class="field-btn" data-fs-replay>Replay entrance</button>
      <button type="button" class="field-btn" data-fs-reset>Reset defaults</button>
    </div>
  </div>
</template>
