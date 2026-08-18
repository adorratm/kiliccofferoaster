import { createElement, useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

export function EChart({
  option,
  height = 240,
}: {
  option: EChartsOption;
  height?: number;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!host.current) return;
    const instance = echarts.init(host.current, undefined, { renderer: 'canvas' });
    chart.current = instance;
    const onResize = () => instance.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      instance.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, true);
  }, [option]);

  return (
    <View style={{ height, width: '100%' }}>
      {createElement('div', {
        ref: host,
        style: { width: '100%', height },
      })}
    </View>
  );
}
