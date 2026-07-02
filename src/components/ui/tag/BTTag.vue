<!-- BTTag — removable pill label atom.
     Figma source: node 3050-6361.
     Left icon: named slot `icon`. Close button: shown when onRemove prop is set.
-->
<script setup lang="ts">
import { computed } from 'vue';
import '@/components/ui/tag/BTTag.css';
import type { BTTagProps } from '@/components/ui/tag/BTTag.types';

const props = withDefaults(defineProps<BTTagProps>(), {
  variant: 'default',
});

const tagClass = computed(() =>
  ['bt-tag', `bt-tag--${props.variant}`].join(' '),
);
</script>

<template>
  <span :class="tagClass" data-testid="bt-tag">
    <span v-if="$slots.icon" class="bt-tag__icon">
      <slot name="icon" />
    </span>
    <span class="bt-tag__label">{{ label }}</span>
    <button
      v-if="onRemove"
      class="bt-tag__close"
      aria-label="Remove tag"
      type="button"
      @click.stop="onRemove"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM11 10.29L10.29 11L8 8.71L5.71 11L5 10.29L7.29 8L5 5.71L5.71 5L8 7.29L10.29 5L11 5.71L8.71 8L11 10.29Z" fill="currentColor"/>
      </svg>
    </button>
  </span>
</template>
