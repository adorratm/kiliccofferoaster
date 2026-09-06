# App Store / Google Play — inceleme notları

Mağaza Console’a / App Review Notes alanına yapıştırılacak metin.

---

## App Store Connect — Resolution Center + Notes (2.1 Information Needed)

Aynı metni **Resolution Center → Reply** ve **App Review Information → Notes** alanına yapıştırın. Ekran kaydını Reply’e ekleyin veya Notes’ta link verin.

```
1) Screen recording: Please see the attached / linked recording from a physical iPhone on the latest iOS. Flow shown: launch → browse products → add to cart → login → checkout (PayTR hosted payment for physical goods) → account deletion.

2) Purpose: Specialty coffee e-commerce for Kılıç Coffee Roaster (Torbalı / İzmir, Turkey). Customers order physical roasted coffee and related pantry goods for delivery or store pickup. Target audience: coffee consumers in Turkey. Value: order, track, and manage purchases from the roasting company.

3) Setup / access:
Demo account (customer only — no staff/admin role):
Email: review@apple.com
Password: 123456789

Path: Products → Add to cart → Checkout (shipping address or store pickup) → accept legal checkboxes → PayTR payment page.
Account deletion: Account tab → Hesabı sil (confirm twice).
Staff/ops menus are hidden for this customer demo account. Tab bar shows only Shop / Cart / Account.

4) External services:
- Backend API: https://api.kiliccoffeeroaster.com.tr
- Website: https://kiliccoffeeroaster.com.tr
- Payments: PayTR hosted payment page (Safari View Controller / Custom Tabs). Physical goods only — Guideline 3.1.3(e); we do NOT use Apple In-App Purchase. No digital unlocks, coins, or subscriptions. iyzico is a fallback payment provider if configured.

5) Account deletion: Signed-in customers can delete their account from Account → Hesabı sil. This permanently removes the customer account via DELETE /auth/me. Staff/employee accounts cannot be deleted from the customer UI.

6) Regional: The store ships / serves customers in Turkey. Content and checkout are primarily in Turkish. No region-locked features beyond shipping availability in Turkey.

Product reviews (UGC): Customer reviews are published only after staff moderation. There is no open chat or unmoderated UGC feed.
```

---

## Review Notes (İngilizce — kısa özet / App Review Information)

```
This app sells physical specialty coffee (and related pantry goods) for delivery or store pickup in Turkey. It is a retail e-commerce client, not a digital content or subscription unlock app.

Payments: Checkout uses an external payment provider (PayTR; iyzico as fallback) inside a secure HTTPS hosted payment page. We do NOT use Apple In-App Purchase because Guideline 3.1.3(e) requires non-IAP purchase methods for physical goods consumed outside the app. There are no digital unlocks, coins, or subscriptions.

Staff panel: A staff/ops tab appears only after signing in with an employee account (roles: admin, staff, accountant). Customer demo accounts never see staff menus. Please use the customer test account below for review.

Photo library permission: Used only by authenticated staff when uploading product images in the catalog admin screens. Customers are not prompted for gallery access during shopping.

Demo account (customer only — no staff role):
Email: review@apple.com
Password: 123456789

Test path: Browse products → Add to cart → Checkout (address or store pickup) → Accept legal checkboxes → Pay with PayTR test card per merchant sandbox.
Account deletion: Account → Hesabı sil.
Privacy: https://kiliccoffeeroaster.com.tr/gizlilik
Support: https://kiliccoffeeroaster.com.tr/iletisim
```

---

## İnceleme notları (Türkçe — Play Console)

```
Uygulama Torbalı / İzmir merkezli specialty kahve ve fiziksel ürün satışı içindir (kargo veya mağazadan teslim). Dijital içerik, abonelik veya uygulama içi kilit açma yoktur.

Ödeme: Fiziksel ürün kuralları gereği Google Play Billing / IAP kullanılmaz. Ödeme PayTR (yedek: iyzico) güvenli ödeme sayfası ile yapılır.

Personel paneli: Yalnızca çalışan hesaplarında (admin / staff / accountant) görünür. İnceleme için yalnızca müşteri hesabı kullanın; personel menüleri açılmaz.

Galeri izni: Sadece personel ürün görseli yüklerken istenir; müşteri alışveriş akışında istenmez.

Test hesabı (yalnızca müşteri):
E-posta: review@apple.com
Şifre: 123456789

Akış: Ürünler → Sepet → Teslimat / pickup → Yasal onaylar → PayTR test ödeme.
Hesap silme: Hesabım → Hesabı sil.
Gizlilik: https://kiliccoffeeroaster.com.tr/gizlilik
Destek: https://kiliccoffeeroaster.com.tr/iletisim
```

---

## Gönderim öncesi kontrol listesi

### Apple 2.1 — sizin yapmanız gerekenler

- [ ] Fiziksel iPhone’da TestFlight kaydı: launch → ürün → sepet → giriş → checkout (PayTR) → Hesabı sil
- [ ] Resolution Center’da Reply + ekran kaydı ekle
- [ ] App Review Information → Notes alanına yukarıdaki 2.1 metnini yapıştır
- [ ] Demo hesap gerçekten var ve yalnızca `customer` rolünde (`review@apple.com` / `123456789` — admin panelinden doğrula; şifre farklıysa Notes’u güncelle)
- [ ] Privacy URL Cloudflare bot challenge’sız açılıyor: https://kiliccoffeeroaster.com.tr/gizlilik
- [ ] Support URL açılıyor: https://kiliccoffeeroaster.com.tr/iletisim
- [ ] Production / review build’de mock ödeme kapalı (`PAYTR_*` canlı veya sandbox bilinçli)
- [ ] Hesap silme müşteri hesabında çalışıyor
- [ ] Screenshot’lar gerçek mağaza akışı (katalog, ürün, sepet, hesap — sadece splash değil)
- [ ] Personel sekmesi gizli: demo ile giriş → tab bar’da yalnızca Mağaza / Sepet / Hesap
- [ ] Klavye düzeltmesi için yeni native build (Android `softwareKeyboardLayoutMode: resize`) önerilir; ardından resubmit

### Genel

- [ ] Store açıklamasında fiziksel ürün + kargo vurgusu; IAP / dijital unlock vaadi yok
