const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3011";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${baseUrl}/messages`, { waitUntil: "networkidle" });
  await page.locator(".conversation-body").waitFor();
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => {
    const body = document.querySelector(".conversation-body");
    const bubbles = [...document.querySelectorAll(".conversation-body .bubble")];
    return {
      atLatest: Boolean(body && body.scrollTop + body.clientHeight >= body.scrollHeight - 4),
      scrollTop: body?.scrollTop ?? 0,
      scrollHeight: body?.scrollHeight ?? 0,
      clientHeight: body?.clientHeight ?? 0,
      bubbleCount: bubbles.length,
      lastBubble: bubbles.at(-1)?.textContent?.trim() ?? "",
    };
  });
  state.errors = errors;
  await page.screenshot({ path: "chat-initial-latest.png", fullPage: true });
  await browser.close();
  console.log(JSON.stringify(state, null, 2));
  if (!state.atLatest || state.errors.length) process.exitCode = 1;
})();
