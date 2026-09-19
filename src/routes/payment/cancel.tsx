import { createFileRoute } from "@tanstack/react-router";
import { PaymentCancel as PaymentCancel } from "@/pages/PaymentResult";

export const Route = createFileRoute("/payment/cancel")({
  component: PaymentCancel,
  head: () => ({
    meta: [
      { title: "Payment Cancelled | Yess Host" },
      { name: "description", content: "You cancelled this Yess Host payment. Your invoice remains unpaid." },
      { property: "og:title", content: "Payment Cancelled | Yess Host" },
      { property: "og:description", content: "You cancelled this Yess Host payment. Your invoice remains unpaid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
