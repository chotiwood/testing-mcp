<script setup lang="ts" generic="T = string">
/**
 * BTDropdownList — floating option list atom.
 * Figma source: node 668-8852.
 *
 * Purely presentational — the caller is responsible for positioning,
 * filtering (handle `update:searchQuery`), and toggling visibility.
 *
 * @example List variant (text-only)
 * <BTDropdownList
 *   :items="[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]"
 *   @select="onSelect"
 * />
 *
 * @example Combobox variant (avatar + name)
 * <BTDropdownList
 *   variant="combobox"
 *   :searchable="true"
 *   v-model:searchQuery="query"
 *   :items="filteredUsers"
 *   @select="onSelectUser"
 * />
 *
 * @example Checkbox multi-select
 * <BTDropdownList
 *   variant="checkbox"
 *   :items="items"
 *   @select="onToggleItem"
 * />
 *
 * @example Radio single-select
 * <BTDropdownList
 *   variant="radio"
 *   :items="items"
 *   @select="onSelectItem"
 * />
 */
import { computed } from 'vue'
import '@/components/ui/dropdown-list/BTDropdownList.css'
import type { BTDropdownListProps, BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types'
import BTCheckbox from '@/components/ui/checkbox/BTCheckbox.vue'
import BTRadioButton from '@/components/ui/radio-button/BTRadioButton.vue'
import BTScrollbar from '@/components/ui/scrollbar/BTScrollbar.vue'
import emptyStateImg from '@/components/ui/dropdown-list/illus/empty-state.svg'
// Intentionally importing a molecule into an atom per product decision —
// search field UX must be consistent with BTInputSearch across the system.
import BTInputSearch from '@/components/ui/input-search/BTInputSearch.vue'

// Avatar color map — mirrors BTAvatar component-specific palette
const AVATAR_COLORS: Record<string, string> = {
  green:  '#89ae68',
  blue:   '#93c6ef',
  orange: '#f0a070',
  purple: '#b39ddb',
  teal:   '#80cbc4',
  pink:   '#f48fb1',
}

const props = withDefaults(defineProps<BTDropdownListProps<T>>(), {
  variant: 'list',
  searchable: false,
  searchQuery: '',
  emptyLabel: 'No result found.',
})

const emit = defineEmits<{
  select: [value: T]
  'update:searchQuery': [query: string]
}>()

const isEmpty = computed(() => props.items.length === 0)
const isCombobox = computed(() => props.variant === 'combobox')
const isCheckbox = computed(() => props.variant === 'checkbox')
const isRadio = computed(() => props.variant === 'radio')

function onItemClick(item: BTDropdownItem<T>) {
  if (!item.disabled && item.value !== undefined) emit('select', item.value)
}

function avatarBg(color?: string): string {
  return AVATAR_COLORS[color ?? 'green'] ?? '#89ae68'
}

function deriveInitials(name: string): string {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return '?'
  const words = trimmed.split(/\s+/)
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase()
  return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase()
}
</script>

<template>
  <div class="bt-dropdown-list" role="listbox">
    <!-- Search bar (optional) -->
    <div v-if="searchable" class="bt-dropdown-list__search">
      <BTInputSearch
        :modelValue="searchQuery"
        placeholder="Search"
        @update:modelValue="emit('update:searchQuery', $event)"
      />
    </div>

    <!-- Items / empty state — scrollable when content exceeds 240px -->
    <div class="bt-dropdown-list__items">
      <BTScrollbar direction="y">
      <template v-if="!isEmpty">
        <div
          v-for="item in items"
          :key="item.value !== undefined ? String(item.value) : item.label"
          :class="[
            'bt-dropdown-list__item',
            isCombobox ? 'bt-dropdown-list__item--combobox' : '',
            isCheckbox || isRadio ? 'bt-dropdown-list__item--selectable' : '',
            item.disabled ? 'bt-dropdown-list__item--disabled' : '',
            item.checked ? 'bt-dropdown-list__item--checked' : '',
          ]"
          role="option"
          :aria-selected="item.checked ?? false"
          :aria-disabled="item.disabled"
          @click="onItemClick(item)"
        >
          <!-- Checkbox control (checkbox variant) -->
          <BTCheckbox
            v-if="isCheckbox"
            :model-value="item.checked ?? false"
            :disabled="item.disabled"
            class="bt-dropdown-list__checkbox"
            @click.stop
          />

          <!-- Radio control — class applied directly so BTRadioButton IS the flex item
               (mirrors Flutter's IgnorePointer > BTRadioButton, no wrapper widget).
               bt-dropdown-list__radio-control merges onto the root <label> via inheritAttrs. -->
          <BTRadioButton
            v-if="isRadio"
            class="bt-dropdown-list__radio-control"
            :modelValue="item.checked ?? false"
            :value="true"
            :disabled="item.disabled"
          />

          <!-- Avatar (combobox only) -->
          <div
            v-if="isCombobox && item.avatar"
            class="bt-dropdown-list__avatar"
            :style="{ background: item.avatar.imageUrl ? undefined : avatarBg(item.avatar.color) }"
            :aria-hidden="true"
          >
            <img
              v-if="item.avatar.imageUrl"
              :src="item.avatar.imageUrl"
              :alt="item.avatar.name"
              style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"
            />
            <span v-else>{{ deriveInitials(item.avatar.name) }}</span>
          </div>

          <span class="bt-dropdown-list__item-label">{{ item.label }}</span>

          <!-- Remove (×) affordance — space-between with label.
               Same path as BTTag.__close (filled-circle × icon, single fill). -->
          <svg
            v-if="item.removable"
            class="bt-dropdown-list__item-remove"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM11 10.29L10.29 11L8 8.71L5.71 11L5 10.29L7.29 8L5 5.71L5.71 5L8 7.29L10.29 5L11 5.71L8.71 8L11 10.29Z" fill="currentColor"/>
          </svg>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="bt-dropdown-list__empty" role="status" aria-live="polite">
        <img :src="emptyStateImg" alt="" class="bt-dropdown-list__empty-image" />
        <span class="bt-dropdown-list__empty-text">{{ emptyLabel }}</span>
      </div>
      </BTScrollbar>
    </div>
  </div>
</template>
