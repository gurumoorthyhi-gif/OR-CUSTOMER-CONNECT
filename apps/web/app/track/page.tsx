import { MapPinned, PackageCheck } from "lucide-react";

import { sampleOrders } from "../data";
import { apiGet } from "../lib/api";

type TrackOrder = { id: string; status: string; title?: string; timeline?: string[] };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  const orders = await apiGet<TrackOrder[]>("/api/orders", sampleOrders);
  const availableOrders = orders.length ? orders : sampleOrders;
  const order = availableOrders.find((item) => item.id === orderId) ?? availableOrders[0];
  const timeline = order.timeline ?? ["Received", "Artwork checked", order.status];
  return (
    <main className="app-shell">
      <section className="page-heading">
        <MapPinned size={24} />
        <div>
          <p className="eyebrow">Tracking</p>
          <h1>Track Order</h1>
        </div>
      </section>

      <section className="timeline">
        <div className="section-title">
          <h2>{order.id}</h2>
          <span>{order.status}</span>
        </div>
        {timeline.map((item, index) => (
          <div className="timeline-row" key={item}>
            <PackageCheck size={16} />
            <span>{item}</span>
            <small>{index === sampleOrders[0].timeline.length - 1 ? "Now" : "Done"}</small>
          </div>
        ))}
      </section>
    </main>
  );
}
