"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { getOrderById } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/giris");
      return;
    }
    getOrderById(params.id, token)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="page-shell py-24 font-meta text-sm uppercase text-secondary animate-fade-up">
        Sipariş yükleniyor…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-shell py-24 page-enter">
        <p className="font-meta text-sm uppercase text-error">Sipariş bulunamadı.</p>
        <Link href="/hesabim" className="btn-ghost mt-8 inline-block px-8 py-4 text-xs">
          Hesaba Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell py-16 md:py-24">
      <div className="page-enter">
        <Link
          href="/hesabim"
          className="font-meta text-[11px] uppercase text-secondary hover:text-primary"
        >
          ← Hesabım
        </Link>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">
          {order.orderNumber}
        </h1>
        <p className="mt-2 font-meta text-xs uppercase text-primary">{order.status}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-8" variant="left">
          <section className="panel-motion industrial-border bg-surface-container-low p-6">
            <h2 className="mb-4 font-display text-2xl">Kalemler</h2>
            <div className="divide-y divide-outline-variant/20">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="row-motion flex justify-between gap-4 py-4 font-meta text-xs uppercase"
                >
                  <div>
                    <div className="text-on-surface">{item.productName}</div>
                    <div className="mt-1 text-secondary">
                      {item.variantLabel || "—"} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-primary">
                    {formatMoney(item.lineTotal, order.currency)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <aside className="space-y-6 lg:col-span-4">
          <Reveal variant="right" delay={60}>
            <div className="panel-motion industrial-border p-6 font-meta text-xs uppercase">
              <h3 className="mb-4 font-display text-xl normal-case tracking-normal">
                Tutar
              </h3>
              <div className="space-y-2 text-secondary">
                <div className="flex justify-between">
                  <span>Ara toplam</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo</span>
                  <span>{formatMoney(order.shippingFee, order.currency)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Toplam</span>
                  <span>{formatMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal variant="right" delay={120}>
            <div className="panel-motion industrial-border p-6 font-meta text-xs uppercase">
              <h3 className="mb-4 font-display text-xl normal-case tracking-normal">
                Teslimat
              </h3>
              <p className="text-secondary">
                {order.customerName}
                <br />
                {order.shippingAddress?.addressLine}
                <br />
                {order.shippingAddress?.district} / {order.shippingAddress?.city}
              </p>
              {order.shipments?.[0]?.trackingNumber ? (
                <Link
                  href={`/takip/${order.shipments[0].trackingNumber}`}
                  className="mt-4 inline-block text-primary underline"
                >
                  Kargo takibi
                </Link>
              ) : null}
            </div>
          </Reveal>

          <Reveal variant="right" delay={180}>
            <div className="panel-motion industrial-border p-6 font-meta text-xs uppercase">
              <h3 className="mb-4 font-display text-xl normal-case tracking-normal">
                Fatura
              </h3>
              <p className="text-secondary">
                {(order.billingAddress || order.shippingAddress)?.addressLine}
                <br />
                {(order.billingAddress || order.shippingAddress)?.district} /{" "}
                {(order.billingAddress || order.shippingAddress)?.city}
              </p>
            </div>
          </Reveal>
        </aside>
      </div>
    </div>
  );
}
