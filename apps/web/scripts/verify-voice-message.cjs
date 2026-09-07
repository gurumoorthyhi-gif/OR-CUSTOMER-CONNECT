const { chromium } = require("playwright");

async function main() {
  const errors = [];
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["microphone"],
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/messages/with-attachment", async (route) => {
    const postData = route.request().postData() || "";
    const clientId = postData.match(/name="client_message_id"\r\n\r\n([^\r\n]+)/)?.[1] || "voice-browser-test";
    const now = new Date().toISOString();
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status: "delivered",
        id: 99001,
        message: {
          id: 99001,
          client_message_id: clientId,
          sender_type: "customer",
          message_type: "audio",
          body: "",
          status: "delivered",
          created_at: now,
          delivered_at: now,
          attachments: [{
            id: 99001,
            url: "/api/messages/uploads/browser-voice-test.webm",
            original_filename: "Voice message.webm",
            mime_type: "audio/webm",
            size_bytes: 2048,
            duration_seconds: 1,
          }],
        },
      }),
    });
  });

  await page.goto("http://127.0.0.1:3000/messages", { waitUntil: "domcontentloaded" });
  const microphone = page.getByRole("button", { name: "Record voice message" });
  await microphone.waitFor();
  await microphone.click();
  await page.getByRole("button", { name: "Pause recording" }).waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "voice-recording-preview.png", fullPage: true });

  const timer = await page.locator(".voice-recording b").textContent();
  await page.getByRole("button", { name: "Pause recording" }).click();
  const resumeVisible = await page.getByRole("button", { name: "Resume recording" }).isVisible();
  await page.getByRole("button", { name: "Cancel voice recording" }).evaluate((button) => button.click());
  let returnedToComposer = false;
  try {
    await microphone.waitFor({ timeout: 5000 });
    returnedToComposer = true;
  } catch {
    returnedToComposer = false;
  }
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  await microphone.click();
  await page.getByRole("button", { name: "Send voice message" }).waitFor();
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Send voice message" }).click();
  const player = page.locator(".voice-message").last();
  await player.waitFor({ timeout: 8000 });
  const playerControls = {
    play: await page.getByRole("button", { name: "Play voice message" }).last().isVisible(),
    seek: await page.getByRole("slider", { name: "Voice message position" }).last().isVisible(),
    speed: await page.getByRole("button", { name: "Change playback speed" }).last().isVisible(),
  };
  await player.scrollIntoViewIfNeeded();
  await player.screenshot({ path: "voice-message-player.png" });
  await page.screenshot({ path: "voice-message-preview.png", fullPage: true });

  const result = { timer, resumeVisible, returnedToComposer, playerControls, errors, horizontalOverflow };
  console.log(JSON.stringify(result));
  await browser.close();
  if (!timer || !resumeVisible || !returnedToComposer || Object.values(playerControls).includes(false) || errors.length || horizontalOverflow) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
