const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3011";

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  desktop.on("pageerror", (error) => errors.push(error.message));
  desktop.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await desktop.goto(`${baseUrl}/messages`, { waitUntil: "networkidle" });
  await desktop.screenshot({ path: "chat-no-outer-border.png", fullPage: true });
  const backButtonRemoved = await desktop.locator(".customer-profile-back").count() === 0;
  const initiallyCollapsed = await desktop.locator(".customer-navigation-rail:not(.expanded)").isVisible();
  await desktop.getByRole("button", { name: "Expand navigation" }).click();
  const expanded = await desktop.locator(".customer-navigation-rail.expanded").isVisible();
  const expandedLabelsVisible = await desktop.locator(".customer-navigation-rail.expanded .customer-navigation-item span").first().isVisible();
  await desktop.getByRole("button", { name: "Collapse navigation" }).click();
  const collapsed = await desktop.locator(".customer-navigation-rail:not(.expanded)").isVisible();
  const desktopOverflow = await desktop.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const shellPadding = await desktop.locator(".messenger-shell").evaluate((element) => getComputedStyle(element).padding);
  const cameraControlsRemoved = await desktop.getByRole("button", { name: "Take a photo" }).count() === 0 && await desktop.getByRole("button", { name: "Record a video" }).count() === 0;
  const moreOptions = desktop.getByRole("button", { name: "More chat options" });
  await moreOptions.click();
  const composerMenu = desktop.locator(".composer-menu");
  const composerMenuItems = await composerMenu.getByRole("button").allTextContents();
  const composerMenuWorks = composerMenuItems.includes("Calendar") && composerMenuItems.some((item) => item.includes("Mute") || item.includes("Unmute"));
  await moreOptions.click();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  mobile.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await mobile.goto(`${baseUrl}/messages`, { waitUntil: "networkidle" });
  const mobileOpen = await mobile.locator(".customer-navigation-rail").isVisible();
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await browser.close();
  console.log(JSON.stringify({ backButtonRemoved, initiallyCollapsed, collapsed, expanded, expandedLabelsVisible, mobileOpen, cameraControlsRemoved, composerMenuWorks, shellPadding, desktopOverflow, mobileOverflow, errors }, null, 2));
  if (!backButtonRemoved || !initiallyCollapsed || !collapsed || !expanded || !expandedLabelsVisible || !mobileOpen || !cameraControlsRemoved || !composerMenuWorks || shellPadding !== "0px" || desktopOverflow || mobileOverflow || errors.length) process.exitCode = 1;
})();
