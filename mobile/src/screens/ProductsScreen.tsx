import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { RootStack } from '../../App';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from '../components/Switch';
import { api, asArray, uploadMedia } from '../lib/api';
import { sortByWeightLabel } from '../lib/weight-sort';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type ProductVariant = {
  id?: string;
  sku: string;
  weightLabel: string;
  price: string | number;
  stock: number;
  isActive?: boolean;
  barcode?: string | null;
  expiresAt?: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: string | number;
  stock: number;
  isActive: boolean;
  isFeatured?: boolean;
  categoryId?: string | null;
  kind?: string;
  allowWholeBean?: boolean;
  allowGround?: boolean;
  imageUrl?: string | null;
  unit?: string;
  vatRate?: string | number;
  barcode?: string | null;
  expiresAt?: string | null;
  allergens?: string[];
  ingredients?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  roastedAt?: string | null;
  brewGuide?: {
    method?: string;
    grind?: string;
    ratio?: string;
    notes?: string;
  } | null;
  storageNotes?: string | null;
  variants?: ProductVariant[];
};

type Category = { id: string; name: string };

type VariantForm = {
  id?: string;
  sku: string;
  weightLabel: string;
  price: string;
  stock: string;
  isActive: boolean;
  barcode: string;
  expiresAt: string;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  stock: string;
  categoryId: string;
  kind: string;
  allowWholeBean: boolean;
  allowGround: boolean;
  unit: string;
  vatRate: string;
  barcode: string;
  expiresAt: string;
  allergens: string;
  ingredients: string;
  seoTitle: string;
  seoDescription: string;
  roastedAt: string;
  brewMethod: string;
  brewGrind: string;
  brewRatio: string;
  brewNotes: string;
  storageNotes: string;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl: string;
  variants: VariantForm[];
};

const KINDS = [
  { value: 'coffee_turkish', label: 'Türk Kahvesi' },
  { value: 'coffee_filter', label: 'Filtre' },
  { value: 'coffee_espresso', label: 'Espresso' },
  { value: 'lokum', label: 'Lokum' },
  { value: 'draje', label: 'Draje' },
  { value: 'nuts', label: 'Kuruyemiş' },
  { value: 'herbal_tea', label: 'Bitki Çayı' },
  { value: 'spice', label: 'Baharat' },
  { value: 'beverage', label: 'Meşrubat' },
  { value: 'tea', label: 'Çay' },
  { value: 'other', label: 'Diğer' },
];

