# Phase 2 Completion Checklist

## Completed In Scaffold

- Production queue screen.
- Machine overview screen.
- QC pass/reject screen.
- Packing screen.
- Courier shipment screen.
- Invoice screen.
- Supplier screen.
- Reprint queue screen.
- Waste tracking screen.
- Backend routes for production operations.
- Backend routes for machines, QC, packing, courier, invoices, suppliers, reprints, and waste.
- Local database tables for operations records.
- Seed records for production job, machine, QC, shipment, invoice, supplier, reprint, and waste.
- Database-backed operation API reads for local development.

## Waiting For ERP Package

- Map ERP production jobs to `/api/production/queue`.
- Map machine/job status if ERP stores it.
- Connect ERP gangsheet/job IDs to QC and packing.
- Confirm invoice generation ownership.
- Confirm supplier job data ownership.
- Confirm waste categories and fields.

## External Dependencies Later

- Courier API credentials.
- Label printer workflow.
- QR or barcode scanner setup.
- GST invoice numbering rules.
- Supplier rate sheets.
- Machine configuration.
