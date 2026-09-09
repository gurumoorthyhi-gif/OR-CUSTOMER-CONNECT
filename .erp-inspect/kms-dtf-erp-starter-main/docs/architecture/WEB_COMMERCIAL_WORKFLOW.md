# Web Commercial Workflow

## Delivered scope

The first browser interface and API cover:

- customer search, creation, details, editing, and deactivation;
- billing and shipping addresses;
- product categories and product creation/listing;
- decimal-safe price calculation using existing price, discount, and tax rules;
- order creation, listing, details, totals, advance/balance, and status changes;
- responsive desktop/mobile navigation and secure browser login.

## Tenant boundary

Migration `0028_commercial_organization_scope` adds `organization_id` to customers,
product categories, products, discount rules, tax configurations, and orders.
Columns remain nullable during desktop compatibility and controlled migration.

Every web repository is constructed using the organization taken from the verified
server-side session. Queries, updates, deactivation, and order status changes apply
that organization filter. Client-supplied organization IDs are not accepted.

Existing desktop repositories omit the organization filter and therefore continue
to operate during the transition. The cutover migration must backfill every legacy
commercial record before PostgreSQL constraints become non-nullable.

## Browser application

The initial browser shell lives under `web/` and is served by FastAPI at `/` for
local development. It provides overview counts, recent orders, searchable tables,
and creation dialogs. It uses credential cookies and sends the CSRF header for all
state-changing operations.

The API supports multi-item orders. The first compact order dialog creates one line
at a time; a richer multi-line editor can build the same API payload without a
backend change.

## API groups

```text
/api/v1/customers
/api/v1/categories
/api/v1/products
/api/v1/products/{id}/price
/api/v1/orders
/api/v1/orders/{id}/status
```
