import Script from "next/script";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim() || "";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";

/**
 * Google Ads / GA4 gtag — Consent Mode v2.
 * Etiket her zaman yüklenir (Google doğrulaması için); çerezler onaydan önce denied.
 * GTM kullanılıyorsa gtag burada atlanır (GTM içinden yönetin).
 */
export function GoogleConsentTags() {
  if (GTM_ID) return null;

  const gtagId = GOOGLE_ADS_ID || GA4_ID;
  if (!gtagId) return null;

  return (
    <>
      <Script id="gtag-consent-default" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500
        });
      `}</Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-config" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        ${GA4_ID ? `gtag('config', '${GA4_ID}', { anonymize_ip: true });` : ""}
        ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
      `}</Script>
    </>
  );
}
