import { Headphones, ImagePlus } from "lucide-react";

export default function SupportPage() {
  return (
    <main className="app-shell">
      <section className="page-heading">
        <Headphones size={24} />
        <div>
          <p className="eyebrow">Support</p>
          <h1>Raise Issue</h1>
        </div>
      </section>
      <section className="auth-panel support-form">
        <label>
          Order ID
          <input placeholder="Example: OR-1028" />
        </label>
        <label>
          Issue details
          <textarea placeholder="Tell us what happened" rows={5} />
        </label>
        <button className="secondary-action" type="button">
          <ImagePlus size={18} />
          Attach Photo
        </button>
        <button className="primary-action" type="button">
          Submit Support Request
        </button>
      </section>
    </main>
  );
}

