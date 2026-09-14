"use client";

import { CheckCircle2, CreditCard, PackageCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState } from "react";

import { sampleOrders } from "../../data";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = sampleOrders.find((item) => item.id === id);
  const [approval, setApproval] = useState("Approval pending");

  if (!order) {
    notFound();
  }

  return (
    <main className="app-shell">
      <section className="page-heading">
        <PackageCheck size={24} />
        <div>
          <p className="eyebrow">Order Detail</p>
          <h1>{order.id}</h1>
        </div>
      </section>

      <section className="approval-panel detail-approval">
        <div>
          <p className="eyebrow">{order.status}</p>
          <h2>{order.title}</h2>
          <p>{approval}</p>
        </div>
        <div className="preview-sheet" aria-label="ERP gangsheet preview">
          <span>{order.meters}</span>
          <div />
          <div />
          <div />
        </div>
        <div className="approval-actions">
          <button
            className="approve"
            type="button"
            onClick={() => setApproval("Approved and locked with customer timestamp")}
          >
            <CheckCircle2 size={18} />
            Approve
          </button>
          <button
            className="reject"
            type="button"
            onClick={() => setApproval("Change request sent to staff chat")}
          >
            <XCircle size={18} />
            Reject
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="work-panel">
          <div className="section-title">
            <h2>Tracking</h2>
            <span>{order.eta}</span>
          </div>
          {order.timeline.map((item, index) => (
            <div className="timeline-row" key={item}>
              <CheckCircle2 size={16} />
              <span>{item}</span>
              <small>{index === order.timeline.length - 1 ? "Now" : "Done"}</small>
            </div>
          ))}
        </div>

        <aside className="side-stack">
          <section className="mini-panel">
            <div className="section-title">
              <h2>Estimate</h2>
              <CreditCard size={18} />
            </div>
            <p className="soft-text">{order.meters}</p>
            <p className="soft-text">{order.rate}</p>
            <strong>{order.amount}</strong>
          </section>
          <Link className="primary-action" href="/messages">
            Open Chat
          </Link>
        </aside>
      </section>
    </main>
  );
}
