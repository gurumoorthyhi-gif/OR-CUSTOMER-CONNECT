"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({
  title,
  subtitle,
  backHref,
  icon,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  backHref?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="or-auth-shell">
      <section className="or-auth-panel">
        {backHref ? (
          <Link href={backHref} className="or-auth-back" aria-label="Go back">
            <ChevronLeft size={18} strokeWidth={2.4} />
          </Link>
        ) : (
          <div className="or-auth-back-spacer" />
        )}

        {icon ? <div className="or-auth-hero-icon">{icon}</div> : null}

        <header className="or-auth-header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>

        {children}
        {footer ? <div className="or-auth-footer">{footer}</div> : null}
      </section>
    </main>
  );
}