const UNITS = ['g', 'kg', 'adet', 'paket', 'lt'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyVariant(): VariantForm {
  return {
    sku: '',
    weightLabel: '250g',
    price: '',
    stock: '0',
    isActive: true,
    barcode: '',
    expiresAt: '',
  };
}

function emptyForm(): FormState {
  return {
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    stock: '0',
    categoryId: '',
    kind: 'other',
    allowWholeBean: true,
    allowGround: true,
    unit: 'adet',
    vatRate: '20',
    barcode: '',
    expiresAt: '',
    allergens: '',
    ingredients: '',
    seoTitle: '',
    seoDescription: '',
    roastedAt: '',
    brewMethod: '',
    brewGrind: '',
    brewRatio: '',
    brewNotes: '',
    storageNotes: '',
    isActive: true,
    isFeatured: false,
    imageUrl: '',
    variants: [emptyVariant()],
  };
}

function formFromProduct(p: Product): FormState {
  const variants =
    p.variants && p.variants.length
      ? sortByWeightLabel(p.variants).map((v) => ({
          id: v.id,
          sku: v.sku || '',
          weightLabel: v.weightLabel || '',
          price: String(v.price ?? ''),
          stock: String(v.stock ?? 0),
          isActive: v.isActive !== false,
          barcode: v.barcode || '',
          expiresAt: v.expiresAt ? String(v.expiresAt).slice(0, 10) : '',
        }))
      : [emptyVariant()];
  return {
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    basePrice: String(p.basePrice ?? ''),
    stock: String(p.stock ?? 0),
    categoryId: p.categoryId || '',
    kind: p.kind || 'other',
    allowWholeBean: p.allowWholeBean !== false,
    allowGround: p.allowGround !== false,
    unit: p.unit || 'adet',
    vatRate: String(p.vatRate ?? '20'),
    barcode: p.barcode || '',
    expiresAt: p.expiresAt ? String(p.expiresAt).slice(0, 10) : '',
    allergens: (p.allergens || []).join(', '),
    ingredients: p.ingredients || '',
    seoTitle: p.seoTitle || '',
    seoDescription: p.seoDescription || '',
    roastedAt: p.roastedAt ? String(p.roastedAt).slice(0, 10) : '',
    brewMethod: p.brewGuide?.method || '',
    brewGrind: p.brewGuide?.grind || '',
    brewRatio: p.brewGuide?.ratio || '',
    brewNotes: p.brewGuide?.notes || '',
    storageNotes: p.storageNotes || '',
    isActive: p.isActive,
    isFeatured: Boolean(p.isFeatured),
    imageUrl: p.imageUrl || '',
    variants,
  };
}

function variantSummary(p: Product): string {
  const rows = p.variants || [];
  if (!rows.length) return `stok ${p.stock}`;
  const labels = rows
    .slice(0, 3)
    .map((v) => `${v.weightLabel} ${v.price}₺`)
    .join(' · ');
  const extra = rows.length > 3 ? ` +${rows.length - 3}` : '';
  return `${rows.length} varyant · ${labels}${extra}`;
}

function ChoiceRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={muted}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={{
                borderWidth: 1,
                borderColor: on ? colors.accent : colors.border,
                backgroundColor: on ? colors.accent : colors.surface,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: on ? '#fff' : colors.text, fontSize: 12 }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ListProps = NativeStackScreenProps<RootStack, 'Products'>;

export function ProductsScreen({ navigation }: ListProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const qRef = useRef(q);
  qRef.current = q;

  async function load() {
    const params = new URLSearchParams({
      limit: '50',
      includeInactive: 'true',
      sort: 'name',
      order: 'asc',
    });
    if (qRef.current.trim()) params.set('q', qRef.current.trim());
    const data = await api<unknown>(`/products/admin/all?${params}`);
    setItems(asArray<Product>(data));
  }

  useEffect(() => {
    return navigation.addListener('focus', () => {
      void load().catch(() => setError('Ürünler yüklenemedi'));
    });
  }, [navigation]);

  return (
    <ScrollView style={screen} keyboardShouldPersistTaps="handled">
      <Text style={title}>Ürünler</Text>
      <TextInput
        placeholder="Ad, slug, SKU…"
        placeholderTextColor={colors.muted}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => void load().catch(() => setError('Ürünler yüklenemedi'))}
        autoCapitalize="none"
        style={input}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Pressable
          onPress={() => void load().catch(() => setError('Ürünler yüklenemedi'))}
          style={[btn, { flex: 1, marginTop: 0, backgroundColor: colors.border }]}
        >
          <Text style={btnText}>Ara</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('ProductEdit', {})}
          style={[btn, { flex: 1, marginTop: 0 }]}
        >
          <Text style={btnText}>Yeni ürün</Text>
        </Pressable>
      </View>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {items.map((p) => (
        <Pressable
          key={p.id}
          style={card}
          onPress={() => navigation.navigate('ProductEdit', { id: p.id })}
        >
          <Text style={{ color: colors.text }}>{p.name}</Text>
          <Text style={muted}>
            {p.basePrice} ₺ · {p.isActive ? 'aktif' : 'pasif'}
          </Text>
          <Text style={[muted, { marginTop: 4 }]}>{variantSummary(p)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

type EditProps = NativeStackScreenProps<RootStack, 'ProductEdit'>;

export function ProductEditScreen({ navigation, route }: EditProps) {
  const productId = route.params?.id;
  const [form, setForm] = useState<FormState>(emptyForm());
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteVariantIndex, setDeleteVariantIndex] = useState<number | null>(null);

  const heading = productId ? 'Ürünü düzenle' : 'Yeni ürün';

  useEffect(() => {
    navigation.setOptions({ title: heading });
  }, [heading, navigation]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      try {
        const cats = await api<unknown>('/categories/admin/all');
        if (!cancelled) setCategories(asArray<Category>(cats));
        if (productId) {
          let product: Product | undefined;
          try {
            product = await api<Product>(`/products/admin/${productId}`);
          } catch {
            const data = await api<unknown>('/products/admin/all?limit=100&includeInactive=true');
            product = asArray<Product>(data).find((p) => p.id === productId);
          }
          if (!product) throw new Error('Ürün bulunamadı');
          if (!cancelled) setForm(formFromProduct(product));
        } else {
          if (!cancelled) setForm(emptyForm());
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ürün yüklenemedi');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Kategori yok' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories],
  );

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[index] = { ...variants[index], ...patch };
      return { ...f, variants };
    });
  }

  async function save() {
    setError('');
    if (!form.name.trim() || !form.basePrice.trim()) {
      setError('Ad ve fiyat zorunlu');
      return;
    }
    const variants = form.variants
      .filter((v) => v.weightLabel.trim() && v.price.trim())
      .map((v, i) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: v.sku.trim() || `${slugify(form.name) || 'urun'}-${slugify(v.weightLabel) || i + 1}`.toUpperCase(),
        weightLabel: v.weightLabel.trim(),
        price: String(v.price),
        stock: Number(v.stock) || 0,
        isActive: v.isActive,
        barcode: v.barcode.trim() || null,
        expiresAt: v.expiresAt.trim() || null,
      }));
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || form.name.trim(),
      basePrice: String(form.basePrice),
      stock: Number(form.stock) || 0,
      categoryId: form.categoryId || null,
      kind: form.kind || 'other',
      allowWholeBean: form.allowWholeBean,
      allowGround: form.allowGround,
      unit: form.unit || 'adet',
      vatRate: Number(form.vatRate) || 20,
      barcode: form.barcode.trim() || null,
      expiresAt: form.expiresAt.trim() || null,
      allergens: form.allergens
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      ingredients: form.ingredients.trim() || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      roastedAt: form.roastedAt.trim() || null,
      brewGuide:
        form.brewMethod || form.brewGrind || form.brewRatio || form.brewNotes
          ? {
              method: form.brewMethod || undefined,
              grind: form.brewGrind || undefined,
              ratio: form.brewRatio || undefined,
              notes: form.brewNotes || undefined,
            }
          : null,
      storageNotes: form.storageNotes.trim() || null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      imageUrl: form.imageUrl.trim() || null,
      variants,
    };
    setSaving(true);
    try {
      if (productId) await api(`/products/${productId}`, { method: 'PATCH', body: payload });
      else await api('/products', { method: 'POST', body: payload });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kayıt hatası');
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct() {
    if (!productId) return;
    try {
      await api(`/products/${productId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      navigation.goBack();
    } catch (e) {
      setDeleteOpen(false);
      setError(e instanceof Error ? e.message : 'Silinemedi');
    }
  }

  const pendingVariant = deleteVariantIndex !== null ? form.variants[deleteVariantIndex] : null;

  async function pickImage() {
    setError('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Galeri izni gerekli');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingImage(true);
    try {
      const uploaded = await uploadMedia(
        {
          uri: asset.uri,
          name: asset.fileName || 'product.jpg',
          type: asset.mimeType || 'image/jpeg',
        },
        { folder: 'products' },
      );
      setForm((f) => ({ ...f, imageUrl: uploaded.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Görsel yüklenemedi');
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={screen} keyboardShouldPersistTaps="handled">
        <Text style={title}>{heading}</Text>
        <TextInput
          placeholder="Ad"
          placeholderTextColor={colors.muted}
          value={form.name}
          onChangeText={(name) =>
            setForm((f) => ({
              ...f,
              name,
              slug: productId ? f.slug : slugify(name),
            }))
          }
          style={input}
        />
        <TextInput
          placeholder="Slug"
          placeholderTextColor={colors.muted}
          value={form.slug}
          onChangeText={(slug) => setForm((f) => ({ ...f, slug }))}
          autoCapitalize="none"
          style={input}
        />
        <TextInput
          placeholder="Açıklama"
          placeholderTextColor={colors.muted}
          value={form.description}
          onChangeText={(description) => setForm((f) => ({ ...f, description }))}
          multiline
          style={[input, { minHeight: 88, textAlignVertical: 'top' }]}
        />
        <TextInput
          placeholder="SEO başlık"
          placeholderTextColor={colors.muted}
          value={form.seoTitle}
          onChangeText={(seoTitle) => setForm((f) => ({ ...f, seoTitle }))}
          style={input}
        />
        <TextInput
          placeholder="SEO açıklama"
          placeholderTextColor={colors.muted}
          value={form.seoDescription}
          onChangeText={(seoDescription) => setForm((f) => ({ ...f, seoDescription }))}
          multiline
          style={[input, { minHeight: 64, textAlignVertical: 'top' }]}
        />
        <TextInput
          placeholder="Kavrum tarihi (YYYY-MM-DD)"
          placeholderTextColor={colors.muted}
          value={form.roastedAt}
          onChangeText={(roastedAt) => setForm((f) => ({ ...f, roastedAt }))}
          autoCapitalize="none"
          style={input}
        />
        <TextInput
          placeholder="Demleme yöntemi"
          placeholderTextColor={colors.muted}
          value={form.brewMethod}
          onChangeText={(brewMethod) => setForm((f) => ({ ...f, brewMethod }))}
          style={input}
        />
        <TextInput
          placeholder="Öğütme önerisi"
          placeholderTextColor={colors.muted}
          value={form.brewGrind}
          onChangeText={(brewGrind) => setForm((f) => ({ ...f, brewGrind }))}
          style={input}
        />
        <TextInput
          placeholder="Kahve / su oranı"
          placeholderTextColor={colors.muted}
          value={form.brewRatio}
          onChangeText={(brewRatio) => setForm((f) => ({ ...f, brewRatio }))}
          style={input}
        />
        <TextInput
          placeholder="Demleme notu"
          placeholderTextColor={colors.muted}
          value={form.brewNotes}
          onChangeText={(brewNotes) => setForm((f) => ({ ...f, brewNotes }))}
          style={input}
        />
        <TextInput
          placeholder="Saklama"
          placeholderTextColor={colors.muted}
          value={form.storageNotes}
          onChangeText={(storageNotes) => setForm((f) => ({ ...f, storageNotes }))}
          multiline
          style={[input, { minHeight: 64, textAlignVertical: 'top' }]}
        />
        <Text style={[muted, { marginBottom: 8 }]}>Kapak görseli</Text>
        {form.imageUrl ? (
          <View style={{ marginBottom: 8 }}>
            <Image
              source={{ uri: form.imageUrl }}
              style={{ width: 112, height: 112, borderWidth: 1, borderColor: colors.border }}
            />
            <Pressable onPress={() => setForm((f) => ({ ...f, imageUrl: '' }))} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.danger, fontSize: 12 }}>Görseli kaldır</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          onPress={() => void pickImage()}
          disabled={uploadingImage}
          style={[btn, { opacity: uploadingImage ? 0.6 : 1, marginBottom: 8 }]}
        >
          <Text style={btnText}>
            {uploadingImage ? 'Yükleniyor…' : 'Galeriden görsel seç'}
          </Text>
        </Pressable>
        <TextInput
          placeholder="veya görsel URL"
          placeholderTextColor={colors.muted}
          value={form.imageUrl}
          onChangeText={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
          autoCapitalize="none"
          style={input}
        />
        <TextInput
          placeholder="Fiyat"
          placeholderTextColor={colors.muted}
          value={form.basePrice}
          onChangeText={(basePrice) => setForm((f) => ({ ...f, basePrice }))}
          keyboardType="decimal-pad"
          style={input}
        />
        <TextInput
          placeholder="Toplam stok"
          placeholderTextColor={colors.muted}
          value={form.stock}
          onChangeText={(stock) => setForm((f) => ({ ...f, stock }))}
          keyboardType="decimal-pad"
          style={input}
        />
        <TextInput
          placeholder="Barkod"
          placeholderTextColor={colors.muted}
          value={form.barcode}
          onChangeText={(barcode) => setForm((f) => ({ ...f, barcode }))}
          style={input}
        />
        <TextInput
          placeholder="SKT (YYYY-MM-DD)"
          placeholderTextColor={colors.muted}
          value={form.expiresAt}
          onChangeText={(expiresAt) => setForm((f) => ({ ...f, expiresAt }))}
          autoCapitalize="none"
          style={input}
        />
        <TextInput
          placeholder="Alerjenler (virgülle)"
          placeholderTextColor={colors.muted}
          value={form.allergens}
          onChangeText={(allergens) => setForm((f) => ({ ...f, allergens }))}
          style={input}
        />
        <TextInput
          placeholder="İçerik / bileşenler"
          placeholderTextColor={colors.muted}
          value={form.ingredients}
          onChangeText={(ingredients) => setForm((f) => ({ ...f, ingredients }))}
          multiline
          style={[input, { minHeight: 72, textAlignVertical: 'top' }]}
        />
        <TextInput
          placeholder="KDV %"
          placeholderTextColor={colors.muted}
          value={form.vatRate}
          onChangeText={(vatRate) => setForm((f) => ({ ...f, vatRate }))}
          keyboardType="decimal-pad"
          style={input}
        />
        <ChoiceRow
          label="Kategori"
          value={form.categoryId}
          options={categoryOptions}
          onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))}
        />
        <ChoiceRow
          label="Tür"
          value={form.kind}
          options={KINDS}
          onChange={(kind) => setForm((f) => ({ ...f, kind }))}
        />
        {form.kind.startsWith('coffee_') ? (
          <View style={{ marginTop: 14, gap: 12 }}>
            <Text style={{ color: colors.muted, fontSize: 12, textTransform: 'uppercase' }}>
              Öğütme seçenekleri
            </Text>
            <Switch
              checked={form.allowWholeBean}
              label="Çekirdek"
              onChange={(allowWholeBean) =>
                setForm((f) => ({ ...f, allowWholeBean }))
              }
            />
            <Switch
              checked={form.allowGround}
              label="Öğütülmüş"
              onChange={(allowGround) =>
                setForm((f) => ({ ...f, allowGround }))
              }
            />
          </View>
        ) : null}
        <ChoiceRow
          label="Birim"
          value={form.unit}
          options={UNITS.map((unit) => ({ value: unit, label: unit }))}
          onChange={(unit) => setForm((f) => ({ ...f, unit }))}
        />
        <View style={{ marginTop: 14, gap: 12 }}>
          <Switch
            checked={form.isActive}
            label="Aktif (mağazada görünür)"
            onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
          />
          <Switch
            checked={form.isFeatured}
            label="Öne çıkan"
            onChange={(isFeatured) => setForm((f) => ({ ...f, isFeatured }))}
          />
        </View>

        <View style={[card, { paddingBottom: 8 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text }}>Varyantlar</Text>
            <Pressable
              onPress={() =>
                setForm((f) => ({
                  ...f,
                  variants: [
                    ...f.variants,
                    {
                      ...emptyVariant(),
                      sku: f.name
                        ? `${slugify(f.name)}-${f.variants.length + 1}`.toUpperCase()
                        : '',
                    },
                  ],
                }))
              }
            >
              <Text style={{ color: colors.accentSoft }}>+ Varyant</Text>
            </Pressable>
          </View>
          {form.variants.map((v, i) => (
            <View
              key={v.id || `new-${i}`}
              style={{
                marginTop: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
              }}
            >
              <Text style={muted}>
                {v.weightLabel || `Varyant ${i + 1}`}
                {v.id ? '' : ' · yeni'}
              </Text>
              <TextInput
                placeholder="SKU"
                placeholderTextColor={colors.muted}
                value={v.sku}
                onChangeText={(sku) => updateVariant(i, { sku })}
                autoCapitalize="characters"
                style={input}
              />
              <TextInput
                placeholder="Ağırlık / etiket (250g)"
                placeholderTextColor={colors.muted}
                value={v.weightLabel}
                onChangeText={(weightLabel) => updateVariant(i, { weightLabel })}
                style={input}
              />
              <TextInput
                placeholder="Fiyat"
                placeholderTextColor={colors.muted}
                value={v.price}
                onChangeText={(price) => updateVariant(i, { price })}
                keyboardType="decimal-pad"
                style={input}
              />
              <TextInput
                placeholder="Stok"
                placeholderTextColor={colors.muted}
                value={v.stock}
                onChangeText={(stock) => updateVariant(i, { stock })}
                keyboardType="decimal-pad"
                style={input}
              />
              <TextInput
                placeholder="Barkod"
                placeholderTextColor={colors.muted}
                value={v.barcode}
                onChangeText={(barcode) => updateVariant(i, { barcode })}
                style={input}
              />
              <TextInput
                placeholder="SKT (YYYY-MM-DD)"
                placeholderTextColor={colors.muted}
                value={v.expiresAt}
                onChangeText={(expiresAt) => updateVariant(i, { expiresAt })}
                autoCapitalize="none"
                style={input}
              />
              <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Switch
                  checked={v.isActive}
                  label="Satışta"
                  onChange={(isActive) => updateVariant(i, { isActive })}
                />
                <Pressable
                  onPress={() => setDeleteVariantIndex(i)}
                  disabled={form.variants.length <= 1}
                >
                  <Text style={{ color: form.variants.length <= 1 ? colors.border : colors.danger }}>
                    Sil
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {error ? <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text> : null}
        <Pressable onPress={() => void save()} style={btn} disabled={saving}>
          <Text style={btnText}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[btn, { backgroundColor: colors.border }]}
        >
          <Text style={btnText}>Vazgeç</Text>
        </Pressable>
        {productId ? (
          <Pressable onPress={() => setDeleteOpen(true)} style={{ marginTop: 16, marginBottom: 32 }}>
            <Text style={{ color: colors.danger, textAlign: 'center' }}>Ürünü sil</Text>
          </Pressable>
        ) : (
          <View style={{ height: 32 }} />
        )}
      </ScrollView>

      <ConfirmDialog
        open={deleteOpen}
        title="Ürünü sil?"
        description="Katalogdan kaldırılır. Bu işlem geri alınamaz."
        confirmLabel="Ürünü sil"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void removeProduct()}
      />
      <ConfirmDialog
        open={deleteVariantIndex !== null}
        title="Varyantı sil?"
        description={
          pendingVariant
            ? `"${pendingVariant.weightLabel || pendingVariant.sku || 'Bu varyant'}" formdan kalkar. Kaydetmeden kalıcı olmaz.`
            : undefined
        }
        confirmLabel="Varyantı sil"
        onCancel={() => setDeleteVariantIndex(null)}
        onConfirm={() => {
          if (deleteVariantIndex === null) return;
          setForm((f) => ({
            ...f,
            variants: f.variants.length > 1 ? f.variants.filter((_, idx) => idx !== deleteVariantIndex) : f.variants,
          }));
          setDeleteVariantIndex(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
