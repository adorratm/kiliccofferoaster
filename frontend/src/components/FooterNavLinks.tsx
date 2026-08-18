"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isInAppShell } from "@/lib/downloads";

type Item = { href: string; label: string };

export function FooterNavLinks({
  items,
  className,
}: {
  items: Item[];
  className?: string;
}) {
  const [hideDownloads, setHideDownloads] = useState(false);
  useEffect(() => {
    setHideDownloads(isInAppShell());
  }, []);
  const visible = hideDownloads
    ? items.filter((item) => item.href !== "/indir")
    : items;

  return (
    <>
      {visible.map((item) => (
        <Link key={item.href} href={item.href} className={className}>
          {item.label}
        </Link>
      ))}
    </>
  );
}
