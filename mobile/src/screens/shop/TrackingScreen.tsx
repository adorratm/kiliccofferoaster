import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountStackParamList } from '../../navigation/types';
import { Field } from '../../components/shop/Field';
import { PageHeader } from '../../components/shop/PageHeader';
import { btn, btnText, colors, link } from '../../ui';

type Props = NativeStackScreenProps<AccountStackParamList, 'Tracking'>;

export function TrackingScreen({ navigation }: Props) {
  const [code, setCode] = useState('');

  function submit() {
    const value = code.trim();
    if (!value) return;
    navigation.navigate('TrackingResult', { kod: value });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 20, justifyContent: 'center' }}>
      <PageHeader
        kicker="Kargo"
        heading="Takip"
        subtitle="Sipariş e-postanızdaki takip kodunu girin."
      />
      <Field
        title="Takip kodu"
        value={code}
        onChangeText={setCode}
        placeholder="Takip numarası"
        autoCapitalize="characters"
      />
      <Pressable onPress={submit} style={btn}>
        <Text style={btnText}>Sorgula</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('OrderLookup')} style={{ marginTop: 20 }}>
        <Text style={link}>Sipariş sorgula</Text>
      </Pressable>
    </View>
  );
}
