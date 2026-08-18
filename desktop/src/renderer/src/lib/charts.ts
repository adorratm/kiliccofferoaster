import type { EChartsOption } from 'echarts';

export const CHART = {
  accent: '#cc5b3e',
  accentSoft: '#ffb4a2',
  success: '#6b9f7a',
  warning: '#c9a227',
  danger: '#c45c5c',
  muted: '#a58b84',
  text: '#e5e2e1',
  border: '#57423d',
  surface: '#1c1b1b',
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: CHART.warning,
  paid: CHART.accent,
  processing: CHART.accentSoft,
  shipped: '#8d6e63',
  delivered: CHART.success,
  cancelled: CHART.danger,
  refunded: '#7a4a4a',
};

const axis = {
  axisLine: { lineStyle: { color: CHART.border } },
  axisLabel: { color: CHART.muted, fontSize: 11 },
  splitLine: { lineStyle: { color: '#2a2a2a' } },
};

export function baseOption(): EChartsOption {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: CHART.muted, fontFamily: 'inherit' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { textStyle: { color: CHART.muted }, top: 0 },
    grid: { left: 52, right: 48, top: 36, bottom: 28 },
  };
}

export function revenueSeriesOption(
  series: { date: string; orders: number; revenue: number }[],
): EChartsOption {
  const labels = series.map((s) => {
    const [, m, d] = s.date.split('-');
    return `${d}.${m}`;
  });
  return {
    ...baseOption(),
    legend: { data: ['Ciro', 'Sipariş'], textStyle: { color: CHART.muted } },
    xAxis: { type: 'category', data: labels, ...axis },
    yAxis: [
      { type: 'value', name: '₺', ...axis },
      { type: 'value', name: 'adet', ...axis, splitLine: { show: false } },
    ],
    series: [
      {
        name: 'Ciro',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: CHART.accent },
        areaStyle: { color: 'rgba(204,91,62,0.18)' },
        data: series.map((s) => Math.round(s.revenue)),
      },
      {
        name: 'Sipariş',
        type: 'bar',
        yAxisIndex: 1,
        itemStyle: { color: CHART.accentSoft },
        data: series.map((s) => s.orders),
      },
    ],
  };
}

export function statusPieOption(
  rows: { status: string; label: string; count: number }[],
): EChartsOption {
  return {
    ...baseOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        itemStyle: { borderColor: '#131313', borderWidth: 2 },
        label: { color: CHART.muted, fontSize: 11 },
        data: rows
          .filter((r) => r.count > 0)
          .map((r) => ({
            name: r.label,
            value: r.count,
            itemStyle: { color: STATUS_COLOR[r.status] || CHART.muted },
          })),
      },
    ],
  };
}

export function mixPieOption(
  rows: { name: string; value: number }[],
  colors: string[],
): EChartsOption {
  return {
    ...baseOption(),
    tooltip: {
      trigger: 'item',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
      formatter: '{b}: {c} ₺ ({d}%)',
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        itemStyle: { borderColor: '#131313', borderWidth: 2 },
        label: { color: CHART.muted, fontSize: 11 },
        data: rows.map((r, i) => ({
          name: r.name,
          value: Math.round(r.value),
          itemStyle: { color: colors[i % colors.length] },
        })),
      },
    ],
  };
}

export function topProductsOption(
  rows: { name: string; quantity: number }[],
): EChartsOption {
  const data = [...rows].reverse();
  return {
    ...baseOption(),
    grid: { left: 120, right: 24, top: 16, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { show: false },
    xAxis: { type: 'value', ...axis },
    yAxis: {
      type: 'category',
      data: data.map((r) =>
        r.name.length > 22 ? `${r.name.slice(0, 20)}…` : r.name,
      ),
      ...axis,
    },
    series: [
      {
        type: 'bar',
        data: data.map((r) => r.quantity),
        itemStyle: { color: CHART.accent },
      },
    ],
  };
}

export function stockBarOption(
  rows: { name: string; stock: number }[],
): EChartsOption {
  const data = rows.slice(0, 8);
  return {
    ...baseOption(),
    grid: { left: 110, right: 16, top: 12, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { show: false },
    xAxis: { type: 'value', ...axis },
    yAxis: {
      type: 'category',
      data: data.map((r) =>
        r.name.length > 18 ? `${r.name.slice(0, 16)}…` : r.name,
      ),
      ...axis,
    },
    series: [
      {
        type: 'bar',
        data: data.map((r) => ({
          value: r.stock,
          itemStyle: { color: r.stock <= 10 ? CHART.warning : CHART.accent },
        })),
      },
    ],
  };
}

export function vatBarOption(vat: {
  outputVat: number;
  inputVat: number;
  payable: number;
}): EChartsOption {
  return {
    ...baseOption(),
    tooltip: {
      trigger: 'axis',
      backgroundColor: CHART.surface,
      borderColor: CHART.border,
      textStyle: { color: CHART.text },
    },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: ['Hesaplanan', 'İndirilecek', 'Ödenecek'],
      ...axis,
    },
    yAxis: { type: 'value', ...axis },
    series: [
      {
        type: 'bar',
        data: [
          { value: vat.outputVat, itemStyle: { color: CHART.accent } },
          { value: vat.inputVat, itemStyle: { color: CHART.accentSoft } },
          { value: vat.payable, itemStyle: { color: CHART.warning } },
        ],
      },
    ],
  };
}
