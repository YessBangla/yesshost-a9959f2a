import { createFileRoute } from "@tanstack/react-router";
import DashboardWallet from "@/pages/dashboard/Wallet";

export const Route = createFileRoute("/dashboard/wallet")({
  component: DashboardWallet,
  head: () => ({
    meta: [
      { title: "Wallet | Yess Host" },
      { name: "description", content: "Top up your Yess Host wallet and review wallet transactions." },
      { property: "og:title", content: "Wallet | Yess Host" },
      { property: "og:description", content: "Top up your Yess Host wallet and review wallet transactions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
