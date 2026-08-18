import { useEffect, useRef } from 'react';
import { Dimensions, View } from 'react-native';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import type { EChartsOption } from 'echarts';

echarts.use([
  SVGRenderer,
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
  const chartRef = useRef(null);
  const width = Math.max(280, Dimensions.get('window').width - 48);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, {
      renderer: 'svg',
      width,
      height,
    });
    chart.setOption(option);
    return () => chart.dispose();
  }, [option, height, width]);

  return (
    <View style={{ height, width }}>
      <SvgChart ref={chartRef} />
    </View>
  );
}
