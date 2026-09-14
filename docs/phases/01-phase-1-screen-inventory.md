# Phase 1 Screen Inventory

## Customer Screens

| Screen | Route | Purpose |
|---|---|---|
| Login | `/login` | Mobile OTP entry point. |
| Dashboard | `/` | Main customer home with active orders, approval, payment, design, support, and tracking summary. |
| New Order | `/new-order` | Artwork upload and order request flow that will call ERP upload, rate, and estimate logic. |
| Orders | `/orders` | Customer order history. |
| Order Detail | `/orders/[id]` | Gangsheet approval, tracking, estimate, and chat entry. |
| Designs | `/designs` | Customer design library view. |
| Messages | `/messages` | Customer-staff chat. |
| Payments | `/payments` | Payment and receipt status. |
| Profile | `/profile` | Customer details, GST, level, address, and audit history. |
| Support | `/support` | Raise support or complaint request. |
| Track | `/track` | Focused order tracking view. |

## Staff Screens

| Screen | Route | Purpose |
|---|---|---|
| Admin Console | `/admin` | Staff entry point. |
| Approval Queue | `/admin/approvals` | Review customer approval state and hold/release orders. |
| Orders | `/admin/orders` | Staff order list and status overview. |
| Customers | `/admin/customers` | CRM/customer lookup placeholder. |
| Messages | `/admin/messages` | Staff inbox placeholder. |
| Payments | `/admin/payments` | Payment status management placeholder. |
| Support | `/admin/support` | Support ticket queue. |

## Data Source

Phase 1 currently uses sample data from `apps/web/app/data.ts`. After the ERP package is provided, these screens should read from the backend API and ERP adapter.

