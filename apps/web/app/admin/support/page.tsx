import { Headphones } from "lucide-react";

import { sampleSupportTickets } from "../../data";
import { apiGet } from "../../lib/api";

type SupportTicket = {
  id: string;
  orderId?: string;
  order_id?: string | null;
  status: string;
  issue: string;
};

export default async function AdminSupportPage() {
  const tickets = await apiGet<SupportTicket[]>("/api/support", sampleSupportTickets);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <Headphones size={24} />
        <div>
          <p className="eyebrow">Support</p>
          <h1>Tickets</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="order-list">
          {tickets.map((ticket) => (
            <article className="order-row" key={ticket.id}>
              <div>
                <strong>{ticket.id}</strong>
                <p>{ticket.issue}</p>
              </div>
              <div className="order-meta">
                <span>{ticket.status}</span>
                <small>{ticket.orderId ?? ticket.order_id}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
