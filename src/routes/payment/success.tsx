import { createFileRoute } from "@tanstack/react-router";
import { PaymentSuccess as PaymentSuccess } from "@/pages/PaymentResult";

export const Route = createFileRoute("/payment/success")({
  component: PaymentSuccess,
});
