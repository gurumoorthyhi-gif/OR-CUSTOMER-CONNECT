# Phase 1 API Inventory

## Core API

Core customer, design, order, and payment read endpoints now return local SQLite seed data until ERP mapping is complete.

| Endpoint | Purpose |
|---|---|
| `GET /health` | API health check. |
| `POST /api/auth/otp/request` | Request mobile OTP. |
| `POST /api/auth/otp/verify` | Verify OTP. |
| `GET /api/customers` | Customer list placeholder. |
| `GET /api/customers/{customer_id}` | Customer detail placeholder. |
| `GET /api/designs` | Design library placeholder. |
| `POST /api/designs/upload` | Artwork upload placeholder. |
| `GET /api/orders` | Order list placeholder. |
| `POST /api/orders` | Order creation placeholder. |

## ERP Adapter API

| Endpoint | Purpose |
|---|---|
| `GET /api/erp/customers` | Read customers through ERP adapter. |
| `POST /api/erp/rate` | Call ERP-authoritative rate calculator. |
| `POST /api/erp/estimate` | Call ERP estimate creator. |
| `GET /api/erp/gangsheets/{gangsheet_id}/preview` | Read ERP gangsheet preview metadata. |

## Phase 1 Workflow API

| Endpoint | Purpose |
|---|---|
| `GET /api/approvals` | Approval queue. |
| `POST /api/approvals/{order_id}/approve` | Record customer approval. |
| `POST /api/approvals/{order_id}/reject` | Record customer rejection/change request. |
| `GET /api/messages` | Chat history placeholder. |
| `POST /api/messages` | Send message placeholder. |
| `GET /api/payments` | Payment status placeholder. |
| `POST /api/payments/{payment_id}/status` | Staff payment update placeholder. |
| `GET /api/support` | Support tickets. |
| `POST /api/support` | Create support ticket. |
| `GET /api/notifications` | Customer notifications. |
