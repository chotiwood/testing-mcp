<script setup lang="ts">
/**
 * BTLineChart — line / area chart molecule (ApexCharts wrapper).
 *
 * Figma node 3398:1486 · M - LineChart
 *
 * @example
 * ```ts
 * // Line (no fill)
 * <BTLineChart :series="[{spots:[{x:0,y:40},{x:1,y:60}],color:'#0EA5E9',label:'Revenue'}]" />
 *
 * // Area (translucent fill)
 * <BTLineChart :series="lineSeries" :area="true" />
 * ```
 */
import '@/components/ui/line-chart/BTLineChart.css';
import '@/components/ui/line-chart/internal/chart-tooltip';
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
import type { BTLineSeries } from '@/components/ui/line-chart/BTLineChart.types';
import { buildTooltipHtml } from '@/components/ui/line-chart/internal/chart-tooltip';
import { btAxisLabelStyle, btGridOptions, btChartBase, inferMaxY } from '@/components/ui/line-chart/internal/chart-apex.utils';

export type BTLineChartVariant = 'line' | 'area';

const props = withDefaults(
  defineProps<{
    /** Series data */
    series: BTLineSeries[];
    /** Figma variants: line | area */
    variant?: BTLineChartVariant;
    /** Show translucent fill below each line */
    area?: boolean;
    /** Y-axis maximum */
    maxY?: number;
    /** Chart height in px */
    height?: number;
    /** Optional x-axis labels override */
    xLabels?: string[];
  }>(),
  {
    variant: 'line',
    area: false,
    height: 188,
  },
);

const resolvedVariant = computed<BTLineChartVariant>(() =>
  props.area ? 'area' : props.variant,
);

const isArea = computed(() => resolvedVariant.value === 'area');

const effectiveMaxY = computed<number>(() => {
  if (props.maxY !== undefined) return props.maxY;
  const all = props.series.flatMap((s) => s.spots.map((p) => p.y));
  return inferMaxY(all);
});

// Category labels — "Label" for every x point (matching Figma spec)
const xCount = computed<number>(() => props.series[0]?.spots?.length ?? 0);
const categories = computed<string[]>(() =>
  props.xLabels && props.xLabels.length > 0
    ? props.xLabels
    : Array.from({ length: xCount.value }, (_, index) => `L${index + 1}`),
);

// Series data: y-values only (category axis handles x positioning)
const apexSeries = computed<ApexAxisChartSeries>(() =>
  props.series.map((s) => ({
    name: s.label ?? '',
    data: s.spots.map((p) => p.y),
  })),
);

function getTooltipPlacement(dataPointIndex: number, w: any): 'left' | 'right' {
  const gridWidth = Number(w?.globals?.gridWidth ?? 0);
  const count = Math.max(categories.value.length, 1);
  const slotWidth = gridWidth > 0 ? gridWidth / count : 0;
  const pointX = slotWidth > 0 ? slotWidth * (dataPointIndex + 0.5) : 0;
  return pointX <= gridWidth / 2 ? 'right' : 'left';
}

const options = computed<ApexOptions>(() => {
  const axisStyle = btAxisLabelStyle();
  return {
    chart: {
      ...btChartBase(),
      type: isArea.value ? 'area' : 'line',
      height: props.height,
    },
    // Colors array drives multi-series coloring for line/area charts
    colors: props.series.map((s) => s.color),
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round',
    },
    ...(isArea.value
      ? {
          fill: {
            type: 'solid',
            opacity: props.series.map((_item, index) => Math.max(0.14, 0.28 - (index * 0.03))),
          },
        }
      : {}),
    markers: {
      size: 0,
      hover: { size: 4 },
    },
    dataLabels: { enabled: false },
    grid: btGridOptions(),
    xaxis: {
      type: 'category',
      categories: categories.value,
      labels: {
        style: axisStyle,
        offsetY: 4,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: true,
        stroke: { color: 'var(--text-primary)', dashArray: 4, width: 1 },
      },
    },
    yaxis: {
      max: effectiveMaxY.value,
      min: 0,
      tickAmount: 5,
      forceNiceScale: true,
      labels: { style: axisStyle, align: 'right', padding: 4 },
    },
    legend: { show: false },
    tooltip: {
      shared: true,
      intersect: false,
      custom({ dataPointIndex, w }: { dataPointIndex: number; w: any }) {
        const xIdx = dataPointIndex;
        const title = `L${xIdx + 1}`;
        const items = props.series.map((s) => ({
          color: s.color,
          label: s.label ?? '',
          value: String(s.spots[xIdx]?.y ?? 0),
        }));
        return buildTooltipHtml(title, items, {
          placement: getTooltipPlacement(dataPointIndex, w),
        });
      },
    },
  };
});
</script>

<template>
  <div class="bt-line-chart">
    <VueApexCharts
      :type="isArea ? 'area' : 'line'"
      :height="height"
      :options="options"
      :series="apexSeries"
    />
  </div>
</template>
