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
import type { ShopStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { ScreenLoader } from '../../components/shop/ScreenLoader';
import { SectionLabel } from '../../components/shop/SectionLabel';
import { shopCmsSettings, shopContact } from '../../lib/shop-api';
import { DEFAULT_CONTACT, type SiteContact, type SiteSettings } from '../../lib/cms';
import { openShopWhatsApp } from '../../lib/whatsapp';
import { btn, btnText, colors, muted } from '../../ui';

type Props = NativeStackScreenProps<ShopStackParamList, 'Wholesale'>;

const REASONS = [
  'Taze kavrum · Torbalı / Ayrancılar atölye',
  'Espresso & filtre için profil seçenekleri',
  'Düzenli B2B teslimat',
];

export function WholesaleScreen(_props: Props) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [contact, setContact] = useState<SiteContact>(DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [form, setForm] = useState({
    senderName: '',
    senderEmail: '',
    message: '',
  });

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const cms = await shopCmsSettings();
          setSettings(cms);
          setContact({ ...DEFAULT_CONTACT, ...cms.contact });
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
    if (!form.senderName.trim() || !form.senderEmail.trim() || !form.message.trim()) {
      setStatus('err');
      return;
    }
    setBusy(true);
    try {
      await shopContact({
        ...form,
        protocolType: 'wholesale',
      });
      setStatus('ok');
      setForm({ senderName: '', senderEmail: '', message: '' });
    } catch {
      setStatus('err');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <ScreenLoader />;

  const brandName = settings.brand?.name || 'Kılıç Coffee Roaster';
  const tel = contact.phone.replace(/\s/g, '');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader
        kicker="B2B · Supply"
        heading="Toptan kahve tedariki"
        subtitle="Cafe, restoran, otel ve ofisler için Ayrancılar’da kavrulan specialty kahve. Düzenli tedarik için yazın."
      />

      <Pressable
        onPress={() =>
          openShopWhatsApp(
            settings,
            `Merhaba, ${brandName} toptan / işletme kahve tedariki hakkında yazıyorum.`,
          )
        }
        style={[btn, { marginTop: 8 }]}
      >
        <Text style={btnText}>WhatsApp ile yaz</Text>
      </Pressable>

      <SectionLabel index="01" label="Neden biz?" />
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.borderMuted,
          backgroundColor: colors.surface,
          padding: 16,
          marginTop: 8,
        }}
      >
        {REASONS.map((line) => (
          <Text key={line} style={[muted, { marginTop: 8, lineHeight: 20, fontSize: 13 }]}>
            · {line}
          </Text>
        ))}
        {contact.phone ? (
          <Pressable
            onPress={() => void Linking.openURL(`tel:${tel}`)}
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: colors.accentSoft, fontWeight: '600' }}>
              Tel · {contact.phone}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <SectionLabel index="02" label="Talep formu" />
      <Field
        title="İşletme / ad soyad"
        value={form.senderName}
        onChangeText={(senderName) => setForm((f) => ({ ...f, senderName }))}
      />
      <Field
        title="E-posta"
        value={form.senderEmail}
        onChangeText={(senderEmail) => setForm((f) => ({ ...f, senderEmail }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        title="Talep"
        value={form.message}
        onChangeText={(message) => setForm((f) => ({ ...f, message }))}
        multiline
        placeholder="Aylık kg, demleme tipi…"
      />
      {status === 'ok' ? (
        <Text style={{ color: colors.success, marginTop: 10 }}>
          Talebiniz alındı. En kısa sürede dönüş yapacağız.
        </Text>
      ) : null}
      {status === 'err' ? (
        <Text style={{ color: colors.danger, marginTop: 10 }}>
          Gönderim başarısız. WhatsApp’tan yazabilirsiniz.
        </Text>
      ) : null}
      <Pressable onPress={() => void submit()} disabled={busy} style={btn}>
        <Text style={btnText}>{busy ? 'Gönderiliyor…' : 'Toptan talep gönder'}</Text>
      </Pressable>
    </ScrollView>
  );
}
