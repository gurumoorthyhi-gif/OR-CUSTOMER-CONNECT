import { MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";

import { sampleAuditEvents, sampleCustomer } from "../data";

export default function ProfilePage() {
  return (
    <main className="app-shell">
      <section className="page-heading">
        <UserRound size={24} />
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
      </section>

      <section className="content-grid">
        <div className="work-panel">
          <div className="profile-list">
            <span>Customer ID</span>
            <strong>{sampleCustomer.id}</strong>
            <span>Business</span>
            <strong>{sampleCustomer.name}</strong>
            <span>GST</span>
            <strong>{sampleCustomer.gst}</strong>
            <span>Level</span>
            <strong>{sampleCustomer.level}</strong>
          </div>
        </div>
        <aside className="side-stack">
          <section className="mini-panel">
            <div className="section-title">
              <h2>Contact</h2>
              <Phone size={18} />
            </div>
            <p className="soft-text">{sampleCustomer.mobile}</p>
          </section>
          <section className="mini-panel">
            <div className="section-title">
              <h2>Address</h2>
              <MapPin size={18} />
            </div>
            <p className="soft-text">{sampleCustomer.address}</p>
          </section>
        </aside>
      </section>

      <section className="timeline">
        <div className="section-title">
          <h2>Audit History</h2>
          <ShieldCheck size={18} />
        </div>
        {sampleAuditEvents.map((event) => (
          <div className="timeline-row" key={event}>
            <ShieldCheck size={16} />
            <span>{event}</span>
            <small>Recorded</small>
          </div>
        ))}
      </section>
    </main>
  );
}

