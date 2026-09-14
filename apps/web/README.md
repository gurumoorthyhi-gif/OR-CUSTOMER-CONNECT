# ODD RAVEN Web App

Next.js PWA for the customer app, staff operations screens, and the embedded ERP frontend.

The browser uses port `3011` for every user-facing page. The root launcher
starts the ODD RAVEN API on `8000`, the ERP backend on `8002`, and this app on
`3011`.

## Phase 1 Screens

- Customer dashboard.
- New order.
- My orders.
- Messages.
- Design library.
- Approval screen.
- Payment status.
- Support.
- Staff order dashboard.

## Install

After installing Node.js LTS and from the repository root:

```powershell
npm.cmd --prefix apps\web ci
npm.cmd run web:dev
```

Open `/erp` for ERP, `/admin/messages` for staff messages, `/messages` for
customer messages, and `/login` for customer login. Staff creates customer
usernames and passwords from `/admin/customers/new`.
