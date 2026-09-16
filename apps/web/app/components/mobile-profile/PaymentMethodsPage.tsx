"use client";

import Link from "next/link";
import { CreditCard, MoreVertical, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import MobileHeader from "./components/MobileHeader";
import BottomNav from "./components/BottomNav";

type Payment = { id: string; order_id?: string | number; status: string; amount: string; method?: string | null };

export default function PaymentMethodsPage() {
  const [payments, setPayments] = useState<Payment[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/payments", { cache: "no-store", credentials: "include" }).then((r) => r.ok ? r.json() : []).then((payload) => setPayments(Array.isArray(payload) ? payload : [])).finally(() => setLoading(false)); }, []);
  return <main className="or-profile-page"><div className="or-profile-scroll"><MobileHeader title="Payment Methods" onBack={() => history.back()} /><section className="or-payment-list">{loading ? <p>Loading payments…</p> : payments.length ? payments.map((payment) => <article className="or-payment-card" key={payment.id}><span>{payment.method?.toLowerCase().includes("upi") ? <WalletCards size={22} /> : <CreditCard size={22} />}</span><div><strong>{payment.method || "Payment"}</strong><small>Order {payment.order_id ?? "—"} · {payment.status}</small></div><b>₹{payment.amount}</b><button type="button" aria-label="Payment details"><MoreVertical size={18} /></button></article>) : <p>No payment records found.</p>}</section><Link className="or-primary-button sticky" href="/profile/payment/new">+ Add Payment Method</Link></div><BottomNav /></main>;
}
