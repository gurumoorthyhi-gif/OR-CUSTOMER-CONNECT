"use client";

import type { LucideIcon } from "lucide-react";

export default function AuthField({
  label,
  placeholder,
  type = "text",
  icon: Icon,
  name,
  required = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  icon: LucideIcon;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="or-auth-field">
      <span>{label}</span>
      <div className="or-auth-input-wrap">
        <Icon size={18} strokeWidth={2} />
        <input required={required} name={name} type={type} placeholder={placeholder} />
      </div>
    </label>
  );
}
