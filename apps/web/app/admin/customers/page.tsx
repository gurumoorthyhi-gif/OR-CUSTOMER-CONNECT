import Link from "next/link";
import { EllipsisVertical, MessageCircle, Pencil, UsersRound } from "lucide-react";

import { apiGet } from "../../lib/api";

type CustomerRow = {
  id: string;
  contact_name: string | null;
  business_name: string;
  mobile: string;
  email: string | null;
  delivery_code: string;
  delivery_type: "local" | "courier";
  profile_locked: boolean;
  profile_image_url: string | null;
};

const fallbackCustomers: CustomerRow[] = [{
  id: "OR-TN-0001",
  contact_name: "Sowmiya",
  business_name: "Sowmiya Prints",
  mobile: "+91 98765 43210",
  email: "orders@sowmiyaprints.example",
  delivery_code: "CO-0001-SOW-CHN",
  delivery_type: "courier",
  profile_locked: false,
  profile_image_url: null,
}];

function initials(customer: CustomerRow) {
  return (customer.contact_name || customer.business_name || "OR")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function imageSource(url: string | null) {
  if (!url) return null;
  return url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8010"}${url}` : url;
}

export default async function AdminCustomersPage() {
  const customers = await apiGet<CustomerRow[]>("/api/customers", fallbackCustomers);

  return (
    <main className="app-shell admin-customers-shell">
      <section className="page-heading">
        <UsersRound size={24} />
        <div>
          <p className="eyebrow">CRM</p>
          <h1>Customers</h1>
        </div>
      </section>

      <section className="work-panel">
        <div className="section-title">
          <h2>Customer records</h2>
          <span>{customers.length} customer{customers.length === 1 ? "" : "s"}</span>
        </div>
        <div className="staff-customer-list">
          {customers.map((customer) => (
            <article className="staff-customer-row" key={customer.id}>
              <div className="staff-customer-avatar">
                {imageSource(customer.profile_image_url) ? <img src={imageSource(customer.profile_image_url) ?? ""} alt="" /> : <span>{initials(customer)}</span>}
              </div>
              <div className="staff-customer-main">
                <strong>{customer.business_name}</strong>
                <span>{customer.contact_name || "No contact name"}</span>
              </div>
              <div className="staff-customer-meta">
                <strong>{customer.delivery_code}</strong>
                <span>{customer.mobile}</span>
              </div>
              <span className={`customer-lock-status ${customer.profile_locked ? "locked" : "setup"}`}>
                {customer.profile_locked ? "Staff managed" : "Setup pending"}
              </span>
              <details className="staff-customer-actions">
                <summary aria-label={`Actions for ${customer.business_name}`}><EllipsisVertical size={20} /></summary>
                <div className="staff-action-menu">
                  <Link href={`/admin/customers/${encodeURIComponent(customer.id)}`}><Pencil size={16} />Edit profile</Link>
                  <Link href="/admin/messages"><MessageCircle size={16} />Open chat</Link>
                  <Link href={`/admin/customers/${encodeURIComponent(customer.id)}`}><UsersRound size={16} />View record</Link>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
