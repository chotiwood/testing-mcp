// circle-chart.utils.ts — pure geometry for the custom-SVG BTCircleChart.
//
// BTCircleChart is rendered as raw SVG (no ApexCharts) so the web donut can
// mirror the Flutter widget exactly: tap/hover a segment → it pops outward,
// a floating tooltip appears, and a radial leader line connects each segment
// to its external Label + % badge.
//
// All dimensions are expressed as ratios of the Flutter baseline `size = 178`
// (outer radius 70, donut inner 36, donutRounded inner 40, segment gap 4,
// badge offset 30, connector gap 3 + length 10, pop-out 8) so the rendering is
// pixel-identical to Flutter at any `size`.
//
// This file is shared verbatim between the Vue and React packages.

import type { BTCircleSection } from '@/components/ui/circle-chart/internal/chart.types';

export type BTCircleChartVariant = 'pie' | 'donut' | 'donutRounded';

/** Flutter baseline the ratios below are derived from. */
const BASE = 178;
/** Outer radius as a fraction of the half-size (70 / 89). */
const OUTER_RATIO = 70 / 89;
/** Center-hole radius as a fraction of the half-size, per variant. */
const INNER_RATIO: Record<BTCircleChartVariant, number> = {
  pie: 0,
  donut: 36 / 89,
  donutRounded: 40 / 89,
};

export interface CircleBadge {
  /** Badge center (label + %). */
  x: number;
  y: number;
  /** Connector line: ring edge → badge. */
  lx1: number;
  ly1: number;
  lx2: number;
  ly2: number;
  label: string;
  pct: string;
}

export interface CircleSegment {
  index: number;
  color: string;
  /** Filled wedge (pie) vs stroked arc (donut / donutRounded). */
  filled: boolean;
  /** SVG path data for the colored shape. */
  path: string;
  /** Stroke width for arcs (ring thickness); 0 for filled wedges. */
  strokeWidth: number;
  /** Rounded line-cap (donutRounded only). */
  rounded: boolean;
  /** Pop-out translation along the segment mid-angle (active state). */
  popDx: number;
  popDy: number;
  /** Anchor point (on the ring, along the mid-angle) for the BTTooltip. */
  tipX: number;
  tipY: number;
  /** Tooltip headline, e.g. "A 40%" or "40%". */
  tooltip: string;
  badge: CircleBadge;
}

