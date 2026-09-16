"use client";

import Link from "next/link";
import { Building2, Home, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import MobileHeader from "./components/MobileHeader";
import BottomNav from "./components/BottomNav";
import type { AddressItem } from "./mobile-profile.types";

export default function AddressBookPage() {
  const [address, setAddress] = useState<AddressItem | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/customers/me", { cache: "no-store", credentials: "include" }).then((r) => r.ok ? r.json() : null).then((payload) => { const customer = payload?.customer; const a = customer?.billing_address; if (a) setAddress({ id: "default", type: "Home", name: customer.contact_name || customer.business_name, address: [a.door_no, a.street_name, a.village_city, a.district, a.state, a.pincode].filter(Boolean).join(", "), phone: customer.mobile, isDefault: true }); }).finally(() => setLoading(false)); }, []);
  const Icon = address?.type === "Office" ? Building2 : address?.type === "Other" ? MapPin : Home;
  return <main className="or-profile-page"><div className="or-profile-scroll"><MobileHeader title="My Addresses" onBack={() => history.back()} />
    <section className="or-address-list">{loading ? <p>Loading addresses…</p> : address ? <article className="or-address-card" key={address.id}><span className="or-address-icon"><Icon size={20} /></span><div><div className="or-address-title"><strong>{address.type}</strong><span>Default</span></div><b>{address.name}</b><p>{address.address}</p><small>{address.phone}</small></div><div className="or-card-actions"><Link href="/profile/address/default" aria-label="Edit address"><Pencil size={17} /></Link><button type="button" className="danger" aria-label="Delete address" onClick={() => setAddress(null)}><Trash2 size={17} /></button></div></article> : <p>No address saved yet.</p>}</section>
    <Link className="or-primary-button sticky" href="/profile/address/new"><Plus size={18} /> Add New Address</Link>
  </div><BottomNav /></main>;
}
