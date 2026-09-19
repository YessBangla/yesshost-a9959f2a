import { createFileRoute } from "@tanstack/react-router";
import Terms from "@/pages/legal/Terms";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms of Service | Yess Host" },
      { name: "description", content: "Read the terms that govern the use of Yess Host hosting, domain and marketplace services." },
      { property: "og:title", content: "Terms of Service | Yess Host" },
      { property: "og:description", content: "Read the terms that govern the use of Yess Host hosting, domain and marketplace services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
