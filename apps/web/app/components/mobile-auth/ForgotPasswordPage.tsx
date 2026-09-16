"use client";

import Link from "next/link";
import { Mail, Phone, ShieldEllipsis } from "lucide-react";
import AuthField from "./AuthField";
import AuthLayout from "./AuthLayout";
import "./mobile-auth.css";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password?" subtitle="Enter your Email ID and Mobile Number. We will send you an OTP to reset your password." backHref="/login" icon={<ShieldEllipsis size={38} strokeWidth={2.1} />}>
      <form className="or-auth-form">
        <AuthField label="Email ID" name="email" type="email" placeholder="Enter your email ID" icon={Mail} />
        <AuthField label="Mobile Number" name="mobile" type="tel" placeholder="Enter your mobile number" icon={Phone} />
        <button className="or-auth-submit" type="submit">Send OTP</button>
        <p className="or-auth-note">Next step: OTP verification</p>
      </form>

      <div><Link href="/login">Back to Sign In</Link></div>
    </AuthLayout>
  );
}
