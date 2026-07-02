<script setup lang="ts">
/**
 * BTSidebarItem — single interactive nav row inside BTSidebar.
 * Figma: node 159-1729.
 *
 * Handles types: Main, Submenu, Sub Submenu.
 * Sub Title and Divider are rendered by the parent BTSidebar.
 *
 * @example
 * <BTSidebarItem
 *   :item="{ id: 'home', type: 'Main', label: 'Home', active: true }"
 *   :expanded="false"
 *   @click="onItemClick"
 * />
 */
import { inject, computed } from 'vue';
import '@/components/ui/sidebar/internal/BTSidebarItem.css';
import BTTooltip from '@/components/ui/tooltip/BTTooltip.vue';
import type { BTSidebarNavItem } from '@/components/ui/sidebar/BTSidebar.types';
import { SIDEBAR_INJECTION_KEY } from '@/components/ui/sidebar/internal/BTSidebarContext';

interface Props {
  /** The navigation item data. */
  item: BTSidebarNavItem;
  /** Whether this item's submenu children are currently expanded. */
  expanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
});

const emit = defineEmits<{
  click: [item: BTSidebarNavItem];
}>();

// Inject sidebar open state from parent BTSidebar
const ctx = inject(SIDEBAR_INJECTION_KEY);
const sidebarOpen = computed(() => ctx?.open.value ?? true);

function handleClick(): void {
  if (props.item.disabled) return;
  emit('click', props.item);
}

// Type → CSS modifier map
const typeClass = computed(() => {
  const map: Record<string, string> = {
    'Main': 'bt-sidebar-item--main',
    'Submenu': 'bt-sidebar-item--submenu',
    'Sub Submenu': 'bt-sidebar-item--sub-submenu',
  };
  return map[props.item.type] ?? 'bt-sidebar-item--main';
});

// Show chevron when item has children, EXCEPT for Main + disabled (Figma 159-1729)
const showChevron = computed(() => {
  const { item } = props;
  if (!item.children?.length) return false;
  if (item.type === 'Main' && item.disabled) return false;
  return true;
});

// Tooltip: only for Main items when sidebar is collapsed
const tooltipDisabled = computed(
  () => sidebarOpen.value || props.item.type !== 'Main' || !props.item.label,
);
</script>

<template>
  <BTTooltip
    :text="item.label"
    position="right"
    :disabled="tooltipDisabled"
    :show-delay="200"
    compact
  >
    <div
      class="bt-sidebar-item"
      :class="[
        typeClass,
        item.active && 'bt-sidebar-item--active',
        item.disabled && 'bt-sidebar-item--disabled',
        expanded && 'bt-sidebar-item--expanded',
        !sidebarOpen && 'bt-sidebar-item--collapsed',
      ]"
      role="button"
      :tabindex="item.disabled ? -1 : 0"
      :aria-disabled="item.disabled || undefined"
      :aria-expanded="item.children?.length ? expanded : undefined"
      @click="handleClick"
      @keydown.enter.space.prevent="handleClick"
    >
      <!-- Left icon slot — empty means no space, label shifts left -->
      <slot name="icon" />

      <!-- Label (hidden via CSS in collapsed mode) -->
      <span class="bt-sidebar-item__label">{{ item.label }}</span>

      <!-- Chevron — data-driven; Main+disabled has none (Figma spec) -->
      <svg
        v-if="showChevron"
        class="bt-sidebar-item__chevron"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </BTTooltip>
</template>
