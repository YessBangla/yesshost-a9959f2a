/// <reference types="vite/client" />
import { Suspense, useEffect, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { HelmetProvider } from "react-helmet-async";

import appCss from "@/styles.css?url";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import OfflineBanner from "@/components/OfflineBanner";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import NotFound from "@/pages/NotFound";
import { installGlobalErrorHandlers } from "@/lib/errorReporting";

const SITE_URL = "https://yesshost.lovable.app";
const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/96551642-88f9-45c1-989b-62c8455854ca/id-preview-fe3020ae--f5a4504a-88d1-4f61-a16f-81a8edc82959.lovable.app-1773492950044.png";

const JSONLD_ORGANIZATION = `{"@context":"https://schema.org","@type":"Organization","name":"Yess Host","alternateName":["ইয়েস হোস্ট","YessHost","ইয়েস হোষ্ট"],"url":"${SITE_URL}","logo":"${SITE_URL}/favicon.ico","description":"বাংলাদেশের সেরা ওয়েব হোস্টিং, ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার ও SSL সার্টিফিকেট প্রোভাইডার। Enterprise-grade cloud hosting with 99.99% uptime in Bangladesh.","foundingDate":"2015","contactPoint":[{"@type":"ContactPoint","telephone":"+880-96-38-205-205","contactType":"customer service","email":"support@yesshost.com","availableLanguage":["Bengali","English"],"areaServed":"BD","contactOption":"TollFree"},{"@type":"ContactPoint","telephone":"+880-96-38-205-205","contactType":"sales","email":"support@yesshost.com","availableLanguage":["Bengali","English"]}],"sameAs":["https://facebook.com/yesshost","https://youtube.com/@yesshost","https://wa.me/8809638205205"],"address":{"@type":"PostalAddress","addressLocality":"Dhaka","addressCountry":"BD","addressRegion":"Dhaka Division"},"areaServed":{"@type":"Country","name":"Bangladesh"},"priceRange":"৳৯৯ - ৳৫০,০০০"}`;

const JSONLD_LOCAL_BUSINESS = `{"@context":"https://schema.org","@type":"LocalBusiness","@id":"${SITE_URL}/#localbusiness","name":"Yess Host","alternateName":"ইয়েস হোস্ট","image":"${SITE_URL}/favicon.ico","url":"${SITE_URL}","telephone":"+880-96-38-205-205","email":"support@yesshost.com","address":{"@type":"PostalAddress","addressLocality":"Dhaka","addressCountry":"BD"},"geo":{"@type":"GeoCoordinates","latitude":23.8103,"longitude":90.4125},"openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday"],"opens":"10:00","closes":"20:00"},"priceRange":"৳৯৯ - ৳৫০,০০০","currenciesAccepted":"BDT","paymentAccepted":"bKash, Nagad, Visa, Mastercard, Bank Transfer","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.8","reviewCount":"500","bestRating":"5"}}`;

const JSONLD_WEBSITE = `{"@context":"https://schema.org","@type":"WebSite","name":"Yess Host","alternateName":"ইয়েস হোস্ট","url":"${SITE_URL}","inLanguage":["bn","en"],"potentialAction":{"@type":"SearchAction","target":"${SITE_URL}/services/{search_term_string}","query-input":"required name=search_term_string"}}`;

const JSONLD_BREADCRUMB = `{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"হোম","item":"${SITE_URL}/"},{"@type":"ListItem","position":2,"name":"ওয়েব হোস্টিং","item":"${SITE_URL}/services/basic-hosting"},{"@type":"ListItem","position":3,"name":"ডোমেইন","item":"${SITE_URL}/services/domain"},{"@type":"ListItem","position":4,"name":"VPS সার্ভার","item":"${SITE_URL}/services/usa-vps"},{"@type":"ListItem","position":5,"name":"থিম স্টোর","item":"${SITE_URL}/themes"}]}`;

const JSONLD_SERVICES = `{"@context":"https://schema.org","@type":"ItemList","name":"Yess Host Services","itemListElement":[{"@type":"ListItem","position":1,"item":{"@type":"Service","name":"ওয়েব হোস্টিং - Web Hosting","description":"বাংলাদেশের সেরা NVMe SSD ওয়েব হোস্টিং। LiteSpeed সার্ভার, ফ্রি SSL, ৯৯.৯৯% আপটাইম। Best NVMe SSD web hosting in Bangladesh.","provider":{"@type":"Organization","name":"Yess Host"},"areaServed":"BD","url":"${SITE_URL}/services/basic-hosting","offers":{"@type":"Offer","priceCurrency":"BDT","price":"99","priceValidUntil":"2027-12-31"}}},{"@type":"ListItem","position":2,"item":{"@type":"Service","name":"ডোমেইন রেজিস্ট্রেশন - Domain Registration","description":".com, .com.bd, .বাংলা সহ ২৬+ TLD সাপোর্ট। সেরা মূল্যে ডোমেইন কিনুন।","provider":{"@type":"Organization","name":"Yess Host"},"url":"${SITE_URL}/services/domain","offers":{"@type":"Offer","priceCurrency":"BDT","price":"999"}}},{"@type":"ListItem","position":3,"item":{"@type":"Service","name":"VPS সার্ভার - VPS Server","description":"ফুল রুট অ্যাক্সেস VPS সার্ভার। USA ও Bangladesh ডেটাসেন্টার।","provider":{"@type":"Organization","name":"Yess Host"},"url":"${SITE_URL}/services/usa-vps","offers":{"@type":"Offer","priceCurrency":"BDT","price":"1500"}}},{"@type":"ListItem","position":4,"item":{"@type":"Service","name":"SSL সার্টিফিকেট - SSL Certificate","description":"আপনার ওয়েবসাইট সুরক্ষিত করুন ফ্রি ও প্রিমিয়াম SSL দিয়ে।","provider":{"@type":"Organization","name":"Yess Host"},"url":"${SITE_URL}/services/ssl"}},{"@type":"ListItem","position":5,"item":{"@type":"Service","name":"রিসেলার হোস্টিং - Reseller Hosting","description":"নিজের হোস্টিং ব্যবসা শুরু করুন রিসেলার প্যাকেজ দিয়ে।","provider":{"@type":"Organization","name":"Yess Host"},"url":"${SITE_URL}/services/linux-reseller","offers":{"@type":"Offer","priceCurrency":"BDT","price":"2500"}}}]}`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      {
        title:
          "Yess Host — বাংলাদেশের সেরা ওয়েব হোস্টিং | Best Web Hosting Bangladesh",
      },
      {
        name: "description",
        content:
          "Yess Host (ইয়েস হোস্ট) — বাংলাদেশের সেরা ওয়েব হোস্টিং, ডোমেইন রেজিস্ট্রেশন, VPS সার্ভার, SSL সার্টিফিকেট। ৯৯.৯৯% আপটাইম গ্যারান্টি। মাত্র ৳৯৯/মাস থেকে শুরু। Best Web Hosting in Bangladesh with 99.99% uptime.",
      },
      {
        name: "keywords",
        content:
          "ইয়েস হোস্ট, ইয়েস হোষ্ট, Yess Host, YessHost, yesshost.com, বাংলাদেশ হোস্টিং, best web hosting bangladesh, best hosting bd, সেরা ওয়েব হোস্টিং বাংলাদেশ, ডোমেইন কিনুন, domain buy bd, bd domain buy, cheap hosting bangladesh, সস্তা হোস্টিং, ওয়েব হোস্টিং বাংলাদেশ, domain registration bangladesh, ডোমেইন রেজিস্ট্রেশন, VPS server bangladesh, VPS সার্ভার, SSL certificate bd, cloud hosting bd, ক্লাউড হোস্টিং, রিসেলার হোস্টিং, reseller hosting bd, BDIX hosting, বিডিআইএক্স হোস্টিং, dedicated server bangladesh, ডেডিকেটেড সার্ভার, email hosting bd, ইমেইল হোস্টিং, whois information, হোস্টিং মূল্য, hosting price bangladesh, best domain reseller bangladesh, fast hosting bangladesh, NVMe SSD hosting",
      },
      { name: "theme-color", content: "#0066FF" },
      { name: "msapplication-TileColor", content: "#0066FF" },
      {
        name: "robots",
        content:
          "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      },
      { name: "author", content: "Yess Host" },
      { name: "geo.region", content: "BD" },
      { name: "geo.placename", content: "Dhaka, Bangladesh" },
      { name: "language", content: "Bengali, English" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Yess Host — ইয়েস হোস্ট" },
      {
        property: "og:title",
        content:
          "Yess Host — বাংলাদেশের সেরা ওয়েব হোস্টিং | Best Hosting BD",
      },
      {
        property: "og:description",
        content:
          "ইয়েস হোস্ট — বাংলাদেশের ১ নম্বর হোস্টিং প্রোভাইডার। ক্লাউড হোস্টিং, VPS, ডোমেইন ও SSL সার্টিফিকেট ৯৯.৯৯% আপটাইমে।",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "bn_BD" },
      { property: "og:locale:alternate", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content:
          "Yess Host — বাংলাদেশের সেরা ওয়েব হোস্টিং | Best Hosting BD",
      },
      {
        name: "twitter:description",
        content:
          "ইয়েস হোস্ট — ক্লাউড হোস্টিং, VPS, ডোমেইন ও SSL। ৯৯.৯৯% আপটাইম। মাত্র ৳৯৯/মাস থেকে।",
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "bn", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      { rel: "preconnect", href: "https://mqezobceeeuqjgbciqku.supabase.co" },
      { rel: "dns-prefetch", href: "https://mqezobceeeuqjgbciqku.supabase.co" },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSONLD_ORGANIZATION },
      { type: "application/ld+json", children: JSONLD_LOCAL_BUSINESS },
      { type: "application/ld+json", children: JSONLD_WEBSITE },
      { type: "application/ld+json", children: JSONLD_BREADCRUMB },
      { type: "application/ld+json", children: JSONLD_SERVICES },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
});

// Minimal loading fallback (ported from src/App.tsx)
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  return (
    <HelmetProvider>
      <AnalyticsScripts />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <LanguageProvider>
              <CartProvider>
                <AuthProvider>
                  {/* Skip to content for accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-semibold"
                  >
                    Skip to content
                  </a>
                  <ScrollToTop />
                  <OfflineBanner />
                  <CartDrawer />
                  <Suspense fallback={<PageLoader />}>
                    <Outlet />
                  </Suspense>
                </AuthProvider>
              </CartProvider>
            </LanguageProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" dir="ltr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="root">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}
