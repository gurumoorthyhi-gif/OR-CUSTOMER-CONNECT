# Phase 2 API Inventory

These endpoints now read from local SQLite seed data where a Phase 2 table exists. Write endpoints record or update local rows where practical and remain ready for ERP mapping.

| Endpoint | Purpose |
|---|---|
| `GET /api/production/queue` | Production queue. |
| `GET /api/machines` | Machine status list. |
| `POST /api/machines/{machine_id}/status` | Update machine status. |
| `GET /api/qc` | QC queue. |
| `POST /api/qc/{qc_id}/pass` | Pass QC. |
| `POST /api/qc/{qc_id}/reject` | Reject QC and require reprint. |
| `GET /api/packing` | Packing queue. |
| `POST /api/packing/{packing_id}/complete` | Mark packing complete. |
| `GET /api/courier` | Shipment list. |
| `POST /api/courier` | Create shipment placeholder. |
| `GET /api/invoices` | Invoice list. |
| `POST /api/invoices` | Create invoice placeholder. |
| `GET /api/suppliers` | Supplier list. |
| `POST /api/suppliers/jobs` | Create supplier job placeholder. |
| `GET /api/reprints` | Reprint queue. |
| `POST /api/reprints` | Create reprint. |
| `GET /api/waste` | Waste events. |
| `POST /api/waste` | Record waste. |
