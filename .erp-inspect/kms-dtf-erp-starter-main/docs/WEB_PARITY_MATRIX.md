# Desktop-to-Web Parity Contract

The PySide desktop ERP is the authoritative product specification. A web feature is not
complete until its fields, actions, validations, permissions, persisted data, and file
effects match the desktop workflow.

## Application shell

- Collapsed 78 px glass navigation rail, branded header, hover labels, active state.
- Dark/light theme control and glassmorphism visual language.
- Top bar page title, subtitle, connectivity state, user context, and Developer Mode state.
- Responsive browser layout without removing desktop navigation destinations.

## Navigation and required workflow parity

| Route | Desktop implementation | Required web behavior | Status |
|---|---|---|---|
| Dashboard | `DashboardPage` | Period filter, 6 KPIs, production pipeline, recent activity, low stock, quick actions | In progress |
| Customers | `CustomersPage` | CRUD, addresses, rates, customer folder, previews, search, image search, upload/open/download/copy/replace/delete | Implemented |
| Orders | `OrdersPage` | Customer intake, product type, staged design imports/previews, saved design links, details, timeline, quick/full status controls, Open Designs | Implemented |
| Artwork Studio | `ArtworkStudioPage` | Select artwork/orders, compose, save and export gang sheets | Missing |
| Image Editor | `ImageEditorPage` | Documents, canvas tools, layers, channels, edits and export | Missing |
| Inventory | `InventoryPage` | Items, receipts, issues, adjustments and low-stock state | Missing |
| Purchase | `PurchasesPage` | Suppliers, purchase records and receiving | Missing |
| Sales | `SalesPage` | Quotations and sales workflow | Missing |
| Invoices | `InvoicesPage` | Invoice creation and status | Missing |
| Payments | `PaymentsPage` | Payment records and customer ledger | Missing |
| Products | `ProductsPage` | Products, categories, quantity pricing, discounts and tax | Partial |
| Artwork Library | `ArtworkLibraryPage` | Upload, preview, versions, approval and customer/order links | Partial |
| Suppliers | `SuppliersPage` | Supplier CRUD and purchase linkage | Missing |
| Packing | `PackingPage` | Packing records, lists and completion | Missing |
| Dispatch | `DispatchPage` | Dispatch creation, carrier/tracking and delivery status | Missing |
| WhatsApp | `WhatsAppWorkspaceHost` | Connected workspace with customer/message linkage | Missing |
| Mail | `EmailInboxPage` | Inbox, replies, templates and customer linkage | Missing |
| AI Tools | `AIToolsPage` | Submit jobs, monitor results and save artwork | Missing |
| Cloud Storage | `CloudStoragePage` | Catalog, upload/download and synchronization state | Partial |
| Reports & Backup | `OperationsPage` | Reports, backup verification/restore and audit history | Missing |
| Settings | `SettingsPage` | Existing application and integration settings | Missing |
| Users | permissions model | Users, roles and all existing permission assignments | Partial |

## Non-negotiable migration rules

1. Existing customer, order, artwork, gang-sheet, inventory, financial, shipping, and audit
   records must be migrated rather than replaced with an empty database.
2. Existing files retain customer/order relationships, names, checksums, and versions.
3. Browser-visible files remain private and tenant-scoped.
4. CorelDRAW remains a Windows application and is reached through the local connector;
   opening and exporting must update the same hosted ERP record.
5. The simplified prototype is not accepted as feature parity.
