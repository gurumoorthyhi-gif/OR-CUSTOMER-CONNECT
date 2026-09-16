"use client";

import { FormEvent, useEffect, useState } from "react";
import MobileHeader from "./components/MobileHeader";

type Address = { door_no: string; street_name: string; village_city: string; landmark: string; pincode: string; district: string; state: string };
const empty: Address = { door_no: "", street_name: "", village_city: "", landmark: "", pincode: "", district: "", state: "" };

export default function EditAddressPage() {
  const [form, setForm] = useState<Address>(empty); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/customers/me", { cache: "no-store", credentials: "include" }).then((r) => r.ok ? r.json() : null).then((payload) => setForm({ ...empty, ...(payload?.customer?.billing_address || {}) })); }, []);
  function update(field: keyof Address, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function save(event: FormEvent) { event.preventDefault(); setSaving(true); setMessage(""); const response = await fetch("/api/customers/me", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billing_address: form }) }); setSaving(false); setMessage(response.ok ? "Address saved" : (await response.json().catch(() => ({}))).detail || "Unable to save address"); }
  return <main className="or-profile-page"><div className="or-profile-scroll"><MobileHeader title="Edit Address" onBack={() => history.back()} /><form className="or-form-stack" onSubmit={save}><label className="or-form-field"><span>Door No.</span><input required value={form.door_no} onChange={(e) => update("door_no", e.target.value)} /></label><label className="or-form-field"><span>Street name</span><input required value={form.street_name} onChange={(e) => update("street_name", e.target.value)} /></label><label className="or-form-field"><span>Village / City</span><input required value={form.village_city} onChange={(e) => update("village_city", e.target.value)} /></label><label className="or-form-field"><span>Landmark</span><input value={form.landmark} onChange={(e) => update("landmark", e.target.value)} /></label><div className="or-form-grid"><label className="or-form-field"><span>District</span><input required value={form.district} onChange={(e) => update("district", e.target.value)} /></label><label className="or-form-field"><span>Pincode</span><input required inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} /></label></div><label className="or-form-field"><span>State</span><input required value={form.state} onChange={(e) => update("state", e.target.value)} /></label><button className="or-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Address"}</button>{message ? <p>{message}</p> : null}</form></div></main>;
}
