# Local Development

See [the setup guide](../../SETUP_INSTALLATION_AND_FEATURES.md) for first-time setup, environment values, and the unified services. From the repository root, `npm.cmd run web:dev` starts or reuses the API, ERP backend, and frontend together. `Start App.cmd` also opens the browser after readiness checks.

When `PIXELCUT_ENABLED=true`, start from normal Windows permissions, not a restricted Codex sandbox. Pixelcut background removal and upscaling use Playwright Chromium and must be able to reach `www.pixelcut.ai`.

## Run ODD RAVEN API

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 127.0.0.1 --port 8000
```

Do not use `--reload` for this Windows Playwright worker setup. Preserve the committed database when transferring systems.

Backend URL:

```text
http://127.0.0.1:8000
```

OpenAPI docs:

```text
http://127.0.0.1:8000/docs
```

## Run ERP backend

```powershell
cd .erp-inspect\kms-dtf-erp-starter-main
$env:DEVELOPER_MODE="true"
$env:ALLOWED_ORIGINS="http://127.0.0.1:3011,http://localhost:3011"
..\..\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8002
```

## Run unified frontend

```powershell
npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3011
```

Frontend URL:

```text
http://127.0.0.1:3011
```

## Run All Checks

```powershell
npm run check
```

## Current Data Flow

- The browser uses one origin at port 3011. Next.js rewrites ODD RAVEN `/api/*` requests to port 8000 and ERP `/api/v1/*`, assets, and pages to port 8002.
- Backend creates local SQLite tables on startup.
- Seed data is disabled by default; set `SEED_LOCAL_DATA=true` only for deliberate demo data.
- Staff creates customer usernames and passwords from `/admin/customers/new`; passwords are stored as bcrypt hashes and are never returned to the browser.
- Customer sessions use an HTTP-only cookie. Use the same host consistently (`127.0.0.1` or `localhost`) when logging in and opening customer pages.
- ERP-owned functionality remains behind the ERP adapter.
- The connection strip checks API and image-worker readiness separately. Offline or blocked image processing is shown explicitly and its controls are disabled.
- Read [the gangsheet process](../gangsheet-process.md) before extending order generation or persistence. Gangsheet attachment currently lives only in the open form, not in the ERP.
