"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Phone, UserRound, UserPlus } from "lucide-react";
import AuthField from "../components/mobile-auth/AuthField";
import AuthLayout from "../components/mobile-auth/AuthLayout";
import "../components/mobile-auth/mobile-auth.css";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ full_name: form.get("fullName"), email: form.get("email"), mobile: form.get("mobile"), password: form.get("password") }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.detail ?? "Unable to create account"); return; }
    router.push("/dashboard");
  }

  return <AuthLayout title="Create Account" subtitle="Your mobile number has been verified. Create your password to continue." backHref="/login" icon={<UserPlus size={38} strokeWidth={2.1} />}>
    <form className="or-auth-form" onSubmit={register}>
      <AuthField required label="Full Name" name="fullName" type="text" placeholder="Enter your full name" icon={UserRound} />
      <AuthField label="Email ID" name="email" type="email" placeholder="Enter your email ID" icon={Mail} />
      <AuthField required label="Mobile Number" name="mobile" type="tel" placeholder="Enter your mobile number" icon={Phone} />
      <AuthField required label="Password" name="password" type="password" placeholder="Create a password" icon={LockKeyhole} />
      <button className="or-auth-submit" type="submit">Create Account</button>
    </form>
    {error ? <p className="customer-auth-error" role="alert">{error}</p> : null}
    <p className="or-auth-note">Your mobile number must be verified with OTP before creating an account.</p>
  </AuthLayout>;
}
