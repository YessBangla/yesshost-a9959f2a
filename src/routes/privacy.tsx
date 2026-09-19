import { createFileRoute } from "@tanstack/react-router";
import Privacy from "@/pages/legal/Privacy";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy | Yess Host" },
      { name: "description", content: "How Yess Host collects, uses and protects your personal and billing information." },
      { property: "og:title", content: "Privacy Policy | Yess Host" },
      { property: "og:description", content: "How Yess Host collects, uses and protects your personal and billing information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
