import { FileImage, Upload } from "lucide-react";

import { sampleDesigns } from "../data";
import { apiGet } from "../lib/api";

type DesignRow = {
  id?: number;
  name: string;
  storage_key?: string;
  size?: string;
  used?: string;
  notes?: string | null;
};

export default async function DesignsPage() {
  const designs = await apiGet<DesignRow[]>("/api/designs", sampleDesigns);

  return (
    <main className="app-shell">
      <section className="page-heading">
        <FileImage size={24} />
        <div>
          <p className="eyebrow">Library</p>
          <h1>Designs</h1>
        </div>
      </section>
      <section className="work-panel">
        <button className="primary-action" type="button">
          <Upload size={18} />
          Upload Design
        </button>
        <div className="design-grid">
          {designs.map((design) => (
            <article className="design-card" key={design.name}>
              <div className="design-thumb">
                <FileImage size={24} />
              </div>
              <strong>{design.name}</strong>
              <p>{design.size ?? design.storage_key ?? "ERP design"}</p>
              <small>{design.used ?? design.notes ?? "Ready"}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
