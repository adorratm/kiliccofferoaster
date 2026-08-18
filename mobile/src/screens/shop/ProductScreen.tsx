import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ShopStackParamList } from '../../navigation/types';
import { useShopCart } from '../../lib/shop-cart';
import { shopAddCartItem, shopProduct, shopToggleWishlist } from '../../lib/shop-api';
import { getShopToken } from '../../lib/api';
import { formatMoney, productImage } from '../../lib/format';
import { GRIND_OPTIONS, type GrindValue } from '../../lib/grind';
import { btn, btnText, colors, muted } from '../../ui';
import type { Product, ProductVariant } from '../../lib/shop-types';

type Props = NativeStackScreenProps<ShopStackParamList, 'Product'>;

export function ProductScreen({ navigation, route }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [variantId, setVariantId] = useState<string | null>(null);
  const [grind, setGrind] = useState<GrindValue>('whole_bean');
  const [busy, setBusy] = useState(false);
  const cart = useShopCart();

  useEffect(() => {
    void shopProduct(route.params.slug)
      .then((p) => {
        setProduct(p);
        const first = (p.variants || []).find((v) => v.isActive !== false);
        setVariantId(first?.id ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ürün yok'));
  }, [route.params.slug]);

  const variants = useMemo(
    () => (product?.variants || []).filter((v) => v.isActive !== false),
    [product],
  );
  const selected: ProductVariant | undefined =
    variants.find((v) => v.id === variantId) || variants[0];
  const price = selected?.price ?? product?.salePrice ?? product?.basePrice;
  const stock = selected != null ? selected.stock : product?.stock ?? 0;
  const img = productImage(product?.gallery?.[0] || product?.imageUrl);

  async function add() {
    if (!product) return;
    setBusy(true);
    setMsg('');
    try {
      await shopAddCartItem({
        productId: product.id,
        variantId: selected?.id ?? null,
        grindOption: grind,
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

  if (!product && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ color: colors.danger }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {img ? (
        <Image source={{ uri: img }} style={{ width: '100%', height: 280 }} resizeMode="cover" />
      ) : (
        <View style={{ height: 180, backgroundColor: colors.border }} />
      )}
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '600' }}>{product.name}</Text>
        {product.campaignName ? (
          <Text style={[muted, { marginTop: 6 }]}>{product.campaignName}</Text>
        ) : null}
        <Text style={{ color: colors.accentSoft, fontSize: 20, marginTop: 8 }}>
          {formatMoney(price, product.currency)}
        </Text>
        {product.shortDescription ? (
          <Text style={{ color: colors.muted, marginTop: 12, lineHeight: 20 }}>
            {product.shortDescription}
          </Text>
        ) : null}
        {product.flavorNotes?.length ? (
          <Text style={[muted, { marginTop: 12 }]}>{product.flavorNotes.join(' · ')}</Text>
        ) : null}

        {variants.length > 1 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={muted}>GRAMAJ</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {variants.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setVariantId(v.id)}
                  style={{
                    marginRight: 8,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: variantId === v.id ? colors.accent : colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: colors.text }}>{v.weightLabel}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 16 }}>
          <Text style={muted}>ÖĞÜTME</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {GRIND_OPTIONS.map((g) => (
              <Pressable
                key={g.value}
                onPress={() => setGrind(g.value)}
                style={{
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: grind === g.value ? colors.accent : colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.text }}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[muted, { marginTop: 16 }]}>
          {stock > 0 ? `Stok: ${stock}` : 'Tükendi'}
        </Text>
        {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
        <Pressable
          onPress={() => void add()}
          disabled={busy || stock <= 0}
          style={[btn, { opacity: busy || stock <= 0 ? 0.5 : 1 }]}
        >
          <Text style={btnText}>{busy ? 'Ekleniyor…' : 'Sepete ekle'}</Text>
        </Pressable>
        <Pressable onPress={() => void fav()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.accentSoft, textAlign: 'center' }}>Favorilere ekle</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
