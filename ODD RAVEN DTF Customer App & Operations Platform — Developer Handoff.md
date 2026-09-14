# ODD RAVEN DTF CUSTOMER APP & OPERATIONS PLATFORM

## 1. PROJECT PURPOSE

We are building a dedicated digital platform for the ODD RAVEN DTF printing business.

The main objective is to avoid depending on WhatsApp, Excel, random file folders, manual quotations, manual order tracking, manual design searching and repeated customer enquiries.

The platform should become the main connection between:

Customer  
↓  
Customer App / Web App  
↓  
ODD RAVEN Backend  
↓  
Sales / CRM  
↓  
Order Management  
↓  
Gangsheet / Artwork  
↓  
Production  
↓  
QC  
↓  
Packing  
↓  
Courier  
↓  
Accounts / Reports

WhatsApp should NOT be required for normal operations.

WhatsApp may remain only as an optional lead-generation or emergency-contact channel.

---

# 2. BUSINESS MODEL

ODD RAVEN sells DTF printing by meter.

Initially, some or most production may be sourced from an outside supplier.

Later, production will gradually move in-house.

Planned machine expansion:

Stage 1:
Supplier / outsourced production

Stage 2:
1 × 4-head DTF printer

Stage 3:
1 × 4-head + 1 × 6-head

Stage 4:
1 × 4-head + 2 × 6-head

Target long-term operating volume:

Approximately 800+ meters/day.

The system must therefore support both:

1. Outsourced/supplier fulfilment
2. Internal machine production

The same customer order system should work regardless of where the order is actually printed.

---

# 3. MOST IMPORTANT PRODUCT RULE

DO NOT COMPROMISE CUSTOMER EASE OF USE.

The customer app must be easier than managing an order through WhatsApp.

If a customer has to learn complicated software, enter the same information repeatedly, search through menus or fill long forms, the product has failed.

General UX target:

Most common customer actions should take approximately 1–3 taps after login.

Customer interface must NOT look like an ERP.

Internal staff interface can be detailed.

Customer interface must remain extremely simple.

---

# 4. CUSTOMER APP EXPERIENCE

Recommended first implementation:

Responsive Web App + PWA.

The same application must work well on:

- Android
- iPhone
- Desktop
- Laptop
- Tablet

Customer should be able to install the PWA on their phone like an app.

Native Android/iOS apps can come later if required.

---

# 5. CUSTOMER LOGIN

Primary login:

Mobile Number + OTP

Optional later:

- Email OTP
- Password
- Biometric/device authentication
- 2FA for high-value dealer accounts

Important:

After a customer verifies a trusted device, do not force OTP every time.

---

# 6. CUSTOMER HOME SCREEN

Keep the home screen very simple.

Primary actions:

NEW ORDER

MY ORDERS

MESSAGES

DESIGN LIBRARY

REORDER

TRACK ORDER

SUPPORT

Secondary information:

- Orders in progress
- Pending approval
- Pending payment
- Orders dispatched
- Current customer pricing level
- Outstanding credit if applicable

Do not put unnecessary business statistics on the customer's home screen.

---

# 7. REAL-TIME CHAT

We need our own internal real-time messaging system.

Do not depend on WhatsApp API.

Chat should feel familiar like WhatsApp.

Required features:

- Text messages
- Image messages
- File attachments
- PNG
- JPG/JPEG
- PDF
- ZIP if allowed
- Artwork file attachment
- Voice note later
- Reply to message
- Read status
- Delivered status
- Typing indicator
- Time/date
- Search
- Message attachments
- Order cards
- Gangsheet approval cards
- Payment request cards
- Courier tracking cards
- Support/reprint cards

Use WebSockets or another reliable realtime architecture.

---

# 8. CHAT MUST BE BUSINESS-AWARE

Do not store all conversations as one giant chat only.

Messages should optionally be linked to:

- Customer
- Order
- Design
- Gangsheet
- Payment
- Complaint
- Reprint
- Courier shipment

Example:

Customer ID:
OR-KA-0028

Order:
OR-2609-00441

Gangsheet:
GS-00441-02

The system must allow staff to open the order and immediately see the relevant messages.

---

