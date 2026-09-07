import { MapPinned, PackageCheck } from "lucide-react";

import { sampleOrders } from "../data";

export default function TrackPage() {
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
          <h2>{sampleOrders[0].id}</h2>
          <span>{sampleOrders[0].status}</span>
        </div>
        {sampleOrders[0].timeline.map((item, index) => (
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

