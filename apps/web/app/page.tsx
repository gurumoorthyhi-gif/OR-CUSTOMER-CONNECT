"use client";

import {
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileImage,
  Headphones,
  Home,
  MessageCircle,
  PackageCheck,
  Repeat,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { sampleOrders } from "./data";

const designs = ["Raven back print", "Logo pack V3", "Kids badges", "Name sheet"];

const actions = [
  { label: "New Order", icon: Upload, href: "/new-order" },
  { label: "Orders", icon: PackageCheck, href: "/orders" },
  { label: "Messages", icon: MessageCircle, href: "/messages" },
  { label: "Reorder", icon: Repeat, href: "/designs" },
];

export default function HomePage() {
  const [approvalStatus, setApprovalStatus] = useState("Waiting for your approval");

  return (
    <main className="app-shell">
      <nav className="mobile-nav" aria-label="App navigation">
        <Link className="nav-item active" href="/" aria-label="Home">
          <Home size={20} />
        </Link>
        <Link className="nav-item" href="/orders" aria-label="Orders">
          <PackageCheck size={20} />
        </Link>
        <Link className="nav-item" href="/messages" aria-label="Messages">
          <MessageCircle size={20} />
        </Link>
        <Link className="nav-item" href="/support" aria-label="Support">
          <Headphones size={20} />
        </Link>
      </nav>

      <section className="header-band">
        <div className="topbar">
          <div>
            <p className="eyebrow">ODD RAVEN</p>
            <h1>Hi, Sowmiya</h1>
          </div>
          <button className="icon-button" type="button" aria-label="Notifications">
            <Bell size={20} />
          </button>
        </div>

        <div className="summary-strip">
          <div>
            <span>Active orders</span>
            <strong>3</strong>
          </div>
          <Link href="/payments">
            <span>Credit balance</span>
            <strong>Rs. 12,500</strong>
          </Link>
          <Link href="/profile">
            <span>ERP sync</span>
            <strong>Pending</strong>
          </Link>
        </div>
      </section>

      <section className="quick-actions" aria-label="Primary actions">
        {actions.map((action) => (
          <Link className="action" key={action.label} href={action.href}>
            <action.icon aria-hidden="true" size={22} />
            <span>{action.label}</span>
          </Link>
        ))}
      </section>

      <section className="approval-panel">
        <div>
          <p className="eyebrow">Gangsheet Preview</p>
          <h2>Approve OR-1028</h2>
          <p>{approvalStatus}</p>
        </div>
        <div className="preview-sheet" aria-label="Gangsheet preview">
          <span>8.4 m</span>
          <div />
          <div />
          <div />
        </div>
        <div className="approval-actions">
          <button
            className="approve"
            type="button"
            onClick={() => setApprovalStatus("Approved and locked for production")}
          >
            <CheckCircle2 size={18} />
            Approve
          </button>
          <button
            className="reject"
            type="button"
            onClick={() => setApprovalStatus("Change request sent to staff")}
          >
            <XCircle size={18} />
            Reject
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="work-panel">
          <div className="section-title">
            <h2>My Orders</h2>
            <span>ERP-backed</span>
          </div>
          <div className="order-list">
            {sampleOrders.map((order) => (
              <article className="order-row" key={order.id}>
                <div>
                  <Link href={`/orders/${order.id}`}>{order.id}</Link>
                  <p>{order.title}</p>
                </div>
                <div className="order-meta">
                  <span>{order.status}</span>
                  <small>
                    {order.meters} / {order.amount}
                  </small>
                  <small>{order.eta}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="side-stack">
          <section className="mini-panel">
            <div className="section-title">
              <h2>Design Library</h2>
              <FileImage size={18} />
            </div>
            <div className="tag-list">
              {designs.map((design) => (
                <button key={design} type="button">
                  {design}
                </button>
              ))}
            </div>
          </section>

          <section className="mini-panel">
            <div className="section-title">
              <h2>Payment</h2>
              <CreditCard size={18} />
            </div>
            <p className="soft-text">OR-1028 estimate is ready after ERP rate calculation.</p>
          </section>

          <section className="mini-panel">
            <div className="section-title">
              <h2>Support</h2>
              <ShieldCheck size={18} />
            </div>
            <p className="soft-text">Last reply from staff: artwork looks clear for print.</p>
          </section>
        </aside>
      </section>

      <section className="timeline">
        <div className="section-title">
          <h2>Order Timeline</h2>
          <Link href="/track">Track</Link>
        </div>
        {["Received", "Artwork checked", "Preview ready", "Approval pending"].map((item, index) => (
          <div className="timeline-row" key={item}>
            <Clock3 size={16} />
            <span>{item}</span>
            <small>{index === 3 ? "Now" : "Done"}</small>
          </div>
        ))}
      </section>
    </main>
  );
}
