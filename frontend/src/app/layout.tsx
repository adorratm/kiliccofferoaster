import type { Metadata } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { AppShellMark } from "@/components/AppShellMark";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteSettings } from "@/lib/cms";
import {
  JsonLd,
  buildSiteMetadata,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildSiteMetadata(settings);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const mediaBase =
    (process.env.NEXT_PUBLIC_CDN_URL || process.env.AWS_CDN_URL || "").replace(
      /\/$/,
      "",
    ) ||
    (process.env.NEXT_PUBLIC_S3_BUCKET
      ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION || process.env.AWS_REGION || "eu-central-1"}.amazonaws.com`
      : "https://kilic-coffee-roaster.s3.eu-central-1.amazonaws.com");

  return (
    <html
      lang="tr"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${inter.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        <link rel="preconnect" href={mediaBase} />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(/KilicCoffee\\//i.test(navigator.userAgent))document.documentElement.classList.add('kilic-native-app')`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-on-background antialiased">
        <JsonLd data={organizationJsonLd(settings)} />
        <JsonLd data={websiteJsonLd(settings)} />
        <AppShellMark />
        <SiteHeader settings={settings} />
        <main className="flex-1 pt-20">{children}</main>
        <SiteFooter settings={settings} />
        <CookieBanner />
        <AnalyticsScripts />
      </body>
    </html>
  );
}
