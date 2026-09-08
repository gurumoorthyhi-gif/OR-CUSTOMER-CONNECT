"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Save, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BillingAddress = {
  door_no: string;
  street_name: string;
  village_city: string;
  landmark: string;
  pincode: string;
  district: string;
  state: string;
};

export type CustomerProfile = {
  id: string;
  contact_name: string | null;
  business_name: string;
  mobile: string;
  email: string | null;
  profile_image_url: string | null;
  gst_number: string | null;
  delivery_type: "local" | "courier";
  preferred_courier: string | null;
  delivery_code: string;
  billing_address: BillingAddress | null;
  profile_locked: boolean;
  level: string;
  account_manager: string | null;
  security_note: string | null;
};

const EMPTY_ADDRESS: BillingAddress = { door_no: "", street_name: "", village_city: "", landmark: "", pincode: "", district: "", state: "" };
const STANDARD_COURIERS = ["DTDC", "Delhivery", "Blue Dart", "Professional Couriers", "Shiprocket"];

function apiBase() {
  if (typeof window !== "undefined" && window.location.port === "3010") return "http://127.0.0.1:8010";
  return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8010";
}

function normaliseCustomer(customer: CustomerProfile): CustomerProfile {
  return {
    ...customer,
    billing_address: { ...EMPTY_ADDRESS, ...(customer.billing_address ?? {}) },
    profile_locked: Boolean(customer.profile_locked),
  };
}

function imageSource(url: string | null) {
  if (!url) return null;
  return url.startsWith("/") ? `${apiBase()}${url}` : url;
}

