import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Field } from './Field';
import { SectionLabel } from './SectionLabel';
import { getShopToken } from '../../lib/api';
import { shopCreateReview, shopProductReviews } from '../../lib/shop-api';
import type { ProductReview } from '../../lib/shop-types';
import { btnGhost, btnGhostText, colors, muted } from '../../ui';

export function ProductReviews({
  productId,
  slug,
  onNeedLogin,
}: {
  productId: string;
  slug: string;
  onNeedLogin: () => void;
}) {
  const [items, setItems] = useState<ProductReview[]>([]);
  const [avg, setAvg] = useState('');
  const [count, setCount] = useState(0);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await shopProductReviews(slug);
      setItems(res.items || []);
      setAvg(res.ratingAvg || '');
      setCount(res.ratingCount || 0);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  async function submit() {
    setMsg('');
    const token = await getShopToken();
    if (!token) {
      onNeedLogin();
      return;
    }
    if (body.trim().length < 10) {
      setMsg('Yorum en az 10 karakter olmalı.');
      return;
    }
    setBusy(true);
    try {
      await shopCreateReview({
        productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });
      setTitle('');
      setBody('');
      setMsg('Yorumunuz incelemeye gönderildi.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ marginTop: 28 }}>
      <SectionLabel label="Yorumlar" />
      {count > 0 ? (
        <Text style={[muted, { marginTop: 4 }]}>
          {Number(avg).toFixed(1)} / 5 · {count} değerlendirme
        </Text>
      ) : (
        <Text style={[muted, { marginTop: 4 }]}>Henüz onaylı yorum yok.</Text>
      )}
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            padding: 14,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={{ color: colors.accentSoft, fontSize: 12, letterSpacing: 1 }}>
            {'★'.repeat(item.rating)}{'☆'.repeat(Math.max(0, 5 - item.rating))}
          </Text>
          <Text style={{ color: colors.text, marginTop: 6, fontWeight: '600' }}>
            {item.authorName}
            {item.title ? ` · ${item.title}` : ''}
          </Text>
          <Text style={[muted, { marginTop: 6, lineHeight: 20 }]}>{item.body}</Text>
        </View>
      ))}

      <Text style={{ color: colors.text, marginTop: 20, fontWeight: '600' }}>Yorum yaz</Text>
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={{ fontSize: 20, color: n <= rating ? colors.accentSoft : colors.muted }}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
      <Field title="Başlık (opsiyonel)" value={title} onChangeText={setTitle} placeholder="Kısaca" />
      <Field
        title="Yorum"
        value={body}
        onChangeText={setBody}
        placeholder="En az 10 karakter"
        multiline
      />
      {msg ? (
        <Text style={{ color: msg.includes('gönderildi') ? colors.success : colors.danger, marginTop: 8 }}>
          {msg}
        </Text>
      ) : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btnGhost}>
        <Text style={btnGhostText}>{busy ? 'Gönderiliyor…' : 'Gönder'}</Text>
      </Pressable>
    </View>
  );
}