export interface CircleGeometry {
  size: number;
  cx: number;
  cy: number;
  outerR: number;
  innerR: number;
  /** Background-colored "knockout" stroke width for donutRounded borders. */
  borderWidth: number;
  segments: CircleSegment[];
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Stroked arc along `r` from `a1`→`a2` (deg). Splits a full circle into two. */
function arcPath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const sweep = a2 - a1;
  if (sweep >= 359.999) {
    const mid = a1 + 180;
    const p0 = polar(cx, cy, r, a1);
    const p1 = polar(cx, cy, r, mid);
    const p2 = polar(cx, cy, r, a2 - 0.001);
    return (
      `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 1 ${p1.x} ${p1.y} ` +
      `A ${r} ${r} 0 1 1 ${p2.x} ${p2.y}`
    );
  }
  const start = polar(cx, cy, r, a1);
  const end = polar(cx, cy, r, a2);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Filled wedge (pie) from center, `a1`→`a2` (deg). */
function wedgePath(cx: number, cy: number, r: number, a1: number, a2: number): string {
  const sweep = a2 - a1;
  if (sweep >= 359.999) {
    // Full disk — two half-arcs back to start.
    const p0 = polar(cx, cy, r, a1);
    const p1 = polar(cx, cy, r, a1 + 180);
    return (
      `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 1 ${p1.x} ${p1.y} ` +
      `A ${r} ${r} 0 1 1 ${p0.x} ${p0.y} Z`
    );
  }
  const start = polar(cx, cy, r, a1);
  const end = polar(cx, cy, r, a2);
  const largeArc = sweep > 180 ? 1 : 0;
  return (
    `M ${cx} ${cy} L ${start.x} ${start.y} ` +
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
  );
}

/**
 * Build all rendering geometry for a circle chart.
 * Angles start at -90° (12 o'clock) and walk clockwise, matching Flutter's
 * `startDegreeOffset: -90`.
 */
export function buildCircleGeometry(
  sections: BTCircleSection[],
  size: number,
  variant: BTCircleChartVariant,
  /**
   * Entrance reveal fraction (0..1). Acts as a single clockwise "hand" that
   * sweeps from 12 o'clock: segment paths are clipped to the cumulative angle
   * `-90° + 360°·reveal`, so the chart draws itself in clockwise (like the
   * Recharts pie). Badge/connector positions stay at their final angle.
   * Defaults to 1 (fully drawn).
   */
  reveal = 1,
): CircleGeometry {
  const half = size / 2;
  const cx = half;
  const cy = half;
  const k = size / BASE; // px scale relative to the Flutter baseline

  const outerR = half * OUTER_RATIO;
  const innerR = half * INNER_RATIO[variant];
  const isPie = variant === 'pie';
  const isRounded = variant === 'donutRounded';

  const strokeWidth = isPie ? 0 : outerR - innerR;
  const midR = (innerR + outerR) / 2;
  // Tooltip anchor radius — on the ring (donut) or 60% out (pie), so the
  // balloon floats just above the touched part of the chart, like Flutter.
  const tipR = isPie ? outerR * 0.6 : midR;
  const borderWidth = isRounded ? 2 * k : 0;

  // Connector + badge offsets (Flutter: gap 3, length 10, badge 30; pop 8).
  const lineR1 = outerR + 3 * k;
  const lineR2 = outerR + 13 * k;
  const badgeR = outerR + 30 * k;
  const pop = 8 * k;

  // donutRounded segment gap (Flutter: 4px at mid-radius), as an angle.
  const gapDeg = isRounded && midR > 0 ? ((4 * k) / midR) * (180 / Math.PI) : 0;

  const total = sections.reduce((s, sec) => s + sec.value, 0);
  if (total <= 0) {
    return { size, cx, cy, outerR, innerR, borderWidth, segments: [] };
  }

  // Clockwise reveal boundary — segments are drawn only up to this angle.
  const revealMax = -90 + 360 * Math.max(0, Math.min(1, reveal));

  let cum = -90;
  const segments: CircleSegment[] = sections.map((sec, index) => {
    const sweep = (sec.value / total) * 360;
    const mid = cum + sweep / 2;
    const midRad = (mid * Math.PI) / 180;

    // Arc endpoints (shrunk by the rounded gap, half on each side).
    const a1 = cum + gapDeg / 2;
    const a2 = cum + sweep - gapDeg / 2;
    cum += sweep;

    // Clip the drawn end to the reveal hand; skip segments not yet reached.
    const drawnEnd = Math.min(a2, revealMax);
    const visible = drawnEnd > a1 + 0.0001;
    const path = !visible
      ? ''
      : isPie
        ? wedgePath(cx, cy, outerR, a1, drawnEnd)
        : arcPath(cx, cy, midR, a1, Math.max(drawnEnd, a1));

    const pct = (sec.value / total) * 100;
    const pctText = `${pct.toFixed(0)}%`;
    const label = sec.label ?? '';
    const tooltip = label ? `${label} ${pctText}` : pctText;

    return {
      index,
      color: sec.color,
      filled: isPie,
      path,
      strokeWidth,
      rounded: isRounded,
      popDx: pop * Math.cos(midRad),
      popDy: pop * Math.sin(midRad),
      tipX: cx + tipR * Math.cos(midRad),
      tipY: cy + tipR * Math.sin(midRad),
      tooltip,
      badge: {
        x: cx + badgeR * Math.cos(midRad),
        y: cy + badgeR * Math.sin(midRad),
        lx1: cx + lineR1 * Math.cos(midRad),
        ly1: cy + lineR1 * Math.sin(midRad),
        lx2: cx + lineR2 * Math.cos(midRad),
        ly2: cy + lineR2 * Math.sin(midRad),
        label,
        pct: pctText,
      },
    };
  });

  return { size, cx, cy, outerR, innerR, borderWidth, segments };
}
