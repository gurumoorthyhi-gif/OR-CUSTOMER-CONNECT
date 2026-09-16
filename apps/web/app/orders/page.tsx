import { PackageCheck } from "lucide-react";

import { sampleOrders } from "../data";
import { apiGet } from "../lib/api";
import MobileOrdersPage from "../components/mobile-orders/MobileOrdersPage";
import { mobileOrdersSample } from "../components/mobile-orders/mobile-orders.data";
import type { MobileOrdersData } from "../components/mobile-orders/mobile-orders.types";

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
  const mobileOrders: MobileOrdersData = {
    ...mobileOrdersSample,
    orders: orders.map((order, index) => ({
      ...mobileOrdersSample.orders[index % mobileOrdersSample.orders.length],
      id: order.id,
      actionHref: `/orders/${encodeURIComponent(order.id)}`,
      status: /complete|deliver/i.test(order.status) ? "Completed" : /approval/i.test(order.status) ? "Approval" : /dispatch/i.test(order.status) ? "Dispatched" : "Printing",
      designs: order.title || order.meters,
      quantity: order.meters,
      metrics: [
        { label: "Amount", value: order.amount, icon: "amount" as const },
        { label: "Payment", value: order.payment_status ?? "Pending", icon: "payment" as const },
        { label: "ETA", value: "Check order details", icon: "time" as const },
      ],
    })),
  };

  return (
    <>
    <MobileOrdersPage data={mobileOrders} />
    <div className="desktop-orders-only">
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
    </div>
    </>
  );
}
