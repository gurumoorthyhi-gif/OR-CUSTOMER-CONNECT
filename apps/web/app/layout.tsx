import type { Metadata } from "next";
import { ServiceWorkerRegister } from "./components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "ODD RAVEN",
  description: "DTF customer app and operations platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
