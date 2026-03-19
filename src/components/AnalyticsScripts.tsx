import { Helmet } from "react-helmet-async";

// =============================================
// 🔧 আপনার ট্র্যাকিং আইডি এখানে বসান:
// =============================================
const GA_MEASUREMENT_ID = "G-WKRJJB7EPB"; // Google Analytics 4 Measurement ID
const FB_PIXEL_ID = "1033602763169756";           // Facebook Pixel ID
// =============================================

const isEnabled = (id: string, placeholder: string) => id && id !== placeholder;

const AnalyticsScripts = () => {
  const gaEnabled = isEnabled(GA_MEASUREMENT_ID, "G-XXXXXXXXXX");
  const fbEnabled = isEnabled(FB_PIXEL_ID, "000000000000000");

  return (
    <Helmet>
      {/* Google Analytics 4 */}
      {gaEnabled && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      )}
      {gaEnabled && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            send_page_view: true
          });
        `}</script>
      )}

      {/* Facebook / Meta Pixel */}
      {fbEnabled && (
        <script>{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}</script>
      )}
      {fbEnabled && (
        <noscript>{`<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1"/>`}</noscript>
      )}
    </Helmet>
  );
};

export default AnalyticsScripts;
