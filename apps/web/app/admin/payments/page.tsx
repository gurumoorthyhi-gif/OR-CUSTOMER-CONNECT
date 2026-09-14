import { CreditCard } from "lucide-react";

import { samplePayments } from "../../data";
import { apiGet } from "../../lib/api";

type PaymentRow = {
  id: string;
  orderId?: string;
  order_id?: string | number;
  status: string;
  amount: string;
};

export default async function AdminPaymentsPage() {
  const payments = await apiGet<PaymentRow[]>("/api/payments", samplePayments);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <CreditCard size={24} />
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Payment Status</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {payments.map((payment) => (
            <article className="order-row" key={payment.id}>
              <div>
                <strong>{payment.id}</strong>
                <p>{payment.orderId ?? payment.order_id}</p>
              </div>
              <div className="order-meta">
                <span>{payment.status}</span>
                <small>{payment.amount}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
