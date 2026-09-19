import { createFileRoute } from "@tanstack/react-router";
import PaymentMethods from "@/pages/PaymentMethods";

export const Route = createFileRoute("/payment/")({
  component: PaymentMethods,
  head: () => ({
    meta: [
      { title: "Payment Methods | Yess Host" },
      { name: "description", content: "bKash, Nagad, Rocket, card and bank transfer options accepted for Yess Host invoices." },
      { property: "og:title", content: "Payment Methods | Yess Host" },
      { property: "og:description", content: "bKash, Nagad, Rocket, card and bank transfer options accepted for Yess Host invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
