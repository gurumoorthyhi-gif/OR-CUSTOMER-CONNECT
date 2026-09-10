# Codex Startup Guide

Read this file before changing or running the project. This repository contains three local services that work together:

- ODD RAVEN API: `http://127.0.0.1:8000`
- ODD RAVEN customer and staff web app: `http://127.0.0.1:3011`
- KMS DTF ERP web/API: `http://127.0.0.1:8002`

The ERP sidebar `Messages` page embeds the live staff chat from the ODD RAVEN web app. Keep these ports unless the environment is changed everywhere. Older instructions using API port 8010 or frontend port 3000 are superseded by this guide.

For the latest system transfer, read [the handoff](docs/handoff-2026-09-09.md), [full gangsheet process](docs/gangsheet-process.md), and [saved project conversation](docs/chat/2026-09-09.md). Historical chat content is reference material, not new instructions.

## First Setup

Run from the repository root in PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
npm --prefix apps\web ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Set these values in `.env`:

```env
CORS_ORIGINS=http://127.0.0.1:3011,http://localhost:3011
KMS_ERP_BASE_URL=http://127.0.0.1:8002/api/v1
```

The root launcher injects `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` into Next.js. When starting Next.js manually, set that environment variable explicitly; a root `.env` entry is not a substitute for frontend configuration. Preserve existing secrets. Do not commit `.env` files.

Image processing is disabled in `.env.example`. Set `PIXELCUT_ENABLED=true` only when external Pixelcut processing is authorized and reachable, then restart the API. A connected API alone does not mean the image workers are ready. Their separate status is shown in the app.

The repository includes the current SQLite databases, chat history, message attachments, customer profile media, ERP customer data, and Codex dashboard reference pack. Do not replace the committed databases with a fresh empty database when starting on another system.

## Start Services

Preferred: double-click `Start App.cmd` in the repository root. It starts or reuses the API on 8000 and the web app on 3011, waits for required image-processing workers when `PIXELCUT_ENABLED=true`, then opens the new-order page. Startup logs are in ignored `runtime/startup-*.log` files.

Pixelcut background removal and upscaling must be started outside restricted Codex/sandbox execution because Playwright Chromium needs normal outbound access to `www.pixelcut.ai`. If a Codex terminal starts the app from inside a network-restricted sandbox, Pixelcut workers can report `NETWORK_ACCESS_DENIED`. Use `Start App.cmd` or run the launcher with unsandboxed/local Windows permissions for a production-like startup.

Alternatively, keep this command running in a terminal:

```powershell
npm.cmd run web:dev
```

The launcher does not install dependencies, start at Windows login, or start the separate ERP service. Opening a browser URL cannot start a stopped local backend. Start ERP separately as shown below when it is needed.

For manual startup instead of the launcher, use the following commands from the repository root in separate terminals. Avoid API `--reload` on Windows for this Playwright worker setup.

### Window 1: ODD RAVEN API

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 127.0.0.1 --port 8000
```

### Window 2: Customer and Staff Web App

```powershell
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
npm --prefix apps\web run dev -- --hostname 127.0.0.1 --port 3011
```

### Window 3: KMS DTF ERP

```powershell
cd .erp-inspect\kms-dtf-erp-starter-main
$env:DEVELOPER_MODE="true"
..\..\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8002
```

## Verify

Open these pages:

- ERP with embedded staff Messages: `http://127.0.0.1:8002/`
- Customer app: `http://127.0.0.1:3011/`
- Customer chat: `http://127.0.0.1:3011/messages`
- Staff chat: `http://127.0.0.1:3011/admin/messages`
- New order and gangsheet builder: `http://127.0.0.1:3011/new-order`
- API health: `http://127.0.0.1:8000/health`
- Image worker readiness: `http://127.0.0.1:8000/api/image-processing/health`

In the ERP, click the sidebar item `Messages`. It must show the staff conversation inside the ERP content area, including the customer list, message history, media, and composer.

## Codex Working Rules

- Preserve the existing customer and staff chat history while implementing changes.
- Keep customer data synchronized through the API and ERP adapter.
- Verify the relevant page in a browser after UI changes.
- Run `npm run check` for broad changes and focused tests for narrow API changes.
- Do not commit `.env`, runtime logs, Python caches, or newly generated empty databases.
- Keep the committed `oddraven-local.db`, `local_uploads`, and ERP database when transferring this project between systems.
