import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

import { sampleQcItems } from "../../data";
import { apiGet } from "../../lib/api";

type QcItem = {
  id: string | number;
  orderId?: string;
  job_id?: string;
  status: string;
  defect?: string | null;
};

export default async function QcPage() {
  const items = await apiGet<QcItem[]>("/api/qc", sampleQcItems);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <ShieldCheck size={24} />
        <div>
          <p className="eyebrow">Quality</p>
          <h1>QC</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {items.map((item) => (
            <article className="order-row" key={item.id}>
              <div>
                <strong>{item.id}</strong>
                <p>{item.orderId ?? item.job_id} / {item.defect ?? "No defect"}</p>
              </div>
              <div className="approval-actions">
                <button className="approve" type="button">
                  <CheckCircle2 size={18} />
                  Pass
                </button>
                <button className="reject" type="button">
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
