import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList, CartStackParamList } from '../../navigation/types';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { shopLegal } from '../../lib/shop-api';
import { HtmlContent } from '../../components/HtmlContent';
import { colors, muted } from '../../ui';

type Props =
  | NativeStackScreenProps<AccountStackParamList, 'Legal'>
  | NativeStackScreenProps<CartStackParamList, 'Legal'>;

export function LegalScreen({ navigation, route }: Props) {
  const { slug } = route.params;
  const [titleText, setTitleText] = useState('Belge');
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const doc = await shopLegal(slug);
      setTitleText(doc.title);
      setHtml(doc.content);
      navigation.setOptions({ title: doc.title });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belge yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [navigation, slug]);

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
    >
      <PageHeader kicker="Yasal" heading={titleText} />
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {html ? (
        <View
          style={{
            marginTop: 4,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            padding: 12,
          }}
        >
          <HtmlContent html={html} />
        </View>
      ) : !error ? (
        <Text style={[muted, { marginTop: 12 }]}>İçerik yok.</Text>
      ) : null}
    </ScrollView>
  );
}
