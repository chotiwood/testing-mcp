<script setup lang="ts">
/**
 * BTCircleChart — pie / donut / donutRounded chart molecule (custom SVG).
 *
 * Figma node 3404:1813 · M - CircleChart
 *
 * Rendered as raw SVG (no ApexCharts) so the web chart mirrors the Flutter
 * widget exactly: hovering (mouse) or tapping (touch) a segment pops it
 * outward and shows a floating BTTooltip, while every segment keeps a radial
 * leader line to its external Label + % badge. Geometry lives in
 * `internal/circle-chart.utils.ts` (shared verbatim with React).
 *
 * @example
 * ```ts
 * <BTCircleChart :sections="sections" variant="donut" />
 * ```
 */
import '@/components/ui/circle-chart/BTCircleChart.css';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { BTCircleSection, BTCircleChartVariant } from '@/components/ui/circle-chart/BTCircleChart.types';
import { buildCircleGeometry } from '@/components/ui/circle-chart/internal/circle-chart.utils';
import BTTooltip from '@/components/ui/tooltip/BTTooltip.vue';

/** Clockwise entrance sweep duration (ms). */
const ENTER_DURATION = 700;

const props = withDefaults(
  defineProps<{
    sections: BTCircleSection[];
    variant?: BTCircleChartVariant;
    /** Width/height of the chart container in px */
    size?: number;
  }>(),
  {
    variant: 'pie',
    size: 208,
  },
);

/**
 * Clockwise entrance sweep (0..1). Tweened from 0→1 once on mount so the
 * chart draws itself in from 12 o'clock, mirroring the Recharts pie.
 */
const reveal = ref(0);
let raf = 0;

onMounted(() => {
  const prefersReduced = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  if (prefersReduced) {
    reveal.value = 1;
    return;
  }
  let start = 0;
  const tick = (now: number) => {
    if (!start) start = now;
    const p = Math.min(1, (now - start) / ENTER_DURATION);
    // easeOutCubic
    reveal.value = 1 - Math.pow(1 - p, 3);
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
});

onBeforeUnmount(() => cancelAnimationFrame(raf));

const geometry = computed(() =>
  buildCircleGeometry(props.sections, props.size, props.variant, reveal.value),
);

/** Index of the hovered / pressed segment, or -1 for none. */
const activeIndex = ref(-1);

const activeSegment = computed(() =>
  activeIndex.value >= 0 ? geometry.value.segments[activeIndex.value] ?? null : null,
);

function activate(index: number) {
  activeIndex.value = index;
}

function clear() {
  activeIndex.value = -1;
}
</script>

<template>
  <div
    class="bt-circle-chart"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @pointerleave="clear"
  >
    <svg
      class="bt-circle-chart__svg"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <!-- Radial connector lines (ring edge → badge), always visible. -->
      <line
        v-for="seg in geometry.segments"
        :key="`line-${seg.index}`"
        :x1="seg.badge.lx1"
        :y1="seg.badge.ly1"
        :x2="seg.badge.lx2"
        :y2="seg.badge.ly2"
        class="bt-circle-chart__connector-line"
      />

      <!-- Segments: filled wedge (pie) or stroked arc (donut/donutRounded). -->
      <g
        v-for="seg in geometry.segments"
        :key="`seg-${seg.index}`"
        class="bt-circle-chart__segment"
        :class="{ 'is-active': seg.index === activeIndex }"
        :style="
          seg.index === activeIndex
            ? { transform: `translate(${seg.popDx}px, ${seg.popDy}px)` }
            : undefined
        "
        @pointerenter="activate(seg.index)"
        @pointerdown="activate(seg.index)"
      >
        <!-- donutRounded knockout border drawn beneath the colored stroke. -->
        <path
          v-if="seg.rounded && geometry.borderWidth > 0"
          :d="seg.path"
          fill="none"
          stroke="var(--bg-primary)"
          :stroke-width="seg.strokeWidth + geometry.borderWidth * 2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          :d="seg.path"
          :fill="seg.filled ? seg.color : 'none'"
          :stroke="seg.filled ? 'none' : seg.color"
          :stroke-width="seg.filled ? 0 : seg.strokeWidth"
          :stroke-linecap="seg.rounded ? 'round' : 'butt'"
          stroke-linejoin="round"
        />
      </g>
    </svg>

    <!-- External badge labels overlay. -->
    <div class="bt-circle-chart__labels">
      <div
        v-for="seg in geometry.segments"
        :key="`badge-${seg.index}`"
        class="bt-circle-chart__badge"
        :style="{ left: `${seg.badge.x}px`, top: `${seg.badge.y}px` }"
      >
        <span v-if="seg.badge.label" class="bt-circle-chart__badge-label">
          {{ seg.badge.label }}
        </span>
        <span class="bt-circle-chart__badge-value">{{ seg.badge.pct }}</span>
      </div>
    </div>

    <!-- Floating tooltip — real BTTooltip anchored at the active segment. -->
    <div
      v-if="activeSegment"
      :key="activeIndex"
      class="bt-circle-chart__tip"
      :style="{ left: `${activeSegment.tipX}px`, top: `${activeSegment.tipY}px` }"
    >
      <BTTooltip :text="activeSegment.tooltip" position="top" :visible="true">
        <span class="bt-circle-chart__tip-anchor" aria-hidden="true" />
      </BTTooltip>
    </div>
  </div>
</template>
