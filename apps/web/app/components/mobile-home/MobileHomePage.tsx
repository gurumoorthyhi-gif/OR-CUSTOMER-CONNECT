"use client";

import {
  Bell,
  ChevronRight,
  CircleCheck,
  CreditCard,
  FileImage,
  FileText,
  Home,
  MessageCircle,
  PackageCheck,
  Plus,
  Truck,
  UserRound,
  UsersRound,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { mobileDashboardSample } from "./mobile-home.data";
import type {
  MobileDashboardData,
  MobileDashboardStat,
} from "./mobile-home.types";
import "./mobile-home.css";

const STAT_ICONS = {
  "Active Orders": FileText,
  "Need Approval": UsersRound,
  "Payment Due": CreditCard,
  Dispatched: Truck,
} as const;

const stages = ["Artwork", "Printing", "Quality Check", "Packing", "Shipped"] as const;

function StatCard({ stat }: { stat: MobileDashboardStat }) {
  const Icon = STAT_ICONS[stat.label as keyof typeof STAT_ICONS] ?? PackageCheck;

  return (
    <article className="or-mobile-stat">
      <span className={`or-mobile-stat-icon ${stat.tone}`}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <strong>{stat.value}</strong>
      <small>{stat.label}</small>
    </article>
  );
}

function ActiveOrder({ data }: { data: MobileDashboardData }) {
  const order = data.activeOrder;
  const currentIndex = stages.indexOf(order.stage);

  return (
    <section className="or-mobile-section">
      <div className="or-mobile-section-title">
        <h2>Current Active Order</h2>
        <Link href={`/orders/${order.id}`}>View Details</Link>
      </div>

      <article className="or-mobile-active-order">
        <div className="or-mobile-order-top">
          <div className="or-mobile-order-preview">
            <img
              src={order.previewSrc ?? "/artwork/active-order-preview.svg"}
              alt=""
            />
          </div>

          <div className="or-mobile-order-copy">
            <strong>{order.id}</strong>
            <p>{order.title} · {order.designs} · {order.quantity}</p>
            <small>{order.date}</small>
          </div>

          <span className="or-mobile-status-pill">{order.status}</span>
        </div>

        <div className="or-mobile-timeline" aria-label={`Order status: ${order.stage}`}>
          <div className="or-mobile-timeline-line" />
          <div
            className="or-mobile-timeline-progress"
            style={{ width: `${Math.max(0, Math.min(100, order.progress))}%` }}
          />
          <div className="or-mobile-stage-row">
            {stages.map((stage, index) => {
              const done = index <= currentIndex;
              const current = index === currentIndex;
              return (
                <div
                  className={`or-mobile-stage ${done ? "done" : ""} ${current ? "current" : ""}`}
                  key={stage}
                >
                  <span>{done ? <CircleCheck size={17} /> : null}</span>
                  <small>{stage}</small>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { label: "Orders", href: "/orders", icon: FileText },
    { label: "Designs", href: "/designs", icon: FileImage },
    { label: "Chat", href: "/messages", icon: MessageCircle },
    { label: "Payments", href: "/payments", icon: CreditCard },
  ];

  return (
    <section className="or-mobile-section">
      <div className="or-mobile-section-title">
        <h2>Quick Actions</h2>
      </div>
      <div className="or-mobile-quick-grid">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link className="or-mobile-quick" href={href} key={label}>
            <span><Icon size={23} strokeWidth={2} /></span>
            <strong>{label}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

function LevelCard({ data }: { data: MobileDashboardData }) {
  const { level } = data;
  const percent = Math.min(
    100,
    Math.round((level.currentMeters / level.targetMeters) * 100),
  );

  return (
    <Link className="or-mobile-level-card" href="/profile?section=level">
      <span className="or-mobile-level-icon">
        <Crown size={30} fill="currentColor" strokeWidth={1.6} />
      </span>

      <div className="or-mobile-level-copy">
        <strong>Level {level.current} · {level.label}</strong>
        <small>{level.currentMeters.toLocaleString("en-IN")} / {level.targetMeters.toLocaleString("en-IN")} to Level {level.current + 1}</small>
        <div className="or-mobile-level-bar"><i style={{ width: `${percent}%` }} /></div>
      </div>

      <b>{percent}%</b>
      <ChevronRight size={19} />
    </Link>
  );
}

function BottomNav() {
  const items = [
    { label: "Home", href: "/dashboard", icon: Home, active: true },
    { label: "Orders", href: "/orders", icon: FileText },
    { label: "New", href: "/new-order", icon: Plus, primary: true },
    { label: "Chat", href: "/messages", icon: MessageCircle },
    { label: "Profile", href: "/profile", icon: UserRound },
  ];

  return (
    <nav className="or-mobile-bottom-nav" aria-label="Customer mobile navigation">
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

export default function MobileHomePage({
  data = mobileDashboardSample,
}: {
  data?: MobileDashboardData;
}) {
  const [liveData, setLiveData] = useState(data);

  useEffect(() => {
    let cancelled = false;
    const base = window.location.origin;
    Promise.all([
      fetch(`${base}/api/customers/me`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
      fetch(`${base}/api/orders`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null),
    ]).then(([profile, orders]) => {
      if (cancelled) return;
      const customer = profile?.customer;
      const hasLiveOrders = Array.isArray(orders);
      const rows = hasLiveOrders ? orders : [];
      const active = rows.find((row) => !["completed", "delivered"].includes(String(row.status ?? "").toLowerCase())) ?? rows[0];
      if (!customer && !hasLiveOrders) return;
      const status = String(active?.status ?? data.activeOrder.status);
      const normalizedStatus = (row: { status?: string }) => String(row.status ?? "").toLowerCase().replaceAll("_", " ");
      const liveStats = data.stats.map((stat) => {
        if (!hasLiveOrders) return stat;
        if (stat.label === "Active Orders") return { ...stat, value: String(rows.filter((row) => !["completed", "delivered"].includes(normalizedStatus(row))).length) };
        if (stat.label === "Need Approval") return { ...stat, value: String(rows.filter((row) => normalizedStatus(row).includes("approval")).length) };
        if (stat.label === "Payment Due") return { ...stat, value: String(rows.filter((row) => !["paid", "payment_confirmed", "completed"].includes(String(row.payment_status ?? "").toLowerCase())).length) };
        if (stat.label === "Dispatched") return { ...stat, value: String(rows.filter((row) => ["dispatched", "delivered"].includes(normalizedStatus(row))).length) };
        return stat;
      });
      setLiveData({
        ...data,
        customerName: String(customer?.contact_name || customer?.business_name || data.customerName).toUpperCase(),
        stats: liveStats,
        activeOrder: active ? {
          ...data.activeOrder,
          id: String(active.id ?? data.activeOrder.id),
          title: String(active.title ?? data.activeOrder.title),
          quantity: String(active.meters ?? active.quantity ?? data.activeOrder.quantity),
          status,
          stage: status.toLowerCase().includes("print") ? "Printing" : data.activeOrder.stage,
        } : data.activeOrder,
      });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [data]);

  return (
    <main className="or-mobile-home">
      <div className="or-mobile-home-scroll">
        <header className="or-mobile-greeting">
          <div>
            <p>Good morning,</p>
            <h1>Hi, {liveData.customerName} 👋</h1>
            <span>Let’s bring your ideas to life.</span>
          </div>

          <Link
            className="or-mobile-notification"
            href="/messages"
            aria-label={`${liveData.unreadCount} unread messages`}
          >
            <Bell size={23} />
            {liveData.unreadCount > 0 ? <b>{liveData.unreadCount}</b> : null}
          </Link>
        </header>

        <Link className="or-mobile-new-order" href="/new-order">
          <span className="or-mobile-new-order-icon">
            <FileText size={30} strokeWidth={1.8} />
            <i><Plus size={12} /></i>
          </span>
          <div>
            <strong>Create a New Order</strong>
            <p>Upload artwork, choose products and get high-quality prints.</p>
          </div>
          <ChevronRight size={27} />
        </Link>

        <section className="or-mobile-section">
          <div className="or-mobile-section-title">
            <h2>Order Overview</h2>
            <Link href="/orders">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="or-mobile-stat-grid">
            {liveData.stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </div>
        </section>

        <ActiveOrder data={liveData} />
        <QuickActions />
        <LevelCard data={liveData} />
      </div>

      <BottomNav />
    </main>
  );
}
