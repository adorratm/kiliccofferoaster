import { useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { AccountStackParamList } from '../../navigation/types';
import { EmptyState } from '../../components/shop/EmptyState';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { StatusBadge } from '../../components/shop/StatusBadge';
import { shopTrack } from '../../lib/shop-api';
import type { TrackingResult } from '../../lib/shop-types';
import { btnGhost, btnGhostText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'TrackingResult'>;

export function TrackingResultScreen({ navigation, route }: Props) {
  const { kod } = route.params;
  const [data, setData] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await shopTrack(kod);
      setData(result);
      navigation.setOptions({ title: kod });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Takip bulunamadı');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [kod, navigation]);

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
      <PageHeader kicker="Kargo" heading="Takip" subtitle={kod} />
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {data ? (
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 16,
          }}
        >
          <StatusBadge status={data.status} kind="shipment" />
          {data.provider ? <Text style={[muted, { marginTop: 10 }]}>{data.provider}</Text> : null}
          {data.order?.orderNumber ? (
            <Text style={{ color: colors.text, marginTop: 8 }}>Sipariş {data.order.orderNumber}</Text>
          ) : null}
          {data.trackingUrl ? (
            <Pressable onPress={() => void Linking.openURL(data.trackingUrl!)} style={btnGhost}>
              <Text style={btnGhostText}>Kargo sitesinde aç</Text>
            </Pressable>
          ) : null}
        </View>
      ) : !error ? (
        <EmptyState icon="truck" title="Kayıt yok" body="Takip kodunu kontrol edin." />
      ) : null}
      {data?.events?.map((ev, i) => (
        <View
          key={`${ev.at || i}-${ev.description}`}
          style={{
            marginTop: 10,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            backgroundColor: colors.surface,
            padding: 14,
            flexDirection: 'row',
          }}
        >
          <View style={{ width: 10, alignItems: 'center', marginRight: 12, paddingTop: 4 }}>
            <View style={{ width: 8, height: 8, backgroundColor: colors.accent }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text }}>{ev.description}</Text>
            <Text style={[muted, { marginTop: 4 }]}>{[ev.at, ev.location].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
