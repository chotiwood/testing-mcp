<script setup lang="ts">
/**
 * BTScrollbar — overflow wrapper with btech token scrollbar styling (Figma 2037:4).
 *
 * Wraps any overflowing content and applies a thin, token-coloured scrollbar.
 * Set an explicit height (or max-height) on the host element for overflow to
 * take effect.
 *
 * @example
 * ```vue
 * // Vertical scroll (default)
 * <BTScrollbar style="height: 300px">
 *   <ul>
 *     <li v-for="i in 100" :key="i">Item {{ i }}</li>
 *   </ul>
 * </BTScrollbar>
 *
 * // Horizontal scroll
 * <BTScrollbar direction="x" style="width: 400px">
 *   <div style="white-space: nowrap; width: 800px">Wide content…</div>
 * </BTScrollbar>
 * ```
 */
import '@/components/ui/scrollbar/BTScrollbar.css';
import { computed } from 'vue';
import type { BTScrollbarProps } from '@/components/ui/scrollbar/BTScrollbar.types';

const props = withDefaults(defineProps<BTScrollbarProps>(), {
  direction: 'y',
});

const rootClass = computed(() => [
  'bt-scrollbar',
  `bt-scrollbar--${props.direction}`,
  props.class,
]);
</script>

<template>
  <div :class="rootClass">
    <slot />
  </div>
</template>
