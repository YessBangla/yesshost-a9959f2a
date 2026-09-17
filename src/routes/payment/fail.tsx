import { createFileRoute } from "@tanstack/react-router";
import { PaymentFail as PaymentFail } from "@/pages/PaymentResult";

export const Route = createFileRoute("/payment/fail")({
  component: PaymentFail,
});
