const assert = require('node:assert/strict');
const { chromium } = require('../apps/web/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto('http://127.0.0.1:3011/new-order');
    await page.getByText('Backend: Connected', { exact: true }).waitFor();
    await page.getByText('Background removal: Unavailable', { exact: true }).waitFor();
    assert.match(await page.locator('.connection-setup').innerText(), /network permissions/);
    await page.screenshot({ path: 'runtime/connection-startup-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'runtime/connection-startup-mobile.png' });
    const banner = page.locator('.connection-setup');
    assert.equal(await banner.evaluate(element => element.scrollWidth <= element.clientWidth), true);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.locator('input[type=file]').first().setInputFiles('apps/web/kms-dtf-erp-production-frontend.png');
    await page.locator('.artwork-thumbnail').first().click();
    assert.equal(await page.getByRole('button', { name: 'Background remove', exact: true }).isDisabled(), true);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: 'runtime/connection-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'runtime/connection-mobile.png' });

    await page.goto('http://127.0.0.1:3011/new-order');
    await page.route('**/health', route => route.abort());
    await page.getByRole('button', { name: 'Check connections again' }).click();
    await page.getByText('Backend: Unavailable', { exact: true }).waitFor();
    await page.unroute('**/health');
    const service = { ready: true, state: 'ready', message: 'Connected' };
    await page.route('**/api/image-processing/health', route => route.fulfill({ json: { background: service, upscale: service } }));
    await page.getByRole('button', { name: 'Check connections again' }).click();
    await page.getByText('Services connected', { exact: true }).waitFor();
    console.log('PASS: startup reports blocked workers; tools disabled; backend disconnect and reconnection verified.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
