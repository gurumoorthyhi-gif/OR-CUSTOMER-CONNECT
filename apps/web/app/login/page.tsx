"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInPage } from "../components/mobile-auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mobile: String(form.get("mobile") || ""), password: String(form.get("password") || "") }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail ?? "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setSaving(false);
    }
  }

  async function requestOtp(mobile: string) {
    setError("");
    const response = await fetch("/api/auth/otp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.detail ?? "Unable to request OTP"); return; }
    router.push(`/verify-otp?mode=login&mobile=${encodeURIComponent(mobile)}`);
  }

  return <><SignInPage onSubmit={login} onOtpRequest={requestOtp} />{saving ? <p className="customer-auth-status">Signing in…</p> : null}{error ? <p className="customer-auth-error" role="alert">{error}</p> : null}</>;
}
