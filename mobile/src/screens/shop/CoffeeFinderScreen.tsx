import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { ShopStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { shopCmsSettings, shopProducts } from '../../lib/shop-api';
import { openShopWhatsApp } from '../../lib/whatsapp';
import type { Product } from '../../lib/shop-types';
import type { SiteSettings } from '../../lib/cms';
import { btn, btnText, colors, muted } from '../../ui';
import { ProductCard } from './ProductCard';

type Props = NativeStackScreenProps<ShopStackParamList, 'CoffeeFinder'>;

type Taste = 'bold' | 'balanced' | 'fruity' | 'chocolate';
type Method = 'espresso' | 'filter' | 'french' | 'moka' | 'turkish';
type Acidity = 'low' | 'medium' | 'high';

const TASTE: { id: Taste; label: string }[] = [
  { id: 'bold', label: 'Sert / yoğun' },
  { id: 'balanced', label: 'Dengeli' },
  { id: 'fruity', label: 'Meyvemsi' },
  { id: 'chocolate', label: 'Çikolatalı / fındıklı' },
];

const METHOD: { id: Method; label: string }[] = [
  { id: 'espresso', label: 'Espresso' },
  { id: 'filter', label: 'V60 / filtre' },
  { id: 'french', label: 'French Press' },
  { id: 'moka', label: 'Moka Pot' },
  { id: 'turkish', label: 'Türk kahvesi' },
];

const ACIDITY: { id: Acidity; label: string }[] = [
  { id: 'low', label: 'Düşük' },
  { id: 'medium', label: 'Orta' },
  { id: 'high', label: 'Yüksek' },
];

function scoreProduct(
  p: Product,
  taste: Taste,
  method: Method,
  acidity: Acidity,
): number {
  const notes = (p.flavorNotes || []).join(' ').toLocaleLowerCase('tr-TR');
  const roast = (p.roastLevel || '').toLocaleLowerCase('tr-TR');
  const name = `${p.name} ${p.shortDescription || ''}`.toLocaleLowerCase('tr-TR');
  const blob = `${notes} ${roast} ${name}`;
  let score = 0;

  if (taste === 'fruity' && /(meyve|berry|çilek|narenciye|floral|çiçek)/.test(blob))
    score += 3;
  if (taste === 'chocolate' && /(çikolata|kakao|fındık|karamel|nut)/.test(blob))
    score += 3;
  if (taste === 'bold' && /(dark|koyu|yoğun|bitter|espresso)/.test(blob)) score += 3;
  if (taste === 'balanced' && /(dengeli|balanced|yumuşak|smooth)/.test(blob))
    score += 2;

  if (method === 'espresso' && /(espresso|crema|yoğun)/.test(blob)) score += 2;
  if (method === 'filter' && /(filtre|v60|pour|aydınlık|floral)/.test(blob))
    score += 2;
  if (method === 'turkish' && /(türk|ince|fine)/.test(blob)) score += 2;
  if (method === 'french' && /(french|full|body)/.test(blob)) score += 1;
  if (method === 'moka' && /(moka|orta)/.test(blob)) score += 1;

  if (acidity === 'high' && /(asit|bright|narenciye|meyve)/.test(blob)) score += 2;
  if (acidity === 'low' && /(düşük asit|yumuşak|çikolata|fındık)/.test(blob))
    score += 2;
  if (acidity === 'medium') score += 1;

  if (p.isFeatured) score += 1;
  return score;
}

export function CoffeeFinderScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [taste, setTaste] = useState<Taste | null>(null);
  const [method, setMethod] = useState<Method | null>(null);
  const [acidity, setAcidity] = useState<Acidity | null>(null);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const [list, cms] = await Promise.all([
            shopProducts({ coffeeOnly: true, limit: 100 }),
            shopCmsSettings(),
          ]);
          setProducts(list.items);
          setSettings(cms);
        } catch {
          /* boş liste */
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const results = useMemo(() => {
    if (!taste || !method || !acidity) return [];
    return [...products]
      .map((p) => ({
        product: p,
        score: scoreProduct(p, taste, method, acidity),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.product);
  }, [products, taste, method, acidity]);

  const brandName = settings.brand?.name || 'Kılıç Coffee Roaster';

  function reset() {
    setStep(0);
    setTaste(null);
    setMethod(null);
    setAcidity(null);
  }

  if (loading) return <ScreenLoader />;

  const options = step === 0 ? TASTE : step === 1 ? METHOD : ACIDITY;
  const question =
    step === 0
      ? 'Nasıl içiyorsunuz?'
      : step === 1
        ? 'Nasıl demliyorsunuz?'
        : 'Asidite tercihiniz?';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      <PageHeader
        kicker="Finder · Protocol"
        heading="Sana uygun kahveyi bul"
        subtitle="Birkaç soruyla damak zevkinize ve demleme yönteminize uygun kavrum öneriyoruz."
      />

      {step < 3 ? (
        <View style={{ marginTop: 8 }}>
          <Text style={[muted, { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' }]}>
            Adım {step + 1} / 3
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: '700',
              marginTop: 8,
              textTransform: 'uppercase',
            }}
          >
            {question}
          </Text>
          <View style={{ marginTop: 16 }}>
            {options.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  if (step === 0) {
                    setTaste(opt.id as Taste);
                    setStep(1);
                  } else if (step === 1) {
                    setMethod(opt.id as Method);
                    setStep(2);
                  } else {
                    setAcidity(opt.id as Acidity);
                    setStep(3);
                  }
                }}
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.borderMuted,
                  backgroundColor: colors.surface,
                  paddingVertical: 16,
                  paddingHorizontal: 14,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    fontWeight: '600',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {step > 0 ? (
            <Pressable onPress={() => setStep((s) => s - 1)} style={{ marginTop: 16, paddingVertical: 12 }}>
              <Text style={{ color: colors.accentSoft, fontWeight: '600' }}>Geri</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ marginTop: 8 }}>
          <Text style={[muted, { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.accentSoft }]}>
            Öneri hazır
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: '700',
              marginTop: 8,
              textTransform: 'uppercase',
            }}
          >
            {results[0]
              ? `Sana ${results[0].name} öneriyoruz`
              : 'Koleksiyonu inceleyin'}
          </Text>
          <Text style={[muted, { marginTop: 8 }]}>
            {brandName} · tercihinize yakın kavrumlar
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            <Pressable onPress={reset} style={[btn, { flexGrow: 1, backgroundColor: colors.surface }]}>
              <Text style={[btnText, { color: colors.accentSoft }]}>Yeniden başla</Text>
            </Pressable>
            {results[0] ? (
              <Pressable
                onPress={() =>
                  openShopWhatsApp(
                    settings,
                    `Merhaba, kahve seçicide "${results[0].name}" önerildi. Bu kavrum hakkında danışmak istiyorum.`,
                  )
                }
                style={[btn, { flexGrow: 1 }]}
              >
                <Text style={btnText}>WhatsApp ile danış</Text>
              </Pressable>
            ) : null}
          </View>

          {results.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 16 }}>
              {results.map((p) => (
                <View key={p.id} style={{ width: '50%' }}>
                  <ProductCard
                    product={p}
                    onPress={() => navigation.navigate('Product', { slug: p.slug })}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 24 }}>
              <Text style={muted}>Aktif kahve ürünü bulunamadı.</Text>
              <Pressable
                onPress={() => navigation.navigate('Catalog', {})}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: colors.accentSoft, fontWeight: '600' }}>
                  Tüm kavrumlar
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
