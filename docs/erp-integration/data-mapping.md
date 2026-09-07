# ERP Data Mapping

This file will be filled after the ERP package is available.

## Customer

| New Platform Field | ERP Field | Notes |
|---|---|---|
| `customer.public_id` | Pending | Permanent ODD RAVEN customer ID. |
| `customer.business_name` | Pending | Business or shop name. |
| `customer.mobile` | Pending | Login and contact number. |
| `customer.level` | Pending | Pricing tier from ERP if available. |

## Design

| New Platform Field | ERP Field | Notes |
|---|---|---|
| `design.name` | Pending | Customer-visible design name. |
| `design.storage_key` | Pending | Original artwork file location. |
| `design.preview_key` | Pending | Preview image/file location. |

## Gangsheet

| New Platform Field | ERP Field | Notes |
|---|---|---|
| `gangsheet.preview_url` | Pending | Customer approval preview. |
| `gangsheet.length_meters` | Pending | Used for estimate and production. |
| `gangsheet.version` | Pending | Required for approval history. |

## Estimate

| New Platform Field | ERP Field | Notes |
|---|---|---|
| `estimate.total_amount` | Pending | Must match ERP calculator. |
| `estimate.rate_per_meter` | Pending | Must come from ERP rules. |
| `estimate.line_items` | Pending | Required for customer transparency. |

