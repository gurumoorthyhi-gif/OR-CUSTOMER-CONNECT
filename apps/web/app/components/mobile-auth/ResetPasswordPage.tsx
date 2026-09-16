"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";
import AuthField from "./AuthField";
import AuthLayout from "./AuthLayout";
import "./mobile-auth.css";

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset Password" subtitle="Create a new password for your account." backHref="/verify-otp?mode=reset" icon={<ShieldCheck size={36} strokeWidth={2.1} />}>
      <form className="or-auth-form">
        <AuthField label="New Password" name="newPassword" type="password" placeholder="Enter a new password" icon={LockKeyhole} />
        <AuthField label="Confirm New Password" name="confirmPassword" type="password" placeholder="Confirm your new password" icon={LockKeyhole} />

        <ul className="or-auth-password-rules">
          <li>At least 8 characters</li>
          <li>Include one uppercase letter</li>
          <li>Include one lowercase letter</li>
          <li>Include one number or special character</li>
        </ul>

        <button className="or-auth-submit" type="submit">Reset Password</button>
      </form>
    </AuthLayout>
  );
}
