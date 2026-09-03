import Link from "next/link";

export type BreadcrumbItem = { name: string; path: string };

export function PageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-outline-variant/20 bg-surface-container-lowest"
    >
      <ol className="page-shell flex flex-wrap items-center gap-x-2 gap-y-1 py-3 font-meta text-[10px] uppercase tracking-widest text-secondary">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.path}-${item.name}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-outline-variant" aria-hidden>
                  /
                </span>
              ) : null}
              {last ? (
                <span className="text-on-surface">{item.name}</span>
              ) : (
                <Link
                  href={item.path}
                  className="transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