export function StaffCustomerEditor({ initialCustomer, isNew = false }: { initialCustomer: CustomerProfile; isNew?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(normaliseCustomer(initialCustomer));
  const [customCourierName, setCustomCourierName] = useState(STANDARD_COURIERS.includes(initialCustomer.preferred_courier ?? "") ? "" : initialCustomer.preferred_courier ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const initials = useMemo(() => (form.contact_name || form.business_name || "OR").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), [form.business_name, form.contact_name]);

  function updateField(field: keyof CustomerProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAddress(field: keyof BillingAddress, value: string) {
    setForm((current) => ({ ...current, billing_address: { ...EMPTY_ADDRESS, ...(current.billing_address ?? {}), [field]: value } }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const preferredCourier = form.preferred_courier === "Other" ? customCourierName.trim() : form.preferred_courier;
    try {
      const response = await fetch(`${apiBase()}/api/customers${isNew ? "" : `/${encodeURIComponent(form.id)}`}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: form.contact_name,
          business_name: form.business_name,
          mobile: form.mobile,
          email: form.email,
          profile_image_url: form.profile_image_url,
          gst_number: form.gst_number,
          delivery_type: form.delivery_type,
          preferred_courier: preferredCourier,
          billing_address: form.billing_address,
          level: form.level,
          account_manager: form.account_manager,
          security_note: form.security_note,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Could not update customer");
      const customer = normaliseCustomer(result.customer as CustomerProfile);
      if (isNew) {
        router.push(`/admin/customers/${encodeURIComponent(customer.id)}`);
        return;
      }
      setForm(customer);
      setCustomCourierName(STANDARD_COURIERS.includes(customer.preferred_courier ?? "") ? "" : customer.preferred_courier ?? "");
      setNotice("Customer profile updated by staff");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell staff-customer-editor-shell">
      <section className="page-heading">
        <Link className="profile-back-button" href="/admin/customers" aria-label="Back to customers"><ArrowLeft size={21} /></Link>
        <div><p className="eyebrow">Staff CRM</p><h1>{isNew ? "Add customer" : "Edit customer profile"}</h1></div>
      </section>
      {notice ? <div className={`profile-notice ${notice.includes("Could not") ? "error" : ""}`}>{notice}</div> : null}

      <form className="staff-customer-editor" onSubmit={save}>
        <section className="work-panel staff-customer-editor-card">
          <div className="staff-editor-identity">
            <div className="staff-editor-avatar">
              {imageSource(form.profile_image_url) ? <img src={imageSource(form.profile_image_url) ?? ""} alt="" /> : <span>{initials}</span>}
            </div>
            <div><strong>{form.business_name || "New customer"}</strong>{form.delivery_code ? <span>{form.delivery_code}</span> : null}</div>
            <span className="staff-editor-lock"><ShieldCheck size={16} />{isNew ? "Staff-created profile" : form.profile_locked ? "Customer form locked" : "Customer setup pending"}</span>
          </div>
          <div className="staff-editor-grid">
            <label><span>Name</span><input required value={form.contact_name ?? ""} onChange={(event) => updateField("contact_name", event.target.value)} /></label>
            <label><span>Business name</span><input required value={form.business_name} onChange={(event) => updateField("business_name", event.target.value)} /></label>
            <label><span>Phone</span><input required value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} /></label>
            <label><span>Email</span><input type="email" value={form.email ?? ""} onChange={(event) => updateField("email", event.target.value)} /></label>
            <label><span>GST number</span><input value={form.gst_number ?? ""} onChange={(event) => updateField("gst_number", event.target.value)} /></label>
            <label><span>Delivery type</span><select value={form.delivery_type} onChange={(event) => updateField("delivery_type", event.target.value)}><option value="local">Local</option><option value="courier">Courier</option></select></label>
            <label><span>Preferred courier</span><select value={STANDARD_COURIERS.includes(form.preferred_courier ?? "") ? form.preferred_courier ?? "" : form.preferred_courier ? "Other" : ""} onChange={(event) => { updateField("preferred_courier", event.target.value); if (event.target.value !== "Other") setCustomCourierName(""); }}><option value="">Select courier</option>{STANDARD_COURIERS.map((courier) => <option key={courier}>{courier}</option>)}<option>Other</option></select></label>
            {form.preferred_courier === "Other" || (form.preferred_courier && !STANDARD_COURIERS.includes(form.preferred_courier)) ? <label><span>Courier / transport name</span><input required value={customCourierName} onChange={(event) => setCustomCourierName(event.target.value)} /></label> : null}
            <label><span>Delivery code</span><input value={form.delivery_code} readOnly /></label>
            <label><span>Customer level</span><input value={form.level} onChange={(event) => updateField("level", event.target.value)} /></label>
            <label><span>Account manager</span><input value={form.account_manager ?? ""} onChange={(event) => updateField("account_manager", event.target.value)} /></label>
            <label><span>Profile image URL</span><input value={form.profile_image_url ?? ""} onChange={(event) => updateField("profile_image_url", event.target.value)} /></label>
            <label className="staff-editor-wide"><span>Security note</span><input value={form.security_note ?? ""} onChange={(event) => updateField("security_note", event.target.value)} /></label>
          </div>
        </section>

        <section className="work-panel staff-billing-editor">
          <div className="section-title"><h2>Billing address</h2><UserRound size={18} /></div>
          <div className="staff-editor-grid">
            <label><span>Door No.</span><input required value={form.billing_address?.door_no ?? ""} onChange={(event) => updateAddress("door_no", event.target.value)} /></label>
            <label><span>Street name</span><input required value={form.billing_address?.street_name ?? ""} onChange={(event) => updateAddress("street_name", event.target.value)} /></label>
            <label><span>Village / City</span><input required value={form.billing_address?.village_city ?? ""} onChange={(event) => updateAddress("village_city", event.target.value)} /></label>
            <label><span>Landmark</span><input required value={form.billing_address?.landmark ?? ""} onChange={(event) => updateAddress("landmark", event.target.value)} /></label>
            <label><span>Pincode</span><input required inputMode="numeric" maxLength={6} value={form.billing_address?.pincode ?? ""} onChange={(event) => updateAddress("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
            <label><span>District</span><input required value={form.billing_address?.district ?? ""} onChange={(event) => updateAddress("district", event.target.value)} /></label>
            <label><span>State</span><input required value={form.billing_address?.state ?? ""} onChange={(event) => updateAddress("state", event.target.value)} /></label>
          </div>
        </section>

        <div className="staff-editor-actions"><Link className="secondary-action" href="/admin/customers">Cancel</Link><button className="primary-action" type="submit" disabled={saving}><Save size={17} />{saving ? "Saving..." : isNew ? "Create customer" : "Save customer changes"}</button></div>
      </form>
    </main>
  );
}
