const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3011";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const results = {};
  for (const section of ["level", "addresses", "settings"]) {
    await page.goto(`${baseUrl}/profile?section=${section}`, { waitUntil: "networkidle" });
    results[section] = await page.locator(".customer-navigation-item.active").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));
  }
  await browser.close();
  console.log(JSON.stringify({ results, errors }, null, 2));
  if (errors.length || Object.values(results).some((active) => active.length !== 1)) process.exitCode = 1;
})();
