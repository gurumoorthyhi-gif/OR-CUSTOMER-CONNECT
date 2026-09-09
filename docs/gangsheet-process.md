# Gangsheet Process and Implementation

This describes the implementation at the September 9, 2026 system handoff. It separates the intended production workflow from features that remain incomplete. Read the [handoff](handoff-2026-09-09.md) and [conversation archive](chat/2026-09-09.md) for context.

## Fixed Production Profile

| Setting | Value |
| --- | --- |
| Roll width | 22.6 inches = 574.04 mm |
| Maximum page length | 100 inches = 2540 mm |
| Artwork gap | 5 mm |
| Edge margin | 0 mm; the earlier 3 mm margin was removed |
| Rotation | 0 or 90 degrees, always allowed |
| Default arrangement | Compact layout |
| Alternative arrangement | Group same sizes |

Customers do not configure the production profile. The builder supplies these constants and the engine overrides incoming settings with them. Only the arrangement mode is variable. Artwork must retain its entered physical dimensions; the packing operation does not shrink it to fit.

The 5 mm gap is between artwork, not an extra margin outside the sheet. A 22.5-inch-wide artwork can fit a 22.6-inch roll if its other dimension fits the page, possibly after rotation. Upload byte limits, image-processing availability, and physical packing limits are separate concerns.

## Customer Workflow

1. Open `http://127.0.0.1:3011/new-order` after starting the local services.
2. Upload artwork. New uploads are selected by default with quantity 1. The order UI limits the batch to 100 files and 1 GB total. The image-processing API has a separate per-file limit, configured by `MAX_IMAGE_UPLOAD_MB` (example value: 100 MB).
3. Check the dimensions of each artwork. Initial inches are calculated from image pixels using the UI's default 300 DPI; embedded print metadata is not a reliable source of physical size in this workflow. Enter the intended print dimensions explicitly.
4. Use the aspect lock for proportional individual resizing. When applying only width or only height in the bulk controls, each selected artwork uses its own aspect ratio to calculate the other dimension. Supplying both dimensions explicitly sets both.
5. Open an artwork preview to inspect or process it. It opens fitted and centered, with dimensions outside the image. Reset returns to fit and center. Zoom spans 10%-500%; each mouse-wheel step changes zoom by 5 percentage points. The middle mouse button pans; the toolbar also provides pan and zoom controls.
6. Background removal and upscaling process the currently displayed preview image. Undo restores the previous snapshot; redo restores the next snapshot. Subsequent processing uses that restored snapshot, not automatically the original upload. Save changes applies the current preview to the artwork row.
7. Select all artwork and provide valid width, height, and quantity before clicking **Create gangsheet**. The builder opens below the artwork form and generates immediately. There is no intermediate production-settings screen.
8. Change artwork details above the builder as needed, then click the separate **Generate gangsheet** button at the boundary between the artwork and builder sections. This explicitly regenerates the layout from the current details; it is not the bulk-edit Apply button.
9. Choose **Compact layout** or **Group same sizes** in the right panel. Switching mode regenerates the sheet and returns navigation to page 1.
10. Inspect the checkerboard sheet, page tabs, per-page measurements, and total meters. Artwork filenames are not printed on the sheet; they remain available as hover/accessibility metadata.
11. A valid result enables **Attach gangsheet to new order**. Currently this attaches only to the in-memory order form. It is not yet saved to an API, ERP order, database, or production file.

## Input and Coordinate Model

The engine is `apps/web/app/gangsheet/engine.ts`. Its entry point is `generateGangsheet(artworks, settings)`.

Each artwork supplies an ID, filename, preview URL, width and height in inches, and quantity. Quantity is expanded into individually addressable instances with IDs such as `artwork-id:1`. Geometry is converted to integer units of 0.01 mm to reduce floating-point boundary errors:

```text
units = round(inches * 25.4 * 100)
millimeters = units / 100
```

The origin is the sheet's top-left corner. X increases to the right; Y increases downward. Placement records store the artwork/instance IDs, bounding rectangle in mm, content rectangle, and rotation. Packing uses image rectangles, including transparent padding. There is no alpha-contour nesting or automatic transparent-border trimming in the engine.

## Compact Layout

1. Expand quantities, then sort instances by descending area, longest side, and stable instance ID.
2. Start with one free rectangle spanning the usable sheet width and maximum page length.
3. Consider each image at 0 degrees and, for nonsquare images, 90 degrees.
4. Generate candidates at the top-left of each free rectangle that can contain the image.
5. Rank candidates lexicographically by added used length, wasted free area, shortest remaining side, Y, X, and rotation. This is a heuristic; it does not guarantee mathematically optimal packing.
6. Place the best candidate. Split intersecting free rectangles around the placement, reserve its cutting gap, and remove duplicate or contained free rectangles.
7. Defer copies that fit an empty page but not the current page. Repeat on additional pages until all placeable copies are assigned.
8. Mark an artwork unplaced when neither orientation can fit an empty page.

Compact mode may put smaller individual copies into gaps between other artwork. It prioritizes material use over keeping equal-size quantities in a single cutting block.

## Group Same Sizes

The requested cutting workflow keeps equal-size copies together, left to right, and permits gap reuse only when an entire size group fits.

Current implementation:

1. Group instances by normalized width and height. Different files with the same dimensions share a group. Width-by-height and height-by-width are distinct group keys even though rotation is available.
2. Sort groups by descending individual artwork area.
3. For each group, evaluate a rectangular grid in both allowed orientations. Columns are the maximum that fit the available width, capped by group quantity. Rows are `ceil(quantity / columns)`.
4. Include the 5 mm gap between columns and rows. Choose the fitting block with the lowest height, then width.
5. Try to place the complete block in the remaining right-side space of the current row. Place its copies left to right, then on subsequent rows within that block.
6. If it does not fit, move below the current row and try the full width. If it fits only an empty page, defer the entire group to a new page.