# 9. CUSTOMER PROFILE

Each customer should receive a permanent customer ID.

Example:

OR-TN-0001

OR-KA-0001

OR-MH-0001

Profile information:

- Customer ID
- Company name
- Customer name
- Mobile
- Email
- GSTIN
- Billing address
- Shipping addresses
- City
- State
- Pincode
- Contact person
- Customer category
- Dealer / printer / factory / brand / reseller
- Assigned account manager
- Customer level
- Customer-specific price
- Credit limit
- Payment terms
- Order history
- Total meters purchased
- Average monthly meters
- Last order date
- Complaint count
- Reprint count
- Outstanding balance
- Notes

---

# 10. CUSTOMER LEVELS

Do not hardcode pricing permanently.

Admin must be able to create/edit customer levels.

Possible structure:

Trial

Standard

Regular

High Volume

Dealer

Factory / Key Account

Each level can control:

- Price per meter
- Minimum order
- Payment method
- Credit eligibility
- Order priority
- Discount
- Delivery benefits
- Support priority

Individual customer overrides must also be possible.

---

# 11. PRICING ENGINE

Pricing must be dynamic and admin-configurable.

Example only:

1–10 m

11–50 m

51–100 m

101–500 m

501+ m

Special Contract

Admin should be able to change pricing without code deployment.

Pricing can depend on:

- Customer level
- Quantity
- Special rate
- Promotional rate
- State
- Courier option
- Urgent production surcharge
- Design service charges
- Other configurable services

System must always store the exact applied price inside the order so historical invoices never change when current pricing changes.

---

# 12. NEW ORDER FLOW

Target flow:

Upload Designs  
↓  
Enter Size  
↓  
Enter Quantity  
↓  
Auto Check  
↓  
Auto Gangsheet / Manual Gangsheet  
↓  
Preview  
↓  
Price  
↓  
Customer Approval  
↓  
Payment  
↓  
Production

The process should require minimum typing.

---

# 13. DESIGN LIBRARY

Every customer's uploaded artwork should become part of their private design library.

Each design needs:

- Design ID
- Customer ID
- Original file
- Preview image
- Filename
- Upload date
- Width
- Height
- DPI
- File type
- Transparency status
- Print-ready status
- Previous print sizes
- Print quantity history
- Previous gangsheets
- Tags
- Customer SKU
- Internal notes
- Archived status

Example:

DES-000842

"Tiger Front"

Previous size:
12 × 16 inch

Last printed:
20 August

Previous orders:
23

---

# 14. DESIGN SEARCH

Customer should be able to search:

Naruto

Tiger

Logo

SKU

Order Number

Design ID

Search results should immediately show relevant:

- Designs
- Previous orders
- Gangsheets

---

# 15. ONE-TAP REORDER

One of the most important features.

Customer opens previous order.

Button:

REORDER

Then:

Same quantity

or

Change quantity

Then confirm.

No need to upload artwork again.

No need to contact staff.

---

# 16. ARTWORK PREFLIGHT

Artwork checking should gradually become automated.

Checks:

- Resolution
- DPI
- Pixel dimensions
- Physical print dimensions
- Transparent background
- File corruption
- Empty image
- Very low resolution
- Very thin details
- Large white background
- Transparent edge
- Unsupported file
- Incorrect dimensions

Status:

READY TO PRINT

WARNING

REQUIRES REVIEW

---

# 17. ARTWORK AUTOMATION

Future/internal tools can include:

REMOVE BACKGROUND

UPSCALE

TRIM TRANSPARENT AREA

RESIZE

WHITE CHOKE

MIRROR

PREVIEW

These operations should eventually integrate with ODD RAVEN's image processing / AI services.

Human designer should handle only exceptions.

---

# 18. GANGSHEET BUILDER

Very important module.

Customer uploads designs.

Example:

Design A  
10 × 12 inch  
50 copies

Design B  
4 × 4 inch  
20 copies

System automatically arranges the items efficiently on the DTF film width.

It calculates required gangsheet length.

Example:

Required length:
8.7 meters

Customer receives preview.

Buttons:

APPROVE

REQUEST CHANGE

After approval, the gangsheet becomes locked for production unless reopened by authorized staff.

