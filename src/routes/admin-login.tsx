import { createFileRoute } from "@tanstack/react-router";
import AdminLogin from "@/pages/AdminLogin";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
  head: () => ({
    meta: [
      { title: "Staff Login | Yess Host" },
      { name: "description", content: "Secure sign-in for Yess Host administrators, support and call centre staff." },
      { property: "og:title", content: "Staff Login | Yess Host" },
      { property: "og:description", content: "Secure sign-in for Yess Host administrators, support and call centre staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
