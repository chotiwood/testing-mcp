// BTChartColors — hardcoded per CLAUDE.md §2 (chart-only palette, not tokenized).
// Matches Flutter chart_colors.dart.

export const BTChartColors = {
  /** Default info blue — single-series bars, first line */
  info:     '#0EA5E9',
  /** Darker info — second bar in grouped variant */
  infoBold: '#0F81B4',
  /** Success green — stacked segment 2, second line */
  success:  '#08A94C',
  /** Warning yellow — stacked segment 3, third line */
  warning:  '#EEC513',
  /** Amber orange — stacked segment 4, fourth line */
  amber:    '#F59E0B',
  /** Error red — stacked segment 5, fifth line */
  error:    '#EF4444',
} as const;

/** Default palette for multi-series line / stacked bar (display order). */
export const BT_CHART_DEFAULT_PALETTE: string[] = [
  BTChartColors.info,
  BTChartColors.success,
  BTChartColors.warning,
  BTChartColors.amber,
  BTChartColors.error,
];

/** Default palette for grouped bars (infoBold first, info second). */
export const BT_CHART_GROUPED_PALETTE: string[] = [
  BTChartColors.infoBold,
  BTChartColors.info,
];
