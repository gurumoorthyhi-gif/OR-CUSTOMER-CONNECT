import { PackageCheck } from "lucide-react";

import { sampleOrders } from "../data";
import { apiGet } from "../lib/api";

type OrderRow = {
  id: string;
  title: string;
  status: string;
  meters: string;
  amount: string;
  payment_status?: string;
};

export default async function OrdersPage() {
  const orders = await apiGet<OrderRow[]>("/api/orders", sampleOrders);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <PackageCheck size={24} />
        <div>
          <p className="eyebrow">Orders</p>
          <h1>My Orders</h1>
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
                <small>
                  {order.meters} / {order.amount}
                </small>
                <small>{order.payment_status ?? "ERP sync pending"}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
