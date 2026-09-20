import { SITE_DEMO_MODE } from "./demo";

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  if (SITE_DEMO_MODE) return fallback;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
