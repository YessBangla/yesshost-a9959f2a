import { createFileRoute } from "@tanstack/react-router";
import ThemeDemo from "@/pages/themes/ThemeDemo";

export const Route = createFileRoute("/themes/$slug/demo")({
  component: ThemeDemo,
  head: () => ({
    meta: [
      { title: "Theme Live Demo | Yess Host" },
      { name: "description", content: "Preview this website theme on desktop, tablet and mobile before you buy." },
      { property: "og:title", content: "Theme Live Demo | Yess Host" },
      { property: "og:description", content: "Preview this website theme on desktop, tablet and mobile before you buy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
