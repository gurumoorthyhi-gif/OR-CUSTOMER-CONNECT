# Local Development

## Run Backend

```powershell
.\.venv\Scripts\python.exe -m services.api.app.db.init_db
.\.venv\Scripts\uvicorn.exe services.api.app.main:app --reload
```

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
npm --prefix apps/web run dev
```

Frontend URL:

```text
http://127.0.0.1:3000
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
- If the backend is offline, frontend screens fall back to sample data.

