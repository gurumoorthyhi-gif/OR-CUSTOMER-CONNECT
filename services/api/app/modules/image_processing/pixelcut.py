"""Pixelcut web automation adapter.

This module deliberately talks only to the public Pixelcut web UI.  It is kept
behind the image-processing service so Messenger never depends on Playwright.
"""
from dataclasses import dataclass
from pathlib import Path
import time

from services.api.app.core.config import settings


@dataclass(frozen=True)
class PixelcutSelectorConfig:
    upload: tuple[str, ...] = ('input[type="file"]',)
    download: tuple[str, ...] = ('button:has-text("Download")', 'a:has-text("Download")')
    processing: tuple[str, ...] = ('text=Processing', 'text=Uploading')
    error: tuple[str, ...] = ('text=Something went wrong', 'text=Try again')
    scale_2x: tuple[str, ...] = ('text=2x', 'text=2×', 'button:has-text("2x")')
    scale_4x: tuple[str, ...] = ('text=4x', 'text=4×', 'button:has-text("4x")')


SELECTORS = PixelcutSelectorConfig()


async def find_first_working_locator(page, candidates: tuple[str, ...]):
    deadline = time.monotonic() + settings.pixelcut_process_timeout_ms / 1000
    while time.monotonic() < deadline:
        for candidate in candidates:
            locator = page.locator(candidate).first
            if await locator.count() and await locator.is_visible():
                return locator
        await page.wait_for_timeout(500)
    raise RuntimeError("PIXELCUT_SELECTOR_NOT_FOUND")


class PixelcutBrowserProvider:
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.playwright = None
        self.context = None

    async def start(self) -> None:
        try:
            from playwright.async_api import async_playwright
        except ImportError as exc:
            raise RuntimeError("PLAYWRIGHT_NOT_INSTALLED") from exc
        profile = Path("runtime/pixelcut/profiles") / self.worker_id.lower()
        profile.mkdir(parents=True, exist_ok=True)
        self.playwright = await async_playwright().start()
        self.context = await self.playwright.chromium.launch_persistent_context(
            str(profile), headless=settings.pixelcut_headless, accept_downloads=True
        )

    async def close(self) -> None:
        if self.context:
            await self.context.close()
        if self.playwright:
            await self.playwright.stop()

    async def process(self, source: Path, operation: str, output: Path) -> Path:
        if not settings.pixelcut_enabled or not self.context:
            raise RuntimeError("PIXELCUT_DISABLED")
        url = settings.pixelcut_bg_url if operation == "REMOVE_BG" else settings.pixelcut_upscale_url
        page = await self.context.new_page()
        page.set_default_timeout(settings.pixelcut_process_timeout_ms)
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=settings.pixelcut_navigation_timeout_ms)
            body_text = (await page.locator("body").inner_text()).lower()
            if any(marker in body_text for marker in ("captcha", "verify you are human", "access denied")):
                raise RuntimeError("ACCESS_RESTRICTED")
            file_inputs = page.locator('input[type="file"]')
            input_count = await file_inputs.count()
            if not input_count:
                upload = await find_first_working_locator(page, SELECTORS.upload)
                await upload.set_input_files(str(source), timeout=settings.pixelcut_upload_timeout_ms)
            else:
                for index in reversed(range(input_count)):
                    await file_inputs.nth(index).set_input_files(str(source), timeout=settings.pixelcut_upload_timeout_ms)
                    try:
                        await page.wait_for_url("**/ai-image-editor**", timeout=10000)
                        break
                    except Exception:
                        continue
            if "ai-image-editor" not in page.url:
                raise RuntimeError("PIXELCUT_UPLOAD_FAILED")
            if operation == "UPSCALE_2X":
                await (await find_first_working_locator(page, SELECTORS.scale_2x)).click()
            elif operation == "UPSCALE_4X":
                await (await find_first_working_locator(page, SELECTORS.scale_4x)).click()
            download_button = page.get_by_role("button", name="Download", exact=True).first
            await download_button.wait_for(state="visible", timeout=settings.pixelcut_process_timeout_ms)
            await download_button.click()
            preview_download = page.get_by_text("Preview resolution", exact=True).first
            download_target = preview_download if await preview_download.count() and await preview_download.is_visible() else download_button
            async with page.expect_download(timeout=settings.pixelcut_download_timeout_ms) as download_info:
                await download_target.click()
            await (await download_info.value).save_as(str(output))
            if not output.exists() or output.stat().st_size == 0:
                raise RuntimeError("DOWNLOAD_FAILED")
            return output
        except Exception:
            if settings.pixelcut_screenshot_on_error:
                output.parent.mkdir(parents=True, exist_ok=True)
                await page.screenshot(path=str(output.parent / "error.png"), full_page=True)
            raise
        finally:
            await page.close()
