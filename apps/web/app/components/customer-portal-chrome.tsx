"use client";

import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  CreditCard,
  FileImage,
  FileText,
  Home,
  MessageCircle,
  MapPin,
  Plus,
  Settings,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const customerPages = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Chat / Support", href: "/messages", icon: MessageCircle },
  { label: "New Order", href: "/new-order", icon: Plus },
  { label: "Orders", href: "/orders", icon: FileText },
  { label: "Designs & Gangsheets", href: "/designs", icon: FileImage },
  { label: "Production & Tracking", href: "/track", icon: Truck },
  { label: "Payments & Invoices", href: "/payments", icon: CreditCard },
  { label: "Level & Benefits", href: "/profile?section=level", icon: Star },
  { label: "Addresses", href: "/profile?section=addresses", icon: MapPin },
  { label: "Settings", href: "/profile?section=settings", icon: Settings },
];

const customerRoutes = new Set(["/dashboard", "/messages", "/new-order", "/orders", "/designs", "/track", "/payments", "/profile", "/support"]);

function isActive(pathname: string, section: string | null, href: string) {
  const [route, query] = href.split("?");
  const targetSection = new URLSearchParams(query).get("section");
  if (targetSection) return pathname === route && section === targetSection;
  return route === "/dashboard" ? pathname === route : pathname.startsWith(route);
}

function CustomerNavigationRail({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? (pathname === "/profile" ? "settings" : null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);

  return (
    <aside className={`customer-navigation-rail ${expanded ? "expanded" : ""}`}>
      <div className="customer-navigation-brand">
        <div className="customer-navigation-mark" aria-hidden="true" />
        {expanded ? <span><strong>ODD RAVEN</strong><small>DTF</small></span> : null}
        <button type="button" aria-label={expanded ? "Collapse navigation" : "Expand navigation"} onClick={() => setExpanded((value) => !value)}>
          {expanded ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
      <nav className="customer-navigation-list" aria-label="Customer portal">
        {customerPages.map(({ label, href, icon: Icon }) => (
          <Link className={`customer-navigation-item ${isActive(pathname, section, href) ? "active" : ""}`} href={href} key={label} aria-label={label}>
            <Icon size={19} />
            {expanded ? <span>{label}</span> : null}
          </Link>
        ))}
      </nav>
      <Link className="customer-navigation-help" href="/support" aria-label="Need help"><CircleHelp size={24} />{expanded ? <span>Need Help?</span> : null}</Link>
    </aside>
  );
}

export default function CustomerPortalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showRail = customerRoutes.has(pathname) || pathname.startsWith("/orders/");

  if (!showRail) return children;

  return (
    <div className="customer-portal-shell">
      <CustomerNavigationRail pathname={pathname} />
      <div className="customer-portal-content">{children}</div>
    </div>
  );
}