---

# 19. GANGSHEET HISTORY

Store:

- Gangsheet ID
- Customer
- Order
- Designs used
- Quantities
- Dimensions
- Film width
- Length
- Preview
- Print-ready export
- Approval status
- Approval time
- Approved by
- Previous reprints
- Production result

---

# 20. CUSTOMER APPROVAL

Never depend on WhatsApp approval.

Gangsheet should show inside the app.

Customer presses:

APPROVE

or

REQUEST CHANGE

Store:

- Timestamp
- Customer ID
- Gangsheet version
- Approval IP/device if needed
- Approval history

Once approved, the system should clearly indicate:

APPROVED FOR PRINTING

---

# 21. PAYMENT

Support:

- Online payment
- UPI
- Payment gateway
- Bank transfer confirmation
- Credit customer
- Manual payment entry by Accounts

Recommended payment gateway can be added later.

Payment statuses:

Pending

Partially Paid

Paid

Credit Approved

Failed

Refunded

Partially Refunded

---

# 22. ORDER STATUS

Customer sees simple statuses:

ORDER RECEIVED

ARTWORK CHECKING

AWAITING APPROVAL

AWAITING PAYMENT

PAYMENT CONFIRMED

PRODUCTION QUEUE

PRINTING

QUALITY CHECK

PACKED

DISPATCHED

DELIVERED

COMPLETED

Customer should not see unnecessary machine-level technical information.

---

# 23. INTERNAL ORDER STATUS

Staff can see detailed information:

- Assigned printer
- Operator
- Queue position
- Expected meters
- Actual meters
- Start time
- Finish time
- Wastage
- Reprint meters
- QC result
- Packing
- Courier

---

# 24. PRODUCTION ROUTING

Production system must support:

OUTSOURCED

4-HEAD

6-HEAD-01

6-HEAD-02

FUTURE MACHINES

Admin can add machines later.

Each machine record should include:

- Machine ID
- Type
- Head count
- Width
- Rated speed
- Practical speed
- Online/offline
- Maintenance
- Current job
- Queue
- Printed meters
- Operator

---

# 25. MACHINE ASSIGNMENT

Initially allow manual machine assignment.

Later automatically assign jobs based on:

- Order size
- Deadline
- Machine availability
- Priority
- Small vs bulk jobs
- Estimated print time
- Current machine queue

Recommended business logic:

4-head:
Small orders
Urgent jobs
Samples
Reprints
Overflow
Testing

6-head #1:
Bulk production

6-head #2:
Bulk production / overflow / backup

---

# 26. SUPPLIER / OUTSOURCED PRODUCTION

System must also support sending jobs externally.

Each outsourced production record should track:

- Supplier
- Meters
- Cost/meter
- Total cost
- Sent date
- Expected completion
- Received date
- Wastage/rejection
- Supplier invoice
- Internal order links

This is necessary because sales may grow faster than our internal machines.

---

# 27. PRODUCTION QUEUE SCREEN

Operators should have a simple screen.

Example:

6-HEAD #1

1. OR-00441 — ABC Garments — 82 m

2. OR-00443 — XYZ Prints — 46 m

3. OR-00448 — Dealer 15 — 105 m

Buttons:

START

PAUSE

COMPLETE

REPORT ISSUE

Operator should not need access to the whole ERP.

---

# 28. QR / BARCODE JOB TRACKING

Every roll/order should have QR/barcode identification.

Example:

OR-260906-3821-R02

Staff scans at:

PRINT COMPLETE

QC

PACKING

DISPATCH

Each scan updates status automatically.

This should significantly reduce manual entry.

---

# 29. QUALITY CONTROL

QC scans QR.

Screen displays:

- Customer
- Order
- Gangsheet
- Expected meters
- Printed meters

Options:

PASS

REJECT

PARTIAL REJECT

Reject reasons:

- Nozzle issue
- White ink issue
- Colour issue
- Film issue
- Powder issue
- Damage
- Incorrect print
- Missing section
- Other

If rejected, automatically create a reprint requirement.

---

# 30. WASTAGE TRACKING

Record wastage separately.

Categories:

