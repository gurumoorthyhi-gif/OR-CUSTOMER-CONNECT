# Phase 1 - MVP

## Outcome

Customers can log in, upload artwork, create or discuss an order, approve a gangsheet, track status, and communicate with staff. Staff can manage customer app activity, approvals, messages, payments, and basic reports manually. Existing ERP features for customer creation, design records, gangsheet upload, preview, rate calculation, and estimate creation should be reused through an integration adapter once the ERP package is available.

## Customer Features

- Mobile OTP login.
- Customer profile and saved addresses.
- Home dashboard with New Order, My Orders, Messages, Design Library, Reorder, Track Order, and Support.
- Artwork upload flow connected to the existing ERP upload and design logic where possible.
- Private design library view backed by ERP design data where possible.
- Basic order creation from uploaded or existing design.
- Order status timeline.
- Gangsheet preview approval or rejection.
- Payment status visibility.
- Real-time chat with attachments.
- Support request from an order.

## Staff Features

- Admin login.
- Customer list and profile management.
- Customer level and manual price setup only if not already controlled by ERP.
- Order list with filters.
- Manual order creation or correction.
- Manual gangsheet approval view connected to ERP gangsheet preview/upload data.
- Approval history.
- Payment status update.
- Message inbox.
- Support queue.
- Basic daily order and revenue reports.
- Role-based permissions.

## Backend Modules

- Auth.
- Customers.
- Addresses.
- Designs.
- Orders.
- Gangsheets.
- Pricing snapshots from ERP calculation output.
- Messages.
- Payments.
- Support.
- Notifications.
- Audit logs.

## Acceptance Criteria

- A customer can complete a basic order journey without WhatsApp.
- Staff can create and update the same order internally.
- Uploaded artwork is private.
- Approved gangsheet records include timestamp and customer identity.
- Order price is stored as a snapshot from the ERP rate calculation.
- All major status changes are audited.

## Current Scaffold Status

Phase 1 screens, route structure, backend placeholder APIs, and ERP adapter boundaries are created. Real ERP data connection will be completed after the ERP package is available.
