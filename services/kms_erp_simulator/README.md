# KMS ERP Local Simulator

This development-only FastAPI app exposes the minimum KMS ERP API contract expected by the ODD RAVEN adapter.

Run it on port `8001`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.kms_erp_simulator.main:app --host 127.0.0.1 --port 8001
```

The main API expects `KMS_ERP_BASE_URL=http://127.0.0.1:8001/api/v1`.