- Startup waste
- Test print
- Nozzle failure
- Film issue
- Powder issue
- Operator error
- Design error
- Customer change
- Reprint
- Machine error

Track:

Expected meters

Actual printed meters

Good meters

Waste meters

Waste %

This will later help calculate actual production cost.

---

# 31. COMPLAINT / REPRINT SYSTEM

Customer opens:

ORDER → REPORT PROBLEM

Select:

- Printing defect
- White issue
- Colour
- Missing quantity
- Courier damage
- Wrong design
- Other

Customer can upload:

- Photo
- Video
- Description

System creates ticket.

Example:

CMP-0092

Statuses:

OPEN

REVIEWING

APPROVED

REJECTED

REPRINT CREATED

REPRINT DISPATCHED

CLOSED

---

# 32. CUSTOMER SUPPORT

Customer should always have a visible:

TALK TO SUPPORT

option.

Never trap customers inside an AI chatbot.

AI can answer basic questions, but human support must always be accessible.

---

# 33. AI CUSTOMER ASSISTANT — LATER

Future feature.

AI can answer:

"What is my rate?"

"Where is my order?"

"Show my last invoice."

"Show my Naruto designs."

"How many meters did I buy this month?"

"Reorder my last gangsheet."

"How do I press this transfer?"

AI should only access data that the logged-in customer is authorized to see.

---

# 34. COURIER

System should eventually integrate courier APIs.

Packing staff scans order.

System already knows:

- Customer
- Address
- Weight
- Invoice
- Parcel details

Then automatically:

- Create shipment
- Generate AWB
- Generate shipping label
- Save courier
- Save tracking number
- Notify customer

Customer can track directly inside the app.

---

# 35. COURIER RESERVE / LOSS

Business analytics should allow configurable allowances for:

- Courier damage
- Lost parcel
- Replacement
- Re-shipment

These should not necessarily change the customer's order price.

They are internal business-cost metrics.

---

# 36. INVOICE

System should support:

- Quotation
- Proforma
- GST invoice
- Credit note
- Debit note
- Payment receipt

Invoice should be generated from order data automatically.

Avoid re-entering the same data manually.

---

# 37. CUSTOMER TRUST FEATURES

The platform must increase customer trust.

Show clearly:

- Business identity
- GST details
- Customer order number
- Order status
- Artwork approval history
- Payment status
- Invoice
- Production status
- Dispatch
- Courier tracking
- Support history
- Reprint resolution

For large orders, staff should be able to upload:

- Production photo
- Roll photo
- Packing photo
- Dispatch proof

The customer can see these within their order.

---

# 38. NOTIFICATIONS

Primary:

- In-app notification
- PWA push notification

Optional:

- Email
- SMS

WhatsApp notifications should be optional only.

The platform must NOT depend on WhatsApp API.

Examples:

Gangsheet ready for approval

Payment received

Production started

Order completed

Order dispatched

Courier delivered

Complaint updated

---

# 39. CUSTOMER LANGUAGE

Initial language:

English

Prepare architecture for:

Tamil

Hindi

Other languages later.

Do not hardcode English strings deeply inside code.

Use translation/i18n structure.

---

# 40. LOW-INTERNET SUPPORT

Many customers may use mobile internet.

Important:

- Compress previews
- Lazy-load history
- Use thumbnails
- Don't download full artwork until needed
- Resume interrupted uploads
- Show upload progress
- Cache important customer data
- Avoid huge page bundles
- PWA caching where appropriate

---

# 41. FILE STORAGE

Do NOT store large artwork directly inside PostgreSQL.

Use object storage.

Example architecture:

PostgreSQL:
metadata

Object Storage:
original designs
previews
gangsheets
invoices
attachments
videos

Use S3-compatible architecture.

---

# 42. DATABASE

Recommended:

PostgreSQL

Core entities/tables:

users

customers

customer_addresses

staff

roles

permissions

customer_levels

pricing_rules

designs

design_versions

gangsheets

gangsheet_items

orders

order_items

order_status_history

payments

invoices

messages

message_attachments

machines

production_jobs

production_events

qc_records

wastage_records

suppliers

supplier_jobs

inventory_items

inventory_transactions

courier_shipments

