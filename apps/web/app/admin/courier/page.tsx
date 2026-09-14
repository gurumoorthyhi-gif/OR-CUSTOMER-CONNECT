import { Truck } from "lucide-react";

import { sampleShipments } from "../../data";
import { apiGet } from "../../lib/api";

type Shipment = {
  id: string;
  orderId?: string;
  order_id?: string;
  courier: string;
  awb?: string | null;
  status: string;
};

export default async function CourierPage() {
  const shipments = await apiGet<Shipment[]>("/api/courier", sampleShipments);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <Truck size={24} />
        <div>
          <p className="eyebrow">Courier</p>
          <h1>Shipments</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {shipments.map((shipment) => (
            <article className="order-row" key={shipment.id}>
              <div>
                <strong>{shipment.id}</strong>
                <p>{shipment.orderId ?? shipment.order_id} / {shipment.courier}</p>
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
