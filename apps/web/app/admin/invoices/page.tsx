import { ReceiptText } from "lucide-react";

import { sampleInvoices } from "../../data";
import { apiGet } from "../../lib/api";

type Invoice = {
  id: string;
  orderId?: string;
  order_id?: string;
  status: string;
  amount: string;
};

export default async function InvoicesPage() {
  const invoices = await apiGet<Invoice[]>("/api/invoices", sampleInvoices);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <ReceiptText size={24} />
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Invoices</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {invoices.map((invoice) => (
            <article className="order-row" key={invoice.id}>
              <div>
                <strong>{invoice.id}</strong>
                <p>{invoice.orderId ?? invoice.order_id}</p>
              </div>
              <div className="order-meta">
                <span>{invoice.status}</span>
                <small>{invoice.amount}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
