import { createFileRoute } from "@tanstack/react-router";
import { PaymentFail as PaymentFail } from "@/pages/PaymentResult";

export const Route = createFileRoute("/payment/fail")({
  component: PaymentFail,
  head: () => ({
    meta: [
      { title: "Payment Failed | Yess Host" },
      { name: "description", content: "Your Yess Host payment could not be completed. Try another method or contact support." },
      { property: "og:title", content: "Payment Failed | Yess Host" },
      { property: "og:description", content: "Your Yess Host payment could not be completed. Try another method or contact support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
