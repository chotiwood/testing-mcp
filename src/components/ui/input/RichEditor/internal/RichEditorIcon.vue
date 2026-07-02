<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{ src: string; alt?: string; size?: 16 | 24 }>(),
  { size: 16 },
);

/** Normalize bundler asset imports and quote for CSS `url()`. */
function maskImageUrl(src: unknown): string | undefined {
  const url = typeof src === 'string' ? src : (src as { src?: string })?.src;
  if (!url) return undefined;
  // Data URLs contain commas; unquoted `url(data:image/svg+xml,...)` breaks parsing.
  return `url('${url.replace(/'/g, '%27')}')`;
}

const maskStyle = computed(() => {
  const mask = maskImageUrl(props.src);
  return mask ? { WebkitMaskImage: mask, maskImage: mask } : {};
});
</script>

<template>
  <span
    class="bt-input-rich-editor__masked-icon"
    :class="{ 'bt-input-rich-editor__masked-icon--24': props.size === 24 }"
    :style="maskStyle"
    :role="props.alt ? 'img' : undefined"
    :aria-label="props.alt"
    :aria-hidden="props.alt ? undefined : true"
  />
</template>
