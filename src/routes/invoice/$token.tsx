import { createFileRoute } from "@tanstack/react-router";
import SharedInvoice from "@/pages/SharedInvoice";

export const Route = createFileRoute("/invoice/$token")({
  component: SharedInvoice,
  head: () => ({
    meta: [
      { title: "Secure Invoice | Yess Host" },
      { name: "description", content: "View, download, and securely pay your Yess Host invoice." },
      { property: "og:title", content: "Secure Invoice | Yess Host" },
      { property: "og:description", content: "View, download, and securely pay your Yess Host invoice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});