const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3011";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${baseUrl}/admin/customers`, { waitUntil: "networkidle" });
  const row = page.locator('.staff-customer-row').first();
  const rowVisible = await row.isVisible();
  await row.locator('summary').click();
  const menu = row.locator('.staff-action-menu');
  const menuVisible = await menu.isVisible();
  const actionLabels = await menu.locator('a').allTextContents();
  await menu.getByText("Edit profile").click();
  await page.waitForURL(/\/admin\/customers\/OR-TN-0001$/);
  const editorVisible = await page.locator('.staff-customer-editor').isVisible();
  const fieldCount = await page.locator('.staff-customer-editor input, .staff-customer-editor select').count();
  const deliveryCodeReadOnly = await page.locator('input[readonly]').isVisible();
  await page.screenshot({ path: "staff-customer-editor.png", fullPage: true });
  await page.goto(`${baseUrl}/admin/messages`, { waitUntil: "networkidle" });
  await page.getByText("KMS", { exact: true }).first().waitFor({ timeout: 5000 });
  const staffChatUsesLiveName = await page.getByText("KMS", { exact: true }).first().isVisible();
  await page.locator('.customer-avatar img').first().waitFor({ state: "visible", timeout: 5000 });
  const staffChatUsesCustomerLogo = await page.locator('.customer-avatar img').first().isVisible();
  await page.getByRole("button", { name: "Conversation information" }).click();
  const staffInfo = page.locator('.chat-info-panel');
  await staffInfo.waitFor({ state: "visible", timeout: 5000 });
  const staffInfoText = await staffInfo.textContent();
  const staffInfoUsesDeliveryCode = staffInfoText.includes("LC-0001-KMS-CHN") && !staffInfoText.includes("OR-TN-0001");
  await page.screenshot({ path: "staff-chat-current.png", fullPage: true });
  await browser.close();
  console.log(JSON.stringify({ rowVisible, menuVisible, actionLabels, editorVisible, fieldCount, deliveryCodeReadOnly, staffChatUsesLiveName, staffChatUsesCustomerLogo, staffInfoUsesDeliveryCode, errors }, null, 2));
})();
