'use client';
/**
 * BTCircleChart — pie / donut / donutRounded chart molecule (custom SVG).
 *
 * Figma node 3404:1813 · M - CircleChart
 *
 * Rendered as raw SVG (no ApexCharts) so the web chart mirrors the Flutter
 * widget exactly: hovering (mouse) or tapping (touch) a segment pops it
 * outward and shows a floating BTTooltip, while every segment keeps a radial
 * leader line to its external Label + % badge. Geometry lives in
 * `internal/circle-chart.utils.ts` (shared verbatim with Vue).
 *
 * @example
 * ```tsx
 * <BTCircleChart sections={sections} variant="donut" />
 * ```
 */
import '@/components/ui/circle-chart/BTCircleChart.css';
import { useEffect, useMemo, useState } from 'react';
import type { BTCircleSection, BTCircleChartVariant } from '@/components/ui/circle-chart/BTCircleChart.types';
import { buildCircleGeometry } from '@/components/ui/circle-chart/internal/circle-chart.utils';
import { BTTooltip } from '@/components/ui/tooltip/BTTooltip';

/** Clockwise entrance sweep duration (ms). */
const ENTER_DURATION = 700;

export interface BTCircleChartProps {
  sections: BTCircleSection[];
  variant?: BTCircleChartVariant;
  /** Width/height in px */
  size?: number;
}

export function BTCircleChart({
  sections,
  variant = 'pie',
  size = 208,
}: BTCircleChartProps) {
  /**
   * Clockwise entrance sweep (0..1). Tweened from 0→1 once on mount so the
   * chart draws itself in from 12 o'clock, mirroring the Recharts pie.
   */
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setReveal(1);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / ENTER_DURATION);
      // easeOutCubic
      setReveal(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const geometry = useMemo(
    () => buildCircleGeometry(sections, size, variant, reveal),
    [sections, size, variant, reveal],
  );

  /** Index of the hovered / pressed segment, or -1 for none. */
  const [activeIndex, setActiveIndex] = useState(-1);

  const activeSegment =
    activeIndex >= 0 ? geometry.segments[activeIndex] ?? null : null;

  return (
    <div
      className="bt-circle-chart"
      style={{ width: size, height: size }}
      onPointerLeave={() => setActiveIndex(-1)}
    >
      <svg
        className="bt-circle-chart__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Radial connector lines (ring edge → badge), always visible. */}
        {geometry.segments.map((seg) => (
          <line
            key={`line-${seg.index}`}
            x1={seg.badge.lx1}
            y1={seg.badge.ly1}
            x2={seg.badge.lx2}
            y2={seg.badge.ly2}
            className="bt-circle-chart__connector-line"
          />
        ))}

        {/* Segments: filled wedge (pie) or stroked arc (donut/donutRounded). */}
        {geometry.segments.map((seg) => (
          <g
            key={`seg-${seg.index}`}
            className={`bt-circle-chart__segment${seg.index === activeIndex ? ' is-active' : ''}`}
            style={
              seg.index === activeIndex
                ? { transform: `translate(${seg.popDx}px, ${seg.popDy}px)` }
                : undefined
            }
            onPointerEnter={() => setActiveIndex(seg.index)}
            onPointerDown={() => setActiveIndex(seg.index)}
          >
            {/* donutRounded knockout border drawn beneath the colored stroke. */}
            {seg.rounded && geometry.borderWidth > 0 && (
              <path
                d={seg.path}
                fill="none"
                stroke="var(--bg-primary)"
                strokeWidth={seg.strokeWidth + geometry.borderWidth * 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <path
              d={seg.path}
              fill={seg.filled ? seg.color : 'none'}
              stroke={seg.filled ? 'none' : seg.color}
              strokeWidth={seg.filled ? 0 : seg.strokeWidth}
              strokeLinecap={seg.rounded ? 'round' : 'butt'}
              strokeLinejoin="round"
            />
          </g>
        ))}
      </svg>

      {/* External badge labels overlay. */}
      <div className="bt-circle-chart__labels">
        {geometry.segments.map((seg) => (
          <div
            key={`badge-${seg.index}`}
            className="bt-circle-chart__badge"
            style={{ left: seg.badge.x, top: seg.badge.y }}
          >
            {seg.badge.label && (
              <span className="bt-circle-chart__badge-label">{seg.badge.label}</span>
            )}
            <span className="bt-circle-chart__badge-value">{seg.badge.pct}</span>
          </div>
        ))}
      </div>

      {/* Floating tooltip — real BTTooltip anchored at the active segment. */}
      {activeSegment && (
        <div
          key={activeIndex}
          className="bt-circle-chart__tip"
          style={{ left: activeSegment.tipX, top: activeSegment.tipY }}
        >
          <BTTooltip text={activeSegment.tooltip} position="top" visible>
            <span className="bt-circle-chart__tip-anchor" aria-hidden="true" />
          </BTTooltip>
        </div>
      )}
    </div>
  );
}
