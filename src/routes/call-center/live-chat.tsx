import { createFileRoute } from "@tanstack/react-router";
import CallCenterLiveChat from "@/pages/callcenter/LiveChat";

export const Route = createFileRoute("/call-center/live-chat")({
  component: CallCenterLiveChat,
});
