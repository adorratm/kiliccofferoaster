import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import type { ShopStackParamList } from '../../navigation/types';
import { Chip } from '../../components/shop/Chip';
import { RemoteImage } from '../../components/shop/RemoteImage';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { ProductReviews } from '../../components/shop/ProductReviews';
import { useShopCart } from '../../lib/shop-cart';
import { shopAddCartItem, shopProduct, shopProducts, shopToggleWishlist } from '../../lib/shop-api';
import { getShopToken } from '../../lib/api';
import {
  asBrewGuide,
  formatRoastDate,
  looksLikeHtml,
  productKindLabel,
} from '../../lib/catalog-seo';
import { HtmlContent } from '../../components/HtmlContent';
import { formatMoney, stockQty } from '../../lib/format';
import { availableGrindOptions, type GrindValue } from '../../lib/grind';
import { sortByWeightLabel } from '../../lib/weight-sort';
import { productOrigin, roastLabel } from '../../lib/order-status';
import { btn, btnGhost, btnGhostText, btnText, colors, muted, price } from '../../ui';
import type { Product, ProductVariant } from '../../lib/shop-types';
import { ProductCard } from './ProductCard';

type Props = NativeStackScreenProps<ShopStackParamList, 'Product'>;

export function ProductScreen({ navigation, route }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [variantId, setVariantId] = useState<string | null>(null);
  const [grind, setGrind] = useState<GrindValue>('whole_bean');
  const [busy, setBusy] = useState(false);
  const cart = useShopCart();

  useEffect(() => {
    void shopProduct(route.params.slug)
      .then(async (p) => {
        setProduct(p);
        const active = sortByWeightLabel(
          (p.variants || []).filter((v) => v.isActive !== false),
        );
        const firstInStock = active.find((v) => stockQty(v.stock) > 0) ?? active[0];
        setVariantId(firstInStock?.id ?? null);
        const choices = availableGrindOptions(
          p.kind,
          p.allowWholeBean,
          p.allowGround,
        );
        if (choices[0]) setGrind(choices[0].value);
        if (p.category?.slug) {
          const page = await shopProducts({
            categorySlug: p.category.slug,
            limit: 8,
            sort: 'name',
            order: 'asc',
          }).catch(() => null);
          setRelated(
            (page?.items || []).filter((item) => item.slug !== p.slug).slice(0, 4),
          );
        } else {
          setRelated([]);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ürün yok'));
  }, [route.params.slug]);

  const variants = useMemo(
    () =>
      sortByWeightLabel(
        (product?.variants || []).filter((v) => v.isActive !== false),
      ),
    [product],
  );
  const grindChoices = useMemo(
    () =>
      availableGrindOptions(
        product?.kind,
        product?.allowWholeBean,
        product?.allowGround,
      ),
    [product?.kind, product?.allowWholeBean, product?.allowGround],
  );
  const selected: ProductVariant | undefined =
    variants.find((v) => v.id === variantId) || variants[0];
  const amount = selected?.price ?? product?.salePrice ?? product?.basePrice;
  const stock = selected ? stockQty(selected.stock) : stockQty(product?.stock);
  const origin = productOrigin(product?.originCountry, product?.originRegion);
  const roast = roastLabel(product?.roastLevel);
  const kindLabel = productKindLabel(product?.kind);
  const roastDate = formatRoastDate(product?.roastedAt);
  const brew = asBrewGuide(product?.brewGuide);
  const weights = (product?.variants || [])
    .filter((v) => v.isActive !== false)
    .map((v) => v.weightLabel)
    .filter(Boolean)
    .join(' · ');
  const specs = [
    ['Kahve türü', kindLabel],
    ['Menşei', origin],
    ['Rakım', product?.altitude],
    ['İşlem', product?.process],
    ['Çeşit', product?.varietal],
    ['Kavrum', roast],
    ['Kavrum tarihi', roastDate],
    ['Gramaj', weights || null],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const showGrindPicker = grindChoices.length > 0;
  const resolvedGrind =
    grindChoices.length > 0
      ? grindChoices.some((g) => g.value === grind)
        ? grind
        : grindChoices[0].value
      : null;

  async function add() {
    if (!product) return;
    setBusy(true);
    setMsg('');
    try {
      await shopAddCartItem({
        productId: product.id,
        variantId: selected?.id,
        grindOption: resolvedGrind,
        quantity: 1,
      });
      await cart.refresh();
      setMsg('Sepete eklendi');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Eklenemedi');
    } finally {
      setBusy(false);
    }
  }

  async function fav() {
    if (!product) return;
    const token = await getShopToken();
    if (!token) {
      navigation.getParent()?.navigate('AccountTab', {
        screen: 'ShopLogin',
      } as never);
      return;
    }
    try {
      await shopToggleWishlist(product.id);
      setMsg('Favoriler güncellendi');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Favori güncellenemedi');
    }
  }

  if (!product && !error) return <ScreenLoader />;

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ height: 320, backgroundColor: colors.surfaceHigh }}>
        <RemoteImage
          uri={product.gallery?.[0] || product.imageUrl}
          seed={product.slug}
          height={320}
        />
        {product.badge ? (
          <View
            style={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              backgroundColor: colors.accent,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {product.badge}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase' }}>
          {kindLabel || 'Taze kavrulmuş kahve'}
        </Text>
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 8, lineHeight: 32 }}>
          {product.name}
        </Text>
        {product.campaignName ? (
          <Text style={[muted, { marginTop: 8 }]}>{product.campaignName}</Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 12, gap: 10 }}>
          <Text style={[price, { fontSize: 22 }]}>{formatMoney(amount, product.currency)}</Text>
          {product.compareAtPrice && Number(product.compareAtPrice) > Number(amount) ? (
            <Text style={{ color: colors.muted, textDecorationLine: 'line-through' }}>
              {formatMoney(product.compareAtPrice, product.currency)}
            </Text>
          ) : null}
        </View>

        {specs.length ? (
          <View
            style={{
              marginTop: 18,
              borderWidth: 1,
              borderColor: colors.borderMuted,
              padding: 14,
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {specs.map(([label, value]) => (
              <View key={label} style={{ width: '50%', paddingVertical: 8, paddingRight: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                  {label}
                </Text>
                <Text style={{ color: colors.text, marginTop: 6 }}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {product.shortDescription ? (
          <Text style={{ color: colors.muted, marginTop: 16, lineHeight: 22, fontSize: 14 }}>
            {product.shortDescription}
          </Text>
        ) : null}

        {product.description ? (
          <View style={{ marginTop: 16 }}>
            {looksLikeHtml(product.description) ? (
              <HtmlContent html={product.description} />
            ) : (
              <Text style={{ color: colors.muted, lineHeight: 22, fontSize: 14 }}>
                {product.description}
              </Text>
            )}
          </View>
        ) : null}

        {brew ? (
          <View style={{ marginTop: 18, borderWidth: 1, borderColor: colors.borderMuted, padding: 14 }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>Demleme önerisi</Text>
            {brew.method ? <Text style={muted}>Yöntem: {brew.method}</Text> : null}
            {brew.grind ? <Text style={muted}>Öğütme: {brew.grind}</Text> : null}
            {brew.ratio ? <Text style={muted}>Oran: {brew.ratio}</Text> : null}
            {brew.notes ? (
              <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 20 }}>{brew.notes}</Text>
            ) : null}
          </View>
        ) : null}

        {product.storageNotes ? (
          <View style={{ marginTop: 12, borderWidth: 1, borderColor: colors.borderMuted, padding: 14 }}>
            <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>Saklama</Text>
            <Text style={{ color: colors.muted, lineHeight: 20 }}>{product.storageNotes}</Text>
          </View>
        ) : null}

        {product.category ? (
          <Pressable
            onPress={() =>
              navigation.navigate('Catalog', { categorySlug: product.category!.slug })
            }
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: colors.accentSoft, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {product.category.name} kategorisi →
            </Text>
          </Pressable>
        ) : null}

        {product.flavorNotes?.length ? (
          <>
            <SectionLabel label="Tat notları" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {product.flavorNotes.map((note) => (
                <View
                  key={note}
                  style={{
                    marginRight: 8,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: colors.accentSoft, fontSize: 11, letterSpacing: 0.6 }}>{note}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {variants.length ? (
          <View style={{ marginTop: 8 }}>
            <SectionLabel label="Gramaj" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {variants.map((v) => (
                <Chip
                  key={v.id}
                  label={stockQty(v.stock) > 0 ? v.weightLabel : `${v.weightLabel} · Yok`}
                  selected={variantId === v.id}
                  onPress={() => setVariantId(v.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {showGrindPicker ? (
          <View style={{ marginTop: 8 }}>
            <SectionLabel label="Öğütme" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {grindChoices.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  selected={grind === g.value}
                  onPress={() => setGrind(g.value)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[muted, { marginTop: 20 }]}>
          {stock > 0 ? `Stokta ${stock} adet` : 'Tükendi'}
        </Text>
        {msg ? (
          <Text style={{ color: msg.includes('Eklenemedi') || msg.includes('güncellenemedi') || msg.toLowerCase().includes('stok') ? colors.danger : colors.success, marginTop: 8 }}>
            {msg}
          </Text>
        ) : null}
        <Pressable
          onPress={() => void add()}
          disabled={busy || stock <= 0}
          style={[btn, { opacity: busy || stock <= 0 ? 0.5 : 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]}
        >
          <Feather name="shopping-bag" size={16} color="#fff" />
          <Text style={btnText}>{busy ? 'Ekleniyor…' : 'Sepete ekle'}</Text>
        </Pressable>
        <Pressable
          onPress={() => void fav()}
          style={[btnGhost, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]}
        >
          <Feather name="heart" size={16} color={colors.accentSoft} />
          <Text style={btnGhostText}>Favorilere ekle</Text>
        </Pressable>
        <ProductReviews
          productId={product.id}
          slug={product.slug}
          onNeedLogin={() =>
            navigation.getParent()?.navigate('AccountTab', {
              screen: 'ShopLogin',
            } as never)
          }
        />
        {related.length ? (
          <View style={{ marginTop: 24 }}>
            <SectionLabel label={product.category ? `${product.category.name} içinde` : 'İlgili kavrumlar'} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              {related.map((item) => (
                <View key={item.id} style={{ width: '50%' }}>
                  <ProductCard
                    product={item}
                    onPress={() => navigation.push('Product', { slug: item.slug })}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
