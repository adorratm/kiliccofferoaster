import { useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { ShopStackParamList } from '../../navigation/types';
import { Chip } from '../../components/shop/Chip';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { shopCmsSettings, shopContact } from '../../lib/shop-api';
import { DEFAULT_CONTACT, type SiteContact } from '../../lib/cms';
import { SHOP_URL } from '../../lib/api';
import { btn, btnText, colors, muted } from '../../ui';

const PROTOCOLS = [
  { value: 'general', label: 'Genel' },
  { value: 'wholesale', label: 'Toptan' },
  { value: 'logistics', label: 'Lojistik' },
  { value: 'technical', label: 'Teknik' },
];

type Props = NativeStackScreenProps<ShopStackParamList, 'Contact'>;

export function ContactScreen({ navigation }: Props) {
  const [contact, setContact] = useState<SiteContact>(DEFAULT_CONTACT);
  const [reviewUrl, setReviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [form, setForm] = useState({
    senderName: '',
    senderEmail: '',
    protocolType: 'general',
    message: '',
  });

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const settings = await shopCmsSettings();
          setContact({ ...DEFAULT_CONTACT, ...settings.contact });
          const social = (settings as { social?: { googleReviewUrl?: string } })
            .social;
          setReviewUrl(social?.googleReviewUrl?.trim() || '');
        } catch {
          /* varsayılan */
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  async function submit() {
    setStatus('idle');
    setBusy(true);
    try {
      await shopContact(form);
      setStatus('ok');
      setForm({ senderName: '', senderEmail: '', protocolType: 'general', message: '' });
    } catch {
      setStatus('err');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <ScreenLoader />;

  const tel = contact.phone.replace(/\s/g, '');
  const waDigits = tel.replace(/\D/g, '').replace(/^0/, '90');
  const waUrl = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
        'Merhaba, Kılıç Coffee Roaster hakkında yazıyorum.',
      )}`
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader kicker="Atölye" heading="İletişim" subtitle={contact.locationLabel} />

      <View
        style={{
          borderWidth: 1,
          borderColor: colors.borderMuted,
          backgroundColor: colors.surface,
          padding: 16,
        }}
      >
        {contact.address ? (
          <InfoRow icon="map-pin" text={contact.address} />
        ) : null}
        {contact.hours ? <InfoRow icon="clock" text={contact.hours} /> : null}
        {contact.phone ? (
          <Pressable onPress={() => void Linking.openURL(`tel:${tel}`)}>
            <InfoRow icon="phone" text={contact.phone} accent />
          </Pressable>
        ) : null}
        {contact.email ? (
          <Pressable onPress={() => void Linking.openURL(`mailto:${contact.email}`)}>
            <InfoRow icon="mail" text={contact.email} accent />
          </Pressable>
        ) : null}
        {waUrl ? (
          <Pressable onPress={() => void Linking.openURL(waUrl)}>
            <InfoRow icon="message-circle" text="WhatsApp ile yaz" accent />
          </Pressable>
        ) : null}
        {reviewUrl ? (
          <Pressable onPress={() => void Linking.openURL(reviewUrl)}>
            <InfoRow icon="star" text="Google’da değerlendir" accent />
          </Pressable>
        ) : (
          <Pressable onPress={() => void Linking.openURL(`${SHOP_URL}/yorum`)}>
            <InfoRow icon="star" text="Google yorum sayfası" accent />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() =>
          navigation.navigate('ShopWeb', { path: '/toptan', title: 'Toptan' })
        }
        style={[btn, { marginTop: 16, backgroundColor: colors.surface }]}
      >
        <Text style={[btnText, { color: colors.accentSoft }]}>Toptan / B2B talep</Text>
      </Pressable>

      <SectionLabel index="01" label="Mesaj" />
      <Field title="Ad soyad" value={form.senderName} onChangeText={(senderName) => setForm((f) => ({ ...f, senderName }))} />
      <Field
        title="E-posta"
        value={form.senderEmail}
        onChangeText={(senderEmail) => setForm((f) => ({ ...f, senderEmail }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {PROTOCOLS.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            selected={form.protocolType === p.value}
            onPress={() => setForm((f) => ({ ...f, protocolType: p.value }))}
          />
        ))}
      </View>
      <Field
        title="Mesaj"
        value={form.message}
        onChangeText={(message) => setForm((f) => ({ ...f, message }))}
        multiline
        placeholder="Nasıl yardımcı olalım?"
      />
      {status === 'ok' ? (
        <Text style={{ color: colors.success, marginTop: 10 }}>Mesaj alındı.</Text>
      ) : null}
      {status === 'err' ? (
        <Text style={{ color: colors.danger, marginTop: 10 }}>Gönderilemedi.</Text>
      ) : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
        <Text style={btnText}>{busy ? 'Gönderiliyor…' : 'Gönder'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  text,
  accent,
}: {
  icon: 'map-pin' | 'clock' | 'phone' | 'mail' | 'message-circle' | 'star';
  text: string;
  accent?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 10, alignItems: 'flex-start' }}>
      <Feather name={icon} size={14} color={accent ? colors.accentSoft : colors.muted} style={{ marginTop: 3, marginRight: 10 }} />
      <Text style={accent ? { color: colors.accentSoft, flex: 1, lineHeight: 20 } : [muted, { flex: 1, lineHeight: 20, fontSize: 13 }]}>
        {text}
      </Text>
    </View>
  );
}
