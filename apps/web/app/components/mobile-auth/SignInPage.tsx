"use client";

import Link from "next/link";
import { LockKeyhole, Phone, ShieldCheck } from "lucide-react";
import type { FormEventHandler } from "react";
import AuthField from "./AuthField";
import AuthLayout from "./AuthLayout";
import "./mobile-auth.css";

export default function SignInPage({ onSubmit, onOtpRequest }: { onSubmit?: FormEventHandler<HTMLFormElement>; onOtpRequest?: (mobile: string) => void }) {
  return (
    <AuthLayout title="Sign In" subtitle="Enter your Email ID, Mobile Number and Password to continue." icon={<ShieldCheck size={38} strokeWidth={2.1} />}>
      <form className="or-auth-form" onSubmit={onSubmit}>
        <AuthField required label="Mobile Number" name="mobile" type="tel" placeholder="Enter your mobile number" icon={Phone} />
        <AuthField required label="Password" name="password" type="password" placeholder="Enter your password" icon={LockKeyhole} />

        <div className="or-auth-row">
          <label className="or-auth-checkbox">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <Link className="or-auth-link" href="/forgot-password">Forgot Password?</Link>
        </div>

        <button className="or-auth-submit" type="submit">Continue with Password</button>
        <button className="or-auth-social-btn" type="button" onClick={(event) => onOtpRequest?.(String((event.currentTarget.form?.elements.namedItem("mobile") as HTMLInputElement)?.value || ""))}>Continue with OTP</button>

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

      <div>Don’t have an account? <Link href="/signup">Sign Up</Link></div>
    </AuthLayout>
  );
}
