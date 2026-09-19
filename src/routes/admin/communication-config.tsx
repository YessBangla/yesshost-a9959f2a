import { createFileRoute } from "@tanstack/react-router";
import AdminCommunicationConfig from "@/pages/admin/CommunicationConfig";

export const Route = createFileRoute("/admin/communication-config")({
  component: AdminCommunicationConfig,
  head: () => ({
    meta: [
      { title: "Communication Settings | Yess Host Admin" },
      { name: "description", content: "Configure Yess Host email, SMS and OTP delivery channels and run live delivery tests." },
      { property: "og:title", content: "Communication Settings | Yess Host Admin" },
      { property: "og:description", content: "Configure Yess Host email, SMS and OTP delivery channels and run live delivery tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
