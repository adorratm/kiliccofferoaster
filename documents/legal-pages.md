# Yasal sayfalar ve e-ticaret uyumu

Checkout’taki zorunlu onaylar [sepet-odeme.md](sepet-odeme.md) ile birlikte çalışır.

## Rotalar (frontend)

| Slug | Sayfa |
|------|-------|
| `kvkk` | KVKK |
| `cerez-politikasi` | Çerez politikası |
| `mesafeli-satis` | Mesafeli satış sözleşmesi |
| `on-bilgilendirme` | Ön bilgilendirme formu |
| `iptal-iade` | Cayma / iptal-iade |
| `aydinlatma-metni` | Aydınlatma metni |
| `gizlilik` | Gizlilik politikası |

İçerik `legal_documents` tablosunda versiyonlanır. Admin `/sozlesmeler` ile düzenler ve yayınlar. API: `GET /legal/:slug` en son yayınlanmış sürümü döner.

## Checkout zorunlulukları

Ödeme öncesi müşteri en az şu sözleşmeleri kabul etmelidir (checkbox + timestamp log):

- Mesafeli satış
- Ön bilgilendirme

Kabul kaydı siparişin `legal_acceptances` JSON alanında saklanır.

## Çerez

`CookieBanner` gerekli / analitik / pazarlama tercihlerini `POST /legal/cookie-consent` ile kaydeder.

Onay sonrası vitrin:

- Analytics → GA4 (`NEXT_PUBLIC_GA4_ID`) veya GTM (`NEXT_PUBLIC_GTM_ID`; doluysa GA4 script atlanır)
- Marketing → Meta Pixel (`NEXT_PUBLIC_META_PIXEL_ID`)
- Olaylar: ViewContent, AddToCart, BeginCheckout, Purchase

Smoke: [smoke-checklist.md](smoke-checklist.md) §5b.

## Checklist (canlı öncesi)

- [ ] Avukat / danışman onaylı sözleşme metinleri yüklenmiş
- [ ] Şirket unvanı, MERSİS, vergi no, adres (Torbalı) metinlerde doğru
- [ ] İade süreçleri ve süreler tutarlı
- [ ] Çerez banner’ı ilk ziyarette görünüyor
- [ ] KVKK aydınlatma linkleri footer’da
