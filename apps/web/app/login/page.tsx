import { KeyRound, Smartphone } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">ODD RAVEN</p>
        <h1>Login</h1>
        <label>
          Mobile number
          <span>
            <Smartphone size={18} />
            <input inputMode="tel" placeholder="Enter mobile number" />
          </span>
        </label>
        <button className="primary-action" type="button">
          <KeyRound size={18} />
          Send OTP
        </button>
      </section>
    </main>
  );
}

