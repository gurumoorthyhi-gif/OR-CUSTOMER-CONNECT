# Database Setup

## Local Development

The default local database is SQLite:

```text
oddraven-local.db
```

It is created automatically when the API starts.

Manual initialization:

```powershell
.\.venv\Scripts\python.exe -m services.api.app.db.init_db
```

Run migrations:

```powershell
.\.venv\Scripts\alembic.exe -c services/api/alembic.ini upgrade head
```

## Tables Created

- `customers`
- `designs`
- `orders`
- `approvals`
- `messages`
- `payments`
- `machines`
- `production_jobs`
- `quality_checks`
- `reprints`
- `waste_events`
- `shipments`
- `invoices`
- `suppliers`
- `support_tickets`
- `audit_logs`

## ERP Mapping Fields

The schema includes `external_erp_id` fields on records that will connect to the existing ERP package. These fields should store the original ERP IDs and let the new app keep customer-facing approval, chat, notification, and audit history separately.

## Production Database

For production, switch `DATABASE_URL` to PostgreSQL:

```text
postgresql+psycopg://oddraven:password@host:5432/oddraven
```
