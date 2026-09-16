"use client";

import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import AuthLayout from "./AuthLayout";
import "./mobile-auth.css";

export default function AuthSuccessPage({
  title = "Success!",
  subtitle = "Your request has been completed successfully.",
  buttonLabel = "Continue",
  buttonHref = "/dashboard",
}: {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonHref?: string;
}) {
  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <div className="or-auth-success-icon">
        <CircleCheckBig size={52} strokeWidth={2.1} />
      </div>
      <form className="or-auth-form">
        <Link className="or-auth-submit" href={buttonHref} style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
          {buttonLabel}
        </Link>
      </form>
    </AuthLayout>
  );
}
