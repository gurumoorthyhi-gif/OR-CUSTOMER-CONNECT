# ODD RAVEN DTF — Customer Dashboard UI Specification

## 1. Overall layout
Build a professional customer-facing web dashboard based on `00_REFERENCE_DASHBOARD.png`.

Desktop:
- Fixed left sidebar: ~210px in the 1024px-wide reference.
- Main page background: very light neutral / near white.
- Main content padding: ~20px at reference size.
- Use a max content width around 1280px for larger displays.
- Do not make the page look like an admin template; it is a customer portal.
- Visual style: premium SaaS, spacious, clean, restrained, high contrast.

Responsive:
- >= 1024px: persistent sidebar.
- 768–1023px: collapsible sidebar.
- < 768px: mobile drawer; KPI cards become 2 columns, then 1 column if needed; quick actions become 1 column; recent orders switch to stacked cards or horizontally scrollable table.

## 2. Sidebar
Background: #121820.
Brand block at top.
Active nav item uses a lighter dark rectangle with 8–10px radius.
Icons 20–22px.
Navigation item height ~50px.
Chat / Support can show a small red unread badge.
Keep a promotional image / brand message lower in the sidebar.
Bottom help box: bordered, compact, always readable.

## 3. Header
Left:
- Hi, GURU
- Good afternoon! 👋
- Let's bring your designs to life.

Right:
- Bell with unread badge.
- Level card with yellow star, `Level 3`, and progress bar `72 / 100 m to Level 4`.
- Circular user avatar with `G`.
- Dropdown chevron.

## 4. KPI cards
Four cards in one row on desktop:
- Active Orders = 3 — blue treatment
- Need Approval = 1 — orange treatment
- Payment Due = ₹2,450 — red/pink treatment
- Dispatched = 2 — green treatment

Each card:
- Very light tinted background.
- Circular icon background.
- Large numeric value.
- Bold label.
- Small action link at bottom.

## 5. New Order hero
Full-width card under KPIs.
Dark background image with a left-to-right black overlay.
Content aligned left:
- GET STARTED
- Create a New Order
- Upload your designs, choose quantity, preview and place your order in minutes.
- Primary red button: + New Order
Use `assets/hero_print_reference.png` only as a visual placeholder if no production artwork is supplied.

## 6. Quick Actions
Header:
- Quick Actions
- Everything you need, in one place.

Desktop grid: 3 columns.
Cards:
- white
- 1px border
- 12–14px radius
- icon in pastel circle
- title + 2-line description
- right chevron
- subtle lift/shadow on hover

Cards:
1. Orders
2. Designs & Gangsheets
3. Chat / Support
4. Production & Tracking
5. Payments & Invoices
6. Level & Benefits
7. Addresses
8. Settings

## 7. Recent Orders
White surface card with title and `View All Orders` link.
Desktop table columns:
Order ID | Date | Designs | Quantity | Status | Action

Status styles:
- Printing: blue pill
- Awaiting Approval: orange pill
- Dispatched: green pill
- Delivered: grey pill
- Completed: green pill

Use the mock records in `DASHBOARD_CONTENT.json`.

## 8. Bottom cards
Two-column desktop layout.

Left: Your Level Progress
- yellow star circle
- Level 3
- 72 / 100 m
- green progress bar
- 28 metres more to reach Level 4
- locked rate strip: Level 4 Rate ₹150/m

Right: Reorder in Seconds
- blue refresh icon
- explanatory copy
- outline button: Browse Previous Orders

## 9. Footer
Thin separator.
Left: ODD RAVEN DTF — Print Bolder. Grow Bigger.
Right: Privacy | Terms | Help | Contact.

## 10. Interaction states
- Buttons: hover, pressed, disabled, focus-visible.
- Sidebar item: active + hover.
- Cards: pointer only when interactive.
- Use keyboard-accessible controls and visible focus.
- Tooltips only where icon meaning is not obvious.
- Avoid excessive animation; 150–220ms transitions are enough.

## 11. Data and routing
Recommended routes:
- /dashboard
- /new-order
- /orders
- /designs
- /tracking
- /payments
- /support
- /level
- /addresses
- /settings

Use mock/local data first. Keep UI components ready to connect to backend APIs later.

## 12. Production implementation
Use the existing project stack if one exists. If starting from scratch, prefer:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
Do not hard-code layout as one giant component. Break it into reusable components:
Sidebar, Header, KpiCard, HeroCTA, QuickActionCard, RecentOrdersTable, LevelProgressCard, ReorderCard, Footer.
