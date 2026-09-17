import { createFileRoute } from "@tanstack/react-router";
import DashboardWallet from "@/pages/dashboard/Wallet";

export const Route = createFileRoute("/dashboard/wallet")({
  component: DashboardWallet,
});
