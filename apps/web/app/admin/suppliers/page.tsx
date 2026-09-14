import { Factory } from "lucide-react";

import { sampleSuppliers } from "../../data";
import { apiGet } from "../../lib/api";

type Supplier = {
  name: string;
  jobs?: string;
  cost?: string;
  cost_per_meter?: string;
  status: string;
};

export default async function SuppliersPage() {
  const suppliers = await apiGet<Supplier[]>("/api/suppliers", sampleSuppliers);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <Factory size={24} />
        <div>
          <p className="eyebrow">Outsourcing</p>
          <h1>Suppliers</h1>
        </div>
      </section>
      <section className="design-grid">
        {suppliers.map((supplier) => (
          <article className="design-card" key={supplier.name}>
            <strong>{supplier.name}</strong>
            <p>{supplier.status}</p>
            <small>{supplier.jobs ?? "Local DB"} / {supplier.cost ?? `Rs. ${supplier.cost_per_meter} / m`}</small>
          </article>
        ))}
      </section>
    </main>
  );
}
