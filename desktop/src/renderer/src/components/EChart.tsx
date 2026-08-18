import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

export function EChart({
  option,
  height = 280,
}: {
  option: EChartsOption;
  height?: number;
}) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
