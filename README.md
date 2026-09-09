# ODD RAVEN DTF Platform

Digital operating system for ODD RAVEN DTF printing: a simple customer PWA backed by order, artwork, production, payment, courier, CRM, and reporting operations.

## Codex Startup

Read [CODEX_STARTUP.md](CODEX_STARTUP.md) before running or modifying the project. It contains the canonical setup, service ports, ERP Messages workflow, and data-preservation rules for another system.

Latest transfer: [September 9 handoff](docs/handoff-2026-09-09.md), [full gangsheet process](docs/gangsheet-process.md), and [project chat with screenshots](docs/chat/2026-09-09.md).

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

## Start Locally

After installing dependencies using the startup guide, double-click `Start App.cmd`, or run from the repository root:

```powershell
npm run web:dev
```

The launcher starts the API first, then the customer/staff frontend. Open:

```text
New order: http://127.0.0.1:3011/new-order
Customer chat: http://127.0.0.1:3011/messages
Staff chat: http://127.0.0.1:3011/admin/messages
API health: http://127.0.0.1:8000/health
```

ERP runs separately on port 8002; see the startup guide. The app reports backend and image-worker connections separately. Image processing requires authorized access to Pixelcut and is disabled by default in the example configuration.

## Project Checks

After dependencies are installed, run from the repository root:

```powershell
npm run check
```
