# Codex Startup Guide

Read this file before changing or running the project. This repository contains three local services that work together:

- ODD RAVEN API: `http://127.0.0.1:8010`
- ODD RAVEN customer and staff web app: `http://127.0.0.1:3011`
- KMS DTF ERP web/API: `http://127.0.0.1:8002`

The ERP sidebar `Messages` page embeds the live staff chat from the ODD RAVEN web app. Keep these ports unless the environment is changed everywhere.

## First Setup

Run from the repository root in PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
npm --prefix apps\web install
Copy-Item .env.example .env
```

Set these values in `.env`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8010
CORS_ORIGINS=http://127.0.0.1:3011,http://localhost:3011
KMS_ERP_BASE_URL=http://127.0.0.1:8002/api/v1
```

The repository includes the current SQLite databases, chat history, message attachments, customer profile media, ERP customer data, and Codex dashboard reference pack. Do not replace the committed databases with a fresh empty database when starting on another system.

## Start Services

Open three PowerShell windows.

### Window 1: ODD RAVEN API

```powershell
cd OR-CUSTOMER-CONNECT
.\.venv\Scripts\python.exe -m services.api.app.db.init_db
.\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 127.0.0.1 --port 8010
```

### Window 2: Customer and Staff Web App

```powershell
cd OR-CUSTOMER-CONNECT
npm --prefix apps\web run dev -- --hostname 127.0.0.1 --port 3011
```

### Window 3: KMS DTF ERP

```powershell
cd OR-CUSTOMER-CONNECT\.erp-inspect\kms-dtf-erp-starter-main
$env:DEVELOPER_MODE="true"
..\..\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8002
```

## Verify

Open these pages:

- ERP with embedded staff Messages: `http://127.0.0.1:8002/`
- Customer app: `http://127.0.0.1:3011/`
- Customer chat: `http://127.0.0.1:3011/messages`
- Staff chat: `http://127.0.0.1:3011/admin/messages`
- API health: `http://127.0.0.1:8010/health`

In the ERP, click the sidebar item `Messages`. It must show the staff conversation inside the ERP content area, including the customer list, message history, media, and composer.

## Codex Working Rules

- Preserve the existing customer and staff chat history while implementing changes.
- Keep customer data synchronized through the API and ERP adapter.
- Verify the relevant page in a browser after UI changes.
- Run `npm run check` for broad changes and focused tests for narrow API changes.
- Do not commit `.env`, runtime logs, Python caches, or newly generated empty databases.
- Keep the committed `oddraven-local.db`, `local_uploads`, and ERP database when transferring this project between systems.

