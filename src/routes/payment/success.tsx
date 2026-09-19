import { createFileRoute } from "@tanstack/react-router";
import { PaymentSuccess as PaymentSuccess } from "@/pages/PaymentResult";

export const Route = createFileRoute("/payment/success")({
  component: PaymentSuccess,
  head: () => ({
    meta: [
      { title: "Payment Successful | Yess Host" },
      { name: "description", content: "Your Yess Host payment was received and your invoice has been updated." },
      { property: "og:title", content: "Payment Successful | Yess Host" },
      { property: "og:description", content: "Your Yess Host payment was received and your invoice has been updated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
