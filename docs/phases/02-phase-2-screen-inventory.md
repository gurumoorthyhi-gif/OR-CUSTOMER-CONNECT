# Phase 2 Screen Inventory

## Staff Operations Screens

| Screen | Route | Purpose |
|---|---|---|
| Production Queue | `/admin/production` | Machine/operator queue for approved jobs. |
| Machines | `/admin/machines` | Machine status, speed, and queue overview. |
| QC | `/admin/qc` | Pass/reject finished print jobs. |
| Packing | `/admin/packing` | Packing workflow before dispatch. |
| Courier | `/admin/courier` | Shipment and AWB tracking placeholder. |
| Invoices | `/admin/invoices` | Invoice and proforma visibility. |
| Suppliers | `/admin/suppliers` | Outsourced production partner view. |
| Reprints | `/admin/reprints` | QC or complaint-created reprint queue. |
| Waste | `/admin/waste` | Waste meters and reason capture. |

## ERP Relationship

These screens should use existing ERP order, design, gangsheet, rate, estimate, and production data where available. The new platform adds tracking, customer visibility, audit logs, and workflow control around those records.

