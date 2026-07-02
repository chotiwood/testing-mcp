<!-- BTLoading — multi-type loading indicator atom.
     Figma source: node 3227:400.
     All visual values (sizes, colors, radii) come from Figma.
-->
<script setup lang="ts">
import { computed } from 'vue';
import { Vue3Lottie } from 'vue3-lottie';
import '@/components/ui/loading/BTLoading.css';
import type { BTLoadingProps } from '@/components/ui/loading/BTLoading.types';
import spinnerData from '@btech/assets/anim/load-spin-anim.json';
import spinnerDataDark from '@btech/assets/anim/load-spin-anim-dark.json';
import pulseData from '@btech/assets/anim/load-pulse-anim.json';
import pulseDataDark from '@btech/assets/anim/load-pulse-anim-dark.json';
import logoData from '@btech/assets/anim/load-btech-anim.json';

const props = withDefaults(defineProps<BTLoadingProps>(), {
  type: 'spinner',
  size: 48,
  width: '100%',
  height: '40px',
});

const isLottie = computed(
  () => props.type === 'spinner' || props.type === 'pulse' || props.type === 'logo',
);
const isThemedLottie = computed(
  () => props.type === 'spinner' || props.type === 'pulse',
);
const isSkeleton = computed(() => props.type === 'skeleton');
const isProgressbar = computed(() => props.type === 'progressbar');

const themedLottieLight = computed(() => {
  if (props.type === 'spinner') return spinnerData;
  if (props.type === 'pulse') return pulseData;
  return null;
});

const themedLottieDark = computed(() => {
  if (props.type === 'spinner') return spinnerDataDark;
  if (props.type === 'pulse') return pulseDataDark;
  return null;
});

const animationData = computed(() => {
  if (props.type === 'logo') return logoData;
  return null;
});

const skeletonStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : (props.height ?? '40px'),
}));

const progressbarStyle = computed(() => {
  if (!props.color) return {};
  return { '--bt-loading-color': props.color } as Record<string, string>;
});

const isIndeterminate = computed(
  () => props.type === 'progressbar' && props.value === undefined,
);

const clampedValue = computed(() =>
  props.value !== undefined ? Math.min(1, Math.max(0, props.value)) : undefined,
);

const barWidth = computed(() => {
  if (isIndeterminate.value) return undefined;
  return `${(clampedValue.value ?? 0) * 100}%`;
});
</script>

<template>
  <!-- Lottie: spinner & pulse (theme-aware), logo -->
  <div
    v-if="isLottie && isThemedLottie"
    class="bt-loading--lottie-themed"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <Vue3Lottie
      class="bt-loading--lottie bt-loading--lottie--light"
      :animation-data="themedLottieLight"
      :width="size"
      :height="size"
      :loop="true"
      :auto-play="true"
    />
    <Vue3Lottie
      class="bt-loading--lottie bt-loading--lottie--dark"
      :animation-data="themedLottieDark"
      :width="size"
      :height="size"
      :loop="true"
      :auto-play="true"
    />
  </div>
  <Vue3Lottie
    v-else-if="isLottie"
    class="bt-loading--lottie"
    :animation-data="animationData"
    :width="size"
    :height="size"
    :loop="true"
    :auto-play="true"
  />

  <!-- Skeleton shimmer block -->
  <div
    v-else-if="isSkeleton"
    class="bt-loading--skeleton"
    :style="skeletonStyle"
    role="status"
    aria-label="Loading"
  />

  <!-- Progress bar -->
  <div
    v-else-if="isProgressbar"
    class="bt-loading--progressbar"
    :style="progressbarStyle"
    role="progressbar"
    :aria-valuenow="clampedValue !== undefined ? Math.round(clampedValue * 100) : undefined"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="bt-loading__progressbar-bar"
      :class="{ 'bt-loading__progressbar-bar--indeterminate': isIndeterminate }"
      :style="barWidth ? { width: barWidth } : {}"
    />
  </div>
</template>
