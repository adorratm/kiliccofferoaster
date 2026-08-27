import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api, asArray } from '../lib/api';
import { btn, btnText, card, colors, input, muted, screen, title } from '../ui';

type Role = 'customer' | 'staff' | 'accountant' | 'admin';

type ManagedUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
};

const ROLE_LABELS: Record<Role, string> = {
  customer: 'Müşteri',
  staff: 'Personel',
  accountant: 'Muhasebe',
  admin: 'Admin',
};

const ROLES: Role[] = ['customer', 'staff', 'accountant', 'admin'];

export function UsersScreen() {
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [filter, setFilter] = useState<'ops' | 'customer' | 'admin'>('ops');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createRole, setCreateRole] = useState<'staff' | 'accountant' | 'admin'>('staff');
  const [allowEmail, setAllowEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    setError('');
    try {
      const me = await api<{ role: string }>('/auth/me');
      setIsAdmin(me.role === 'admin');
      if (me.role !== 'admin') {
        setError('Yalnızca adminler kullanıcı yönetimi yapabilir.');
        return;
      }
      const data = await api<unknown>(`/auth/users?role=${filter}&limit=60`);
      setRows(asArray<ManagedUser>(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    void load();
  }, [filter]);

  async function create() {
    setMsg('');
    try {
      await api('/auth/ops-users', {
        method: 'POST',
        body: { email, password, role: createRole },
      });
      setEmail('');
      setPassword('');
      setMsg('Hesap oluşturuldu');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Oluşturma başarısız');
    }
  }

  async function setRole(id: string, role: Role) {
    try {
      await api(`/auth/users/${id}`, { method: 'PATCH', body: { role } });
      setMsg('Rol güncellendi');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  async function toggleActive(u: ManagedUser) {
    try {
      await api(`/auth/users/${u.id}`, {
        method: 'PATCH',
        body: { isActive: !u.isActive },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  }

  async function addAllow() {
    try {
      await api('/auth/admin-allowlist', {
        method: 'POST',
        body: { email: allowEmail, promoteUser: true },
      });
      setAllowEmail('');
      setMsg('Admin allowlist’e eklendi');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Allowlist hatası');
    }
  }

  if (!isAdmin && error) {
    return (
      <View style={screen}>
        <Text style={title}>Kullanıcılar</Text>
        <Text style={{ color: colors.danger, marginTop: 12 }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={screen}>
      <Text style={title}>Kullanıcılar</Text>
      <Text style={[muted, { marginTop: 6, lineHeight: 18 }]}>
        Admin ekleme, personel tanımlama, müşteri rollerini yönetme. Birden fazla
        admin desteklenir.
      </Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.success, marginTop: 8 }}>{msg}</Text> : null}

      <Text style={[muted, { marginTop: 16 }]}>YENİ HESAP</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="E-posta"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Şifre"
        placeholderTextColor={colors.muted}
        secureTextEntry
        style={input}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {(['staff', 'accountant', 'admin'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setCreateRole(r)}
            style={{
              borderWidth: 1,
              borderColor: createRole === r ? colors.accent : colors.borderMuted,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: createRole === r ? colors.accentSoft : colors.text }}>
              {ROLE_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => void create()} style={btn}>
        <Text style={btnText}>Oluştur</Text>
      </Pressable>

      <Text style={[muted, { marginTop: 20 }]}>ADMIN ALLOWLIST</Text>
      <TextInput
        value={allowEmail}
        onChangeText={setAllowEmail}
        placeholder="ikinci-admin@firma.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={input}
      />
      <Pressable onPress={() => void addAllow()} style={btn}>
        <Text style={btnText}>Allowlist’e ekle</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
        {([
          ['ops', 'Ops'],
          ['customer', 'Müşteri'],
          ['admin', 'Admin'],
        ] as const).map(([v, label]) => (
          <Pressable
            key={v}
            onPress={() => setFilter(v)}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: filter === v ? colors.accent : colors.borderMuted,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: filter === v ? colors.accentSoft : colors.muted,
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {rows.map((u) => (
        <View key={u.id} style={card}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
          </Text>
          <Text style={muted}>{u.email}</Text>
          <Text style={[muted, { marginTop: 4 }]}>
            {u.isActive ? 'Aktif' : 'Pasif'} · {ROLE_LABELS[u.role]}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => void setRole(u.id, r)}
                style={{
                  borderWidth: 1,
                  borderColor: u.role === r ? colors.accent : colors.borderMuted,
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: u.role === r ? colors.accentSoft : colors.muted,
                    fontSize: 11,
                  }}
                >
                  {ROLE_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => void toggleActive(u)} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.muted }}>
              {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
            </Text>
          </Pressable>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
