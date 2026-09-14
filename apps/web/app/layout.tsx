import type { Metadata } from "next";
import { Suspense } from "react";
import CustomerPortalChrome from "./components/customer-portal-chrome";
import { ServiceWorkerRegister } from "./components/service-worker-register";
import { ConnectionSetup } from "./components/connection-setup";
import "./globals.css";

export const metadata: Metadata = {
  title: "ODD RAVEN",
  description: "DTF customer app and operations platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={children}>
          <CustomerPortalChrome><ConnectionSetup>{children}</ConnectionSetup></CustomerPortalChrome>
        </Suspense>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