complaints

reprints

notifications

audit_logs

---

# 43. ROLE-BASED ACCESS

Roles:

CUSTOMER

DEALER

SALES EXECUTIVE

CUSTOMER SUPPORT

DESIGNER

PRODUCTION OPERATOR

QC

PACKING

DISPATCH

ACCOUNTS

PRODUCTION MANAGER

ADMIN

SUPER ADMIN

Every role must have controlled access.

Production operator should not see company financial reports.

Customer should never see another customer's files.

---

# 44. DEALER ACCOUNT

Later provide additional dealer capabilities.

Dealer may have:

- Special pricing
- High-volume ordering
- Multiple shipping addresses
- Monthly statement
- Credit
- Priority support
- Potential sub-customer/project organization

Do not make this complicate normal customer accounts.

---

# 45. CRM / SALES

Sales staff need:

- Leads
- Customer accounts
- Follow-up
- Trial status
- Sample sent
- Conversion
- Last order
- Monthly meters
- Average order
- Outstanding
- Customer health

Customer pipeline:

LEAD

CONTACTED

SAMPLE SENT

TRIAL ORDER

VERIFIED CUSTOMER

REGULAR CUSTOMER

HIGH VOLUME

DEALER / KEY ACCOUNT

---

# 46. AUTOMATIC FOLLOW-UP

Later system should identify customers whose ordering behavior changes.

Examples:

Usually orders every 7 days.

No order for 10 days.

Create follow-up.

Normally 300 m/month.

Current month only 80 m.

Create alert.

This reduces manual CRM checking.

---

# 47. CUSTOMER ACCOUNT MANAGER

Each regular/high-volume customer should be assignable to one staff member.

Account manager sees:

- Their customers
- Pending conversations
- New orders
- Payment issues
- Declining orders
- Complaints
- Follow-ups

---

# 48. INTERNAL DASHBOARD

Important dashboard metrics:

TODAY

Orders received

Orders pending approval

Orders awaiting payment

Orders in production

Meters pending

Meters printed

Meters remaining

Orders ready for dispatch

Delayed orders

Complaints

Reprints

Wastage

---

# 49. SALES DASHBOARD

Show:

New leads

Qualified leads

Samples sent

New customers

Repeat customers

Meters sold

Revenue

Average selling price/meter

Customer acquisition source

Top customers

Inactive customers

Outstanding payments

---

# 50. PRODUCTION DASHBOARD

Show:

Machine status

Current job

Queue

Meters printed

Machine utilization

Wastage

Reprints

Downtime

Production speed

Operator

Expected completion time

---

# 51. INVENTORY

Eventually automatically track:

- PET film
- White ink
- Cyan
- Magenta
- Yellow
- Black
- Powder
- Cleaning materials
- Packaging materials
- Labels

Production completion should create estimated consumption transactions.

Physical inventory adjustments must also be possible.

---

# 52. STOCK ALERTS

System should predict:

Current stock

Average daily consumption

Remaining production days

Example:

Film stock:
3,500 m

Daily usage:
800 m

Approximately:
4.4 days remaining

Alert purchasing before stock-out.

---

# 53. MAINTENANCE

For each machine:

- Installation date
- Total meters
- Head cleaning
- Damper change
- Filter
- Maintenance
- Repair
- Parts
- Technician
- Cost
- Downtime

Later generate preventive maintenance alerts based on:

Meters

Hours

Days

---

# 54. REPORTING

Reports should include:

Sales by day/month/state/customer

Meters by day/month

Revenue

Average selling price

Gross margin estimate

Customer retention

Repeat orders

Customer lifetime value

Wastage

Reprints

Complaint rate

Courier loss

Machine utilization

Supplier vs own production

Cost/meter

Outstanding payments

---

# 55. AUDIT LOG

Important actions must be logged.

Examples:

Price changed

Customer level changed

Order edited

Gangsheet approved

Gangsheet reopened

Payment edited

Invoice changed

Credit changed

Complaint closed

Order cancelled

Store:

Who

What

Before value

After value

Date/time

---

# 56. SECURITY

Minimum requirements:

HTTPS everywhere

Hashed passwords where passwords exist

Secure OTP

