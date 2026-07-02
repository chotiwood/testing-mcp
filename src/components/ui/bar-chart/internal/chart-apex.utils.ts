// chart-apex.utils.ts — shared ApexCharts option fragments used by all chart types.

import type { ApexOptions } from 'apexcharts';

/** Shared axis label style (10px medium, --text-secondary, Geist). */
export function btAxisLabelStyle(): object {
  return {
    fontFamily: 'var(--typography-font-family-sans, "Geist", system-ui)',
    fontSize: '10px',
    fontWeight: 500,
    colors: 'var(--text-secondary)',
  };
}

/** Shared grid options — horizontal lines only. */
export function btGridOptions(): NonNullable<ApexOptions['grid']> {
  return {
    show: true,
    borderColor: 'var(--border-primary)',
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: 0, right: 8, bottom: 0, left: 4 },
  };
}

/** Shared toolbar / zoom disable config. */
export function btChartBase(): NonNullable<ApexOptions['chart']> {
  return {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'var(--typography-font-family-sans, "Geist", system-ui)',
    background: 'transparent',
    // Entrance animation — plays once when the chart first mounts. Bars grow
    // up from the baseline and lines/areas draw in left→right. animateGradually
    // staggers multi-series so each series eases in just after the previous.
    animations: {
      enabled: true,
      speed: 800,
      animateGradually: { enabled: true, delay: 150 },
      dynamicAnimation: { enabled: true, speed: 350 },
    },
    parentHeightOffset: 0,
  };
}

/**
 * Infer Y-axis max: round the data max up to the nearest 20.
 * Matches Flutter _inferMaxY logic.
 */
export function inferMaxY(values: number[]): number {
  const max = values.length > 0 ? Math.max(...values) : 0;
  if (max === 0) return 100;
  return Math.ceil(max / 20) * 20;
}
