import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";

import { sampleOrders } from "../../data";

export default function AdminApprovalsPage() {
  return (
    <main className="app-shell">
      <section className="page-heading">
        <ClipboardCheck size={24} />
        <div>
          <p className="eyebrow">Staff Queue</p>
          <h1>Approvals</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {sampleOrders.map((order) => (
            <article className="order-row" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <p>{order.title}</p>
              </div>
              <div className="approval-actions">
                <button className="approve" type="button">
                  <CheckCircle2 size={18} />
                  Mark Ready
                </button>
                <button className="reject" type="button">
                  <XCircle size={18} />
                  Hold
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

