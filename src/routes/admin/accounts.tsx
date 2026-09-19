import { createFileRoute } from "@tanstack/react-router";
import AdminAccounts from "@/pages/admin/Accounts";

export const Route = createFileRoute("/admin/accounts")({
  component: AdminAccounts,
  head: () => ({
    meta: [
      { title: "Central Accounts | Yess Host Admin" },
      { name: "description", content: "Central ledger for Yess Host: client payments, daily, weekly, monthly and yearly income and expense, journal entries and trial balance." },
      { property: "og:title", content: "Central Accounts | Yess Host Admin" },
      { property: "og:description", content: "Client payment detail, period income and expense reports, journal and trial balance in one central ledger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
