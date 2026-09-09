import { ClipboardList } from "lucide-react";

import { sampleOrders } from "../../data";
import { apiGet } from "../../lib/api";

type AdminOrder = {
  id: string;
  title: string;
  status: string;
  payment?: string;
  payment_status?: string;
};

export default async function AdminOrdersPage() {
  const orders = await apiGet<AdminOrder[]>("/api/orders", sampleOrders);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <ClipboardList size={24} />
        <div>
          <p className="eyebrow">Staff</p>
          <h1>Orders</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {orders.map((order) => (
            <article className="order-row" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <p>{order.title}</p>
              </div>
              <div className="order-meta">
                <span>{order.status}</span>
                <small>{order.payment ?? order.payment_status ?? "Pending"}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
