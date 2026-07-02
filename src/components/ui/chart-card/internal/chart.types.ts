// Internal chart types — shared across BTBarChart, BTLineChart, BTCircleChart, BTChartCard.
// Do NOT re-export from component barrels.

/** Single bar datum for BTBarChart basic variant. */
export interface BTBarData {
  value: number;
  /** x-axis label */
  label?: string;
}

/** One rod within a grouped or stacked bar. */
export interface BTBarItem {
  value: number;
  /** CSS color or var(--token) */
  color: string;
  /** Series name shown in tooltip */
  label?: string;
}

/** One x-position group for BTBarChart grouped variant. */
export interface BTBarGroupData {
  /** x-axis label */
  label?: string;
  bars: BTBarItem[];
}

/** One stacked bar for BTBarChart stacked variant. */
export interface BTStackedBarData {
  /** x-axis label */
  label?: string;
  segments: BTBarItem[];
}

/** One (x, y) data point for BTLineChart. */
export interface BTLineSpot {
  x: number;
  y: number;
}

/** One series for BTLineChart. */
export interface BTLineSeries {
  spots: BTLineSpot[];
  /** CSS color or var(--token) */
  color: string;
  /** Series name shown in tooltip */
  label?: string;
}

/** One section for BTCircleChart. */
export interface BTCircleSection {
  value: number;
  /** CSS color or var(--token) */
  color: string;
  /** Section label shown on badge and in tooltip */
  label?: string;
}

/** Legend item shown in BTChartCard. */
export interface BTChartLegendItem {
  label: string;
  /** CSS color or var(--token) */
  color: string;
}

/** Summary metric shown in BTChartCard header area. */
export interface BTChartSummaryItem {
  label: string;
  value: string;
  unit?: string;
}

/** One row inside the chart tooltip balloon. */
export interface BTChartTooltipItem {
  /** Swatch color */
  color: string;
  /** Series name — empty string hides the label column */
  label: string;
  /** Formatted value string */
  value: string;
}
