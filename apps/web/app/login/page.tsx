"use client";

import { KeyRound, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail ?? "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-panel" onSubmit={login}>
        <p className="eyebrow">ODD RAVEN</p>
        <h1>Login</h1>
        <label>
          Username
          <span>
            <UserRound size={18} />
            <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" />
          </span>
        </label>
        <label>
          Password
          <input required minLength={6} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button className="primary-action" type="submit" disabled={saving}>
          <KeyRound size={18} />
          {saving ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
