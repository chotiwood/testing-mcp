'use client';
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
 * ```tsx
 * // Basic
 * <BTBarChart data={[{value:80,label:'Jan'},{value:60,label:'Feb'}]} />
 *
 * // Grouped
 * <BTBarChart groups={[{label:'Jan',bars:[{value:80,color:'#0EA5E9',label:'Revenue'}]}]} />
 *
 * // Stacked
 * <BTBarChart stackedBars={[{label:'Jan',segments:[{value:40,color:'#0EA5E9',label:'A'}]}]} />
 * ```
 */
import '@/components/ui/bar-chart/BTBarChart.css';
import '@/components/ui/bar-chart/internal/chart-tooltip';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
import type { BTBarData, BTBarGroupData, BTStackedBarData } from '@/components/ui/bar-chart/BTBarChart.types';
import { BTChartColors } from '@/components/ui/bar-chart/internal/chart-colors';
import { buildTooltipHtml } from '@/components/ui/bar-chart/internal/chart-tooltip';
import { btAxisLabelStyle, btGridOptions, btChartBase, inferMaxY } from '@/components/ui/bar-chart/internal/chart-apex.utils';

export interface BTBarChartProps {
  /** Basic variant: single-series data */
  data?: BTBarData[];
  /** Grouped variant: multi-series data */
  groups?: BTBarGroupData[];
  /** Stacked variant: segmented data */
  stackedBars?: BTStackedBarData[];
  /** Basic variant bar fill color */
  barColor?: string;
  /** Y-axis maximum */
  maxY?: number;
  /** Chart height in px */
  height?: number;
  /** Optional x-axis labels override */
  xLabels?: string[];
}

export function BTBarChart({
  data = [],
  groups = [],
  stackedBars = [],
  barColor = BTChartColors.info,
  maxY,
  height = 188,
  xLabels,
}: BTBarChartProps) {
  const isGrouped = groups.length > 0;
  const isStacked = stackedBars.length > 0;

  const series = useMemo<ApexAxisChartSeries>(() => {
    if (isGrouped) {
      const numBars = groups[0]?.bars.length ?? 0;
      return Array.from({ length: numBars }, (_, i) => ({
        name: groups[0]?.bars[i]?.label ?? `Series ${i + 1}`,
        color: groups[0]?.bars[i]?.color ?? BTChartColors.info,
        data: groups.map((g) => g.bars[i]?.value ?? 0),
      }));
    }
    if (isStacked) {
      const numSegs = stackedBars[0]?.segments.length ?? 0;
      return Array.from({ length: numSegs }, (_, i) => ({
        name: stackedBars[0]?.segments[i]?.label ?? `Segment ${i + 1}`,
        color: stackedBars[0]?.segments[i]?.color ?? BTChartColors.info,
        data: stackedBars.map((b) => b.segments[i]?.value ?? 0),
      }));
    }
    return [{ name: 'Value', color: barColor, data: data.map((d) => d.value) }];
  }, [data, groups, stackedBars, barColor, isGrouped, isStacked]);

  const categories = useMemo<string[]>(() => {
    if (xLabels && xLabels.length > 0) return xLabels;
    if (isGrouped) return groups.map((g) => g.label ?? '');
    if (isStacked) return stackedBars.map((b) => b.label ?? '');
    return data.map((d) => d.label ?? '');
  }, [data, groups, stackedBars, isGrouped, isStacked, xLabels]);

  const effectiveMaxY = useMemo<number>(() => {
    if (maxY !== undefined) return maxY;
    if (isStacked) {
      const totals = stackedBars.map((b) =>
        b.segments.reduce((s, seg) => s + seg.value, 0),
      );
      return inferMaxY(totals);
    }
    if (isGrouped) {
      return inferMaxY(groups.flatMap((g) => g.bars.map((b) => b.value)));
    }
    return inferMaxY(data.map((d) => d.value));
  }, [data, groups, stackedBars, maxY, isGrouped, isStacked]);

  const getTooltipPlacement = (dataPointIndex: number, w: any): 'left' | 'right' => {
    const gridWidth = Number(w?.globals?.gridWidth ?? 0);
    const count = Math.max(categories.length, 1);
    const slotWidth = gridWidth > 0 ? gridWidth / count : 0;
    const pointX = slotWidth > 0 ? slotWidth * (dataPointIndex + 0.5) : 0;
    return pointX <= gridWidth / 2 ? 'right' : 'left';
  };

  const options = useMemo<ApexOptions>(() => {
    const axisStyle = btAxisLabelStyle();
    return {
      chart: {
        ...btChartBase(),
        type: 'bar',
        stacked: isStacked,
        height,
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          columnWidth: isGrouped ? '76%' : isStacked ? '74%' : '68%',
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      grid: btGridOptions(),
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: axisStyle, offsetY: 4 },
      },
      yaxis: {
        min: 0,
        max: effectiveMaxY,
        tickAmount: 5,
        forceNiceScale: true,
        labels: { style: axisStyle, align: 'right', padding: 4 },
      },
      legend: { show: false },
      colors: series.map((s) => (s as { color?: string }).color ?? BTChartColors.info),
      tooltip: {
        custom({ seriesIndex, dataPointIndex, w }: { seriesIndex: number; dataPointIndex: number; w: any }) {
          const title = categories[dataPointIndex] ?? '';
          let items: { color: string; label: string; value: string }[];
          if (isGrouped || isStacked) {
            const allSeries: ApexAxisChartSeries = (w.config?.series ?? []) as ApexAxisChartSeries;
            items = allSeries.map((s) => ({
              color: (s as { color?: string; name?: string; data: number[] }).color ?? BTChartColors.info,
              label: s.name ?? '',
              value: String(((s as { data: number[] }).data)[dataPointIndex] ?? 0),
            }));
          } else {
            const firstSeries = (w.config?.series?.[0] ?? { data: [] }) as { data: number[] };
            items = [{
              color: barColor,
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
  }, [series, categories, effectiveMaxY, height, isGrouped, isStacked, barColor]);

  return (
    <div className="bt-bar-chart">
      <ReactApexChart
        type="bar"
        height={height}
        options={options}
        series={series}
      />
    </div>
  );
}
