const { chromium } = require("playwright");

const baseUrl = process.env.WEB_URL || "http://127.0.0.1:3010";

(async () => {
  const browser = await chromium.launch();
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = [];
  desktop.on("pageerror", (error) => errors.push(error.message));
  desktop.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await desktop.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  const editPhotoButton = desktop.locator('button[aria-label="Edit profile photo"]');
  const editPhotoVisible = await editPhotoButton.isVisible();
  const profileLocked = await editPhotoButton.isDisabled();
  let photoSheetVisible = false;
  let photoActions = [];
  let photoEditorVisible = false;
  let resizeWorking = false;
  let removeDialogVisible = false;
  let customCourierVisible = false;
  if (!profileLocked) {
    await editPhotoButton.click();
    const photoSheet = desktop.locator('.profile-photo-sheet');
    photoSheetVisible = await photoSheet.isVisible();
    photoActions = await photoSheet.locator('.profile-photo-actions button span').allTextContents();
    if (photoActions.includes("Edit current photo")) {
      await photoSheet.getByText("Edit current photo").click();
    } else {
      await photoSheet.getByText("Choose from gallery").click();
      await desktop.locator('input.profile-photo-input').setInputFiles("profile-photo-editor.png");
    }
    const photoEditor = desktop.locator('.profile-photo-editor');
    photoEditorVisible = await photoEditor.isVisible();
    await desktop.locator('.profile-editor-canvas').waitFor({ state: "visible", timeout: 5000 });
    const zoomSlider = photoEditor.locator('input[type="range"]');
    const initialCanvas = await desktop.locator('.profile-editor-canvas').evaluate((canvas) => canvas.toDataURL());
    await zoomSlider.fill("4");
    await desktop.waitForTimeout(100);
    const resizedCanvas = await desktop.locator('.profile-editor-canvas').evaluate((canvas) => canvas.toDataURL());
    await zoomSlider.fill("0.1");
    await desktop.waitForTimeout(100);
    const reducedCanvas = await desktop.locator('.profile-editor-canvas').evaluate((canvas) => canvas.toDataURL());
    resizeWorking = initialCanvas !== resizedCanvas && resizedCanvas !== reducedCanvas && await zoomSlider.inputValue() === "0.1";
    await desktop.screenshot({ path: "profile-photo-editor.png", fullPage: false });
    await photoEditor.getByRole("button", { name: "Cancel" }).click();
    if (photoActions.includes("Remove photo")) {
      await editPhotoButton.click();
      await photoSheet.getByText("Remove photo").click();
      removeDialogVisible = await desktop.locator('.profile-remove-dialog').isVisible();
      await desktop.locator('.profile-remove-dialog').getByRole("button", { name: "Cancel" }).click();
    }
    await desktop.locator('input[type="email"]').fill("profile-check@sowmiyaprints.example");
    const preferredCourier = desktop.locator('select[required]').nth(1);
    await preferredCourier.selectOption({ label: "Other" });
    const customCourier = desktop.locator('input[placeholder="Type courier or transport name"]');
    customCourierVisible = await customCourier.isVisible();
    await customCourier.fill("Local Transport");
    await preferredCourier.selectOption({ label: "DTDC" });
    await desktop.locator('button[type="submit"]').click();
    await desktop.getByText("Profile saved").waitFor({ timeout: 5000 });
  }
  await desktop.screenshot({ path: "profile-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("pageerror", (error) => errors.push(error.message));
  mobile.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await mobile.goto(`${baseUrl}/profile`, { waitUntil: "networkidle" });
  await mobile.screenshot({ path: "profile-mobile.png", fullPage: true });
  const chatsHref = await mobile.locator('a[aria-label="Chats"]').getAttribute("href");
  const profileState = await mobile.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent,
    hasSettings: Array.from(document.querySelectorAll(".settings-grid a, .settings-grid button")).map((button) => button.textContent?.trim()),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  await mobile.locator('a[aria-label="Chats"]').click();
  await mobile.waitForURL(/\/messages$/);
  const chatConnected = await mobile.locator('.conversation-header').isVisible();

  await browser.close();

  console.log(JSON.stringify({ ...profileState, chatsHref, chatConnected, profileLocked, editPhotoVisible, photoSheetVisible, photoActions, photoEditorVisible, resizeWorking, removeDialogVisible, customCourierVisible, errors }, null, 2));
})();
