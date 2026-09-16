"use client";

import Link from "next/link";
import { LockKeyhole, Mail, Phone, UserRound, UserPlus } from "lucide-react";
import AuthField from "./AuthField";
import AuthLayout from "./AuthLayout";
import "./mobile-auth.css";

export default function SignUpPage() {
  return (
    <AuthLayout title="Create Account" subtitle="Join us and start creating your custom prints today." backHref="/login" icon={<UserPlus size={38} strokeWidth={2.1} />}>
      <form className="or-auth-form">
        <AuthField label="Full Name" name="fullName" type="text" placeholder="Enter your full name" icon={UserRound} />
        <AuthField label="Email ID" name="email" type="email" placeholder="Enter your email ID" icon={Mail} />
        <AuthField label="Mobile Number" name="mobile" type="tel" placeholder="Enter your mobile number" icon={Phone} />
        <AuthField label="Password" name="password" type="password" placeholder="Create a password" icon={LockKeyhole} />

        <label className="or-auth-checkbox or-auth-terms">
          <input type="checkbox" />
          <span>I agree to the <Link href="/terms">Terms & Conditions</Link> and <Link href="/privacy">Privacy Policy</Link></span>
        </label>

        <button className="or-auth-submit" type="submit">Create Account</button>
        <p className="or-auth-note">Next step: OTP verification</p>

        <div className="or-auth-divider">OR</div>

        <div className="or-auth-social">
          <button className="or-auth-social-btn" type="button">
            <img src="/icons/google.svg" alt="" />
            Continue with Google
          </button>
          <button className="or-auth-social-btn" type="button">
            <img src="/icons/apple.svg" alt="" />
            Continue with Apple
          </button>
        </div>
      </form>

      <div>Already have an account? <Link href="/login">Sign In</Link></div>
    </AuthLayout>
  );
}
