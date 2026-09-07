import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <WifiOff size={28} />
        <p className="eyebrow">ODD RAVEN</p>
        <h1>Offline</h1>
        <p className="soft-text">Your saved app shell is available. Reconnect to sync orders and messages.</p>
      </section>
    </main>
  );
}

