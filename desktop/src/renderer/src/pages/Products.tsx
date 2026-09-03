import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from '../components/Switch';
import { api, uploadMedia } from '../lib/api';
import { asBrewGuide } from '../lib/catalog-seo';
import { asArray, asPaged, formatMoney, inputClass, slugify } from '../lib/format';
import { sortByWeightLabel } from '../lib/weight-sort';

type Category = { id: string; name: string };

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
  { value: 'coffee_filter', label: 'Filtre Kahve' },
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
  const brew = asBrewGuide(p.brewGuide);
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
    brewMethod: brew?.method || '',
    brewGrind: brew?.grind || '',
    brewRatio: brew?.ratio || '',
    brewNotes: brew?.notes || '',
    storageNotes: p.storageNotes || '',
    isActive: p.isActive,
    isFeatured: Boolean(p.isFeatured),
    imageUrl: p.imageUrl || '',
    variants,
  };
}

function variantCount(p: Product): number {
  return p.variants?.length ?? 0;
}

export function ProductsPage() {
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteVariantIndex, setDeleteVariantIndex] = useState<number | null>(null);

  async function load() {
    const params = new URLSearchParams({
      limit: '100',
      includeInactive: 'true',
      sort: 'name',
      order: 'asc',
    });
    if (q.trim()) params.set('q', q.trim());
    const [products, cats] = await Promise.all([
      api<unknown>(`/products/admin/all?${params}`),
      api<unknown>('/categories/admin/all'),
    ]);
    setItems(asPaged<Product>(products).items);
    setCategories(asArray<Category>(cats));
  }

  useEffect(() => {
    void load().catch(() => setError('Ürünler yüklenemedi'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!routeId) {
      setEditId(null);
      setForm(emptyForm());
      return;
    }
    void (async () => {
      setError(null);
      let product: Product | undefined;
      try {
        product = await api<Product>(`/products/admin/${routeId}`);
      } catch {
        const data = await api<unknown>('/products/admin/all?limit=100&includeInactive=true');
        product = asPaged<Product>(data).items.find((p) => p.id === routeId);
      }
      if (cancelled) return;
      if (!product) {
        setError('Ürün bulunamadı');
        setEditId(null);
        setForm(emptyForm());
        return;
      }
      setEditId(product.id);
      setForm(formFromProduct(product));
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  function updateVariant(index: number, patch: Partial<VariantForm>) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[index] = { ...variants[index], ...patch };
      return { ...f, variants };
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const variants = form.variants
      .filter((v) => v.weightLabel.trim() && v.price.trim())
      .map((v, i) => ({
        ...(v.id ? { id: v.id } : {}),
        sku:
          v.sku.trim() ||
          `${slugify(form.name) || 'urun'}-${slugify(v.weightLabel) || i + 1}`.toUpperCase(),
        weightLabel: v.weightLabel.trim(),
        price: String(v.price),
        stock: Number(v.stock) || 0,
        isActive: v.isActive,
        barcode: v.barcode.trim() || null,
        expiresAt: v.expiresAt.trim() || null,
      }));
    const body = {
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
      if (editId) await api(`/products/${editId}`, { method: 'PATCH', body });
      else await api('/products', { method: 'POST', body });
      setForm(emptyForm());
      setEditId(null);
      if (routeId) navigate('/urunler');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt hatası');
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct() {
    if (!editId) return;
    try {
      await api(`/products/${editId}`, { method: 'DELETE' });
      setDeleteOpen(false);
      navigate('/urunler');
      await load();
    } catch (err) {
      setDeleteOpen(false);
      setError(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  const pendingVariant = deleteVariantIndex !== null ? form.variants[deleteVariantIndex] : null;

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3">
        <p className="mono text-[10px] uppercase tracking-[0.16em] text-muted">08 // Ürünler</p>
        <h1 className="mt-1 text-2xl font-semibold">Katalog</h1>
        <div className="mt-4 flex gap-2">
          <input
            placeholder="Ad, slug, SKU…"
            className={`${inputClass} mt-0`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load().catch(() => setError('Ürünler yüklenemedi'));
            }}
          />
          <button
            type="button"
            className="border border-border-muted px-4 py-2 text-sm"
            onClick={() => void load().catch(() => setError('Ürünler yüklenemedi'))}
          >
            Ara
          </button>
          <button
            type="button"
            className="bg-accent px-4 py-2 text-sm text-white"
            onClick={() => {
              setError(null);
              setEditId(null);
              setForm(emptyForm());
              if (routeId) navigate('/urunler');
            }}
          >
            Yeni
          </button>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border-muted text-left text-muted">
              <th className="py-2">Ad</th>
              <th>Varyant</th>
              <th>Fiyat</th>
              <th>Stok</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr
                key={p.id}
                className={`cursor-pointer border-b border-border-muted/40 hover:bg-surface ${
                  editId === p.id ? 'bg-surface' : ''
                }`}
                onClick={() => navigate(`/urunler/${p.id}`)}
              >
                <td className="py-2">
                  <div>{p.name}</div>
                  <div className="mono text-[10px] text-muted">{p.slug}</div>
                </td>
                <td className="text-muted">{variantCount(p) || '—'}</td>
                <td>{formatMoney(p.basePrice)}</td>
                <td>{p.stock}</td>
                <td>{p.isActive ? 'Aktif' : 'Pasif'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        onSubmit={onSubmit}
        className="col-span-2 max-h-[calc(100vh-8rem)] overflow-y-auto border border-border-muted bg-surface p-4"
      >
        <p className="mono text-[10px] uppercase text-muted">{editId ? 'Düzenle' : 'Yeni ürün'}</p>
        <input
          required
          placeholder="Ad"
          className={inputClass}
          value={form.name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              name: e.target.value,
              slug: editId ? f.slug : slugify(e.target.value),
            }))
          }
        />
        <input
          placeholder="Slug"
          className={inputClass}
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <textarea
          required
          placeholder="Açıklama (HTML H2/p kullanılabilir)"
          className={`${inputClass} min-h-32`}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <input
          placeholder="SEO başlık"
          className={inputClass}
          value={form.seoTitle}
          onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
        />
        <textarea
          placeholder="SEO açıklama"
          className={`${inputClass} min-h-20`}
          value={form.seoDescription}
          onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            placeholder="Kavrum tarihi"
            className={inputClass}
            value={form.roastedAt}
            onChange={(e) => setForm((f) => ({ ...f, roastedAt: e.target.value }))}
          />
          <input
            placeholder="Demleme yöntemi"
            className={inputClass}
            value={form.brewMethod}
            onChange={(e) => setForm((f) => ({ ...f, brewMethod: e.target.value }))}
          />
          <input
            placeholder="Öğütme önerisi"
            className={inputClass}
            value={form.brewGrind}
            onChange={(e) => setForm((f) => ({ ...f, brewGrind: e.target.value }))}
          />
          <input
            placeholder="Kahve / su oranı"
            className={inputClass}
            value={form.brewRatio}
            onChange={(e) => setForm((f) => ({ ...f, brewRatio: e.target.value }))}
          />
        </div>
        <input
          placeholder="Demleme notu"
          className={inputClass}
          value={form.brewNotes}
          onChange={(e) => setForm((f) => ({ ...f, brewNotes: e.target.value }))}
        />
        <textarea
          placeholder="Saklama"
          className={`${inputClass} min-h-20`}
          value={form.storageNotes}
          onChange={(e) => setForm((f) => ({ ...f, storageNotes: e.target.value }))}
        />
        <div className="space-y-2">
          <p className="mono text-[10px] uppercase text-muted">Kapak görseli</p>
          {form.imageUrl ? (
            <div className="relative inline-block">
              <img
                src={form.imageUrl}
                alt=""
                className="h-28 w-28 border border-border-muted object-cover"
              />
              <button
                type="button"
                className="absolute right-1 top-1 bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
              >
                Kaldır
              </button>
            </div>
          ) : null}
          <input
            type="file"
            accept="image/*"
            disabled={uploadingImage}
            className="block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingImage(true);
              setError(null);
              void uploadMedia(file, { folder: 'products' })
                .then((asset) => setForm((f) => ({ ...f, imageUrl: asset.url })))
                .catch((err) =>
                  setError(err instanceof Error ? err.message : 'Görsel yüklenemedi'),
                )
                .finally(() => {
                  setUploadingImage(false);
                  e.target.value = '';
                });
            }}
          />
          <input
            placeholder="veya görsel URL yapıştır"
            className={inputClass}
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          />
          {uploadingImage ? (
            <p className="text-xs text-muted">Görsel yükleniyor…</p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            placeholder="Fiyat"
            className={inputClass}
            value={form.basePrice}
            onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
          />
          <input
            placeholder="Toplam stok"
            className={inputClass}
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
          />
          <input
            placeholder="KDV %"
            className={inputClass}
            value={form.vatRate}
            onChange={(e) => setForm((f) => ({ ...f, vatRate: e.target.value }))}
          />
          <input
            placeholder="Barkod"
            className={inputClass}
            value={form.barcode}
            onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
          />
          <input
            type="date"
            placeholder="SKT"
            className={inputClass}
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
          />
          <select
            className={inputClass}
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
        <select
          className={inputClass}
          value={form.kind}
          onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        {form.kind.startsWith('coffee_') ? (
          <div className="mt-3 space-y-2 rounded border border-border-muted p-3">
            <p className="text-xs uppercase tracking-wide text-muted">
              Öğütme seçenekleri
            </p>
            <Switch
              id="product-whole-bean"
              checked={form.allowWholeBean}
              onChange={(checked) =>
                setForm((f) => ({ ...f, allowWholeBean: checked }))
              }
              label="Çekirdek"
              description="Mağazada çekirdek seçeneği sunulsun"
            />
            <Switch
              id="product-ground"
              checked={form.allowGround}
              onChange={(checked) =>
                setForm((f) => ({ ...f, allowGround: checked }))
              }
              label="Öğütülmüş"
              description="Mağazada öğütülmüş seçeneği sunulsun"
            />
          </div>
        ) : null}
        <select
          className={inputClass}
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
        >
          <option value="">Kategori yok</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Alerjenler (virgülle: fındık, süt)"
          className={inputClass}
          value={form.allergens}
          onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
        />
        <textarea
          placeholder="İçerik / bileşenler"
          className={`${inputClass} min-h-20`}
          value={form.ingredients}
          onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
        />
        <div className="mt-3 space-y-2">
          <Switch
            id="product-active"
            checked={form.isActive}
            onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            label="Aktif"
            description="Mağazada listelenir"
          />
          <Switch
            id="product-featured"
            checked={form.isFeatured}
            onChange={(checked) => setForm((f) => ({ ...f, isFeatured: checked }))}
            label="Öne çıkan"
          />
        </div>

        <div className="mt-4 border border-border-muted p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="mono text-[10px] uppercase text-muted">Varyantlar</p>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  variants: [
                    ...f.variants,
                    {
                      ...emptyVariant(),
                      sku: f.name ? `${slugify(f.name)}-${f.variants.length + 1}`.toUpperCase() : '',
                    },
                  ],
                }))
              }
            >
              + Varyant
            </button>
          </div>
          {form.variants.map((v, i) => (
            <div key={v.id || `new-${i}`} className="mt-2 border border-border-muted/60 p-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="SKU"
                  className={`${inputClass} mt-0 font-mono`}
                  value={v.sku}
                  onChange={(e) => updateVariant(i, { sku: e.target.value })}
                />
                <input
                  placeholder="250g"
                  className={`${inputClass} mt-0`}
                  value={v.weightLabel}
                  onChange={(e) => updateVariant(i, { weightLabel: e.target.value })}
                />
                <input
                  placeholder="Fiyat"
                  className={`${inputClass} mt-0`}
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: e.target.value })}
                />
                <input
                  placeholder="Stok"
                  className={`${inputClass} mt-0`}
                  value={v.stock}
                  onChange={(e) => updateVariant(i, { stock: e.target.value })}
                />
                <input
                  placeholder="Barkod"
                  className={`${inputClass} mt-0 font-mono`}
                  value={v.barcode}
                  onChange={(e) => updateVariant(i, { barcode: e.target.value })}
                />
                <input
                  type="date"
                  placeholder="SKT"
                  className={`${inputClass} mt-0`}
                  value={v.expiresAt}
                  onChange={(e) => updateVariant(i, { expiresAt: e.target.value })}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Switch
                  id={`variant-active-${i}`}
                  checked={v.isActive}
                  onChange={(isActive) => updateVariant(i, { isActive })}
                  label="Satışta"
                />
                <button
                  type="button"
                  disabled={form.variants.length <= 1}
                  onClick={() => setDeleteVariantIndex(i)}
                  className="text-xs text-danger hover:underline disabled:opacity-30"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={saving} className="bg-accent px-4 py-2 text-white disabled:opacity-50">
            {saving ? 'Kaydediliyor…' : editId ? 'Güncelle' : 'Oluştur'}
          </button>
          {editId ? (
            <>
              <button
                type="button"
                className="border border-border px-4 py-2"
                onClick={() => navigate('/urunler')}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="ml-auto text-sm text-danger hover:underline"
                onClick={() => setDeleteOpen(true)}
              >
                Sil
              </button>
            </>
          ) : null}
        </div>
      </form>

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
            variants:
              f.variants.length > 1
                ? f.variants.filter((_, idx) => idx !== deleteVariantIndex)
                : f.variants,
          }));
          setDeleteVariantIndex(null);
        }}
      />
    </div>
  );
}
