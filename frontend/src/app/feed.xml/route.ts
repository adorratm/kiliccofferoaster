import { getBlogPosts } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const [settings, posts] = await Promise.all([
    getSiteSettings(),
    getBlogPosts({ page: 1, limit: 50, sort: "publishedAt", order: "desc" }),
  ]);

  const channelTitle = escapeXml(`${settings.brand.name} Blog`);
  const channelDesc = escapeXml(
    settings.seo.description || "Kavrum, demleme ve atölye notları",
  );

  const items = posts.items
    .map((post) => {
      const link = `${SITE_URL}/blog/${post.slug}`;
      const title = escapeXml(post.title);
      const description = escapeXml(
        post.excerpt ||
          (post.content ? stripHtml(post.content).slice(0, 280) : "") ||
          post.seoDescription ||
          "",
      );
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.updatedAt || Date.now()).toUTCString();
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${SITE_URL}/blog</link>
    <description>${channelDesc}</description>
    <language>tr</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
