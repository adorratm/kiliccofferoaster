# Mimari

## Monorepo

Tek GitHub repository içinde üç uygulama:

| Paket | Klasör | Rol |
|-------|--------|-----|
| `@kilic/api` | `api/` | NestJS REST API |
| `@kilic/frontend` | `frontend/` | Müşteri vitrini (App Router) |
| `@kilic/admin` | `admin/` | Yönetim paneli |

Yarn workspaces kök `package.json` üzerinden yönetilir. Node ve Yarn sürümleri Volta ile pinlenir.

## Import kuralları

- API: `@entities/*`, `@modules/*`, `@common/*`, `@config/*`, `@database/*`, `@/*`
- Frontend / Admin: `@/*`
- Relative `../` import **kullanılmaz**

## Veri erişimi

TypeORM yalnızca **EntityManager** ile kullanılır:

```ts
constructor(@InjectEntityManager() private readonly em: EntityManager) {}
```

Repository pattern (`@InjectRepository`, custom Repository sınıfları) yasaktır.

## Modüller (API)

- `auth` — JWT, e-posta/şifre, Google / Facebook / Apple OAuth; admin Google allowlist
- `catalog` — kategori ve ürün
- `cart` — sepet (user veya `X-Session-Id`)
- `orders` — sipariş yaşam döngüsü
- `payments` — iyzico Checkout Form
- `shipping` — çoklu kargo adaptörleri
- `marketplace` — Trendyol / HB / N11 adaptörleri
- `legal` — sözleşme CMS + çerez onay logu
- `contact` — iletişim + bülten

## Ortam

Geliştirmede `synchronize: true` (NODE_ENV !== production). Production’da migrations zorunlu.

## Domain planı (Hetzner)

| Host | Servis |
|------|--------|
| `kiliccoffeeroaster.com.tr` | frontend :3000 |
| `admin.kiliccoffeeroaster.com.tr` | admin :3001 |
| `api.kiliccoffeeroaster.com.tr` | api :4000 |

Mevcut `emrekilic.web.tr` ve `ttengamesstudio.com.tr` host bloklarının yanına eklenir.
