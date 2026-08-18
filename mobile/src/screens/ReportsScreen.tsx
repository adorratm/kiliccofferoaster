import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EChart } from '../components/EChart';
import { api } from '../lib/api';
import { CHART, mixPieOption, vatBarOption } from '../lib/charts';
import { card, colors, muted, screen, title } from '../ui';

type Turnover = {
  from: string;
  to: string;
  web: { count: number; total: string };
  invoices: { count: number; total: string; vat: string };
  okc: { count: number; total: string; vat: string; cash: string; card: string };
  combined: string;
};

type Vat = { outputVat: string; inputVat: string; payable: string };

export function ReportsScreen() {
  const [turnover, setTurnover] = useState<Turnover | null>(null);
  const [vat, setVat] = useState<Vat | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([
      api<Turnover>('/accounting/reports/turnover'),
      api<Vat>('/accounting/reports/vat'),
    ])
      .then(([t, v]) => {
        setTurnover(t);
        setVat(v);
      })
      .catch(() => setError('Çevrimdışı veya rapor alınamadı'));
  }, []);

  return (
    <ScrollView style={screen}>
      <Text style={title}>Raporlar</Text>
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}

      {turnover ? (
        <View>
          <View style={card}>
            <Text style={muted}>WEB</Text>
            <Text style={{ color: colors.accent, fontSize: 20 }}>{turnover.web.total} ₺</Text>
            <Text style={muted}>{turnover.web.count} sipariş</Text>
          </View>
          <View style={card}>
            <Text style={muted}>FATURA · ÖKC · BİRLEŞİK</Text>
            <Text style={{ color: colors.text, marginTop: 6 }}>
              Fatura {turnover.invoices.total} ₺ · ÖKC {turnover.okc.total} ₺
            </Text>
            <Text style={{ color: colors.accent, marginTop: 4 }}>{turnover.combined} ₺</Text>
          </View>
          <View style={card}>
            <Text style={muted}>CİRO DAĞILIMI</Text>
            <EChart
              option={mixPieOption(
                [
                  { name: 'Web', value: Number(turnover.web.total) || 0 },
                  { name: 'Fatura', value: Number(turnover.invoices.total) || 0 },
                  { name: 'ÖKC', value: Number(turnover.okc.total) || 0 },
                ],
                [CHART.accent, CHART.accentSoft, CHART.success],
              )}
              height={240}
            />
          </View>
        </View>
      ) : null}

      {vat ? (
        <View style={card}>
          <Text style={muted}>KDV</Text>
          <EChart
            option={vatBarOption({
              outputVat: Number(vat.outputVat) || 0,
              inputVat: Number(vat.inputVat) || 0,
              payable: Number(vat.payable) || 0,
            })}
            height={220}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
