import { UsersRound } from "lucide-react";

import { sampleCustomer } from "../../data";
import { apiGet } from "../../lib/api";

type CustomerRow = {
  id: string;
  business_name?: string;
  name?: string;
  mobile: string;
  level: string;
};

export default async function AdminCustomersPage() {
  const customers = await apiGet<CustomerRow[]>("/api/customers", [sampleCustomer]);
  const customer = customers[0] ?? sampleCustomer;

  return (
    <main className="app-shell">
      <section className="page-heading">
        <UsersRound size={24} />
        <div>
          <p className="eyebrow">CRM</p>
          <h1>Customers</h1>
        </div>
      </section>
      <section className="work-panel">
        <div className="profile-list">
          <span>ID</span>
          <strong>{customer.id}</strong>
          <span>Business</span>
          <strong>{customer.business_name ?? customer.name}</strong>
          <span>Mobile</span>
          <strong>{customer.mobile}</strong>
          <span>Level</span>
          <strong>{customer.level}</strong>
        </div>
      </section>
    </main>
  );
}
