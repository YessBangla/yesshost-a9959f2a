import { createFileRoute } from "@tanstack/react-router";
import AdminUsers from "@/pages/admin/Users";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
  head: () => ({
    meta: [
      { title: "Client Management | Yess Host Admin" },
      { name: "description", content: "Create, approve and manage client accounts." },
      { property: "og:title", content: "Client Management | Yess Host Admin" },
      { property: "og:description", content: "Create, approve and manage client accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
