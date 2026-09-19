import { createFileRoute } from "@tanstack/react-router";
import AdminPaymentGateways from "@/pages/admin/PaymentGateways";

export const Route = createFileRoute("/admin/payment-gateways")({
  component: AdminPaymentGateways,
  head: () => ({
    meta: [
      { title: "Payment Gateways | Yess Host Admin" },
      { name: "description", content: "Configure SSLCommerz, bKash and Nagad credentials securely." },
      { property: "og:title", content: "Payment Gateways | Yess Host Admin" },
      { property: "og:description", content: "Configure SSLCommerz, bKash and Nagad credentials securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
