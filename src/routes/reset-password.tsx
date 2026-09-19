import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Set a New Password | Yess Host" },
      { name: "description", content: "Choose a new password for your Yess Host client account." },
      { property: "og:title", content: "Set a New Password | Yess Host" },
      { property: "og:description", content: "Choose a new password for your Yess Host client account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
