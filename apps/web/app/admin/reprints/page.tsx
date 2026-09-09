import { RotateCcw } from "lucide-react";

import { apiGet } from "../../lib/api";

type Reprint = {
  id: string;
  order_id: string;
  reason: string;
  status: string;
};

export default async function ReprintsPage() {
  const reprints = await apiGet<Reprint[]>("/api/reprints", []);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <RotateCcw size={24} />
        <div>
          <p className="eyebrow">Quality</p>
          <h1>Reprints</h1>
        </div>
      </section>
      <section className="work-panel">
        {reprints.length === 0 ? (
          <div className="empty-state">
            <strong>No active reprints</strong>
            <p className="soft-text">QC rejected or complaint-approved jobs will appear here.</p>
          </div>
        ) : (
          <div className="order-list">
            {reprints.map((reprint) => (
              <article className="order-row" key={reprint.id}>
                <div>
                  <strong>{reprint.id}</strong>
                  <p>{reprint.reason}</p>
                </div>
                <div className="order-meta">
                  <span>{reprint.status}</span>
                  <small>{reprint.order_id}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
