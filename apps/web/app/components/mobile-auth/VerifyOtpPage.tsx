"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import AuthLayout from "./AuthLayout";
import AuthOtpInput from "./AuthOtpInput";
import "./mobile-auth.css";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setMobile(new URLSearchParams(window.location.search).get("mobile") || ""), []);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const response = await fetch("/api/auth/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ mobile, otp }) });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(result.detail ?? "Invalid OTP"); return; }
    if (result.needs_registration) router.push(`/signup?mobile=${encodeURIComponent(mobile)}&verified=1`);
    else router.push("/dashboard");
  }

  async function resend() {
    await fetch("/api/auth/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile }) });
    setError("");
  }

  return <AuthLayout title="Verify OTP" subtitle="Enter the 6-digit code sent to your mobile number." backHref="/login" icon={<MessageSquareText size={36} strokeWidth={2.1} />}>
    <p className="or-auth-center-text">Sent to <strong>{mobile || "your mobile number"}</strong></p>
    <AuthOtpInput value={otp} onChange={setOtp} />
    <p className="or-auth-note">Development OTP: 123456</p>
    <form className="or-auth-form" onSubmit={verify}><button className="or-auth-submit" type="submit" disabled={saving || otp.length !== 6}>{saving ? "Verifying…" : "Verify OTP"}</button></form>
    {error ? <p className="customer-auth-error" role="alert">{error}</p> : null}
    <div className="or-auth-helper-links"><button className="or-auth-link" type="button" onClick={resend}>Resend OTP</button><Link className="or-auth-link" href="/login">Use a different number</Link></div>
  </AuthLayout>;
}
