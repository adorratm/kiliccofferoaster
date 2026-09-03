import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Post = {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  excerpt?: string | null;
  relatedProductSlugs?: string[];
  relatedCategorySlugs?: string[];
};

export function BlogAdminScreen() {
  const [rows, setRows] = useState<Post[]>([]);
  const [titleText, setTitleText] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [relatedProducts, setRelatedProducts] = useState('');
  const [relatedCategories, setRelatedCategories] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api<unknown>(
        '/blog/admin/all?includeDrafts=true&limit=50&sort=updatedAt&order=desc',
      );
      setRows(asArray<Post>(data));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yazılar yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!titleText.trim()) return;
    const body = {
      title: titleText.trim(),
      slug:
        slug.trim() ||
        titleText
          .toLowerCase()
          .replace(/[^a-z0-9ğüşıöç\s-]/gi, '')
          .trim()
          .replace(/\s+/g, '-'),
      content: content.trim() || titleText.trim(),
      excerpt: content.trim().slice(0, 160) || null,
      relatedProductSlugs: relatedProducts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      relatedCategorySlugs: relatedCategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      isPublished: false,
      authorName: 'Kılıç Coffee Roaster',
    };
    try {
      await api('/blog', { method: 'POST', body });
      setTitleText('');
      setSlug('');
      setContent('');
      setRelatedProducts('');
      setRelatedCategories('');
      setMsg('Taslak oluşturuldu');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Oluşturulamadı');
    }
  }

  async function togglePublish(p: Post) {
    try {
      await api(`/blog/${p.id}`, {
        method: 'PATCH',
        body: { isPublished: !p.isPublished },
      });
      setMsg(p.isPublished ? 'Taslağa alındı' : 'Yayınlandı');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  async function remove(id: string) {
    try {
      await api(`/blog/${id}`, { method: 'DELETE' });
      setMsg('Silindi');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silinemedi');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Blog</Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      <Text style={[muted, { marginTop: 12 }]}>YENİ YAZI</Text>
      <TextInput
        value={titleText}
        onChangeText={setTitleText}
        placeholder="Başlık"
        placeholderTextColor={colors.muted}
        style={input}
      />
      <TextInput
        value={slug}
        onChangeText={setSlug}
        placeholder="Slug (opsiyonel)"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={input}
      />
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="İçerik"
        placeholderTextColor={colors.muted}
        multiline
        style={[input, { minHeight: 100 }]}
      />
      <TextInput
        value={relatedProducts}
        onChangeText={setRelatedProducts}
        placeholder="İlgili ürün slug’ları (virgülle)"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={input}
      />
      <TextInput
        value={relatedCategories}
        onChangeText={setRelatedCategories}
        placeholder="İlgili kategori slug’ları (virgülle)"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={input}
      />
      <Pressable onPress={() => void create()} style={btn}>
        <Text style={btnText}>Taslak oluştur</Text>
      </Pressable>

      {rows.map((p) => (
        <View key={p.id} style={card}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{p.title}</Text>
          <Text style={muted}>
            {p.slug} · {p.isPublished ? 'yayında' : 'taslak'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable
              onPress={() => void togglePublish(p)}
              style={[btn, { flex: 1, marginTop: 0 }]}
            >
              <Text style={btnText}>{p.isPublished ? 'Taslak' : 'Yayınla'}</Text>
            </Pressable>
            <Pressable
              onPress={() => void remove(p.id)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.danger,
                paddingVertical: 16,
              }}
            >
              <Text style={{ color: colors.danger, textAlign: 'center' }}>Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
