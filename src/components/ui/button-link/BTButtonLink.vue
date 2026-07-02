<script setup lang="ts">
/**
 * BTButtonLink — inline hyperlink-style action atom (Figma 480:3197).
 *
 * @example
 * ```ts
 * // <BTButtonLink label="View details" @click="goToDetails" />
 * // <BTButtonLink label="Cancel" variant="secondary" :disabled="loading" @click="handleCancel" />
 * // <BTButtonLink label="Learn more" variant="invert" @click="openUrl" />
 * ```
 */
import '@/components/ui/button-link/BTButtonLink.css';
import type { BTButtonLinkProps } from '@/components/ui/button-link/BTButtonLink.types';

const props = withDefaults(defineProps<BTButtonLinkProps>(), {
  variant: 'primary',
  disabled: false,
});

const emit = defineEmits<{ click: [] }>();

const onClick = () => {
  if (!props.disabled) emit('click');
};
</script>

<template>
  <button
    class="bt-button-link"
    :class="`bt-button-link--${variant}`"
    :disabled="disabled"
    type="button"
    data-testid="bt-button-link"
    @click="onClick"
  >
    <slot name="left-icon" />
    <span class="bt-button-link__label">{{ label }}</span>
    <slot name="right-icon" />
  </button>
</template>