Rate limiting

File validation

Malware/file-type checks where possible

Object storage access controls

Signed/private file URLs

Customer tenant isolation

Role-based permissions

Audit logs

Database backup

Object-storage backup

Secure secrets management

No hardcoded API secrets in frontend

---

# 57. DATA PRIVACY

Customer artwork is private.

Customer A must never be able to access:

Customer B designs

Customer B invoices

Customer B messages

Customer B gangsheets

Even if someone guesses a URL.

Authorization must always be enforced by backend, not only frontend hiding.

---

# 58. TECHNICAL ARCHITECTURE

Preferred starting architecture:

Frontend:
React / Next.js

Customer App:
Responsive PWA

Internal Admin/ERP:
Web interface

Backend:
FastAPI or Node.js

Database:
PostgreSQL

Realtime:
WebSockets

Cache / queue:
Redis if required

Background jobs:
Celery/RQ/BullMQ or similar

Object storage:
S3-compatible

Authentication:
OTP + secure session/token

Push:
Web Push / Firebase later

Payments:
Gateway integration later

Courier:
API integration later

---

# 59. SERVICE ARCHITECTURE

Start as a modular monolith unless scaling requires services.

Do NOT unnecessarily create 20 microservices.

Keep clean modules:

Authentication

Customers

Chat

Designs

Gangsheets

Orders

Payments

Production

QC

Inventory

Courier

Support

Reporting

This allows future extraction into services if traffic requires it.

---

# 60. API-FIRST

Backend should expose documented APIs.

This is important because later:

Customer Web App

Android App

iOS App

Desktop ERP

AI Engine

Gangsheet Engine

Machine Systems

can all use the same backend.

Use OpenAPI documentation.

---

# 61. SOURCE OF TRUTH

The backend database should be the main source of business truth.

Not:

WhatsApp

Excel

Google Drive folders

Local staff notes

Everything important should eventually be recorded against:

Customer

Order

Gangsheet

Payment

Production Job

Shipment

---

# 62. CUSTOMER SIMPLICITY RULES

Hard UX rules:

Do not ask twice for information already stored.

Do not show internal production jargon unnecessarily.

Do not force customers to remember Order IDs.

Do not require navigating five menus to reorder.

Do not force long forms.

Do not show features customer does not use.

Default to simple mode.

Use large touch-friendly buttons.

Use clear status labels.

Use understandable error messages.

Autosave forms.

Remember drafts.

Allow upload retry/resume.

---

# 63. SIMPLE MODE VS ADVANCED MODE

Normal customers should see:

Order

History

Chat

Designs

Tracking

Support

Dealer/factory accounts can additionally see:

Bulk upload

Advanced gangsheet tools

Credit statement

Monthly reports

Multiple users

Purchase orders

Do not expose these unnecessarily to small buyers.

---

# 64. CUSTOMER TEAM ACCOUNTS — FUTURE

Large factories may need multiple users.

Example:

Owner

Purchase Manager

Designer

Accounts

Each can belong to the same company account.

Permissions can differ.

---

# 65. PERFORMANCE

System should feel fast.

Targets:

Fast initial load

Optimized images

Pagination

Virtual scrolling for large lists

Thumbnail previews

Background processing for heavy files

Do not block UI while image processing occurs.

Gangsheet generation may run as an asynchronous job with visible progress.

---

# 66. BACKUP AND RECOVERY

Automatic database backup.

Object storage backup/versioning.

Recovery testing.

Never depend on one server disk.

Production data is business-critical.

---

# 67. DEVELOPMENT PHASES

## PHASE 1 — FOUNDATION / MVP

Build first:

Customer registration/login

Customer profile

Customer dashboard

Real-time messaging

File upload

Design library

Manual new order

Order history

Order status

Manual customer pricing

Gangsheet upload by staff

Customer approve/reject

Payment status

Support ticket

Basic notifications

Internal admin

Role permissions

Basic reports

The MVP must already be easy enough for actual customers.

---

## PHASE 2 — DTF ORDER AUTOMATION

Add:

Artwork preflight

Automatic size calculations

Automatic pricing

Gangsheet builder

Reorder

QR tracking

Production queue

