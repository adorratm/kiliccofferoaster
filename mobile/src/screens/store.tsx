import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api, apiFormData, asArray } from '../lib/api';
import { formatMoney } from '../lib/format';
import { orderStatusLabel } from '../lib/order-status';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';
import { Switch } from '../components/Switch';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Category = { id: string; name: string; slug: string; isActive: boolean };
type Order = { id: string; orderNumber: string; status: string; customerName: string; total: string | number };
type ReturnReq = {
  id: string;
  type: string;
  status: string;
  reason: string;
  order?: { orderNumber: string; customerName: string };
};
type Coupon = { id: string; code: string; type: string; value: number; isActive: boolean };
type Campaign = { id: string; name: string; discountPercent: number; isActive: boolean };
type Review = { id: string; rating: number; body: string; title?: string | null; product?: { name: string } };
type Provider = { id: string; provider: string; displayName: string; isEnabled: boolean };
type Message = { id: string; name: string; email: string; message: string; isRead?: boolean };
type Sub = { id: string; email: string };

export function CategoriesScreen() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');

  async function load() {
    setItems(asArray<Category>(await api('/categories/admin/all')));
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await api('/categories', { method: 'POST', body: { name, slug, isActive: true } });
    setName('');
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Kategoriler</Text>
      <TextInput placeholder="Ad" placeholderTextColor={colors.muted} value={name} onChangeText={setName} style={input} />
      <Pressable onPress={() => void create()} style={btn}><Text style={btnText}>Oluştur</Text></Pressable>
      {items.map((c) => (
        <View key={c.id} style={card}>
          <Text style={{ color: colors.text }}>{c.name}</Text>
          <Text style={muted}>{c.slug}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

type OrderItem = {
  id: string;
  productName: string;
  variantLabel?: string | null;
  grindLabel?: string | null;
  quantity: number;
  unitPrice?: string | number;
  lineTotal?: string | number;
};

type OrderDetail = Order & {
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: string | number;
  shippingFee?: string | number;
  discountAmount?: string | number;
  shippingAddress?: Record<string, string>;
  shippingProvider?: string | null;
  notes?: string | null;
  items?: OrderItem[];
};

const STAFF_ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export function ShopOrdersScreen() {
  const [items, setItems] = useState<Order[]>([]);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<{
    id: string;
    invoiceNumber: string;
    edocumentType?: string;
    status: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [invoiceDocType, setInvoiceDocType] = useState<'earchive' | 'einvoice'>(
    'earchive',
  );
  const [invoiceFile, setInvoiceFile] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);
  const [invoiceEmailBusy, setInvoiceEmailBusy] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState('');

  async function load() {
    setItems(asArray<Order>(await api('/orders/admin/all?limit=40')));
  }
  useEffect(() => { void load(); }, []);

  async function open(id: string) {
    setSelected(await api<OrderDetail>(`/orders/${id}`));
    try {
      const inv = await api<{
        items?: Array<{
          id: string;
          invoiceNumber: string;
          edocumentType?: string;
          status: string;
        }>;
      }>(`/accounting/invoices?orderId=${id}&limit=1`);
      setLinkedInvoice(inv.items?.[0] ?? null);
      const row = inv.items?.[0];
      if (row?.invoiceNumber) {
        setInvoiceNumberInput(row.invoiceNumber);
        if (row.edocumentType === 'einvoice') setInvoiceDocType('einvoice');
      } else {
        setInvoiceNumberInput('');
        setInvoiceDocType('earchive');
      }
      setInvoiceFile(null);
      setInvoiceMsg('');
    } catch {
      setLinkedInvoice(null);
    }
  }

  async function setStatus(status: string) {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await api(`/orders/${selected.id}/status`, { method: 'PATCH', body: { status } });
      await open(selected.id);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function ensureReceipt() {
    if (!selected) return;
    try {
      const inv = await api<{
        id: string;
        invoiceNumber: string;
        edocumentType?: string;
        status: string;
      }>(`/accounting/invoices/from-order/${selected.id}`, { method: 'POST' });
      setLinkedInvoice(inv);
    } catch {
      /* ignore */
    }
  }

  async function pickInvoiceFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/zip',
        'application/pdf',
        'text/html',
        'text/xml',
        'application/xml',
        '*/*',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setInvoiceFile({
      uri: asset.uri,
      name: asset.name || 'fatura.zip',
      mimeType: asset.mimeType || undefined,
    });
  }

  async function sendInvoiceEmail() {
    if (!selected || !invoiceFile) {
      setInvoiceMsg('GİB ZIP, HTML, XML veya PDF seçin');
      return;
    }
    setInvoiceEmailBusy(true);
    setInvoiceMsg('');
    try {
      const form = new FormData();
      form.append('file', {
        uri: invoiceFile.uri,
        name: invoiceFile.name,
        type: invoiceFile.mimeType || 'application/octet-stream',
      } as unknown as Blob);
      if (invoiceNumberInput.trim()) {
        form.append('invoiceNumber', invoiceNumberInput.trim());
      }
      form.append('edocumentType', invoiceDocType);
      if (linkedInvoice?.id) form.append('invoiceId', linkedInvoice.id);
      await apiFormData(`/orders/${selected.id}/send-invoice-email`, form);
      setInvoiceMsg(`Gönderildi: ${selected.customerEmail}`);
      setInvoiceFile(null);
    } catch (e) {
      setInvoiceMsg(e instanceof Error ? e.message : 'Gönderilemedi');
    } finally {
      setInvoiceEmailBusy(false);
    }
  }

  const address = selected?.shippingAddress;

  return (
    <ScrollView style={screen}>
      <Text style={title}>Siparişler</Text>
      {items.map((o) => (
        <Pressable key={o.id} onPress={() => void open(o.id)} style={card}>
          <Text style={{ color: colors.accentSoft }}>{o.orderNumber}</Text>
          <Text style={{ color: colors.text }}>{o.customerName}</Text>
          <Text style={muted}>
            {orderStatusLabel(o.status)} · {formatMoney(o.total)}
          </Text>
        </Pressable>
      ))}
      {selected ? (
        <View style={[card, { marginTop: 8 }]}>
          <Text style={{ color: colors.accentSoft, fontSize: 12, letterSpacing: 1 }}>
            SİPARİŞ DETAYI
          </Text>
          <Text style={{ color: colors.text, fontSize: 18, marginTop: 6 }}>
            {selected.orderNumber}
          </Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>{selected.customerName}</Text>
          {selected.customerPhone ? (
            <Text style={muted}>{selected.customerPhone}</Text>
          ) : null}
          {selected.customerEmail ? (
            <Text style={muted}>{selected.customerEmail}</Text>
          ) : null}

          <Text style={{ color: colors.accentSoft, marginTop: 14, fontSize: 11, letterSpacing: 1 }}>
            ÜRÜNLER
          </Text>
          {(selected.items || []).map((item) => (
            <View
              key={item.id}
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: colors.borderMuted,
                padding: 10,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>{item.productName}</Text>
              <Text style={muted}>
                {[item.variantLabel, item.grindLabel].filter(Boolean).join(' · ')}
                {item.quantity ? ` · ${item.quantity} adet` : ''}
              </Text>
              <Text style={{ color: colors.accentSoft, marginTop: 4 }}>
                {formatMoney(item.lineTotal || item.unitPrice)}
              </Text>
            </View>
          ))}

          {address ? (
            <View style={{ marginTop: 14 }}>
              <Text style={{ color: colors.accentSoft, fontSize: 11, letterSpacing: 1 }}>
                TESLİMAT
              </Text>
              <Text style={[muted, { marginTop: 6, lineHeight: 20 }]}>
                {[
                  address.fullName,
                  address.addressLine || address.line1,
                  [address.district, address.city].filter(Boolean).join(' / '),
                  address.phone,
                ]
                  .filter(Boolean)
                  .join('\n')}
              </Text>
              {selected.shippingProvider ? (
                <Text style={[muted, { marginTop: 4 }]}>
                  Kargo: {selected.shippingProvider}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={{ marginTop: 14, gap: 4 }}>
            <Text style={muted}>Ara toplam · {formatMoney(selected.subtotal)}</Text>
            <Text style={muted}>Kargo · {formatMoney(selected.shippingFee)}</Text>
            {Number(selected.discountAmount) ? (
              <Text style={muted}>İndirim · −{formatMoney(selected.discountAmount)}</Text>
            ) : null}
            <Text style={{ color: colors.text, fontWeight: '600', marginTop: 4 }}>
              Toplam · {formatMoney(selected.total)}
            </Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.accentSoft, fontSize: 11, letterSpacing: 1 }}>
              SATIŞ FİŞİ
            </Text>
            {linkedInvoice ? (
              <Text style={[muted, { marginTop: 6 }]}>
                {linkedInvoice.invoiceNumber} ·{' '}
                {!linkedInvoice.edocumentType || linkedInvoice.edocumentType === 'none'
                  ? 'Fiş'
                  : linkedInvoice.edocumentType === 'einvoice'
                    ? 'e-Fatura'
                    : 'e-Arşiv'}{' '}
                · {linkedInvoice.status}
              </Text>
            ) : (
              <Pressable onPress={() => void ensureReceipt()} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.accentSoft }}>Fiş oluştur</Text>
              </Pressable>
            )}
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: colors.accentSoft, fontSize: 11, letterSpacing: 1 }}>
              E-ARŞIV MÜŞTERİYE GÖNDER
            </Text>
            <Text style={[muted, { marginTop: 6, lineHeight: 18 }]}>
              GİB ZIP yükleyin (içinden HTML/XML çıkarılır) veya ayırdığınız HTML/XML
              dosyasını seçin — sunucu PDF’e çevirip e-postalar.
              {selected.customerEmail ? `\nAlıcı: ${selected.customerEmail}` : ''}
            </Text>
            <TextInput
              value={invoiceNumberInput}
              onChangeText={setInvoiceNumberInput}
              placeholder="Fatura no (ZIP’ten otomatik de olabilir)"
              placeholderTextColor={colors.muted}
              style={[input, { marginTop: 8 }]}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {(['earchive', 'einvoice'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setInvoiceDocType(t)}
                  style={{
                    borderWidth: 1,
                    borderColor: invoiceDocType === t ? colors.accent : colors.borderMuted,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: invoiceDocType === t ? colors.accentSoft : colors.muted }}>
                    {t === 'earchive' ? 'e-Arşiv' : 'e-Fatura'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => void pickInvoiceFile()} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.accentSoft }}>
                {invoiceFile ? invoiceFile.name : 'Dosya seç (ZIP / HTML / XML / PDF)'}
              </Text>
            </Pressable>
            <Pressable
              disabled={invoiceEmailBusy || !invoiceFile}
              onPress={() => void sendInvoiceEmail()}
              style={[btn, { marginTop: 10, opacity: invoiceEmailBusy || !invoiceFile ? 0.5 : 1 }]}
            >
              <Text style={btnText}>
                {invoiceEmailBusy ? 'Gönderiliyor…' : 'Faturayı e-posta ile gönder'}
              </Text>
            </Pressable>
            {invoiceMsg ? (
              <Text style={[muted, { marginTop: 8 }]}>{invoiceMsg}</Text>
            ) : null}
          </View>

          <Text style={{ color: colors.accentSoft, marginTop: 16, fontSize: 11, letterSpacing: 1 }}>
            DURUM GÜNCELLE
          </Text>
          <Text style={[muted, { marginTop: 4, marginBottom: 8 }]}>
            Şu an: {orderStatusLabel(selected.status)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STAFF_ORDER_STATUSES.map((s) => {
              const active = selected.status === s;
              return (
                <Pressable
                  key={s}
                  disabled={saving || active}
                  onPress={() => void setStatus(s)}
                  style={{
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.borderMuted,
                    backgroundColor: active ? '#2a1a16' : 'transparent',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: active ? colors.accentSoft : colors.text, fontSize: 12 }}>
                    {orderStatusLabel(s)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => setSelected(null)} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.muted, textAlign: 'center' }}>Detayı kapat</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

export function ReturnsScreen() {
  const [items, setItems] = useState<ReturnReq[]>([]);
  const [pending, setPending] = useState<{ id: string; status: 'approved' | 'rejected' } | null>(null);
  useEffect(() => {
    void api('/orders/admin/return-requests?status=requested')
      .then((d) => setItems(asArray<ReturnReq>(d)));
  }, []);

  async function review() {
    if (!pending) return;
    await api(`/orders/admin/return-requests/${pending.id}`, {
      method: 'PATCH',
      body: { status: pending.status },
    });
    setItems((rows) => rows.filter((r) => r.id !== pending.id));
    setPending(null);
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>İadeler</Text>
      {items.map((r) => (
        <View key={r.id} style={card}>
          <Text style={{ color: colors.text }}>{r.order?.orderNumber} · {r.type}</Text>
          <Text style={muted}>{r.reason}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable onPress={() => setPending({ id: r.id, status: 'approved' })} style={[btn, { flex: 1, marginTop: 0 }]}>
              <Text style={btnText}>Onay</Text>
            </Pressable>
            <Pressable onPress={() => setPending({ id: r.id, status: 'rejected' })} style={[btn, { flex: 1, marginTop: 0, backgroundColor: colors.border }]}>
              <Text style={btnText}>Red</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.status === 'approved' ? 'Talebi onayla?' : 'Talebi reddet?'}
        confirmLabel={pending?.status === 'approved' ? 'Onayla' : 'Reddet'}
        danger={pending?.status === 'rejected'}
        onCancel={() => setPending(null)}
        onConfirm={() => void review()}
      />
    </ScrollView>
  );
}

export function CouponsScreen() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [value, setValue] = useState('10');
  const [pending, setPending] = useState<Coupon | null>(null);
  async function load() {
    setItems(asArray<Coupon>(await api('/coupons/admin/all')));
  }
  useEffect(() => {
    void load();
  }, []);

  async function create() {
    await api('/coupons', {
      method: 'POST',
      body: { code: code.toUpperCase(), type: 'percent', value: Number(value), isActive: true },
    });
    setCode('');
    await load();
  }

  async function applyToggle(c: Coupon) {
    await api(`/coupons/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } });
    setPending(null);
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Kuponlar</Text>
      <TextInput placeholder="Kod" placeholderTextColor={colors.muted} value={code} onChangeText={setCode} style={input} autoCapitalize="characters" />
      <TextInput placeholder="%" placeholderTextColor={colors.muted} value={value} onChangeText={setValue} style={input} keyboardType="number-pad" />
      <Pressable onPress={() => void create()} style={btn}><Text style={btnText}>Oluştur</Text></Pressable>
      {items.map((c) => (
        <View key={c.id} style={card}>
          <Text style={{ color: colors.text }}>{c.code}</Text>
          <Text style={muted}>{c.type} {c.value}</Text>
          <View style={{ marginTop: 10 }}>
            <Switch
              checked={c.isActive}
              label="Aktif"
              onChange={(next) => {
                if (c.isActive && !next) setPending(c);
                else void applyToggle(c);
              }}
            />
          </View>
        </View>
      ))}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Kuponu pasifleştir?"
        description={pending?.code}
        confirmLabel="Pasifleştir"
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void applyToggle(pending)}
      />
    </ScrollView>
  );
}

export function CampaignsScreen() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [pct, setPct] = useState('15');
  const [pending, setPending] = useState<Campaign | null>(null);
  async function load() {
    setItems(asArray<Campaign>(await api('/campaigns/admin/all')));
  }
  useEffect(() => {
    void load();
  }, []);

  async function create() {
    await api('/campaigns', {
      method: 'POST',
      body: { name, discountPercent: Number(pct), isActive: true },
    });
    setName('');
    await load();
  }

  async function applyToggle(c: Campaign) {
    await api(`/campaigns/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } });
    setPending(null);
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Kampanyalar</Text>
      <TextInput placeholder="Ad" placeholderTextColor={colors.muted} value={name} onChangeText={setName} style={input} />
      <TextInput placeholder="İndirim %" placeholderTextColor={colors.muted} value={pct} onChangeText={setPct} style={input} keyboardType="number-pad" />
      <Pressable onPress={() => void create()} style={btn}><Text style={btnText}>Oluştur</Text></Pressable>
      {items.map((c) => (
        <View key={c.id} style={card}>
          <Text style={{ color: colors.text }}>{c.name}</Text>
          <Text style={muted}>%{c.discountPercent}</Text>
          <View style={{ marginTop: 10 }}>
            <Switch
              checked={c.isActive}
              label="Aktif"
              onChange={(next) => {
                if (c.isActive && !next) setPending(c);
                else void applyToggle(c);
              }}
            />
          </View>
        </View>
      ))}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Kampanyayı pasifleştir?"
        description={pending?.name}
        confirmLabel="Pasifleştir"
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void applyToggle(pending)}
      />
    </ScrollView>
  );
}

export function ReviewsScreen() {
  const [items, setItems] = useState<Review[]>([]);
  const [pending, setPending] = useState<{ id: string; isApproved: boolean } | null>(null);
  async function load() {
    setItems(asArray<Review>(await api('/reviews/admin/all?status=pending&limit=40')));
  }
  useEffect(() => { void load(); }, []);

  async function moderate() {
    if (!pending) return;
    await api(`/reviews/${pending.id}/moderate`, { method: 'PATCH', body: { isApproved: pending.isApproved } });
    setPending(null);
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Yorumlar</Text>
      {items.map((r) => (
        <View key={r.id} style={card}>
          <Text style={{ color: colors.text }}>{r.product?.name || 'Ürün'} · {r.rating}/5</Text>
          <Text style={muted}>{r.body}</Text>
          <Pressable onPress={() => setPending({ id: r.id, isApproved: true })} style={btn}>
            <Text style={btnText}>Onayla</Text>
          </Pressable>
        </View>
      ))}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Yorumu yayınla?"
        confirmLabel="Yayınla"
        danger={false}
        onCancel={() => setPending(null)}
        onConfirm={() => void moderate()}
      />
    </ScrollView>
  );
}

export function ShippingScreen() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [pending, setPending] = useState<Provider | null>(null);
  async function load() {
    setRows(asArray<Provider>(await api('/shipping/providers')));
  }
  useEffect(() => { void load(); }, []);

  async function applyToggle(row: Provider) {
    await api(`/shipping/providers/${encodeURIComponent(row.provider)}`, {
      method: 'PATCH',
      body: { isEnabled: !row.isEnabled },
    });
    setPending(null);
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Kargo</Text>
      {rows.map((r) => (
        <View key={r.id} style={card}>
          <Text style={{ color: colors.text }}>{r.displayName}</Text>
          <View style={{ marginTop: 10 }}>
            <Switch
              checked={r.isEnabled}
              label="Açık"
              onChange={(next) => {
                if (r.isEnabled && !next) setPending(r);
                else void applyToggle(r);
              }}
            />
          </View>
        </View>
      ))}
      <ConfirmDialog
        open={Boolean(pending)}
        title="Kargo sağlayıcısını kapat?"
        description={pending?.displayName}
        confirmLabel="Kapat"
        onCancel={() => setPending(null)}
        onConfirm={() => pending && void applyToggle(pending)}
      />
    </ScrollView>
  );
}

export function MessagesScreen() {
  const [items, setItems] = useState<Message[]>([]);
  async function load() {
    setItems(asArray<Message>(await api('/contact/admin')));
  }
  useEffect(() => { void load(); }, []);

  async function mark(id: string) {
    await api(`/contact/admin/${id}/read`, { method: 'PATCH', body: { isRead: true } });
    await load();
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Mesajlar</Text>
      {items.map((m) => (
        <View key={m.id} style={card}>
          <Text style={{ color: colors.text }}>{m.name}</Text>
          <Text style={muted}>{m.email}</Text>
          <Text style={{ color: colors.muted, marginTop: 6 }}>{m.message}</Text>
          {!m.isRead ? (
            <Pressable onPress={() => void mark(m.id)} style={btn}><Text style={btnText}>Okundu</Text></Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

export function NewsletterScreen() {
  const [items, setItems] = useState<Sub[]>([]);
  useEffect(() => {
    void api('/newsletter/subscribers').then((d) => setItems(asArray<Sub>(d)));
  }, []);
  return (
    <ScrollView style={screen}>
      <Text style={title}>Bülten</Text>
      {items.map((s) => (
        <View key={s.id} style={card}>
          <Text style={{ color: colors.text }}>{s.email}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
