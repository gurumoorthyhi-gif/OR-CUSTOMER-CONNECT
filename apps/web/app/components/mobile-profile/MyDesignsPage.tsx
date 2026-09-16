"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FileImage, Filter, MoreVertical, Search, Upload } from "lucide-react";
import MobileHeader from "./components/MobileHeader";
import BottomNav from "./components/BottomNav";

type Design = { id: number; name: string; preview_url?: string; created_at?: string; notes?: string | null };

export default function MyDesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]); const [query, setQuery] = useState(""); const [message, setMessage] = useState(""); const input = useRef<HTMLInputElement>(null);
  async function load() { const response = await fetch("/api/designs", { cache: "no-store", credentials: "include" }); setDesigns(response.ok ? await response.json() : []); }
  useEffect(() => { load().catch(() => setMessage("Unable to load designs")); }, []);
  async function upload(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const form = new FormData(); form.append("upload", file); setMessage("Uploading design…"); const response = await fetch("/api/designs/upload", { method: "POST", credentials: "include", body: form }); const result = await response.json().catch(() => ({})); const detail = Array.isArray(result.detail) ? result.detail.map((item: { msg?: string }) => item.msg || "Validation error").join("; ") : String(result.detail || "Upload failed"); setMessage(response.ok ? "Design uploaded" : detail); if (response.ok) await load(); event.target.value = ""; }
  const filtered = designs.filter((design) => design.name.toLowerCase().includes(query.toLowerCase()));
  return <main className="or-profile-page"><div className="or-profile-scroll"><MobileHeader title="My Designs" onBack={() => history.back()} /><input ref={input} hidden type="file" accept="image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff" onChange={upload} /><div className="or-search-row"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search designs..." /></label><button type="button"><Filter size={18} /></button></div><div className="or-design-tabs"><button className="active" type="button">All ({designs.length})</button><button type="button">Favorites</button><button type="button">Folders</button></div>{message ? <p role="status" className="or-design-message">{message}</p> : null}<button className="or-primary-button" type="button" onClick={() => input.current?.click()}><Upload size={17} /> Upload Design</button><section className="or-design-grid">{filtered.map((design) => <Link href={`/designs/${design.id}`} className="or-design-card" key={design.id}><div>{design.preview_url ? <img src={design.preview_url} alt={design.name} /> : <FileImage size={24} />}<span className="or-design-more"><MoreVertical size={16} /></span></div><strong>{design.name}</strong><small>{design.created_at ? new Date(design.created_at).toLocaleDateString() : "Uploaded design"}</small></Link>)}{!filtered.length ? <p>No designs found.</p> : null}</section></div><BottomNav /></main>;
}
