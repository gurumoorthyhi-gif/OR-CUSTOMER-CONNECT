const { chromium } = require("playwright");

const url = process.env.KMS_ERP_URL || "http://127.0.0.1:8020/";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: "kms-dtf-erp-production-frontend.png", fullPage: true });

  const state = await page.evaluate(() => ({
    url: location.href,
    text: document.body.innerText.slice(0, 700),
    hasDashboard: document.body.innerText.includes("Dashboard"),
    hasProduction: document.body.innerText.includes("Production"),
    hasLogin: document.body.innerText.includes("Welcome back"),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));

  await browser.close();
  console.log(JSON.stringify({ ...state, errors }, null, 2));
})();
