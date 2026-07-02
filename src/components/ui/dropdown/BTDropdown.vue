<script setup lang="ts" generic="T = string">
/**
 * BTDropdown — composable dropdown molecule.
 *
 * Handles overlay positioning internally. Provides a default trigger button
 * (BTButton secondaryWhite + chevron) or a custom trigger via the `trigger`
 * slot.
 *
 * @example Simple list
 * ```vue
 * <BTDropdown v-model:value="selected" :items="options" label="Status" />
 * ```
 *
 * @example Checkbox multi-select
 * ```vue
 * <BTDropdown
 *   variant="checkbox"
 *   :items="options"
 *   :values="selectedValues"
 *   label="Assignees"
 *   @multiSelect="selectedValues = $event"
 * />
 * ```
 *
 * @example Custom trigger
 * ```vue
 * <BTDropdown :items="options">
 *   <template #trigger="{ toggle, isOpen }">
 *     <BTButton @click="toggle">{{ isOpen ? 'Close' : 'Open' }}</BTButton>
 *   </template>
 * </BTDropdown>
 * ```
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import '@/components/ui/dropdown/BTDropdown.css'
import type { BTDropdownProps } from '@/components/ui/dropdown/BTDropdown.types'
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types'
import BTDropdownList from '@/components/ui/dropdown-list/BTDropdownList.vue'
import BTButton from '@/components/ui/button/BTButton.vue'

const props = withDefaults(defineProps<BTDropdownProps<T>>(), {
  variant: 'list',
  label: 'Select',
  align: 'start',
  searchable: false,
  emptyLabel: 'No result found.',
})

const emit = defineEmits<{
  select: [value: T]
  multiSelect: [values: T[]]
  open: []
  close: []
  'update:value': [value: T]
  'update:values': [values: T[]]
}>()

const isOpen     = ref(false)
const openAbove  = ref(false)
const searchQuery = ref('')
const rootRef    = ref<HTMLElement | null>(null)
const listRef    = ref<HTMLElement | null>(null)

// ── Open / close ────────────────────────────────────────────────────────────

function open() {
  isOpen.value = true
  searchQuery.value = ''
  emit('open')
}

function close() {
  isOpen.value = false
  emit('close')
}

function toggle() {
  isOpen.value ? close() : open()
}

// ── Click-outside ────────────────────────────────────────────────────────────
// Simple document-level listener instead of a custom directive —
// no external package needed.

function onDocumentClick(event: MouseEvent) {
  if (!isOpen.value) return
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick, true))
onUnmounted(() => document.removeEventListener('click', onDocumentClick, true))

// ── Selection ────────────────────────────────────────────────────────────────

function handleSelect(value: T) {
  emit('select', value)
  emit('update:value', value)

  if (props.variant === 'checkbox') {
    const current = Array.isArray(props.values) ? [...props.values] : []
    const idx = current.indexOf(value)
    if (idx === -1) {
      current.push(value)
    } else {
      current.splice(idx, 1)
    }
    emit('multiSelect', current)
    emit('update:values', current)
    // Checkbox stays open — intentional for multi-select UX.
  } else {
    close()
  }
}

// ── Resolved items with checked state ───────────────────────────────────────

const resolvedItems = computed<BTDropdownItem<T>[]>(() =>
  props.items.map((item) => {
    const isChecked =
      props.variant === 'checkbox'
        ? (item.value !== undefined && (props.values?.includes(item.value) ?? item.checked ?? false))
        : props.variant === 'radio'
          ? props.value === item.value
          : (item.checked ?? false)
    return { ...item, checked: isChecked }
  }),
)

const filteredItems = computed<BTDropdownItem<T>[]>(() => {
  if (!props.searchable || !searchQuery.value) return resolvedItems.value
  const q = searchQuery.value.toLowerCase()
  return resolvedItems.value.filter((i) =>
    (i.label ?? '').toLowerCase().includes(q),
  )
})

// ── Auto-flip: position above when not enough space below ────────────────────

function updateFlip() {
  const root = rootRef.value
  const list = listRef.value
  if (!root || !list) return
  const triggerRect = root.getBoundingClientRect()
  const listHeight  = list.getBoundingClientRect().height
  const spaceBelow  = window.innerHeight - triggerRect.bottom - 4
  const spaceAbove  = triggerRect.top - 4
  openAbove.value = spaceBelow < listHeight && spaceAbove >= listHeight
}

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  updateFlip()
  window.addEventListener('resize', updateFlip)
  window.addEventListener('scroll', updateFlip, true)
}, { immediate: false })

watch(isOpen, (open) => {
  if (!open) {
    window.removeEventListener('resize', updateFlip)
    window.removeEventListener('scroll', updateFlip, true)
  }
})

// Expose toggle for parent refs (uncommon but useful for headless patterns)
defineExpose({ open, close, toggle })
</script>

<template>
  <div ref="rootRef" class="bt-dropdown">
    <!-- Custom trigger slot -->
    <slot name="trigger" :toggle="toggle" :isOpen="isOpen">
      <!-- Default trigger — BTButton secondaryWhite + animated chevron -->
      <BTButton
        variant="secondary-white"
        :label="label"
        @click="toggle"
      />
    </slot>

    <!-- Floating dropdown list -->
    <div
      v-if="isOpen"
      ref="listRef"
      :class="['bt-dropdown__list', `bt-dropdown__list--align-${align}`, openAbove && 'bt-dropdown__list--above']"
    >
      <BTDropdownList
        :variant="variant"
        :items="filteredItems"
        :searchable="searchable"
        :searchQuery="searchQuery"
        :emptyLabel="emptyLabel"
        @select="handleSelect"
        @update:searchQuery="searchQuery = $event"
      />
    </div>
  </div>
</template>
