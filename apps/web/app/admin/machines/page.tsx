import { Gauge } from "lucide-react";

import { sampleMachines } from "../../data";
import { apiGet } from "../../lib/api";

type Machine = {
  name: string;
  status: string;
  queue?: string;
  speed?: string;
  speed_mph?: string;
};

export default async function MachinesPage() {
  const machines = await apiGet<Machine[]>("/api/machines", sampleMachines);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <Gauge size={24} />
        <div>
          <p className="eyebrow">Factory</p>
          <h1>Machines</h1>
        </div>
      </section>
      <section className="design-grid">
        {machines.map((machine) => (
          <article className="design-card" key={machine.name}>
            <strong>{machine.name}</strong>
            <p>{machine.status}</p>
            <small>{machine.queue ?? "Local DB"} / {machine.speed ?? `${machine.speed_mph} m/hr`}</small>
          </article>
        ))}
      </section>
    </main>
  );
}
