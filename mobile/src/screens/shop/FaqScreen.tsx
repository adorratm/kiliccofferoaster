import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { ShopStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { shopCmsSections } from '../../lib/shop-api';
import { sectionContent } from '../../lib/cms';
import { btnGhost, btnGhostText, colors, muted } from '../../ui';

const FALLBACK = {
  title: 'Sıkça Sorulan Sorular',
  items: [
    {
      question: 'Kahveler ne sıklıkla kavruluyor?',
      answer:
        'Sipariş ve taze stok dengesi için batch bazlı kavrum yapıyoruz. Çekirdekler mümkün olduğunca taze kavrulmuş olarak gönderilir.',
    },
    {
      question: 'Öğütülmüş kahve sipariş edebilir miyim?',
      answer:
        'Varsayılan ürünlerimiz çekirdek olarak sunulur. Öğütme tercihinizi sipariş notunda belirtirseniz uygun öğütmeye göre hazırlarız.',
    },
    {
      question: 'Kargo süresi ne kadar?',
      answer:
        'Ödeme onayı sonrası siparişler genellikle 1–3 iş günü içinde kargoya verilir.',
    },
  ],
};

type FaqItem = { question: string; answer: string };
type Props = NativeStackScreenProps<ShopStackParamList, 'Faq'>;

export function FaqScreen({ navigation }: Props) {
  const [titleText, setTitleText] = useState(FALLBACK.title);
  const [items, setItems] = useState<FaqItem[]>(FALLBACK.items);
  const [open, setOpen] = useState<string | null>(FALLBACK.items[0]?.question ?? null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const sections = await shopCmsSections('home');
      const faq = sectionContent(sections, 'faq', FALLBACK);
      setTitleText(faq.title || FALLBACK.title);
      const next = (faq.items || []).filter(
        (item) => item?.question?.trim() && item?.answer?.trim(),
      );
      setItems(next.length ? next : FALLBACK.items);
    } catch {
      setItems(FALLBACK.items);
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => void load()} tintColor={colors.accent} />
      }
    >
      <PageHeader kicker="Destek" heading={titleText} subtitle="Kavrum, öğütme ve kargo." />
      {items.map((item, i) => {
        const expanded = open === item.question;
        return (
          <Pressable
            key={item.question}
            onPress={() => setOpen(expanded ? null : item.question)}
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: expanded ? colors.border : colors.borderMuted,
              backgroundColor: colors.surface,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ color: colors.accentSoft, fontSize: 10, letterSpacing: 1.6, marginRight: 10, marginTop: 3 }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', flex: 1, lineHeight: 22 }}>
                {item.question}
              </Text>
              <Feather name={expanded ? 'minus' : 'plus'} size={16} color={colors.muted} />
            </View>
            {expanded ? (
              <Text style={[muted, { marginTop: 12, fontSize: 14, lineHeight: 22, marginLeft: 28 }]}>
                {item.answer}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      <Pressable onPress={() => navigation.navigate('Contact')} style={btnGhost}>
        <Text style={btnGhostText}>Sorunuz mu var?</Text>
      </Pressable>
    </ScrollView>
  );
}
