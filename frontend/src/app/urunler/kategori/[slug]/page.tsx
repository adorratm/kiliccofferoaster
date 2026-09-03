import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Reveal } from "@/components/Reveal";
import { getBlogPosts, getCategories, getProductsPaged } from "@/lib/api";
import { getSiteSettings } from "@/lib/cms";
import { categoryCatalogPath } from "@/lib/catalog-paths";
import { looksLikeHtml } from "@/lib/catalog-seo";
import {
  buildCatalogMetadata,
  breadcrumbJsonLd,
  itemListJsonLd,
  JsonLd,
} from "@/lib/seo";
import ProductsCatalog from "../../ProductsCatalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    origin?: string;
    roast?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, sp, settings, categories] = await Promise.all([
    params,
    searchParams,
    getSiteSettings(),
    getCategories().catch(() => []),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return { title: "Kategori bulunamadı", robots: { index: false, follow: false } };
  }
  return buildCatalogMetadata(settings, {
    categorySlug: category.slug,
    categoryName: category.name,
    categoryDescription: category.description,
    categorySeoTitle: category.seoTitle,
    categorySeoDescription: category.seoDescription,
    q: sp.q,
    page: sp.page,
    origin: sp.origin,
    roast: sp.roast,
    sort: sp.sort,
    order: sp.order,
  });
}

export default async function CategoryCatalogPage({ params }: Props) {
  const { slug } = await params;
  const [categories, relatedBlog] = await Promise.all([
    getCategories().catch(() => []),
    getBlogPosts({ categorySlug: slug, limit: 3, sort: "publishedAt" }),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const crumbs = [
    { name: "Ana sayfa", path: "/" },
    { name: "Kavrumlar", path: "/urunler" },
    {
      name: category.name,
      path: categoryCatalogPath(category.slug),
    },
  ];

  const catalog = await getProductsPaged({
    page: 1,
    limit: 48,
    categorySlug: category.slug,
  }).catch(() => null);

  const intro = category.description?.trim() || "";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {catalog?.items?.length ? (
        <JsonLd
          data={itemListJsonLd(catalog.items, {
            name: category.name,
            path: categoryCatalogPath(category.slug),
          })}
        />
      ) : null}
      <PageBreadcrumb items={crumbs} />
      <section className="page-shell border-b border-outline-variant/20 pt-10 pb-6 md:pt-16">
        <Reveal>
          <p className="mb-2 font-meta text-xs uppercase tracking-widest text-primary">
            Taze kavrulmuş kahve
          </p>
          <h1 className="font-display text-4xl leading-none md:text-6xl">
            {category.name}
          </h1>
          {intro ? (
            looksLikeHtml(intro) ? (
              <div
                className="prose-blog mt-6 max-w-3xl space-y-4 font-sans text-base leading-7 text-secondary [&_a]:text-primary [&_a]:underline [&_p]:mb-0"
                dangerouslySetInnerHTML={{ __html: intro }}
              />
            ) : (
              <div className="mt-6 max-w-3xl space-y-4 font-sans text-base leading-7 text-secondary">
                {intro.split(/\n{2,}/).map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            )
          ) : null}
        </Reveal>
        {relatedBlog.items.length ? (
          <div className="mt-8 border-t border-outline-variant/15 pt-6">
            <p className="mb-3 font-meta text-[10px] uppercase tracking-widest text-primary">
              Rehber yazıları
            </p>
            <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {relatedBlog.items.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="font-meta text-xs uppercase tracking-wide text-secondary hover:text-primary"
                  >
                    {post.title} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <Suspense
        fallback={
          <div className="page-shell py-24 font-meta text-sm uppercase text-secondary">
            Katalog yükleniyor…
          </div>
        }
      >
        <ProductsCatalog hideHeading />
      </Suspense>
    </>
  );
}
