import { createFileRoute } from "@tanstack/react-router";
import PaymentMethods from "@/pages/PaymentMethods";

export const Route = createFileRoute("/payment/")({
  component: PaymentMethods,
});
