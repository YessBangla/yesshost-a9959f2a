import { createFileRoute } from "@tanstack/react-router";
import AdminContactMessages from "@/pages/admin/ContactMessages";

export const Route = createFileRoute("/admin/contact-messages")({
  component: AdminContactMessages,
  head: () => ({
    meta: [
      { title: "Contact Operations | Yess Host Admin" },
      { name: "description", content: "Review Yess Host website enquiries, track unread messages, and reply from one console." },
      { property: "og:title", content: "Contact Operations | Yess Host Admin" },
      { property: "og:description", content: "Review Yess Host website enquiries, track unread messages, and reply from one console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
