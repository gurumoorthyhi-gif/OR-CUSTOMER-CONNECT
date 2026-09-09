# ODD RAVEN Dependencies

Use this file when setting up the project on another system.

## Required Software

Install these first:

| Software | Version Used Here | Purpose |
|---|---:|---|
| Git | 2.55.0 | Source control. |
| Python | 3.13.14 | FastAPI backend. |
| Node.js LTS | 24.19.0 | Next.js frontend. |
| npm | 11.17.0 | Frontend package manager and root scripts. |
| Docker Desktop | 4.89.0 | PostgreSQL, Redis, and MinIO local services when needed. |
| Docker CLI | 29.7.2 | Container commands. |

## Windows Install Commands

Run PowerShell as Administrator for software installation:

```powershell
winget install --id Git.Git --exact
winget install --id Python.Python.3.13 --exact
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Docker.DockerDesktop --exact
```

After installing Node or Docker, open a new terminal so PATH updates are loaded.

## Project Setup On Another System

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r services\api\requirements.txt
npm --prefix apps/web install
.\.venv\Scripts\python.exe -m services.api.app.db.init_db
npm run check
```

## Run The App

Backend:

```powershell
.\.venv\Scripts\uvicorn.exe services.api.app.main:app --reload
```

Frontend:

```powershell
npm --prefix apps/web run dev
```

Open:

```text
Customer/staff web app: http://127.0.0.1:3000
Backend API: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs
```

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

