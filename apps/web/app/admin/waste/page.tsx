import { ChartNoAxesCombined } from "lucide-react";

import { sampleProductionJobs } from "../../data";
import { apiGet } from "../../lib/api";

type WasteEvent = {
  id?: number;
  job_id?: string;
  idFallback?: string;
  category?: string;
  meters?: string;
  status?: string;
};

const fallbackWaste = sampleProductionJobs.map((job) => ({
  job_id: job.id,
  category: "sample",
  meters: job.waste,
  status: job.status,
}));

export default async function WastePage() {
  const events = await apiGet<WasteEvent[]>("/api/waste", fallbackWaste);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <ChartNoAxesCombined size={24} />
        <div>
          <p className="eyebrow">Production</p>
          <h1>Waste</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {events.map((event) => (
            <article className="order-row" key={`${event.job_id}-${event.category}`}>
              <div>
                <strong>{event.job_id ?? event.idFallback}</strong>
                <p>{event.category}</p>
              </div>
              <div className="order-meta">
                <span>{event.meters}</span>
                <small>{event.status ?? "Recorded"}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
