import { createFileRoute } from "@tanstack/react-router";
import AdminStaff from "@/pages/admin/Staff";

export const Route = createFileRoute("/admin/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Access | Yess Host Admin" },
      { name: "description", content: "Manage Yess Host staff roles, access permissions, and support activity." },
      { property: "og:title", content: "Staff & Access | Yess Host Admin" },
      { property: "og:description", content: "Manage Yess Host staff roles, access permissions, and support activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminStaff,
});
