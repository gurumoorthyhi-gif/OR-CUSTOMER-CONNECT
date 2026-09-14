# Database Migrations

Alembic migrations for the ODD RAVEN API.

Run from the repository root:

```powershell
.\.venv\Scripts\alembic.exe -c services/api/alembic.ini upgrade head
```

Create a new migration after model changes:

```powershell
.\.venv\Scripts\alembic.exe -c services/api/alembic.ini revision --autogenerate -m "describe change"
```

