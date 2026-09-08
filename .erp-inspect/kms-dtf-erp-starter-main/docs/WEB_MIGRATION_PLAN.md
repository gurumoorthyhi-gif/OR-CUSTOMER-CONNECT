# Web Migration Plan

The hosted ERP is being built alongside the existing Windows desktop application.
The desktop runtime remains operational until migration reconciliation and pilot
acceptance are complete.

## Delivery order

1. **Web foundation** — FastAPI application factory, environment configuration,
   versioned routing, CORS allow-list, request tracing, security headers, health
   endpoint, separate dependencies, and automated tests.
2. **Hosted data foundation** — PostgreSQL compatibility, tenant boundaries,
   hosted identities, roles, permissions, sessions, audit records, and migrations.
3. **Authentication** — secure login/logout, password reset, session rotation,
   account disabling, rate limits, and authorization enforcement.
4. **Core commercial workflow** — customers, addresses, products, pricing, and
   orders in the API and responsive browser interface.
5. **Design files** — private Backblaze uploads/downloads, metadata, previews,
   versions, approvals, and production-ready design selection.
6. **Operations** — production, quality, packing, dispatch, inventory, purchasing,
   invoices, payments, and reports.
7. **Migration** — immutable source backup, SQLite-to-PostgreSQL import,
   record/financial/file reconciliation, and a tested rollback procedure.
8. **Production deployment** — Render services, domain, HTTPS, monitoring,
   database and object-storage backups, restore drills, and secrets management.
9. **Pilot and cutover** — restricted pilot, acceptance checks, desktop read-only
   transition, and hosted system of record.
10. **CorelDRAW workflow** — signed local sync agent, controlled production drive,
    CorelDRAW automation, versioned CDR uploads, and gangsheet export feedback.

## Step 1 local usage

Install the web-only dependencies without installing the PySide6 desktop stack:

```powershell
python -m venv .venv-web
.\.venv-web\Scripts\python.exe -m pip install -r requirements-web-dev.txt
```

Start the development API:

```powershell
.\.venv-web\Scripts\python.exe -m uvicorn api.main:app --reload
```

Then open `http://127.0.0.1:8000/docs` or check
`http://127.0.0.1:8000/api/v1/health`.

The eventual Render start command is:

```text
uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

Production interactive API documentation is disabled by default.

## Data safety gates

- No production data is migrated during the foundation steps.
- The desktop SQLite database remains unchanged until a reviewed migration tool exists.
- Migration runs against a copied source database before any cutover attempt.
- Database records and Backblaze objects receive separate backup and restore checks.
- Every milestone requires tests and an explicit acceptance check before cutover.
