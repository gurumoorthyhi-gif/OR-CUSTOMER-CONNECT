"use client";

export default function AuthOtpInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="or-auth-otp">
    {Array.from({ length: 6 }).map((_, index) => <input key={index} value={value[index] ?? ""} type="text" inputMode="numeric" maxLength={1} aria-label={`OTP digit ${index + 1}`} onChange={(event) => onChange(value.slice(0, index) + event.target.value.replace(/\D/g, "").slice(-1) + value.slice(index + 1))} />)}
  </div>;
}
