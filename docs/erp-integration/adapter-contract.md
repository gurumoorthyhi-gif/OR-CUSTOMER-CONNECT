# ERP Adapter Contract

The backend will call the existing ERP through this adapter boundary. The implementation depends on the ERP package language and database.

## Required Adapter Methods

- `list_customers()`
- `get_customer(external_customer_id)`
- `create_or_link_customer(payload)`
- `list_designs(customer_id)`
- `upload_design(customer_id, file)`
- `create_gangsheet(order_payload)`
- `get_gangsheet_preview(gangsheet_id)`
- `calculate_rate(payload)`
- `create_estimate(payload)`
- `get_order_status(external_order_id)`

## Integration Modes

| Mode | When To Use |
|---|---|
| Direct database read | ERP has a stable database schema and no API. |
| Internal API call | ERP already exposes endpoints. |
| Library import | ERP is Python or Node code that can be safely reused. |
| File exchange | ERP is desktop/local and only exports files. |

## Non-Negotiables

- Do not duplicate the ERP rate calculator unless reuse is impossible.
- Do not change ERP production logic before mapping and test comparison.
- Approval history must stay in the new platform even if preview comes from ERP.
- Customer-visible data must be filtered through the new API permission layer.

