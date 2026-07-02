<!-- BTToggle — pressable pill toggle atom.
     Figma source: node 2855-1224.
     Caller controls `pressed`; component fires `change(!pressed)` on click.
     Icons via named slots: #leftIcon and #rightIcon.

     @example Default inactive
     <BTToggle label="Option" @change="onToggle" />

     @example Controlled active
     <BTToggle label="Bold" :pressed="isBold" @change="v => isBold = v" />

     @example Outline with left icon
     <BTToggle label="Bold" variant="outline" :pressed="isBold" @change="v => isBold = v">
       <template #leftIcon><BoldIcon /></template>
     </BTToggle>

     @example Disabled
     <BTToggle label="Option" :disabled="true" />
-->
<script setup lang="ts">
import { computed } from 'vue';
import '@/components/ui/toggle/BTToggle.css';
import type { BTToggleProps } from '@/components/ui/toggle/BTToggle.types';

const props = withDefaults(defineProps<BTToggleProps>(), {
  pressed:  false,
  variant:  'default',
  size:     'default',
  disabled: false,
});

const emit = defineEmits<{
  change: [pressed: boolean];
}>();

const cls = computed(() =>
  [
    'bt-toggle',
    `bt-toggle--${props.variant}`,
    props.pressed  ? 'bt-toggle--active' : '',
    props.size === 'small' ? 'bt-toggle--small' : '',
  ]
    .filter(Boolean)
    .join(' '),
);

function handleClick() {
  if (!props.disabled) emit('change', !props.pressed);
}
</script>

<template>
  <button
    :class="cls"
    :disabled="disabled"
    type="button"
    :aria-pressed="pressed"
    data-testid="bt-toggle"
    @click="handleClick"
  >
    <span v-if="$slots.leftIcon" class="bt-toggle__icon bt-toggle__icon--left">
      <slot name="leftIcon" />
    </span>
    <span class="bt-toggle__label">{{ label }}</span>
    <span v-if="$slots.rightIcon" class="bt-toggle__icon bt-toggle__icon--right">
      <slot name="rightIcon" />
    </span>
  </button>
</template>
