import { createFileRoute } from "@tanstack/react-router";
import AdminPaymentGateways from "@/pages/admin/PaymentGateways";

export const Route = createFileRoute("/admin/payment-gateways")({
  component: AdminPaymentGateways,
});
