# Akış şemaları

Tek bakışta sistem ve iş akışları. Her diyagramın altında kısa Türkçe özet ve ilgili belge linki vardır. Konu sayfalarında aynı diyagramın kısa hali de bulunur.

Proje tarihçesi: [asamalar.md](asamalar.md).

## 1. Sistem bağlamı

```mermaid
flowchart LR
  vitrin[Vitrin_3000] --> api[API_4000]
  admin[Admin_3001] --> api
  desktop[Desktop_Electron] --> api
  mobile[Mobile_Expo] --> api
  api --> pg[(PostgreSQL)]
  api --> redis[(Redis_BullMQ)]
  api --> paytr[PayTR_iyzico]
  api --> kargo[KargoAdaptörleri]
  api --> pazar[Trendyol_HB_N11]
```

Beş istemci tek NestJS API’ye bağlanır. Kaynak gerçekliği PostgreSQL’dir; kuyruklar Redis/BullMQ üzerindedir. Swagger: `http://localhost:4000/docs`.

İlgili: [architecture.md](architecture.md).

## 2. Müşteri satın alma

```mermaid
flowchart TD
  gezinme[Katalog_arama] --> sepet[Sepet]
  sepet --> checkout[POST_checkout]
  checkout --> pending[pending_payment]
  pending --> odeme[PayTR_veya_iyzico]
  odeme -->|basari| paid[paid_stok_bildirim]
  odeme -->|vazgec| sepet
  paid --> kargo[Admin_kargo]
  kargo --> takip[takip_kod]
```

Vitrin veya native mağaza: ürün → sepet (`X-Session-Id` veya JWT) → checkout (adres, kupon, yasal onay) → ödeme formu. Başarıda sipariş `paid`, sepet temizlenir, stok düşer. Başarısızlıkta sepet durur.

İlgili: [sepet-odeme.md](sepet-odeme.md), [payments-iyzico.md](payments-iyzico.md).

## 3. Auth

```mermaid
flowchart TD
  subgraph musteri [Musteri]
    email[email_sifre] --> jwt[JWT]
    google[Google_Facebook_Apple] --> jwt
  end
  subgraph adminPanel [Admin]
    gAdmin[Google_admin] --> allow[ADMIN_ALLOWLIST]
    allow --> jwtAdmin[JWT_role_admin]
  end
  subgraph personel [Personel]
    ops[POST_auth_ops_login] --> jwtOps[JWT_admin_staff_accountant]
  end
```

Müşteri vitrin/mobil mağazada e-posta veya OAuth kullanır. Admin panel yalnızca Google + allowlist. Masaüstü ve mobil personel `POST /auth/ops-login` (müşteri hesabı reddedilir).

İlgili: [auth.md](auth.md).

## 4. Ödeme

```mermaid
flowchart TD
  checkout[Checkout] --> provider{PAYMENT_PROVIDER}
  provider -->|paytr| paytrInit[PayTR_iframe]
  provider -->|iyzico| iyzicoInit[iyzico_CheckoutForm]
  provider -->|bos| auto{PayTR_keys}
  auto -->|var| paytrInit
  auto -->|yok| iyzicoInit
  paytrInit --> cb[callback]
  iyzicoInit --> cb
  cb -->|OK| fulfill[PAID_stok_kupon_sepet_bildirim]
  cb -->|fail| pending[pending_payment]
```

`GET /payments/provider` aktif sağlayıcıyı döner. Callback public’tir. Mock: anahtar yoksa UI uçtan uca test edilebilir. İade: admin `/iadeler` (PayTR keys varsa sağlayıcı iadesi).

İlgili: [payments-iyzico.md](payments-iyzico.md).

## 5. Sipariş yaşam döngüsü

```mermaid
stateDiagram-v2
  [*] --> pending_payment
  pending_payment --> paid: odeme_basarili
  pending_payment --> cancelled: vazgec_veya_timeout
  paid --> processing: ops
  processing --> shipped: kargo_etiket
  shipped --> delivered: takip_teslim
  paid --> cancelled: iptal_stok_iade
  processing --> cancelled: iptal_stok_iade
  paid --> refunded: iade
  processing --> refunded: iade
  shipped --> refunded: iade
```

Stok yalnızca ödeme onayında düşer (`stock_decremented`). `cancelled` / `refunded` stoku geri verir (çift iade yok). Pazaryeri siparişlerinde kargo oluşturma kullanılmaz.

İlgili: [sepet-odeme.md](sepet-odeme.md), [marketplace-adapters.md](marketplace-adapters.md).

## 6. Kargo ve takip

```mermaid
flowchart TD
  paid[Siparis_paid] --> admin[Admin_firma_sec]
  admin --> create[POST_shipping_shipments]
  create --> adapter[IShippingAdapter]
  adapter --> shipment[Shipment_tracking]
  shipment --> poll[BullMQ_shipping_poll]
  poll --> ws[SocketIO_tracking]
  shipment --> page["/takip/kod"]
```

Credentials yoksa mock takip no (production’da `SHIPPING_ALLOW_MOCK` kapalıysa hata). Müşteri vitrinde `/takip/[kod]`; canlı güncelleme WebSocket `/tracking`.

İlgili: [shipping-adapters.md](shipping-adapters.md), [kuyruklar.md](kuyruklar.md).

## 7. Pazaryeri

```mermaid
flowchart TD
  cron[BullMQ_marketplace_sync] --> adapter[Trendyol_HB_N11]
  adminUi[Admin_Senkronize] --> adapter
  adapter --> listings[listings_stok]
  adapter --> mOrders[marketplace_orders]
  mOrders --> import[ic_Order_Payment]
  import --> stock[stok_dusum]
  adapter -->|iptal| restock[stok_iade]
```

Otomatik sync `MARKETPLACE_SYNC_*`. Credentials yoksa mock. İç sipariş numarası örneği: `KLC-TY-20260716-0001`. Aktarılmamış kayıt Admin’den **İçe aktar**.

İlgili: [marketplace-adapters.md](marketplace-adapters.md).

## 8. Muhasebe ve e-belge

```mermaid
flowchart TD
  webOrder[Web_siparis] --> invoice[POST_invoices_from_order]
  invoice --> queue[QUEUE_EINVOICE]
  queue --> turkcell[Turkcell_veya_mock]
  cash[Kasa] --> paytrSync[POST_cash_sync_paytr]
  desktop[Desktop_Mobile] -->|offline| sqlite[SQLite_outbox]
  sqlite --> push[POST_sync_push]
  push --> pg[(PostgreSQL)]
  pg --> pull[GET_sync_pull]
```

Kaynak PostgreSQL’dir. Cihazlar SQLite outbox ile çevrimdışı çalışır. Web siparişinden fatura stoku tekrar düşmez. ÖKC CSV mali fiştir; aynı satış için e-arşiv kesilmez.

İlgili: [accounting.md](accounting.md).

## 9. Deploy

```mermaid
flowchart LR
  gh[GitHub_Actions] --> ssh[SSH_VPS]
  ssh --> script[deploy_deploy.sh]
  script --> compose[docker_compose_prod]
  compose --> fe[host_3200]
  compose --> ad[host_3201]
  compose --> api[host_3202]
  nginx[ttengamesstudio_nginx] --> fe
  nginx --> ad
  nginx --> api
```

Aynı VPS’te TTEN / portfolio ile port çakışması yok. DNS: `@`, `www`, `admin`, `api` → Cloudflare. SSL: `setup-server.sh` (certbot).

İlgili: [deployment-hetzner.md](deployment-hetzner.md), [deploy/README.md](../deploy/README.md).
