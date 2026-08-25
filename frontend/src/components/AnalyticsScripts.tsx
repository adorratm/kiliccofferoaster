"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID?.trim() || "";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";

/**
 * Çerez onayı olmadan GA4 / GTM / Google Ads / Meta Pixel yüklenmez.
 * analytics → GA4 + GTM; marketing → Google Ads + Meta Pixel.
 */
export function AnalyticsScripts() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    setConsent(readCookieConsent());
    function onConsent(e: Event) {
      const detail = (e as CustomEvent<CookieConsent>).detail;
      setConsent(detail ?? readCookieConsent());
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
  }, []);

  if (!consent) return null;

  const loadGtm = consent.analytics && !!GTM_ID;
  const loadGa4 = consent.analytics && !!GA4_ID && !GTM_ID;
  const loadGoogleAds = consent.marketing && !!GOOGLE_ADS_ID;
  const loadMeta = consent.marketing && !!META_PIXEL_ID;
  const loadGtag = loadGa4 || loadGoogleAds;
  const gtagScriptId = GA4_ID || GOOGLE_ADS_ID;

  if (!loadGtm && !loadGtag && !loadMeta) return null;

  return (
    <>
      {loadGtm ? (
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>
      ) : null}

      {loadGtag ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagScriptId}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${loadGa4 ? `gtag('config', '${GA4_ID}', { anonymize_ip: true });` : ""}
            ${loadGoogleAds ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
          `}</Script>
        </>
      ) : null}

      {loadMeta ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}
    </>
  );
}
