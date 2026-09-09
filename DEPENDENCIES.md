# ODD RAVEN Dependencies

Use this file when setting up the project on another system. [CODEX_STARTUP.md](CODEX_STARTUP.md) is the canonical configuration; [the current handoff](docs/handoff-2026-09-09.md) records verification and limitations.

## Required Software

Install these first:

| Software | Version Used Here | Purpose |
|---|---:|---|
| Git | 2.55.0 | Source control. |
| Python | 3.12 | FastAPI backend; used for the current local image-worker setup. |
| Node.js LTS | 24.19.0 | Next.js frontend. |
| npm | 11.17.0 | Frontend package manager and root scripts. |
| Docker Desktop | 4.89.0 | PostgreSQL, Redis, and MinIO local services when needed. |
| Docker CLI | 29.7.2 | Container commands. |

## Windows Install Commands

Run PowerShell as Administrator for software installation:

```powershell
winget install --id Git.Git --exact
winget install --id Python.Python.3.12 --exact
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Docker.DockerDesktop --exact
```

After installing Node or Docker, open a new terminal so PATH updates are loaded.

## Project Setup On Another System

From the project root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
npm --prefix apps/web ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

## Run The App

Set the local environment as described in the startup guide. Preserve the existing database; do not replace it with an empty one. Then double-click `Start App.cmd` or run:

```powershell
npm run web:dev
```

Open:

```text
Customer/staff web app: http://127.0.0.1:3011
Backend API: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs
```

Do not use API reload mode for the Windows image-worker setup. The separate ERP service is not started by this launcher; its instructions are in `CODEX_STARTUP.md`.

## Optional Local Services

Docker Compose file:

```text
infra/docker-compose.yml
```

Start local PostgreSQL, Redis, and MinIO:

```powershell
docker compose -f infra\docker-compose.yml up -d
```

The default development database is SQLite, so Docker is not required for the basic app to run.

## Dependency Files In This Project

| File | Purpose |
|---|---|
| `services/api/requirements.txt` | Python backend packages. |
| `apps/web/package.json` | Frontend package list. |
| `apps/web/package-lock.json` | Exact frontend dependency versions. |
| `package.json` | Root helper scripts. |
| `.env.example` | Backend environment variables. |
| `apps/web/.env.example` | Frontend environment variables. |
| `infra/docker-compose.yml` | Local database/cache/storage services. |
