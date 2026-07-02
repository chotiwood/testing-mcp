<script setup lang="ts">
/**
 * BTBarChart — bar chart molecule (ApexCharts wrapper).
 *
 * Figma node 3398:521 · M - BarChart
 *
 * Variant is inferred from the data prop provided:
 * - `data`        → basic single-series
 * - `groups`      → grouped multi-series (side-by-side)
 * - `stackedBars` → stacked segments bottom→top
 *
 * @example
 * ```ts
 * // Basic
 * <BTBarChart :data="[{value:80,label:'Jan'},{value:60,label:'Feb'}]" />
 *
 * // Grouped
 * <BTBarChart :groups="[{label:'Jan',bars:[{value:80,color:'#0EA5E9',label:'Revenue'},{value:60,color:'#0F81B4',label:'Cost'}]}]" />
 *
 * // Stacked
 * <BTBarChart :stacked-bars="[{label:'Jan',segments:[{value:40,color:'#0EA5E9',label:'A'},{value:20,color:'#08A94C',label:'B'}]}]" />
 * ```
 */
import '@/components/ui/bar-chart/BTBarChart.css';
import '@/components/ui/bar-chart/internal/chart-tooltip';
import { computed } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
import type { BTBarData, BTBarGroupData, BTStackedBarData } from '@/components/ui/bar-chart/BTBarChart.types';
import { BTChartColors } from '@/components/ui/bar-chart/internal/chart-colors';
import { buildTooltipHtml } from '@/components/ui/bar-chart/internal/chart-tooltip';
import { btAxisLabelStyle, btGridOptions, btChartBase, inferMaxY } from '@/components/ui/bar-chart/internal/chart-apex.utils';

const props = withDefaults(
  defineProps<{
    /** Basic variant: single-series data */
    data?: BTBarData[];
    /** Grouped variant: multi-series data */
    groups?: BTBarGroupData[];
    /** Stacked variant: segmented data */
    stackedBars?: BTStackedBarData[];
    /** Basic variant bar fill color (default: BTChartColors.info) */
    barColor?: string;
    /** Y-axis maximum (auto-rounded to next 20 if omitted) */
    maxY?: number;
    /** Chart height in px */
    height?: number;
    /** Optional x-axis labels override */
    xLabels?: string[];
  }>(),
  {
    data: () => [],
    groups: () => [],
    stackedBars: () => [],
    barColor: BTChartColors.info,
    height: 188,
  },
);

const isGrouped  = computed(() => props.groups  && props.groups.length  > 0);
const isStacked  = computed(() => props.stackedBars && props.stackedBars.length > 0);

// ── Series ────────────────────────────────────────────────────────────────────

const series = computed<ApexAxisChartSeries>(() => {
  if (isGrouped.value) {
    // Collect all series across groups: one ApexCharts series per bar slot.
    const numBars = props.groups[0]?.bars.length ?? 0;
    return Array.from({ length: numBars }, (_, i) => ({
      name: props.groups[0]?.bars[i]?.label ?? `Series ${i + 1}`,
      color: props.groups[0]?.bars[i]?.color ?? BTChartColors.info,
      data: props.groups.map((g) => g.bars[i]?.value ?? 0),
    }));
  }

  if (isStacked.value) {
    // One series per segment slot.
    const numSegs = props.stackedBars[0]?.segments.length ?? 0;
    return Array.from({ length: numSegs }, (_, i) => ({
      name: props.stackedBars[0]?.segments[i]?.label ?? `Segment ${i + 1}`,
      color: props.stackedBars[0]?.segments[i]?.color ?? BTChartColors.info,
      data: props.stackedBars.map((b) => b.segments[i]?.value ?? 0),
    }));
  }

  // Basic: single series
  return [{
    name: 'Value',
    color: props.barColor,
    data: props.data.map((d) => d.value),
  }];
});

// ── Categories (x-axis labels) ────────────────────────────────────────────────

const categories = computed<string[]>(() => {
  if (props.xLabels && props.xLabels.length > 0) return props.xLabels;
  if (isGrouped.value) return props.groups.map((g) => g.label ?? '');
  if (isStacked.value) return props.stackedBars.map((b) => b.label ?? '');
  return props.data.map((d) => d.label ?? '');
});

// ── maxY ─────────────────────────────────────────────────────────────────────

const effectiveMaxY = computed<number>(() => {
  if (props.maxY !== undefined) return props.maxY;

  if (isStacked.value) {
    // Stack totals
    const totals = props.stackedBars.map((b) =>
      b.segments.reduce((s, seg) => s + seg.value, 0),
    );
    return inferMaxY(totals);
  }
  if (isGrouped.value) {
    const all = props.groups.flatMap((g) => g.bars.map((b) => b.value));
    return inferMaxY(all);
  }
  return inferMaxY(props.data.map((d) => d.value));
});

function getTooltipPlacement(dataPointIndex: number, w: any): 'left' | 'right' {
  const gridWidth = Number(w?.globals?.gridWidth ?? 0);
  const count = Math.max(categories.value.length, 1);
  const slotWidth = gridWidth > 0 ? gridWidth / count : 0;
  const pointX = slotWidth > 0 ? slotWidth * (dataPointIndex + 0.5) : 0;
  return pointX <= gridWidth / 2 ? 'right' : 'left';
}

// ── ApexCharts options ────────────────────────────────────────────────────────

const options = computed<ApexOptions>(() => {
  const axisStyle = btAxisLabelStyle();
  return {
    chart: {
      ...btChartBase(),
      type: 'bar',
      stacked: isStacked.value,
      height: props.height,
    },
    plotOptions: {
      bar: {
        borderRadius: 2,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        columnWidth: isGrouped.value ? '76%' : isStacked.value ? '74%' : '68%',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    grid: btGridOptions(),
    xaxis: {
      categories: categories.value,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: axisStyle, offsetY: 4 },
    },
    yaxis: {
      min: 0,
      max: effectiveMaxY.value,
      tickAmount: 5,
      forceNiceScale: true,
      labels: { style: axisStyle, align: 'right', padding: 4 },
    },
    legend: { show: false },
    tooltip: {
      custom({ seriesIndex, dataPointIndex, w }) {
        // Build title from x-axis category
        const title = categories.value[dataPointIndex] ?? '';

        let items: { color: string; label: string; value: string }[];

        if (isGrouped.value || isStacked.value) {
          // Show all series values at this x position
          const allSeries: ApexAxisChartSeries = (w.config?.series ?? []) as ApexAxisChartSeries;
          items = allSeries.map((s) => ({
            color: (s as { color?: string; name?: string; data: number[] }).color ?? BTChartColors.info,
            label: s.name ?? '',
            value: String(((s as { data: number[] }).data)[dataPointIndex] ?? 0),
          }));
        } else {
          const firstSeries = (w.config?.series?.[0] ?? { data: [] }) as { data: number[] };
          items = [{
            color: props.barColor ?? BTChartColors.info,
            label: '',
            value: String(firstSeries.data[dataPointIndex] ?? 0),
          }];
        }

        return buildTooltipHtml(title, items, {
          placement: getTooltipPlacement(dataPointIndex, w),
        });
      },
    },
  };
});
</script>

<template>
  <div class="bt-bar-chart">
    <VueApexCharts
      type="bar"
      :height="height"
      :options="options"
      :series="series"
    />
  </div>
</template>
