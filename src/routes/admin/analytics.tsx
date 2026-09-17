import { createFileRoute } from "@tanstack/react-router";
import AdminAnalytics from "@/pages/admin/Analytics";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});
