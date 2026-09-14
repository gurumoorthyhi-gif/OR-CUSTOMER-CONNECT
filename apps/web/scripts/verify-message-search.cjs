const { chromium } = require("playwright");

async function main() {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 760 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));

  const apiResponse = await context.request.get(
    "http://127.0.0.1:8000/api/messages/search?q=Hi&viewer_type=staff&limit=5",
  );
  const apiHits = await apiResponse.json();
  if (!apiHits.length) throw new Error("Search fixture did not return a message");
  const resultDate = new Date(`${apiHits[0].message.created_at}Z`).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  await page.goto("http://127.0.0.1:3000/admin/messages", { waitUntil: "domcontentloaded" });
  await page.locator(".chat-search input").fill("Hi");
  const firstResult = page.locator(".global-search-results > button").first();
  await firstResult.waitFor();
  const resultLabel = await firstResult.locator("b").textContent();
  await page.screenshot({ path: "global-message-search.png", fullPage: true });
  await firstResult.click();
  await page.locator(".bubble.search-highlight").waitFor();

  await page.getByRole("button", { name: "Search by date" }).click();
  const dateInput = page.locator(".date-search-popover input[type=date]");
  await dateInput.fill(resultDate);
  await page.locator(".message-search small").waitFor();
  await page.waitForFunction(() => document.querySelector(".message-search small")?.textContent !== "...");
  const dateCount = await page.locator(".message-search small").textContent();
  await page.screenshot({ path: "message-date-search.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Search by date" }).click();
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  const result = {
    apiStatus: apiResponse.status(),
    resultLabel,
    dateCount,
    errors,
    horizontalOverflow,
  };
  console.log(JSON.stringify(result));
  await browser.close();
  if (apiResponse.status() !== 200 || !resultLabel || dateCount === "0/0" || errors.length || horizontalOverflow) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
