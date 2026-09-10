# Codex Session Handoff

This project contains the ODD RAVEN customer and staff platform work completed during the Codex session.

## Completed work

- Removed the messages header and added a horizontally resizable left panel with a resize cursor.
- Made the chat fit the viewport with scrollable message content and WhatsApp-style dropdown positioning.
- Closed message dropdowns when clicking outside them.
- Added multi-artwork upload to New Order: up to 100 images and 1 GB combined, thumbnails, per-artwork selection, width, height, quantity, and bulk details.
- Added proportional width/height locking per artwork and automatic image dimension detection in inches at 300 DPI.
- Added a checkerboard artwork preview with a boundary box and Background remove, Upscale 2x, ChatGPT, Undo, Redo, and Save changes controls.
- Connected customer-side image processing to the staff browser Pixelcut queue for background removal and 2x upscaling.
- Added transparent-pixel trimming after background removal and recalculated dimensions after processing.
- Preview artwork scales to entered width and height at 96 CSS pixels per inch and remains scrollable for large sizes.

## Validation

- `npm.cmd --prefix apps/web run build` passes.
- Browser interaction check confirmed a 6 x 3 inch preview renders at 576 x 288 CSS pixels.
- Pixelcut background removal and 2x upscaling smoke tests completed with the local API and staff browser worker.

## Local services

- Web app: `http://localhost:3011`
- API: `http://127.0.0.1:8000`
- Current web page: `http://127.0.0.1:3011/new-order`

## Latest Codex session

- The visible conversation for September 10, 2026 is archived in [the session transcript](docs/chat/2026-09-10.md).
- The latest startup and Git commands are recorded in [the command log](docs/CODEX_LATEST_COMMANDS.md).

Generated runtime profiles, logs, local uploads, databases, and environment files are intentionally ignored. Copy `.env.example` files and configure local secrets on the next system.