Machine management

QC

Reprints

Packing

Courier integration

Invoice automation

Supplier fulfilment

---

## PHASE 3 — SCALE AUTOMATION

Add:

AI background removal

Upscaling

Smart artwork checking

Auto machine assignment

Automated CRM follow-ups

Advanced customer segmentation

Inventory prediction

Maintenance prediction

AI customer support

Dealer portal

Factory accounts

Advanced analytics

Native mobile app only if necessary

---

# 68. DO NOT OVERBUILD V1

Do not delay the first usable version trying to build every feature immediately.

V1 should solve:

Customer communication

Artwork storage

Order management

Approval

Payment status

Order tracking

History

Support

Then automate deeper production tasks incrementally.

---

# 69. EXPECTED BUSINESS SCALE

Design architecture so it can comfortably grow beyond:

100 customers

500 customers

1,000 customers

10,000 customer accounts

Thousands of designs

Thousands of orders

Hundreds of thousands of messages

Large artwork files

800+ meters/day production

Do not optimize prematurely, but do not create architecture that requires complete rewriting at 500 customers.

---

# 70. CUSTOMER TRUST GOAL

The system should make the customer feel:

"My files are safe."

"I know what is happening with my order."

"I know what I paid."

"I can find my previous designs."

"I can reorder easily."

"If something goes wrong I know whom to contact."

"I don't need to continuously call them."

That experience is more important than adding unnecessary features.

---

# 71. FINAL CUSTOMER WORKFLOW

LOGIN

↓

DASHBOARD

↓

NEW ORDER

↓

SELECT OLD DESIGN
OR
UPLOAD NEW DESIGN

↓

SIZE + QUANTITY

↓

ARTWORK CHECK

↓

GANGSHEET

↓

PRICE

↓

APPROVE

↓

PAY

↓

PRODUCTION

↓

QC

↓

PACKING

↓

DISPATCH

↓

TRACKING

↓

DELIVERED

↓

REORDER

Everything remains permanently available in the customer's account.

---

# 72. FINAL INTERNAL WORKFLOW

LEAD

↓

CUSTOMER

↓

ORDER

↓

ARTWORK

↓

GANGSHEET

↓

APPROVAL

↓

PAYMENT

↓

PRODUCTION QUEUE

↓

SUPPLIER / MACHINE ASSIGNMENT

↓

PRINT

↓

QC

↓

REPRINT IF REQUIRED

↓

PACK

↓

COURIER

↓

DELIVERY

↓

INVOICE

↓

FOLLOW-UP

↓

REPEAT CUSTOMER

---

# 73. MAIN PRODUCT PHILOSOPHY

Customer-facing side:

SIMPLE

FAST

CLEAR

FAMILIAR

LOW-FRICTION

Internal side:

DETAILED

TRACEABLE

AUTOMATED

MEASURABLE

SCALABLE

The customer should feel like they are using a simple messaging/order app.

The company should receive the power of a complete DTF ERP behind it.

---

# 74. NON-NEGOTIABLE REQUIREMENTS

1. Customer simplicity must never be compromised.

2. WhatsApp API must not be required for core operation.

3. Every customer must have complete permanent history.

4. Artwork and gangsheets must be stored securely.

5. Reorders must be extremely simple.

6. Messages must be connected with orders/designs where relevant.

7. Customer-specific pricing must be supported.

8. Supplier and own production must both work.

9. Machines must be addable without rewriting the system.

10. QR/barcode production tracking should be supported.

11. Every important action should have an audit trail.

12. System should be API-first.

13. Customer files must remain private.

14. Mobile experience is the first priority.

15. Heavy artwork processing must not freeze the user interface.

16. The platform must be able to grow with the DTF business.

---

# 75. PRODUCT VISION

The final system should effectively combine:

WhatsApp-like communication

+

Amazon-like order tracking

+

Google Drive-like artwork history

+

Self-service DTF ordering

+

Gangsheet automation

+

CRM

+

Production ERP

+

QC

+

Courier

+

Accounts

into one connected ODD RAVEN platform.

The objective is not merely to create another ordering website.

The objective is to create the digital operating system of the DTF business while keeping the customer experience extremely easy.