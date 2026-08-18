"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isInAppShell } from "@/lib/downloads";

export function AppDownloadLink({ className }: { className?: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(isInAppShell());
  }, []);
  if (hidden) return null;
  return (
    <Link
      href="/indir"
      className={
        className ||
        "hidden font-meta text-xs uppercase tracking-widest text-secondary hover:text-primary lg:inline"
      }
    >
      Uygulamalar
    </Link>
  );
}
