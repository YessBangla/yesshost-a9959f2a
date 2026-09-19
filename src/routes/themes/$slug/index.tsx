import { createFileRoute } from "@tanstack/react-router";
import ThemeDetail from "@/pages/themes/ThemeDetail";

const humanize = (slug: string) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const Route = createFileRoute("/themes/$slug/")({
  component: ThemeDetail,
  head: ({ params }) => {
    const name = humanize(params.slug) || "Website Theme";
    const title = `${name} Theme | Yess Host`;
    const description = `${name} website theme — screenshots, features and BDT pricing on the Yess Host marketplace.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
});
