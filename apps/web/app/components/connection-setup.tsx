"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw, AlertCircle } from "lucide-react";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
type Service = { ready: boolean; state: string; message: string };
type Connection = { backend: boolean; background: Service; upscale: Service };
const pending: Service = { ready: false, state: "connecting", message: "Checking connection..." };
const initial: Connection = { backend: false, background: pending, upscale: pending };
const ConnectionContext = createContext({ connection: initial, check: async (): Promise<Connection> => initial });

export const useConnection = () => useContext(ConnectionContext);

export function ConnectionSetup({ children }: { children: React.ReactNode }) {
  const [connection, setConnection] = useState(initial);
  const [checking, setChecking] = useState(true);
  const inFlight = useRef<Promise<Connection> | null>(null);
  const check = useCallback((): Promise<Connection> => {
    if (inFlight.current) return inFlight.current;
    setChecking(true);
    inFlight.current = (async () => {
      let backend = false;
      let next = initial;
      try {
        const health = await fetch(`${API_BASE}/health`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
        if (!health.ok || (await health.json()).status !== "ok") throw new Error("Backend unavailable");
        backend = true;
        const response = await fetch(`${API_BASE}/api/image-processing/health`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
        if (!response.ok) throw new Error("Worker health unavailable");
        const status = await response.json();
        if (typeof status.background?.ready !== "boolean" || typeof status.upscale?.ready !== "boolean") throw new Error("Worker health outdated");
        next = { backend, background: status.background, upscale: status.upscale };
      } catch {
        const unavailable = { ready: false, state: "unavailable", message: backend ? "Worker connection could not be verified. Restart the local app." : "Backend disconnected. Open Start App to reconnect." };
        next = { backend, background: unavailable, upscale: unavailable };
      }
      setConnection(next);
      setChecking(false);
      inFlight.current = null;
      return next;
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    void check();
    const timer = window.setInterval(() => void check(), 10000);
    const reconnect = () => void check();
    window.addEventListener("online", reconnect);
    window.addEventListener("focus", reconnect);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("focus", reconnect);
    };
  }, [check]);

  const ready = connection.backend && connection.background.ready && connection.upscale.ready;
  const issues = [...new Set([connection.background, connection.upscale].filter((service) => !service.ready).map((service) => service.message))];
  return <ConnectionContext.Provider value={{ connection, check }}>
    <section className="connection-setup" aria-label="Connection setup">
      <div className="connection-setup-row">
        <strong>{ready ? "Services connected" : "Connection setup"}</strong>
        {[{ label: "Backend", ready: connection.backend }, { label: "Background removal", ready: connection.background.ready }, { label: "Upscaler", ready: connection.upscale.ready }].map((service) => <span key={service.label} className={service.ready ? "connection-ready" : "connection-unavailable"}>{service.ready ? <CheckCircle2 size={16} /> : checking ? <LoaderCircle size={16} className="spin" /> : <AlertCircle size={16} />}{service.label}: {service.ready ? "Connected" : checking ? "Checking" : "Unavailable"}</span>)}
        <button type="button" onClick={() => void check()} disabled={checking} title="Check connections again" aria-label="Check connections again"><RefreshCw size={17} className={checking ? "spin" : undefined} /></button>
      </div>
      {!ready ? <p role="status">{issues.join(" ")}</p> : null}
    </section>
    {children}
  </ConnectionContext.Provider>;
}
