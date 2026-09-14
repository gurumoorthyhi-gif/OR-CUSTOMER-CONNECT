import { AlertTriangle, CheckCircle2, Link2 } from "lucide-react";

import { apiGet } from "../../lib/api";

type ErpStatus = {
  status: string;
  base_url?: string;
  detail?: string;
  erp?: unknown;
};

const fallbackStatus: ErpStatus = {
  status: "backend_unreachable",
  detail: "ODD RAVEN API is not reachable at NEXT_PUBLIC_API_URL or http://127.0.0.1:8000.",
};

function statusLabel(status: string) {
  if (status === "connected") {
    return "Connected";
  }
  if (status === "offline") {
    return "Offline";
  }
  if (status === "pending_configuration") {
    return "Pending Configuration";
  }
  return "Needs Attention";
}

export default async function AdminErpPage() {
  const erpStatus = await apiGet<ErpStatus>("/api/erp/status", fallbackStatus);
  const isConnected = erpStatus.status === "connected";
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  return (
    <main className="app-shell">
      <section className="page-heading">
        <Link2 size={24} />
        <div>
          <p className="eyebrow">Integration</p>
          <h1>ERP Connection</h1>
        </div>
      </section>

      <section className="work-panel">
        <div className="section-title">
          <h2>KMS ERP Status</h2>
          <span>{statusLabel(erpStatus.status)}</span>
        </div>
        <div className="order-list">
          <article className="order-row">
            <div>
              <strong>{isConnected ? "ERP is connected" : "ERP is not connected"}</strong>
              <p>{erpStatus.detail ?? "The configured ERP adapter responded successfully."}</p>
            </div>
            <div className="order-meta">
              <span>{erpStatus.status}</span>
              <small>{erpStatus.base_url ?? "No ERP base URL returned"}</small>
            </div>
          </article>
          <article className="order-row">
            <div>
              <strong>What this controls</strong>
              <p>Customer sync, ERP rate calculation, estimate creation, and gangsheet preview lookup.</p>
            </div>
            <div className="order-meta">
              {isConnected ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <small>{isConnected ? "Ready" : "Start ERP service or update .env"}</small>
            </div>
          </article>
        </div>
      </section>

      <section className="work-panel">
        <div className="section-title">
          <h2>Useful Links</h2>
          <span>Live API</span>
        </div>
        <div className="tag-list">
          <a className="secondary-action" href={`${apiBase}/api/erp/status`}>
            ERP Status
          </a>
          <a className="secondary-action" href={`${apiBase}/api/erp/customers`}>
            ERP Customers
          </a>
          <a className="secondary-action" href={`${apiBase}/docs`}>
            API Docs
          </a>
          <a className="secondary-action" href="/new-order">
            ERP Upload Flow
          </a>
        </div>
      </section>
    </main>
  );
}
