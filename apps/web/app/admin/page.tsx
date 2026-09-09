import Link from "next/link";
import {
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  Factory,
  Gauge,
  Link2,
  Headphones,
  MessageCircle,
  PackageCheck,
  Printer,
  ReceiptText,
  RotateCcw,
  Truck,
  UsersRound,
} from "lucide-react";

const adminLinks = [
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/orders", label: "Orders", icon: ClipboardCheck },
  { href: "/admin/customers", label: "Customers", icon: UsersRound },
  { href: "/admin/erp", label: "ERP", icon: Link2 },
  { href: "/admin/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/production", label: "Production", icon: Printer },
  { href: "/admin/machines", label: "Machines", icon: Gauge },
  { href: "/admin/qc", label: "QC", icon: PackageCheck },
  { href: "/admin/packing", label: "Packing", icon: PackageCheck },
  { href: "/admin/courier", label: "Courier", icon: Truck },
  { href: "/admin/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/admin/suppliers", label: "Suppliers", icon: Factory },
  { href: "/admin/reprints", label: "Reprints", icon: RotateCcw },
  { href: "/admin/waste", label: "Waste", icon: ChartNoAxesCombined },
];

export default function AdminPage() {
  return (
    <main className="app-shell">
      <section className="page-heading">
        <ClipboardCheck size={24} />
        <div>
          <p className="eyebrow">Staff</p>
          <h1>Admin Console</h1>
        </div>
      </section>
      <section className="quick-actions">
        {adminLinks.map((item) => (
          <Link className="action" href={item.href} key={item.href}>
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
