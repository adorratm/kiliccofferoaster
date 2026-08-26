import { AppImage as Image } from "@/components/AppImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import {
  getBlogPostBySlug,
  getBlogPosts,
  getProductBySlug,
} from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import { displayUpper, formatMoney, productImage } from "@/lib/format";
import {
  JsonLd,
  blogPostJsonLd,
  breadcrumbJsonLd,
  buildBlogPostMetadata,
} from "@/lib/seo";
import type { Product } from "@/lib/types";

/** İlgili ürün fetch’i SSG’yi kilitlemesin / prod’da asılı kalmasın */
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getBlogPostBySlug(slug),
    getSiteSettings(),
  ]);
  if (!post) {
    return { title: "Yazı bulunamadı", robots: { index: false, follow: false } };
  }
  return buildBlogPostMetadata(post, settings);
}

export async function generateStaticParams() {
  const paged = await getBlogPosts({ limit: 50, sort: "publishedAt" });
  return paged.items.map((p) => ({ slug: p.slug }));
}

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function relatedSlugList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || "").trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

async function loadRelatedProducts(raw: unknown): Promise<Product[]> {
  const slugs = relatedSlugList(raw).slice(0, 6);
  if (!slugs.length) return [];

  const results = await Promise.all(
    slugs.map(async (s) => {
      try {
        return await Promise.race([
          getProductBySlug(s),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 8000);
          }),
        ]);
      } catch {
        return null;
      }
    }),
  );

  return results.filter(
    (p): p is Product => Boolean(p && p.isActive !== false),
  );
}

function RelatedProductTeaser({ product }: { product: Product }) {
  const img = productImage(product.imageUrl, product.slug);
  const price = product.variants?.[0]?.price ?? product.basePrice;

  return (
    <Link
      href={`/urunler/${product.slug}`}
      className="group block border border-outline-variant/25 bg-surface-container-low p-4 transition-colors hover:border-primary"
    >
      <div className="relative mb-4 aspect-4/5 overflow-hidden bg-surface-dim">
        <Image
          src={img}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, 40vw"
        />
      </div>
      <h3 className="font-display text-2xl leading-none tracking-wide">
        {displayUpper(product.name)}
      </h3>
      <p className="mt-2 font-meta text-sm text-primary">
        {formatMoney(price, product.currency)}
      </p>
      <span className="mt-4 inline-block font-meta text-[11px] uppercase tracking-widest text-secondary group-hover:text-primary">
        İncele →
      </span>
    </Link>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getBlogPostBySlug(slug),
    getSiteSettings(),
  ]);

  if (!post) notFound();

  const cover = productImage(post.coverImageUrl, post.slug);
  const relatedProducts = await loadRelatedProducts(post.relatedProductSlugs);

  return (
    <article>
      <JsonLd data={blogPostJsonLd(post, settings)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana sayfa", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <section className="relative min-h-[52vh] overflow-hidden border-b border-outline-variant/20 md:min-h-[62vh]">
        <Image
          src={cover}
          alt={post.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/20" />
        <div className="page-shell relative flex min-h-[52vh] flex-col justify-end py-14 md:min-h-[62vh] md:py-20">
          <Reveal>
            <p className="font-meta text-xs uppercase tracking-widest text-primary">
              Blog / {post.slug}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
              {post.title}
            </h1>
            <p className="mt-5 font-meta text-[11px] uppercase tracking-widest text-white/70">
              {formatDate(post.publishedAt)}
              {post.authorName ? ` · ${post.authorName}` : ""}
              {post.tags?.length ? ` · ${post.tags.join(" · ")}` : ""}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="page-shell mx-auto max-w-3xl py-14 md:py-20">
        {post.excerpt ? (
          <Reveal>
            <p className="mb-10 border-l-2 border-primary pl-5 text-lg leading-relaxed text-secondary md:text-xl">
              {post.excerpt}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={80}>
          <div
            className="prose-blog space-y-5 font-sans text-base leading-8 text-secondary [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:text-foreground [&_p]:mb-0 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </Reveal>

        {relatedProducts.length ? (
          <section className="mt-16 border-t border-outline-variant/20 pt-10">
            <Reveal>
              <p className="font-meta text-[10px] uppercase tracking-widest text-primary">
                İlgili kavrumlar
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase md:text-4xl">
                Bu yazıdan ürünlere
              </h2>
              <p className="mt-3 max-w-xl font-meta text-xs uppercase text-on-surface-variant">
                Önerilen çekirdekleri Kılıç Coffee Roaster’dan inceleyebilirsiniz.
              </p>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {relatedProducts.map((p, i) => (
                <Reveal key={p.id} delay={80 + i * 60}>
                  <RelatedProductTeaser product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        <Reveal delay={120} className="mt-14 border-t border-outline-variant/20 pt-8">
          <Link href="/blog" className="btn-ghost px-5 py-3 text-[10px]">
            ← Tüm yazılar
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
