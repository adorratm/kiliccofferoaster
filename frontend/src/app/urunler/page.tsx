"use client";

import { Suspense } from "react";
import ProductsCatalog from "./ProductsCatalog";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell py-24 font-meta text-sm uppercase text-secondary">
          Katalog yükleniyor…
        </div>
      }
    >
      <ProductsCatalog />
    </Suspense>
  );
}
