const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3010";

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on("pageerror", (error) => errors.push(error.message));
  desktop.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const response = await desktop.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await desktop.screenshot({ path: "dashboard-desktop.png", fullPage: true });
  const desktopState = await desktop.evaluate(() => ({
    path: window.location.pathname,
    heading: document.querySelector("h1")?.textContent,
    kpis: document.querySelectorAll(".dashboard-kpi").length,
    quickActions: document.querySelectorAll(".dashboard-quick-card").length,
    railVisible: Boolean(document.querySelector(".customer-navigation-rail")),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  const initiallyCollapsed = await desktop.locator(".customer-navigation-rail:not(.expanded)").isVisible();
  await desktop.getByRole("button", { name: "Expand navigation" }).click();
  const expandedSidebar = await desktop.locator(".customer-navigation-rail.expanded").isVisible();
  const expandedLabelsVisible = await desktop.locator(".customer-navigation-rail.expanded .customer-navigation-item span").first().isVisible();
  await desktop.getByRole("button", { name: "Collapse navigation" }).click();
  const collapsedSidebar = await desktop.locator(".customer-navigation-rail:not(.expanded)").isVisible();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  mobile.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await mobile.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  const drawerOpen = await mobile.locator(".customer-navigation-rail").isVisible();
  await mobile.screenshot({ path: "dashboard-mobile.png", fullPage: true });
  const mobileState = await mobile.evaluate(() => ({
    drawerOpen: Boolean(document.querySelector(".customer-navigation-rail")),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  await browser.close();
  console.log(JSON.stringify({ status: response?.status(), desktop: { ...desktopState, initiallyCollapsed, collapsedSidebar, expandedSidebar, expandedLabelsVisible }, mobile: { ...mobileState, drawerOpen }, errors }, null, 2));
})();
