import { PackageCheck } from "lucide-react";

import { sampleShipments } from "../../data";
import { apiGet } from "../../lib/api";

type PackingItem = {
  id: string;
  orderId?: string;
  order_id?: string;
  courier: string;
  awb?: string | null;
  status: string;
};

export default async function PackingPage() {
  const shipments = await apiGet<PackingItem[]>("/api/packing", sampleShipments);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <PackageCheck size={24} />
        <div>
          <p className="eyebrow">Dispatch Prep</p>
          <h1>Packing</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {shipments.map((shipment) => (
            <article className="order-row" key={shipment.id}>
              <div>
                <strong>{shipment.orderId ?? shipment.order_id}</strong>
                <p>{shipment.courier}</p>
              </div>
              <div className="order-meta">
                <span>{shipment.status}</span>
                <small>{shipment.awb}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
