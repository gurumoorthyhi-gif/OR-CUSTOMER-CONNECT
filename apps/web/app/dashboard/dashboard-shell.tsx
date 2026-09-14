"use client";

import {
  Bell,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileImage,
  Home,
  Image,
  Lock,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";

type IconComponent = typeof Home;

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: IconComponent;
  tone: string;
};

const stats = [
  { label: "Active Orders", value: "3", action: "View Orders", href: "/orders", icon: ShoppingBag, tone: "blue" },
  { label: "Need Approval", value: "1", action: "Review Now", href: "/orders", icon: PackageCheck, tone: "orange" },
  { label: "Payment Due", value: "₹2,450", action: "View Invoices", href: "/payments", icon: Receipt, tone: "red" },
  { label: "Dispatched", value: "2", action: "Track Orders", href: "/track", icon: Truck, tone: "green" },
];

const quickActions: QuickAction[] = [
  { title: "Orders", description: "View, manage and reorder your past and current orders.", href: "/orders", icon: Receipt, tone: "blue" },
  { title: "Designs & Gangsheets", description: "Upload designs, manage gangsheets and reuse previous files.", href: "/designs", icon: FileImage, tone: "purple" },
  { title: "Chat / Support", description: "Chat with our team (General or order-specific).", href: "/messages", icon: MessageCircle, tone: "green" },
  { title: "Production & Tracking", description: "See real-time production status and courier tracking.", href: "/track", icon: Truck, tone: "orange" },
  { title: "Payments & Invoices", description: "View invoices, make payments and download GST bills.", href: "/payments", icon: CreditCard, tone: "red" },
  { title: "Level & Benefits", description: "Check your level, current rates and unlock more benefits.", href: "/profile", icon: Star, tone: "yellow" },
  { title: "Addresses", description: "Manage your shipping and billing addresses.", href: "/profile", icon: MapPin, tone: "red" },
  { title: "Settings", description: "Profile, business details, notifications and more.", href: "/profile", icon: Settings, tone: "slate" },
];

const recentOrders = [
  { orderId: "OR-1058", date: "08 Sep 2026", designs: "12 designs", quantity: "15 metres", status: "Printing", action: "View", href: "/orders/OR-1058" },
  { orderId: "OR-1055", date: "06 Sep 2026", designs: "8 designs", quantity: "10 metres", status: "Awaiting Approval", action: "View", href: "/orders/OR-1055" },
  { orderId: "OR-1049", date: "02 Sep 2026", designs: "20 designs", quantity: "25 metres", status: "Dispatched", action: "Track", href: "/track" },
  { orderId: "OR-1042", date: "28 Aug 2026", designs: "6 designs", quantity: "8 metres", status: "Delivered", action: "View", href: "/orders/OR-1042" },
  { orderId: "OR-1038", date: "24 Aug 2026", designs: "10 designs", quantity: "12 metres", status: "Completed", action: "Reorder", href: "/new-order" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function KpiCard({ stat }: { stat: (typeof stats)[number] }) {
  const Icon = stat.icon;
  return (
    <article className={`dashboard-kpi ${stat.tone}`}>
      <div className="dashboard-kpi-icon"><Icon size={23} /></div>
      <strong className="dashboard-kpi-value">{stat.value}</strong>
      <h2>{stat.label}</h2>
      <Link href={stat.href}>{stat.action}<ChevronRight size={16} /></Link>
    </article>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <Link className="dashboard-quick-card" href={action.href}>
      <div className={`dashboard-quick-icon ${action.tone}`}><Icon size={21} /></div>
      <span><strong>{action.title}</strong><small>{action.description}</small></span>
      <ChevronRight className="dashboard-card-chevron" size={20} />
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span className={`dashboard-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

export default function DashboardShell() {
  return (
    <div className="dashboard-frame">
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-greeting">
            <p>Hi, GURU</p>
            <span>Good afternoon! <span aria-hidden="true">👋</span></span>
            <small>Let's bring your designs to life.</small>
          </div>
          <div className="dashboard-header-actions">
            <Link className="dashboard-notification" href="/messages" aria-label="Open messages, 3 unread">
              <Bell size={27} /><b>3</b>
            </Link>
            <Link className="dashboard-level-chip" href="/profile">
              <span className="dashboard-star"><Star size={22} fill="currentColor" /></span>
              <span><strong>Level 3</strong><small>72 / 100 m to Level 4</small><i><em /></i></span>
              <ChevronRight size={20} />
            </Link>
            <Link className="dashboard-user" href="/profile" aria-label="Open profile">G</Link>
            <Link className="dashboard-user-chevron" href="/profile" aria-label="Open profile menu"><ChevronDown size={17} /></Link>
          </div>
        </header>

        <section className="dashboard-kpi-grid" aria-label="Order summary">
          {stats.map((stat) => <KpiCard key={stat.label} stat={stat} />)}
        </section>

        <Link className="dashboard-hero" href="/new-order">
          <img src="/dashboard/hero_print_reference.png" alt="DTF printed garments" />
          <div className="dashboard-hero-copy">
            <span>GET STARTED</span>
            <h1>Create a New Order</h1>
            <p>Upload your designs, choose quantity, preview and place your order in minutes.</p>
            <strong><Plus size={19} /> New Order <ChevronRight size={18} /></strong>
          </div>
        </Link>

        <section className="dashboard-section">
          <div className="dashboard-section-heading"><div><h2>Quick Actions</h2><p>Everything you need, in one place.</p></div></div>
          <div className="dashboard-quick-grid">{quickActions.map((action) => <QuickActionCard action={action} key={action.title} />)}</div>
        </section>

        <section className="dashboard-orders-panel">
          <div className="dashboard-panel-heading"><h2>Recent Orders</h2><Link href="/orders">View All Orders <ChevronRight size={17} /></Link></div>
          <div className="dashboard-orders-scroll">
            <table className="dashboard-orders-table">
              <thead><tr><th>Order ID</th><th>Date</th><th>Designs</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{recentOrders.map((order) => <tr key={order.orderId}><th scope="row">{order.orderId}</th><td>{order.date}</td><td>{order.designs}</td><td>{order.quantity}</td><td><StatusPill status={order.status} /></td><td><Link href={order.href}>{order.action} <ChevronRight size={15} /></Link></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-progress-card">
            <div className="dashboard-progress-star"><Star size={29} fill="currentColor" /></div>
            <div className="dashboard-progress-copy"><h2>Your Level Progress</h2><div className="dashboard-progress-line"><strong>Level 3</strong><span>72 / 100 m</span></div><div className="dashboard-progress-bar"><i /></div><small>28 metres more to reach Level 4</small><div className="dashboard-rate"><Lock size={15} /><span>Level 4 Rate<br /><strong>₹150/m</strong></span><span>›</span></div></div>
          </article>
          <article className="dashboard-reorder-card"><div className="dashboard-reorder-icon"><RefreshCw size={29} /></div><div><h2>Reorder in Seconds</h2><p>Use your previous designs and settings to place a new order quickly.</p><Link href="/orders">Browse Previous Orders <ChevronRight size={17} /></Link></div></article>
        </section>

        <footer className="dashboard-footer"><div><strong>ODD RAVEN DTF</strong><span>Print Bolder. Grow Bigger.</span></div><nav aria-label="Footer"><Link href="/profile">Privacy</Link><Link href="/profile">Terms</Link><Link href="/support">Help</Link><Link href="/support">Contact</Link></nav></footer>
      </main>
    </div>
  );
}
