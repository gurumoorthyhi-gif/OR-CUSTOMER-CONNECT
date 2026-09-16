"use client";

import {
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  MessageCircle,
  PackageCheck,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  Truck,
  UserRound,
  WalletCards,
  Clock3,
  Ticket,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { mobileOrdersSample } from "./mobile-orders.data";
import type { MobileOrderCard, MobileOrdersData, OrderCardMetric } from "./mobile-orders.types";
import "./mobile-orders.css";

const STATUS_META = {
  Printing: { tone: "printing", actionTone: "primary" },
  Approval: { tone: "approval", actionTone: "primary" },
  Dispatched: { tone: "dispatched", actionTone: "primary" },
  Completed: { tone: "completed", actionTone: "ghost" },
} as const;

function MetricIcon({ type }: { type: OrderCardMetric["icon"] }) {
  if (type === "amount") return <CircleDollarSign size={18} strokeWidth={1.9} />;
  if (type === "payment") return <WalletCards size={18} strokeWidth={1.9} />;
  if (type === "courier") return <Truck size={18} strokeWidth={1.9} />;
  if (type === "awb") return <Ticket size={18} strokeWidth={1.9} />;
  return <Clock3 size={18} strokeWidth={1.9} />;
}

function OrderStatusPill({ status }: { status: MobileOrderCard["status"] }) {
  return <span className={`or-orders-status ${STATUS_META[status].tone}`}>{status}</span>;
}

function OrderCard({ order }: { order: MobileOrderCard }) {
  return (
    <article className="or-orders-card">
      <div className="or-orders-top">
        <div className="or-orders-cover">
          <img src={order.thumbs[0]?.src} alt={order.thumbs[0]?.alt ?? ""} />
        </div>

        <div className="or-orders-copy">
          <div className="or-orders-title-row">
            <strong>{order.id}</strong>
            <OrderStatusPill status={order.status} />
          </div>
          <p>{order.date} · {order.designs} · {order.quantity}</p>

          {typeof order.progress === "number" ? (
            <>
              <div className="or-orders-progress-row">
                <div className="or-orders-progress-track"><i style={{ width: `${order.progress}%` }} /></div>
                <b>{order.progress}%</b>
              </div>
            </>
          ) : null}

          {order.helperTitle ? (
            <div className="or-orders-helper">
              <span className={order.status === "Approval" ? "approval" : order.status === "Dispatched" ? "dispatched" : "default"}>
                {order.status === "Approval" ? <PackageCheck size={17} strokeWidth={1.9} /> : <Truck size={17} strokeWidth={1.9} />}
              </span>
              <div>
                <strong>{order.helperTitle}</strong>
                <small>{order.helperText}</small>
              </div>
            </div>
          ) : null}

          <div className="or-orders-thumb-row">
            {order.thumbs.map((thumb) => (
              <div className="or-orders-mini-thumb" key={thumb.src}>
                <img src={thumb.src} alt={thumb.alt} />
              </div>
            ))}
            {order.extraCount ? <div className="or-orders-mini-thumb more">{order.extraCount}</div> : null}
            <Link className="or-orders-action" href={order.actionHref}>{order.actionLabel} <ChevronRight size={18} /></Link>
          </div>
        </div>
      </div>

      <div className="or-orders-metrics-grid">
        {order.metrics.map((metric) => (
          <div className="or-orders-metric" key={`${order.id}-${metric.label}`}>
            <span><MetricIcon type={metric.icon} /></span>
            <div>
              <small>{metric.label}</small>
              <strong>{metric.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function BottomNav() {
  const items = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Orders", href: "/orders", icon: FileText, active: true },
    { label: "New", href: "/new-order", icon: Plus, primary: true },
    { label: "Chat", href: "/messages", icon: MessageCircle },
    { label: "Profile", href: "/profile", icon: UserRound },
  ];

  return (
    <nav className="or-orders-bottom-nav" aria-label="Customer mobile navigation">
      {items.map(({ label, href, icon: Icon, active, primary }) => (
        <Link
          href={href}
          className={`${active ? "active" : ""} ${primary ? "primary" : ""}`}
          key={label}
          aria-current={active ? "page" : undefined}
        >
          <span><Icon size={primary ? 26 : 22} strokeWidth={2} /></span>
          <small>{label}</small>
        </Link>
      ))}
    </nav>
  );
}

export default function MobileOrdersPage({ data = mobileOrdersSample }: { data?: MobileOrdersData }) {
  const [activeFilter, setActiveFilter] = useState(data.activeFilter);
  const [query, setQuery] = useState("");
  const visibleOrders = useMemo(() => data.orders.filter((order) => {
    const matchesQuery = `${order.id} ${order.date} ${order.designs} ${order.quantity}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = activeFilter === "All" || (activeFilter === "Active" ? order.status !== "Completed" : order.status === "Completed");
    return matchesQuery && matchesFilter;
  }), [activeFilter, data.orders, query]);

  return (
    <main className="or-orders-page">
      <div className="or-orders-scroll">
        <header className="or-orders-header">
          <h1>My Orders</h1>
          <p>Track, manage and view your orders</p>
        </header>

        <section className="or-orders-search-row">
          <label className="or-orders-search" aria-label="Search orders">
            <Search size={20} strokeWidth={2} />
            <input type="text" placeholder={data.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button className="or-orders-filter" type="button" aria-label="Filter orders">
            <Settings2 size={20} strokeWidth={2} />
          </button>
        </section>

        <section className="or-orders-tabs" aria-label="Order filters">
          {data.filters.map((option) => (
            <button
              key={option}
              type="button"
              className={option === activeFilter ? "active" : ""}
              aria-pressed={option === activeFilter}
              onClick={() => setActiveFilter(option)}
            >
              {option}
            </button>
          ))}
        </section>

        <section className="or-orders-list" aria-label="Orders list">
          {visibleOrders.map((order) => <OrderCard key={order.id} order={order} />)}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
