import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  keywords?: string;
}

const SITE_NAME = "Yess Host";
const BASE_URL = "https://yesshost.lovable.app";
const OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/96551642-88f9-45c1-989b-62c8455854ca/id-preview-fe3020ae--f5a4504a-88d1-4f61-a16f-81a8edc82959.lovable.app-1773492950044.png";

const DEFAULT_KEYWORDS = "ইয়েস হোস্ট, Yess Host, YessHost, Best Web Hosting in Bangladesh, Best Domain Reseller in Bangladesh, bd domain buy, Fast Hosting Site in Bangladesh, Bangladeshi Domain Buy & Sell, Complete Domain & Hosting Solution in Bangladesh, web hosting bangladesh, domain registration, whois information";

const SEOHead = ({
  title,
  description,
  canonical,
  ogType = "website",
  noindex = false,
  jsonLd,
  keywords = DEFAULT_KEYWORDS,
}: SEOHeadProps) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={OG_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
