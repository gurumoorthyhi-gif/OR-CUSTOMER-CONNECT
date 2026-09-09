# Phase 2 - Operations Automation

## Outcome

The system extends the existing ERP production workflow with customer-facing status, QC, packing, courier dispatch, invoice visibility, supplier routing visibility, and reprints where those areas are missing or need stronger tracking.

## Features

- Artwork preflight checks only if missing from ERP or needed for customer-side validation.
- Automated pricing through the existing ERP rate calculator.
- Gangsheet builder or preview wrapper around existing ERP gangsheet logic.
- One-tap reorder.
- QR or barcode tracking.
- Machine setup and production queue.
- Operator screen with Start, Pause, Complete, and Report Issue.
- QC pass, reject, and partial reject.
- Reprint creation and tracking.
- Packing workflow.
- Courier integration for AWB, labels, and tracking.
- GST invoice, proforma, receipt, credit note, and debit note generation.
- Supplier job routing and tracking.
- Waste tracking.

## Acceptance Criteria

- A job can move from approved order to production queue.
- Staff can track machine, operator, QC, packing, and dispatch states.
- Reprints link back to the original order and defect reason.
- Courier tracking is visible to customer and staff.
- Invoices are generated from order and payment data.

## Current Scaffold Status

Phase 2 operations screens and backend placeholder APIs are created. Real behavior will be connected after the existing ERP package is inspected and mapped.
