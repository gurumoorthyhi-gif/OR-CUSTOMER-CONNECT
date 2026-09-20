import Link from "next/link";

const sections = [
  ["Operations", [["Admin dashboard", "/admin"], ["Customers", "/admin/customers"], ["Orders", "/admin/orders"], ["Messages", "/admin/messages"], ["Approvals", "/admin/approvals"], ["Support", "/admin/support"]]],
  ["Production", [["Production", "/admin/production"], ["Machines", "/admin/machines"], ["Quality control", "/admin/qc"], ["Packing", "/admin/packing"], ["Courier", "/admin/courier"], ["Reprints", "/admin/reprints"], ["Waste", "/admin/waste"]]],
  ["Commercial", [["Payments", "/admin/payments"], ["Invoices", "/admin/invoices"], ["Suppliers", "/admin/suppliers"]]],
] as const;

export default function ErpTestPortal() {
  return <main className="app-shell">
    <section className="page-heading"><div><p className="eyebrow">Sites testing</p><h1>ODD RAVEN ERP Portal</h1></div></section>
    <section className="work-panel"><p>This hosted test portal uses demo/fallback data. File upload and download are intentionally paused. The production ERP remains unchanged on the main branch.</p></section>
    {sections.map(([title, links]) => <section className="work-panel" key={title}>
      <div className="section-title"><h2>{title}</h2><span>Test pages</span></div>
      <div className="quick-actions">{links.map(([label, href]) => <Link className="action" href={href} key={href}><span>{label}</span></Link>)}</div>
    </section>)}
  </main>;
}
