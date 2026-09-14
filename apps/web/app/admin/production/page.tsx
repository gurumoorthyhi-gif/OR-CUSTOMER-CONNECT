import { Play, Printer } from "lucide-react";

import { sampleProductionJobs } from "../../data";
import { apiGet } from "../../lib/api";

type ProductionJob = {
  id: string;
  orderId?: string;
  order_id?: string;
  machine: string;
  operator?: string | null;
  status: string;
  meters?: string;
  expected_meters?: string;
  waste?: string;
  waste_meters?: string;
};

export default async function ProductionPage() {
  const jobs = await apiGet<ProductionJob[]>("/api/production/queue", sampleProductionJobs);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <Printer size={24} />
        <div>
          <p className="eyebrow">Production</p>
          <h1>Queue</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {jobs.map((job) => (
            <article className="order-row" key={job.id}>
              <div>
                <strong>{job.id}</strong>
                <p>{job.orderId ?? job.order_id} / {job.machine}</p>
              </div>
              <div className="order-meta">
                <span>{job.status}</span>
                <small>{job.meters ?? job.expected_meters} / waste {job.waste ?? job.waste_meters}</small>
              </div>
              <button className="secondary-action" type="button">
                <Play size={18} />
                Start
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
