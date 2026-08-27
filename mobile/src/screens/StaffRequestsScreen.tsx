import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type OpsAccessRequest = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export function StaffRequestsScreen() {
  const [requests, setRequests] = useState<OpsAccessRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setError('');
    try {
      const me = await api<{ role: string }>('/auth/me');
      const admin = me.role === 'admin';
      setIsAdmin(admin);
      if (!admin) {
        setRequests([]);
        setError('Bu sayfa yalnızca yöneticiler içindir.');
        return;
      }
      setRequests(await api<OpsAccessRequest[]>('/auth/ops-access-requests'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Talepler yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onApprove(id: string, role: 'staff' | 'accountant' = 'staff') {
    setBusy(id);
    setMsg('');
    try {
      await api(`/auth/ops-access-requests/${id}/approve`, {
        method: 'POST',
        body: { role },
      });
      setMsg(role === 'accountant' ? 'Muhasebe erişimi onaylandı.' : 'Personel erişimi onaylandı.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Onay başarısız');
    } finally {
      setBusy(null);
    }
  }

  async function onReject(id: string) {
    setBusy(id);
    setMsg('');
    try {
      await api(`/auth/ops-access-requests/${id}/reject`, { method: 'POST' });
      setMsg('Talep reddedildi.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Reddetme başarısız');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Personel onayları</Text>
      <Text style={[muted, { marginTop: 6, lineHeight: 18 }]}>
        Kayıt olan hesaplar önce müşteri kalır. Onaylayınca personel paneline girerler.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}
      {isAdmin ? (
        <>
          <Pressable onPress={() => void load()} style={[btn, { marginTop: 12 }]}>
            <Text style={btnText}>Yenile</Text>
          </Pressable>
          {requests.length === 0 ? (
            <Text style={[muted, { marginTop: 16 }]}>Bekleyen talep yok.</Text>
          ) : (
            requests.map((r) => {
              const name =
                [r.firstName, r.lastName].filter(Boolean).join(' ') || r.email;
              return (
                <View key={r.id} style={card}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{name}</Text>
                  <Text style={muted}>{r.email}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable
                      disabled={busy === r.id}
                      onPress={() => void onApprove(r.id, 'staff')}
                      style={[btn, { flex: 1, marginTop: 0, opacity: busy === r.id ? 0.5 : 1 }]}
                    >
                      <Text style={btnText}>Personel</Text>
                    </Pressable>
                    <Pressable
                      disabled={busy === r.id}
                      onPress={() => void onApprove(r.id, 'accountant')}
                      style={[btn, { flex: 1, marginTop: 0, opacity: busy === r.id ? 0.5 : 1 }]}
                    >
                      <Text style={btnText}>Muhasebe</Text>
                    </Pressable>
                    <Pressable
                      disabled={busy === r.id}
                      onPress={() => void onReject(r.id)}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingVertical: 16,
                        opacity: busy === r.id ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ color: colors.muted, textAlign: 'center' }}>Reddet</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
