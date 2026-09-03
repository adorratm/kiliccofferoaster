# App Store / Google Play — inceleme notları

Mağaza Console’a / App Review Notes alanına yapıştırılacak metin.

---

## Review Notes (İngilizce — App Store Connect)

```
This app sells physical specialty coffee (and related pantry goods) for delivery or store pickup in Turkey. It is a retail e-commerce client, not a digital content or subscription unlock app.

Payments: Checkout uses an external payment provider (PayTR; iyzico as fallback) inside a secure HTTPS WebView / hosted payment page. We do NOT use Apple In-App Purchase because Guideline 3.1.3(e) requires non-IAP purchase methods for physical goods consumed outside the app. There are no digital unlocks, coins, or subscriptions.

Staff panel: A staff/ops tab appears only after signing in with an employee account (roles: admin, staff, accountant). Customer demo accounts never see staff menus. Please use the customer test account below for review.

Photo library permission: Used only by authenticated staff when uploading product images in the catalog admin screens. Customers are not prompted for gallery access during shopping.

Demo account (customer only — no staff role):
Email: [REVIEW_EMAIL]
Password: [REVIEW_PASSWORD]

Test path: Browse products → Add to cart → Checkout (address or store pickup) → Accept legal checkboxes → Pay with PayTR test card per merchant sandbox.
Privacy: https://kiliccoffeeroaster.com.tr/gizlilik
Support: https://kiliccoffeeroaster.com.tr/iletisim
```

---

## İnceleme notları (Türkçe — Play Console)

```
Uygulama Torbalı / İzmir merkezli specialty kahve ve fiziksel ürün satışı içindir (kargo veya mağazadan teslim). Dijital içerik, abonelik veya uygulama içi kilit açma yoktur.

Ödeme: Fiziksel ürün kuralları gereği Google Play Billing / IAP kullanılmaz. Ödeme PayTR (yedek: iyzico) güvenli ödeme sayfası / WebView ile yapılır.

Personel paneli: Yalnızca çalışan hesaplarında (admin / staff / accountant) görünür. İnceleme için yalnızca müşteri hesabı kullanın; personel menüleri açılmaz.

Galeri izni: Sadece personel ürün görseli yüklerken istenir; müşteri alışveriş akışında istenmez.

Test hesabı (yalnızca müşteri):
E-posta: [REVIEW_EMAIL]
Şifre: [REVIEW_PASSWORD]

Akış: Ürünler → Sepet → Teslimat / pickup → Yasal onaylar → PayTR test ödeme.
Gizlilik: https://kiliccoffeeroaster.com.tr/gizlilik
Destek: https://kiliccoffeeroaster.com.tr/iletisim
```

---

## Gönderim öncesi kontrol listesi

- [ ] İnceleme hesabı **yalnızca müşteri** rolünde (ops rolü yok) — admin panelinden `customer` / mağaza kullanıcısı oluşturun; `admin` / `staff` / `accountant` vermeyin
- [ ] PayTR sandbox / test kartı Review Notes’ta veya destek e-postasında
- [ ] Production build’de mock ödeme kapalı (`PAYTR_*` canlı veya test bilinçli)
- [ ] Hesap silme müşteri hesabında çalışıyor (Apple)
- [ ] Privacy / Support URL erişilebilir
- [ ] Store açıklamasında fiziksel ürün + kargo vurgusu; IAP / dijital unlock vaadi yok
- [ ] Personel sekmesinin gizli olduğunu doğrulayın: inceleme hesabıyla giriş → tab bar’da yalnızca Mağaza / Sepet / Hesap
