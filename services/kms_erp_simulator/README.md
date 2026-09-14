# KMS ERP Local Simulator (legacy development tool)

This development-only FastAPI app exposes the minimum KMS ERP API contract expected by the ODD RAVEN adapter.

Run it on port `8001`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.kms_erp_simulator.main:app --host 127.0.0.1 --port 8001
```

The unified application now uses the inspected KMS DTF ERP backend on port
`8002`, started automatically by `npm.cmd run web:dev`. This simulator remains
available for adapter-contract tests only; use
`KMS_ERP_BASE_URL=http://127.0.0.1:8001/api/v1` when deliberately testing it.
