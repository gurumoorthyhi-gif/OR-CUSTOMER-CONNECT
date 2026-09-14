# KMS DTF ERP — Continuation Handoff

Last updated: 2026-08-15

## Goal

Move the existing KMS DTF ERP from a single-machine desktop workflow to a
universal browser application while preserving the existing ERP behavior and
data model. CorelDRAW integration is planned for seamless CDR file handoff.

## Completed

- FastAPI web application and browser UI are available.
- Developer Mode opens the local web app without login credentials.
- Existing desktop SQLite data can be used locally by the web application.
- Customer panel supports customer details, address fields, CRUD, folder/date
  workspaces, file uploads, previews, downloads, copying, deletion, and search.
- Orders panel supports customer selection, order type, design imports,
  customer/date-based filenames and folders, artwork linking, status updates,
  order details, timeline, and design previews.
- The uploaded KMS logo is used on the login page, sidebar, and browser favicon.
- Source is stored in the private GitHub repository:
  `gurumoorthyhi-gif/kms-dtf-erp`.

## Verification

- Full suite: 203 tests passed before initial publication.
- Branding change: web API tests passed.

## Local browser startup

From the repository root in PowerShell:

```powershell
$env:DEVELOPER_MODE='true'
$env:APP_ENV='development'
C:\KMS_DTF_ERP_VENV\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Then open `http://127.0.0.1:8000/`.

On a different computer, create a Python virtual environment, install the
requirements, and use that environment's Python executable instead of the
machine-specific path above.

## Important data rule

GitHub contains source code only. Real databases, customer files, CDR artwork,
uploads, backups, environment files, and credentials are intentionally ignored
and are not transferred through Git. Do not commit them.

Universal shared access still requires hosted deployment, PostgreSQL, and cloud
object storage. A Git clone alone runs a separate local installation.

## UI redesign decision

The owner will design the replacement UI in CorelDRAW and export each screen as
PNG. Recommended canvas: 1920 x 1080 px, equivalent to 20 x 11.25 inches at
96 DPI, RGB. Provide separate PNGs for pages, dialogs, menus, and states, plus
transparent logo/icon assets. The implementation must recreate these as real
responsive HTML/CSS controls and connect them to the existing APIs; the PNGs
must not be used as flattened interactive screens.

## Next work

1. Receive the CorelDRAW/PNG screen designs.
2. Rebuild the web UI to match them without changing working backend behavior.
3. Finish remaining ERP parity modules listed in `docs/WEB_PARITY_MATRIX.md`.
4. Deploy the application with hosted PostgreSQL and cloud file storage.
5. Build the Windows/CorelDRAW bridge for opening selected ERP designs in a new
   named CDR document and returning exported gang sheets to the ERP.

## Instruction for a new coding session

Read this file, `README.md`, `docs/PROJECT_BIBLE.md`, and
`docs/WEB_PARITY_MATRIX.md` before making changes. Preserve existing customer
and order functionality and do not replace the original ERP behavior with
placeholder implementations.
