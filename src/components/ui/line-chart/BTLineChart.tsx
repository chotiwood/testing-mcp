'use client';
/**
 * BTLineChart — line / area chart molecule (ApexCharts wrapper).
 *
 * Figma node 3398:1486 · M - LineChart
 *
 * @example
 * ```tsx
 * // Line
 * <BTLineChart series={[{spots:[{x:0,y:40},{x:1,y:60}],color:'#0EA5E9',label:'Revenue'}]} />
 *
 * // Area
 * <BTLineChart series={lineSeries} area />
 * ```
 */
import '@/components/ui/line-chart/BTLineChart.css';
import '@/components/ui/line-chart/internal/chart-tooltip';
import { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
import type { BTLineSeries } from '@/components/ui/line-chart/BTLineChart.types';
import { buildTooltipHtml } from '@/components/ui/line-chart/internal/chart-tooltip';
import { btAxisLabelStyle, btGridOptions, btChartBase, inferMaxY } from '@/components/ui/line-chart/internal/chart-apex.utils';

export type BTLineChartVariant = 'line' | 'area';

export interface BTLineChartProps {
  series: BTLineSeries[];
  variant?: BTLineChartVariant;
  area?: boolean;
  maxY?: number;
  height?: number;
  xLabels?: string[];
}

export function BTLineChart({
  series,
  variant = 'line',
  area = false,
  maxY,
  height = 188,
  xLabels,
}: BTLineChartProps) {
  const resolvedVariant: BTLineChartVariant = area ? 'area' : variant;
  const isArea = resolvedVariant === 'area';

  const effectiveMaxY = useMemo<number>(() => {
    if (maxY !== undefined) return maxY;
    return inferMaxY(series.flatMap((s) => s.spots.map((p) => p.y)));
  }, [series, maxY]);

  const xCount = series.length > 0 ? (series[0]?.spots?.length ?? 0) : 0;

  // Category labels — "Label" for every x point (matching Figma spec)
  const categories = useMemo<string[]>(
    () => xLabels && xLabels.length > 0
      ? xLabels
      : Array.from({ length: xCount }, (_, index) => `L${index + 1}`),
    [xCount, xLabels],
  );

  // Series data: y-values only (category axis handles x positioning)
  const apexSeries = useMemo<ApexAxisChartSeries>(() =>
    series.map((s) => ({
      name: s.label ?? '',
      data: s.spots.map((p) => p.y),
    })),
  [series]);

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
        type: isArea ? 'area' : 'line',
        height,
      },
      // Colors array drives multi-series coloring for line/area charts
      colors: series.map((s) => s.color),
      stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
      ...(isArea
        ? {
            fill: {
              type: 'solid',
              opacity: series.map((_item, index) => Math.max(0.14, 0.28 - (index * 0.03))),
            },
          }
        : {}),
      markers: { size: 0, hover: { size: 4 } },
      dataLabels: { enabled: false },
      grid: btGridOptions(),
      xaxis: {
        type: 'category',
        categories,
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
        max: effectiveMaxY,
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
          const xIdx  = dataPointIndex;
          const title = `L${xIdx + 1}`;
          const items = series.map((s) => ({
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
  }, [series, isArea, effectiveMaxY, height, categories]);

  return (
    <div className="bt-line-chart">
      <ReactApexChart
        type={isArea ? 'area' : 'line'}
        height={height}
        options={options}
        series={apexSeries}
      />
    </div>
  );
}