Important limitations: this mode does not search every earlier cavity. It reuses the current row's side space only. A group whose complete block exceeds one 100-inch page is currently rejected instead of split across multiple pages, even when each individual copy fits. Compact mode supports splitting such quantities across pages. Full cavity search and oversized-group pagination remain follow-up work; do not describe them as completed.

## Pages and Material Calculation

Each page is at most 100 inches long. Its displayed length is the actual used bottom edge, not an automatic charge for a full 100-inch page. The checkerboard preview preserves the ratio of roll width to used length. The surrounding builder uses the available window width while the sheet itself stays visually narrow and centered.

Navigation includes first, previous, numbered page tabs, next, and last. The selected page determines the top summary's length, pieces, and utilization.

```text
pageMeters = page.usedLengthMm / 1000
totalMeters = sum(page.usedLengthMm for every page) / 1000
pageMaterialArea = sheetWidthMm * page.usedLengthMm
pageArtworkArea = sum(placed widthMm * placed heightMm)
utilizationPercent = 100 * pageArtworkArea / pageMaterialArea
wastePercent = 100 - utilizationPercent
```

The right panel displays total material and each page's meters to two decimal places. For example, a 100-inch page plus a 40-inch page uses `2.54 + 1.016 = 3.556 m`, displayed as `3.56 m`. Sum unrounded page lengths, then round for display.

`result.pages` is the authoritative multi-page collection. Legacy top-level `result.placements` and `result.usedLengthMm` describe only the first page. Do not use the latter to calculate total material. The current attach confirmation still uses this first-page length and needs correction for multi-page orders.

## Validation and Errors

The engine checks placement geometry for finite positive values, sheet bounds, and rectangle overlap. The complete result is invalid if placement errors or unplaced artwork remain. Attachment is disabled for invalid results.

With no placeable page, the builder shows a generation failure and a Generate again action. With a partial result, it keeps the preview and shows an error banner. Errors include affected filenames (up to two in the primary message). The unplaced count is unique artwork files, not necessarily the number of missing copies.

The current grouped failure message uses the generic roll-width/page-length explanation; it does not distinguish an oversized complete group from an individually oversized image. Improve this before production acceptance.

The validator does not independently verify the minimum 5 mm distance between every pair of rectangles. The packing routine reserves clearance to the right and bottom of placements; add explicit gap tests covering every relative direction before relying on the output for cutting.

## Image Processing and Connection Setup

`Start App.cmd` runs the local launcher, which starts or reuses the API and web app and waits for readiness before opening the new-order URL. A browser page alone cannot start a stopped local Python process. Use the launcher on the new system, not just a stale browser bookmark.

The connection strip separately reports Backend, Background removal, and Upscaler. It checks on opening, every 10 seconds, and on focus/network return. Image workers must open the provider page successfully before becoming available. Unhealthy workers retry; the API rejects unavailable processing with a clear 503 response before queuing an upload. The preview also checks readiness before sending the current image.

Backend health does not prove Pixelcut health. At this handoff the local API works, but this environment blocks the external provider with `ERR_NETWORK_ACCESS_DENIED`. The UI now reports that blocker and disables processing instead of promising a connection. A successful real background-removal/upscale round trip still needs verification on a machine with authorized provider access. Pixelcut processing sends artwork to an external service; enable it only when that use is authorized. Captchas and provider access restrictions are not bypassed.

## Remaining Production Work

- Persist artwork and the full multi-page result to an actual order API/ERP transaction. The current Continue to review handler only displays a readiness notice.
- Add print-resolution export with physical dimensions and transparency, for example PNG/TIFF/PDF according to the production requirement. There is no gangsheet production export yet.
- Implement complete-gap search and oversized-group pagination without scattering same-size copies through unrelated gaps.
- Add explicit 5 mm clearance validation and robust engine-level checks for finite dimensions, integer quantity, excessive quantities, and malformed input.
- Verify nonsquare 90-degree artwork rendering. The preview currently rotates an image inside its already-rotated placement box; visual fitting must be tested against the geometry before export work.
- Correct the attach confirmation's multi-page length and review aggregate utilization on partial/unplaced results.
- Verify that upscaling preserves the user's intended physical print dimensions. The preview's processed-image metadata currently derives dimensions from output pixels at 300 DPI.
- Add automated geometry, grouped layout, pagination, state-history, and desktop/mobile visual regression tests. Build success is not proof of print correctness.

## Code Map

| File | Responsibility |
| --- | --- |
| `apps/web/app/new-order/page.tsx` | Uploads, selection, quantity/dimensions, preview history, processing, generation/attachment state |
| `apps/web/app/new-order/gangsheet-builder.tsx` | Immediate generation, mode selection, sheet rendering, pages, meter summary, errors |
| `apps/web/app/gangsheet/engine.ts` | Physical geometry, compact/grouped packing, pagination, validation, result types |
| `apps/web/app/globals.css` | Artwork form, preview rulers, zoom surface, gangsheet sheet/navigation/layout |
| `apps/web/app/components/connection-setup.tsx` | Shared backend and processing readiness strip/context |
| `services/api/app/modules/image_processing/` | Provider workers, readiness, queue/job routes, friendly errors |
| `scripts/start-local.mjs` and `scripts/open-app.ps1` | Backend-first local startup and browser launch |
