import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Client Login | Yess Host" },
      { name: "description", content: "Sign in to your Yess Host account to manage hosting, domains, invoices and support tickets." },
      { property: "og:title", content: "Client Login | Yess Host" },
      { property: "og:description", content: "Sign in to your Yess Host account to manage hosting, domains, invoices and support tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
