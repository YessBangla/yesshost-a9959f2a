import { createFileRoute } from "@tanstack/react-router";
import Refund from "@/pages/legal/Refund";

export const Route = createFileRoute("/refund")({
  component: Refund,
  head: () => ({
    meta: [
      { title: "Refund Policy | Yess Host" },
      { name: "description", content: "Details of the Yess Host money-back guarantee, eligibility and refund processing times." },
      { property: "og:title", content: "Refund Policy | Yess Host" },
      { property: "og:description", content: "Details of the Yess Host money-back guarantee, eligibility and refund processing times." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
