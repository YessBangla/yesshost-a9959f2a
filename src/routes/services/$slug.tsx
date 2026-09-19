import { createFileRoute } from "@tanstack/react-router";
import ServiceDetail from "@/pages/services/ServiceDetail";

const humanize = (slug: string) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const Route = createFileRoute("/services/$slug")({
  component: ServiceDetail,
  head: ({ params }) => {
    const name = humanize(params.slug) || "Hosting Service";
    const title = `${name} | Yess Host`;
    const description = `${name} from Yess Host — features, pricing in BDT, and 24/7 Bangladesh support.`;
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
