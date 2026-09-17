import { createFileRoute } from "@tanstack/react-router";
import CallCenterRoute from "@/components/CallCenterRoute";
import CallCenterLayout from "@/components/CallCenterLayout";

export const Route = createFileRoute("/call-center")({
  ssr: false,
  component: CallCenterRouteComponent,
});

function CallCenterRouteComponent() {
  return (
    <CallCenterRoute>
      <CallCenterLayout />
    </CallCenterRoute>
  );
}
