const { chromium } = require("playwright");

async function main() {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3000/admin/messages", { waitUntil: "domcontentloaded" });

  const triggers = page.locator(".message-menu-trigger");
  await triggers.first().waitFor();
  let noteButton = null;
  for (let index = await triggers.count() - 1; index >= 0; index -= 1) {
    await triggers.nth(index).click({ force: true });
    const candidate = page.getByRole("button", { name: "Add text to note" });
    if (await candidate.isVisible()) {
      noteButton = candidate;
      break;
    }
  }
  if (!noteButton) throw new Error("No note action was available");
  await noteButton.click();

  const dialog = page.getByRole("dialog", { name: "Add text to note" });
  await dialog.waitFor();
  await dialog.locator("textarea").fill("Internal artwork follow-up");
  await dialog.screenshot({ path: "note-dialog-preview.png" });
  const counter = await dialog.locator("small").textContent();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  const closed = await dialog.isHidden();

  const result = { opened: true, counter, closed, errors };
  console.log(JSON.stringify(result));
  await browser.close();
  if (!closed || errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
