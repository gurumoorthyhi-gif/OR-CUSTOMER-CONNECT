"use client";

import { CheckCircle2, CreditCard, PackageCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { sampleOrders } from "../../data";

type Order = {
  id: string;
  title: string;
  status: string;
  meters: string;
  rate_per_meter?: string;
  amount: string;
  payment_status?: string;
  eta?: string;
  timeline?: string[];
};

function fallbackOrder(id: string): Order | null {
  const order = sampleOrders.find((item) => item.id === id);
  return order ? { ...order, rate_per_meter: order.rate, timeline: order.timeline } : null;
}

function timelineFor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("approval")) return ["Received", "Artwork checked", "Preview ready", "Approval pending"];
  if (normalized.includes("print")) return ["Received", "Approved", "Payment confirmed", "Printing"];
  if (normalized.includes("dispatch")) return ["Received", "Printed", "Packed", "Dispatched"];
  if (normalized.includes("deliver")) return ["Received", "Printed", "Packed", "Delivered"];
  return ["Received", "Artwork checked", status];
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(() => fallbackOrder(id));
  const [loading, setLoading] = useState(true);
  const [approval, setApproval] = useState("Approval pending");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Order not found");
        return response.json() as Promise<Order>;
      })
      .then((result) => { if (!cancelled) setOrder(result); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading && !order) return <main className="app-shell"><p>Loading order…</p></main>;
  if (!order) return <main className="app-shell"><h1>Order not found</h1><Link className="primary-action" href="/orders">Back to orders</Link></main>;

  const timeline = order.timeline ?? timelineFor(order.status);
  return (
    <main className="app-shell">
      <section className="page-heading">
        <PackageCheck size={24} />
        <div><p className="eyebrow">Order Detail</p><h1>{order.id}</h1></div>
      </section>

      <section className="approval-panel detail-approval">
        <div><p className="eyebrow">{order.status}</p><h2>{order.title}</h2><p>{approval}</p></div>
        <div className="preview-sheet" aria-label="ERP gangsheet preview"><span>{order.meters}</span><div /><div /><div /></div>
        <div className="approval-actions">
          <button className="approve" type="button" onClick={() => setApproval("Approved and locked with customer timestamp")}><CheckCircle2 size={18} />Approve</button>
          <button className="reject" type="button" onClick={() => setApproval("Change request sent to staff chat")}><XCircle size={18} />Reject</button>
        </div>
      </section>

      <section className="content-grid">
        <div className="work-panel">
          <div className="section-title"><h2>Tracking</h2><span>{order.eta ?? "Status updates available"}</span></div>
          {timeline.map((item, index) => <div className="timeline-row" key={item}><CheckCircle2 size={16} /><span>{item}</span><small>{index === timeline.length - 1 ? "Now" : "Done"}</small></div>)}
        </div>
        <aside className="side-stack">
          <section className="mini-panel"><div className="section-title"><h2>Estimate</h2><CreditCard size={18} /></div><p className="soft-text">{order.meters}</p><p className="soft-text">{order.rate_per_meter ? `Rs. ${order.rate_per_meter} / m` : "Rate pending"}</p><strong>{order.amount}</strong></section>
          <Link className="primary-action" href="/messages">Open Chat</Link>
        </aside>
      </section>
    </main>
  );
}
