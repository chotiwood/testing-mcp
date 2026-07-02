<script setup lang="ts">
/**
 * BTButton — interactive action atom.
 * Figma source: node 114:2645.
 * All visual values come from Figma. Token CSS vars from @btech/tokens
 *
 * @example Primary (default)
 * <BTButton label="Save" />
 *
 * @example With left icon
 * <BTButton label="Upload" variant="secondary-light">
 *   <template #leftIcon><UploadIcon /></template>
 * </BTButton>
 *
 * @example Icon only
 * <BTButton :icon-only="true" variant="ghost">
 *   <CloseIcon />
 * </BTButton>
 *
 * @example Disabled
 * <BTButton label="Submit" :disabled="true" />
 */
import { Comment, computed, useSlots } from 'vue'
import type { BTButtonProps } from '@/components/ui/button/BTButton.types'
import '@/components/ui/button/BTButton.css'

const props = withDefaults(defineProps<BTButtonProps>(), {
  variant: 'primary',
  size: 'default',
  disabled: false,
  iconOnly: false,
  label: '',
})

const slots = useSlots()

// Vue 3 slot detection: `slots.rightIcon` is always truthy when parent declares
// the template even with `v-if` returning false. Call the slot function and
// check it actually returns rendered VNodes (filtering out Comment placeholders
// that Vue uses for v-if=false branches).
function hasSlotContent(slotName: string): boolean {
  const slot = slots[slotName]
  if (!slot) return false
  const nodes = slot()
  return nodes.some(
    (n) => n.type !== Comment && (typeof n.children !== 'string' || n.children.trim() !== ''),
  )
}

const btnClass = computed(() => {
  const hasAddon = props.iconOnly && (hasSlotContent('rightIcon') || hasSlotContent('leftIcon'))
  return [
    'bt-button',
    `bt-button--${props.variant}`,
    props.size === 'small' ? 'bt-button--small' : '',
    props.iconOnly ? 'bt-button--icon-only' : '',
    hasAddon ? 'bt-button--has-addon' : '',
  ]
    .filter(Boolean)
    .join(' ')
})
</script>

<template>
  <button
    type="button"
    :class="btnClass"
    :disabled="disabled"
    data-testid="bt-button"
  >
    <!-- Icon-only: renders default slot as the single icon -->
    <!-- Icon-only: icon + optional rightIcon (e.g. BTHint badge) -->
    <template v-if="iconOnly">
      <slot />
      <slot name="rightIcon" />
    </template>

    <!-- Regular: optional left icon · label · optional right icon -->
    <template v-else>
      <slot name="leftIcon" />
      <span v-if="label" class="bt-button__label">{{ label }}</span>
      <slot name="rightIcon" />
    </template>
  </button>
</template>
