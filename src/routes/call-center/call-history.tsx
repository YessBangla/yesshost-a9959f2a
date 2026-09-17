import { createFileRoute } from "@tanstack/react-router";
import CallCenterCallHistory from "@/pages/callcenter/CallHistory";

export const Route = createFileRoute("/call-center/call-history")({
  component: CallCenterCallHistory,
});
