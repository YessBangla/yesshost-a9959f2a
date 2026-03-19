import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string;
}

const SITE_NAME = "Yess Host";
const BASE_URL = "https://yesshost.lovable.app";
const OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/96551642-88f9-45c1-989b-62c8455854ca/id-preview-fe3020ae--f5a4504a-88d1-4f61-a16f-81a8edc82959.lovable.app-1773492950044.png";

const DEFAULT_KEYWORDS = "ইয়েস হোস্ট, ইয়েস হোষ্ট, Yess Host, YessHost, yesshost.com, বাংলাদেশ হোস্টিং, best web hosting bangladesh, best hosting bd, সেরা ওয়েব হোস্টিং বাংলাদেশ, ডোমেইন কিনুন, domain buy bd, bd domain buy, cheap hosting bangladesh, সস্তা হোস্টিং, ওয়েব হোস্টিং বাংলাদেশ, domain registration bangladesh, ডোমেইন রেজিস্ট্রেশন, VPS server bangladesh, VPS সার্ভার, SSL certificate bd, cloud hosting bd, ক্লাউড হোস্টিং, রিসেলার হোস্টিং, reseller hosting bd, BDIX hosting, বিডিআইএক্স হোস্টিং, dedicated server bangladesh, email hosting bd, whois information, hosting price bd, হোস্টিং মূল্য";

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

  // Support both single and array of JSON-LD objects
  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      )}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="bn" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="en" href={canonicalUrl} />}
      {canonicalUrl && <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="Yess Host — ইয়েস হোস্ট" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:locale" content="bn_BD" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {/* JSON-LD */}
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(item)}</script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
