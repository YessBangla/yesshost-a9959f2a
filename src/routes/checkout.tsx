import { createFileRoute } from "@tanstack/react-router";
import Checkout from "@/pages/Checkout";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({
    meta: [
      { title: "Secure Checkout | Yess Host" },
      { name: "description", content: "Review your hosting, domain and theme order and pay securely with wallet, card or bank transfer." },
      { property: "og:title", content: "Secure Checkout | Yess Host" },
      { property: "og:description", content: "Review your hosting, domain and theme order and pay securely with wallet, card or bank transfer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
