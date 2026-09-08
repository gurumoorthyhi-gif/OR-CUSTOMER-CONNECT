const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3000";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    permissions: ["notifications"],
    viewport: { width: 1280, height: 820 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${baseUrl}/admin/messages`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("odd-raven-notifications-staff", "on");
    localStorage.setItem("odd-raven-notification-sound-staff", "on");
  });
  await page.reload({ waitUntil: "networkidle" });
  const firstMessageId = await page.locator("article.bubble[id]").first().evaluate((node) => node.id.replace("message-", ""));
  await page.goto(`${baseUrl}/admin/messages?message=${firstMessageId}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.locator(".sidebar-menu-button").click();

  const state = await page.evaluate(() => ({
    title: document.title,
    hasSettings: Array.from(document.querySelectorAll(".conversation-menu button")).some((button) =>
      button.textContent?.includes("Notifications") || button.textContent?.includes("Sound"),
    ),
    highlighted: Boolean(document.querySelector(".bubble.search-highlight")),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));

  await page.screenshot({ path: "notification-message-focus.png", fullPage: true });
  await browser.close();

  console.log(JSON.stringify({ ...state, errors }, null, 2));
})();
