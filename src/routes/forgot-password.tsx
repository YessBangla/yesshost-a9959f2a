import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({
    meta: [
      { title: "Reset Your Password | Yess Host" },
      { name: "description", content: "Request a password reset link for your Yess Host client account." },
      { property: "og:title", content: "Reset Your Password | Yess Host" },
      { property: "og:description", content: "Request a password reset link for your Yess Host client account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
