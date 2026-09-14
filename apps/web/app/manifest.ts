import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ODD RAVEN",
    short_name: "ODD RAVEN",
    description: "DTF customer orders, approvals, payments, tracking, and support.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f0",
    theme_color: "#18181b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

