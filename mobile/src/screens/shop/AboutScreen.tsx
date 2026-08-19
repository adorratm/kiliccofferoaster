import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { ShopStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { shopCmsSections } from '../../lib/shop-api';
import { sectionContent } from '../../lib/cms';
import { btn, btnGhost, btnGhostText, btnText, colors, muted } from '../../ui';

const FALLBACK = {
  hero: {
    title: 'Hakkımızda',
    seoDescription:
      'Torbalı / İzmir’de batch bazlı specialty coffee kavurucusu.',
    imageUrl: '',
  },
  body: {
    titleLine1: 'Torbalı’dan',
    titleLine2: 'ölçülen kavrum',
    paragraphs: [
      'Kılıç Coffee Roaster, Ayrancılar / Torbalı merkezinde batch bazlı specialty coffee üretir. Her profil termal eğri, hava akışı ve drum hızı ile izlenir.',
      'Amacımız raflara stok kahve koymak değil; taze kavrulmuş, izlenebilir ve demlemeye hazır çekirdek sunmaktır.',
      'Atölyemizi ziyaret etmek veya toptan iş birliği için iletişime geçebilirsiniz.',
    ],
  },
  ethos: {
    eyebrow: 'The Roasting Ethos',
    quote: 'Metodoloji veriye dayanır. Her batch için tutarlılık ölçülür.',
  },
};

type Props = NativeStackScreenProps<ShopStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const [hero, setHero] = useState(FALLBACK.hero);
  const [body, setBody] = useState(FALLBACK.body);
  const [ethos, setEthos] = useState(FALLBACK.ethos);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const sections = await shopCmsSections('about');
      setHero(sectionContent(sections, 'hero', FALLBACK.hero));
      setBody(sectionContent(sections, 'body', FALLBACK.body));
      setEthos(sectionContent(sections, 'ethos', FALLBACK.ethos));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sayfa yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) return <ScreenLoader />;

  const paragraphs = Array.isArray(body.paragraphs)
    ? body.paragraphs.filter((p) => typeof p === 'string' && p.trim())
    : FALLBACK.body.paragraphs;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.accent} />
      }
    >
      <PageHeader
        kicker="Atölye"
        heading={hero.title || 'Hakkımızda'}
        subtitle={hero.seoDescription}
      />
      {hero.imageUrl ? (
        <Image
          source={{ uri: hero.imageUrl }}
          style={{ height: 200, marginTop: 8, backgroundColor: colors.surface }}
          resizeMode="cover"
        />
      ) : null}
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      <Text style={{ color: colors.text, marginTop: 24, fontSize: 24, fontWeight: '700', lineHeight: 30 }}>
        {body.titleLine1} {body.titleLine2}
      </Text>
      {paragraphs.map((p) => (
        <Text key={p} style={[muted, { marginTop: 14, fontSize: 14, lineHeight: 22 }]}>
          {p}
        </Text>
      ))}
      <View
        style={{
          marginTop: 28,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          paddingLeft: 14,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase' }}>
          {ethos.eyebrow}
        </Text>
        <Text style={{ color: colors.text, marginTop: 10, fontSize: 17, lineHeight: 26 }}>{ethos.quote}</Text>
      </View>
      <Pressable onPress={() => navigation.navigate('Contact')} style={btn}>
        <Text style={btnText}>İletişim</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('BlogList')} style={btnGhost}>
        <Text style={btnGhostText}>Blog</Text>
      </Pressable>
    </ScrollView>
  );
}
