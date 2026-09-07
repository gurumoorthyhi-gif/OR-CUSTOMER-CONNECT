# Existing ERP Integration

## Decision

The existing DTF ERP is the source system for production-side logic where it already works well. The new ODD RAVEN platform must integrate with it, reuse its conditions, and expose customer-friendly workflows around it.

## ERP-Owned Areas

- Customer creation rules.
- Design records.
- Gangsheet upload.
- Gangsheet preview.
- Auto rate calculation.
- Estimate creation.
- Existing production conditions.
- Existing validation rules.

## New Platform-Owned Areas

- Customer PWA.
- Mobile OTP login and customer sessions.
- Customer order history and tracking view.
- Customer approval and rejection flow.
- In-app chat and support.
- Payment visibility.
- Notification center.
- Secure customer file access.
- Audit trail around customer-visible actions.
- API layer around ERP functions.
- Data import and synchronization.

## Integration Strategy

1. Inspect the ERP package when it is available.
2. Identify framework, database, storage, and rate calculation code.
3. Map ERP entities to the new platform contracts.
4. Wrap reusable ERP functions behind adapter interfaces.
5. Keep ERP calculation results as the authoritative estimate and rate output.
6. Store customer app events, approvals, messages, and audit logs in the new platform.
7. Sync or import ERP data without changing ERP logic until the mapping is verified.

## Files To Bring From Existing ERP

- Source code folder.
- Database schema or SQL dump.
- Configuration sample with real secrets removed.
- Sample customer, design, gangsheet, estimate, and invoice records.
- Rate calculator files.
- Estimate creator files.
- Upload and file storage path notes.
- Deployment or setup notes.

