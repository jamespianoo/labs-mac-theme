const { chromium } = require('/tmp/node_modules/playwright');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:8777/index.php');
  await page.waitForTimeout(1000);

  // Check promo.png hover
  const promo = page.locator('.icon[data-id="promo"]').first();
  await promo.hover({ force: true });
  await page.waitForTimeout(200);
  const promoBg = await page.evaluate(() => {
    const el = document.querySelector('.icon[data-id="promo"]');
    const art = el ? el.querySelector('.art') : null;
    const after = art ? window.getComputedStyle(art, '::after').display : null;
    return {
      artBg: art ? window.getComputedStyle(art).backgroundColor : null,
      afterDisplay: after
    };
  });
  console.log('Promo hover:', promoBg);

  // Check Videos folder hover
  const videos = page.locator('.icon[data-id="videos"]').first();
  await videos.hover({ force: true });
  await page.waitForTimeout(200);
  const videosBg = await page.evaluate(() => {
    const el = document.querySelector('.icon[data-id="videos"]');
    const art = el ? el.querySelector('.art') : null;
    return {
      artBg: art ? window.getComputedStyle(art).backgroundColor : null,
      parentHover: el ? window.getComputedStyle(el).backgroundColor : null
    };
  });
  console.log('Videos hover full details:', JSON.stringify(videosBg, null, 2));

  await videos.hover({ force: true });
  await page.screenshot({ path: 'videos-hover.png' });
  await promo.hover({ force: true });
  await page.screenshot({ path: 'promo-hover.png' });

  // Open Piano Repair window
  console.log('Opening piano window...');
  const winDetails = await page.evaluate(() => {
    if (window.JB && window.JB.open) {
      window.JB.open('piano');
    }
    const win = document.querySelector('.win');
    return {
      hasWin: !!win,
      winHtml: win ? win.outerHTML.slice(0, 500) : null,
      shelvedCount: document.getElementById('shelved')?.children?.length,
      shelvedPiano: Array.from(document.getElementById('shelved')?.children || []).filter(c => c.dataset.shelf === 'piano').map(c => c.dataset.id),
      dOpen: Object.keys(window.JBDesk ? window.JBDesk.open || {} : {})
    };
  });
  console.log('Window details:', winDetails);

  await page.waitForTimeout(500);

  const pianoItemStyles = await page.evaluate(() => {
    const item = document.querySelector('.win .item');
    if (!item) return null;
    const art = item.querySelector('.art');
    const after = art ? window.getComputedStyle(art, '::after') : null;
    return {
      itemText: item.textContent.trim(),
      itemBg: window.getComputedStyle(item).backgroundColor,
      artBg: art ? window.getComputedStyle(art).backgroundColor : null,
      afterDisplay: after ? after.display : null,
      afterBg: after ? after.backgroundColor : null
    };
  });
  console.log('Piano item normal styles:', pianoItemStyles);

  // Now hover greenwich-piano in the window
  const greenwichLoc = page.locator('.win .item:has-text("greenwich-piano.html")').first();
  if (await greenwichLoc.count() > 0) {
    await greenwichLoc.hover({ force: true });
    await page.waitForTimeout(300);
    const hoveredGreenwichStyles = await page.evaluate(() => {
      const item = document.querySelector('.win .item:has-text("greenwich-piano.html")');
      if (!item) return null;
      const art = item.querySelector('.art');
      const after = art ? window.getComputedStyle(art, '::after') : null;
      return {
        itemBg: window.getComputedStyle(item).backgroundColor,
        artBg: art ? window.getComputedStyle(art).backgroundColor : null,
        afterDisplay: after ? after.display : null,
        afterBg: after ? after.backgroundColor : null
      };
    });
    console.log('Greenwich piano hovered styles:', hoveredGreenwichStyles);
    await page.screenshot({ path: 'greenwich-piano-hovered.png' });

    // Now click to select it
    await greenwichLoc.click({ force: true });
    await page.waitForTimeout(300);
    const selectedGreenwichStyles = await page.evaluate(() => {
      const item = document.querySelector('.win .item:has-text("greenwich-piano.html")');
      if (!item) return null;
      const art = item.querySelector('.art');
      const label = item.querySelector('.label');
      const after = art ? window.getComputedStyle(art, '::after') : null;
      return {
        itemBg: window.getComputedStyle(item).backgroundColor,
        artBg: art ? window.getComputedStyle(art).backgroundColor : null,
        labelBg: label ? window.getComputedStyle(label).backgroundColor : null,
        labelColor: label ? window.getComputedStyle(label).color : null,
        afterDisplay: after ? after.display : null
      };
    });
    console.log('Greenwich piano selected styles:', selectedGreenwichStyles);
    await page.screenshot({ path: 'greenwich-piano-selected.png' });
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
