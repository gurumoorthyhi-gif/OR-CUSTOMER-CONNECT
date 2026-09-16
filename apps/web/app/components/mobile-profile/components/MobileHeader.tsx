"use client";
import { ChevronLeft } from "lucide-react";

export default function MobileHeader({ title, onBack, action }: { title: string; onBack?: () => void; action?: React.ReactNode }) {
  return (
    <header className="or-profile-header">
      {onBack ? <button type="button" className="or-profile-back" onClick={onBack} aria-label="Go back"><ChevronLeft size={22} /></button> : <span />}
      <h1>{title}</h1>
      <div className="or-profile-header-action">{action}</div>
    </header>
  );
}
