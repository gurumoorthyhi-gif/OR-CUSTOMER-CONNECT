import { Calculator, FileUp, Image, Ruler } from "lucide-react";

export default function NewOrderPage() {
  return (
    <main className="app-shell">
      <section className="page-heading">
        <FileUp size={24} />
        <div>
          <p className="eyebrow">ERP Upload Flow</p>
          <h1>New Order</h1>
        </div>
      </section>

      <section className="order-create-grid">
        <form className="auth-panel order-form">
          <label>
            Select artwork
            <input type="file" />
          </label>
          <label>
            Print width
            <span>
              <Ruler size={18} />
              <input placeholder="Example: 22 inch" />
            </span>
          </label>
          <label>
            Quantity or meter note
            <input placeholder="Example: 50 pieces / 8 meters" />
          </label>
          <label>
            Instructions
            <textarea rows={5} placeholder="Size, background, urgency, packing note" />
          </label>
          <button className="primary-action" type="button">
            <Calculator size={18} />
            Send To ERP Calculator
          </button>
        </form>

        <aside className="work-panel">
          <div className="section-title">
            <h2>Before Production</h2>
            <Image size={18} />
          </div>
          <div className="check-list">
            <span>Upload original artwork</span>
            <span>ERP creates preview or gangsheet</span>
            <span>ERP returns rate and estimate</span>
            <span>Customer approves preview</span>
            <span>Payment or credit approval unlocks production</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

