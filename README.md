# ODD RAVEN DTF Platform

Digital operating system for ODD RAVEN DTF printing: a simple customer PWA backed by order, artwork, production, payment, courier, CRM, and reporting operations.

## Codex Startup

Read [CODEX_STARTUP.md](CODEX_STARTUP.md) before running or modifying the project. It contains the canonical setup, service ports, ERP Messages workflow, and data-preservation rules for another system.

## Repository Layout

- `docs/phases` - detailed phase plans and acceptance criteria.
- `docs/operations` - business inputs, SOPs, and configuration references.
- `docs/erp-integration` - adapter contracts and mapping for the existing DTF ERP.
- `apps/web` - customer and staff PWA frontend scaffold.
- `services/api` - FastAPI backend scaffold.
- `packages/shared` - shared constants, API contracts, and status definitions.
- `infra` - Docker, database, storage, and deployment templates.
- `scripts` - local setup and maintenance helpers.

## Local Development Guide

See `docs/operations/local-development.md`.

## Dependencies

See `DEPENDENCIES.md` for installing this project on another system.

## Local Backend Setup

```powershell
.\.venv\Scripts\Activate.ps1
python -m services.api.app.db.init_db
uvicorn services.api.app.main:app --reload
```

API health check:

```text
http://127.0.0.1:8000/health
```

## Frontend Setup

Node.js is required before installing frontend dependencies.

```powershell
cd apps\web
npm install
npm run dev
```

## Project Checks

After dependencies are installed, run from the repository root:

```powershell
npm run check
```
