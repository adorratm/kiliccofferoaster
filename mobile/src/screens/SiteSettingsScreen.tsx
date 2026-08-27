import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type SettingRow = { key: string; value: Record<string, unknown>; group?: string };

export function SiteSettingsScreen() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [phone, setPhone] = useState('');
  const [greeting, setGreeting] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [presets, setPresets] = useState<unknown[]>([]);
  const [instagram, setInstagram] = useState('');
  const [socialRest, setSocialRest] = useState<Record<string, unknown>>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const list = asArray<SettingRow>(await api('/cms/admin/settings'));
        setRows(list);
        const map = Object.fromEntries(list.map((r) => [r.key, r.value]));
        const wa = (map.whatsapp || {}) as Record<string, unknown>;
        const social = (map.social || {}) as Record<string, unknown>;
        setPhone(String(wa.phone || ''));
        setGreeting(String(wa.greeting || ''));
        setEnabled(wa.enabled !== false);
        setPresets(Array.isArray(wa.presets) ? wa.presets : []);
        setInstagram(String(social.instagram || ''));
        const { instagram: _i, ...rest } = social;
        setSocialRest(rest);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ayarlar yüklenemedi');
      }
    })();
  }, []);

  async function save() {
    setMsg('');
    setError('');
    try {
      const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
      const settings = [
        ...(byKey.whatsapp
          ? [
              {
                key: 'whatsapp',
                group: byKey.whatsapp.group || 'whatsapp',
                value: {
                  ...byKey.whatsapp.value,
                  enabled,
                  phone: phone.trim(),
                  greeting: greeting.trim(),
                  presets,
                },
              },
            ]
          : [
              {
                key: 'whatsapp',
                group: 'whatsapp',
                value: {
                  enabled,
                  phone: phone.trim(),
                  greeting: greeting.trim(),
                  presets,
                },
              },
            ]),
        {
          key: 'social',
          group: byKey.social?.group || 'social',
          value: { ...socialRest, instagram: instagram.trim() },
        },
      ];
      await api('/cms/admin/settings', {
        method: 'PATCH',
        body: { settings },
      });
      setMsg('Site ayarları kaydedildi');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Site ayarları</Text>
      <Text style={[muted, { marginTop: 6 }]}>
        WhatsApp ve Instagram. Navigasyon / menü web admin’de.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      <Text style={[muted, { marginTop: 16 }]}>WHATSAPP</Text>
      <Pressable
        onPress={() => setEnabled((v) => !v)}
        style={[
          card,
          { borderColor: enabled ? colors.accent : colors.borderMuted },
        ]}
      >
        <Text style={{ color: enabled ? colors.accentSoft : colors.muted }}>
          {enabled ? 'Widget açık' : 'Widget kapalı'}
        </Text>
      </Pressable>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Telefon"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        style={input}
      />
      <TextInput
        value={greeting}
        onChangeText={setGreeting}
        placeholder="Karşılama"
        placeholderTextColor={colors.muted}
        multiline
        style={[input, { minHeight: 80 }]}
      />

      <Text style={[muted, { marginTop: 16 }]}>INSTAGRAM</Text>
      <TextInput
        value={instagram}
        onChangeText={setInstagram}
        placeholder="https://instagram.com/..."
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={input}
      />
      <Pressable onPress={() => void save()} style={btn}>
        <Text style={btnText}>Kaydet</Text>
      </Pressable>
    </ScrollView>
  );
}
