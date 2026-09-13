import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:8080/index.php');
  await page.waitForTimeout(1000);

  // Check promo.png hover
  const promo = page.locator('.icon:has-text("promo.png")').first();
  await promo.hover();
  await page.waitForTimeout(300);
  const promoBg = await page.evaluate(() => {
    const el = document.querySelector('.icon:has(.photo)');
    const art = el ? el.querySelector('.art') : null;
    const after = art ? window.getComputedStyle(art, '::after').display : null;
    return {
      artBg: art ? window.getComputedStyle(art).backgroundColor : null,
      afterDisplay: after
    };
  });
  console.log('Promo hover:', promoBg);

  // Check Videos folder hover
  const videos = page.locator('.icon:has-text("Videos")').first();
  await videos.hover();
  await page.waitForTimeout(300);
  const videosBg = await page.evaluate(() => {
    const el = document.querySelector('.icon:has(.ra-folder)');
    const art = el ? el.querySelector('.art') : null;
    return {
      artBg: art ? window.getComputedStyle(art).backgroundColor : null
    };
  });
  console.log('Videos hover:', videosBg);

  // Check normal folder hover (if any) or any other icon hover
  const iconResults = await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll('.desktop .icon'));
    return icons.map(ic => {
      const label = ic.querySelector('.label')?.textContent?.trim() || ic.querySelector('.ra-caption')?.textContent?.trim() || 'unnamed';
      const art = ic.querySelector('.art');
      return {
        label,
        classes: art ? art.className : ''
      };
    });
  });
  console.log('Desktop icons:', iconResults);

  // Take screenshot of desktop hovering Videos and promo
  await videos.hover();
  await page.screenshot({ path: 'videos-hover.png' });
  await promo.hover();
  await page.screenshot({ path: 'promo-hover.png' });

  // Open Piano Repair window
  const pianoFolder = page.locator('.icon:has-text("Piano Repair")').first();
  if (await pianoFolder.count() > 0) {
    await pianoFolder.dblclick();
    await page.waitForTimeout(800);
    const pianoWindowItem = page.locator('.window .item:has-text("greenwich-piano.html")').first();
    if (await pianoWindowItem.count() > 0) {
      await pianoWindowItem.hover();
      await page.waitForTimeout(300);
      const itemStyles = await page.evaluate(() => {
        const item = document.querySelector('.window .item:has(.art)');
        const art = item ? item.querySelector('.art') : null;
        const after = art ? window.getComputedStyle(art, '::after').display : null;
        return {
          itemBg: item ? window.getComputedStyle(item).backgroundColor : null,
          artBg: art ? window.getComputedStyle(art).backgroundColor : null,
          afterDisplay: after
        };
      });
      console.log('Piano item hover styles in window:', itemStyles);
      await page.screenshot({ path: 'window-piano-hover.png' });
    }
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
