import Link from "next/link";

const groups = [
  {
    title: "Customer side",
    links: [
      ["Login", "/login"], ["Dashboard", "/dashboard"], ["New Order", "/new-order"],
      ["Orders", "/orders"], ["Designs", "/designs"], ["Messages", "/messages"],
      ["Payments", "/payments"], ["Track Order", "/track"], ["Support", "/support"], ["Profile", "/profile"],
    ],
  },
  {
    title: "Staff side",
    links: [
      ["Staff Home", "/admin"], ["Customers", "/admin/customers"], ["Orders", "/admin/orders"],
      ["Messages", "/admin/messages"], ["Approvals", "/admin/approvals"], ["Payments", "/admin/payments"],
      ["Production", "/admin/production"], ["Machines", "/admin/machines"], ["QC", "/admin/qc"],
      ["Packing", "/admin/packing"], ["Courier", "/admin/courier"], ["Invoices", "/admin/invoices"],
      ["Suppliers", "/admin/suppliers"], ["Reprints", "/admin/reprints"], ["Waste", "/admin/waste"],
    ],
  },
  {
    title: "ERP portal",
    links: [["ERP Test Portal", "/erp"], ["ERP Connection Status", "/admin/erp"]],
  },
] as const;

export default function TestIndexPage() {
  return <main className="app-shell">
    <section className="page-heading"><div><p className="eyebrow">ODD RAVEN</p><h1>Customer Connect — Test Index</h1></div></section>
    <section className="work-panel">
      <p>Hosted test build. Upload and download are paused; navigation, dashboards, forms, messaging UI, operational pages and fallback/demo views remain available for research.</p>
    </section>
    {groups.map((group) => <section className="work-panel" key={group.title}>
      <div className="section-title"><h2>{group.title}</h2><span>Test routes</span></div>
      <div className="quick-actions">
        {group.links.map(([label, href]) => <Link className="action" href={href} key={href}><span>{label}</span></Link>)}
      </div>
    </section>)}
  </main>;
}
