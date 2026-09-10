# Local Development

See [the startup guide](../../CODEX_STARTUP.md) for first-time setup, environment values, and the separate ERP service. From the repository root, `npm.cmd run web:dev` starts the API and frontend together. `Start App.cmd` also opens the browser after API, web, and required image-processing startup checks.

When `PIXELCUT_ENABLED=true`, start from normal Windows permissions, not a restricted Codex sandbox. Pixelcut background removal and upscaling use Playwright Chromium and must be able to reach `www.pixelcut.ai`.

## Run Backend

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

## Run Frontend

```powershell
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
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

- Frontend screens call `NEXT_PUBLIC_API_URL`.
- Backend creates local SQLite tables on startup.
- Seed data is inserted idempotently.
- ERP-owned functionality remains behind the ERP adapter.
- The connection strip checks API and image-worker readiness separately. Offline or blocked image processing is shown explicitly and its controls are disabled.
- Read [the gangsheet process](../gangsheet-process.md) before extending order generation or persistence. Gangsheet attachment currently lives only in the open form, not in the ERP.
