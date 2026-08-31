import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Settings = {
  companyTitle: string;
  vkn?: string | null;
  taxOffice?: string | null;
  address?: string | null;
  city?: string | null;
  earchivePrefix: string;
  einvoicePrefix: string;
  paytrCommissionRatePercent?: string | number;
};

const FIELDS = [
  ['companyTitle', 'Unvan'],
  ['vkn', 'VKN'],
  ['taxOffice', 'Vergi dairesi'],
  ['address', 'Adres'],
  ['city', 'Şehir'],
  ['earchivePrefix', 'e-Arşiv ön ek'],
  ['einvoicePrefix', 'e-Fatura ön ek'],
  ['paytrCommissionRatePercent', 'PayTR komisyon (%)'],
] as const;

export function SettingsScreen() {
  const [form, setForm] = useState<Settings | null>(null);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api<Settings>('/accounting/settings')
      .then(setForm)
      .catch(() =>
        setForm({
          companyTitle: '',
          earchivePrefix: '',
          einvoicePrefix: '',
        }),
      );
    void api<{ hasPassword?: boolean }>('/auth/me')
      .then((me) => setHasPassword(Boolean(me.hasPassword)))
      .catch(() => undefined);
  }, []);

  async function saveSettings() {
    if (!form) return;
    setSaving(true);
    setMsg('');
    try {
      const saved = await api<Settings>('/accounting/settings', {
        method: 'PATCH',
        body: form,
      });
      setForm(saved);
      setMsg('Firma ayarları kaydedildi');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setPwError('');
    setPwMsg('');
    if (newPassword.length < 8) {
      setPwError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (newPassword !== newPassword2) {
      setPwError('Şifreler eşleşmiyor.');
      return;
    }
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: {
          ...(hasPassword ? { currentPassword } : {}),
          newPassword,
        },
      });
      setHasPassword(true);
      setCurrentPassword('');
      setNewPassword('');
      setNewPassword2('');
      setPwMsg('Şifre kaydedildi.');
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Şifre kaydedilemedi');
    }
  }

  if (!form) {
    return (
      <View style={screen}>
        <Text style={muted}>Yükleniyor…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Ayarlar</Text>
      <Text style={[muted, { marginTop: 6 }]}>Firma / e-belge bilgileri</Text>
      {FIELDS.map(([key, label]) => (
        <View key={key}>
          <Text style={[muted, { marginTop: 14 }]}>{label}</Text>
          <TextInput
            value={String(form[key] ?? (key === 'paytrCommissionRatePercent' ? 2.19 : ''))}
            onChangeText={(v) => setForm({ ...form, [key]: v })}
            keyboardType={key === 'paytrCommissionRatePercent' ? 'decimal-pad' : 'default'}
            placeholderTextColor={colors.muted}
            style={input}
          />
        </View>
      ))}
      <Pressable
        disabled={saving}
        onPress={() => void saveSettings()}
        style={[btn, { opacity: saving ? 0.6 : 1 }]}
      >
        <Text style={btnText}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Text>
      </Pressable>
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      <Text style={[title, { fontSize: 22, marginTop: 32 }]}>Şifre</Text>
      <Text style={[muted, { marginTop: 6, lineHeight: 18 }]}>
        Personel hesabı için şifre belirleyin veya değiştirin.
      </Text>
      {hasPassword ? (
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Mevcut şifre"
          placeholderTextColor={colors.muted}
          style={input}
        />
      ) : null}
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="Yeni şifre"
        placeholderTextColor={colors.muted}
        style={input}
      />
      <TextInput
        value={newPassword2}
        onChangeText={setNewPassword2}
        secureTextEntry
        placeholder="Şifre tekrar"
        placeholderTextColor={colors.muted}
        style={input}
      />
      <Pressable onPress={() => void savePassword()} style={btn}>
        <Text style={btnText}>{hasPassword ? 'Şifreyi değiştir' : 'Şifre belirle'}</Text>
      </Pressable>
      {pwMsg ? <Text style={{ color: colors.success, marginTop: 8 }}>{pwMsg}</Text> : null}
      {pwError ? <Text style={{ color: colors.danger, marginTop: 8 }}>{pwError}</Text> : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
