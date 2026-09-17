import { createFileRoute } from "@tanstack/react-router";
import { PaymentCancel as PaymentCancel } from "@/pages/PaymentResult";

export const Route = createFileRoute("/payment/cancel")({
  component: PaymentCancel,
});
