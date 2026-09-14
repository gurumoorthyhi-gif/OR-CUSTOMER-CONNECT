# ODD RAVEN API

FastAPI backend for customer accounts, credential login, designs, orders,
production, payments, messaging, reporting, uploads, and image-processing jobs.

The unified launcher runs this service on `http://127.0.0.1:8000`. Browser
requests normally go through the frontend origin at `http://127.0.0.1:3011`.

## Run

```powershell
.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 127.0.0.1 --port 8000
```

## Test

```powershell
.venv\Scripts\pytest.exe
```

Initialize the local schema with `npm.cmd run api:init-db`. Demo seed data is
disabled unless `SEED_LOCAL_DATA=true` is explicitly configured.
