<script setup lang="ts">
/**
 * BTSidebar — collapsible navigation sidebar for desktop layouts.
 * Figma: node 2346-3623 (D-Sidebar).
 * Web only — no Flutter implementation.
 *
 * Composes:
 *   - BTAvatar       (footer user avatar, size="sm")
 *   - BTButton       (toggle button, secondary-light small icon-only)
 *   - BTInputSearch  (search row, when searchValue prop is provided)
 *   - BTSidebarItem  (each interactive nav row)
 *
 * @example
 * ```vue
 * <BTSidebar
 *   :open="sidebarOpen"
 *   :header="{ title: 'Workspace', description: 'Team' }"
 *   :items="navItems"
 *   @toggle="sidebarOpen = !sidebarOpen"
 *   @item-click="handleNav"
 * >
 *   <template #logo>
 *     <img src="/logo.svg" class="bt-sidebar__logo" alt="Workspace" />
 *   </template>
 *   <template #footer>
 *     <BTAvatar :item="{ name: 'John Doe' }" size="sm" />
 *   </template>
 * </BTSidebar>
 * ```
 */
import { ref, computed, provide, watch } from 'vue';
import '@/components/ui/sidebar/BTSidebar.css';
import BTButton from '@/components/ui/button/BTButton.vue';
import BTInputSearch from '@/components/ui/input-search/BTInputSearch.vue';
import BTSidebarItem from '@/components/ui/sidebar/internal/BTSidebarItem.vue';
import { SIDEBAR_INJECTION_KEY } from '@/components/ui/sidebar/internal/BTSidebarContext';
import type { BTSidebarProps, BTSidebarNavItem } from '@/components/ui/sidebar/BTSidebar.types';

const props = withDefaults(defineProps<BTSidebarProps>(), {
  open: true,
  hasScroll: false,
  items: () => [],
  initialExpandedIds: () => [],
});

const emit = defineEmits<{
  toggle: [];
  search: [value: string];
  'item-click': [item: BTSidebarNavItem];
}>();

// ── Provide open state to all descendant BTSidebarItem components ───────────
const openComputed = computed(() => props.open ?? true);
provide(SIDEBAR_INJECTION_KEY, { open: openComputed });

// ── Expand/collapse tracking for items with children ────────────────────────
// Seed with initialExpandedIds so demos (and deep-link navigation) can pre-open items.
const expandedIds = ref<Set<string>>(new Set(props.initialExpandedIds));

// When the sidebar collapses, close all expanded groups so the children
// container (max-height animated) snaps shut — prevents phantom vertical space.
watch(openComputed, (isOpen) => {
  if (!isOpen) {
    expandedIds.value = new Set();
  }
});

function isExpanded(id: string): boolean {
  return expandedIds.value.has(id);
}

function handleItemClick(item: BTSidebarNavItem): void {
  // Toggle expand if item has children
  if (item.children?.length) {
    if (expandedIds.value.has(item.id)) {
      expandedIds.value.delete(item.id);
    } else {
      expandedIds.value.add(item.id);
    }
  }
  emit('item-click', item);
}

// Show search area only when searchValue prop is provided (not undefined)
const hasSearch = computed(() => props.searchValue !== undefined);

// ── Icon mask helper ─────────────────────────────────────────────────────────
// Wraps an icon data-URI in CSS url("...") with double quotes so that single
// quotes inside the SVG XML attributes don't break the CSS url() parser.
function iconMaskStyle(src: string) {
  return {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
  };
}
</script>

<template>
  <aside
    class="bt-sidebar"
    :class="{ 'bt-sidebar--collapsed': !open, 'bt-sidebar--no-header': !header && !$slots.logo }"
    :aria-expanded="open"
  >
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div v-if="header || $slots.logo" class="bt-sidebar__header">
      <!-- Logo slot — accepts any element: <img>, <svg>, custom component, etc. -->
      <slot name="logo" />
      <div
        v-if="header?.title || header?.description"
        class="bt-sidebar__header-text"
      >
        <span v-if="header.title" class="bt-sidebar__header-title">
          {{ header.title }}
        </span>
        <span v-if="header.description" class="bt-sidebar__header-desc">
          {{ header.description }}
        </span>
      </div>
    </div>

    <!-- ── Search + toggle row ────────────────────────────────────────── -->
    <div class="bt-sidebar__search-row">
      <!-- BTInputSearch: flex-1, visible only when open + hasSearch -->
      <div v-if="open && hasSearch" class="bt-sidebar__search-wrapper">
        <BTInputSearch
          :model-value="searchValue ?? ''"
          placeholder="Search..."
          @update:model-value="$emit('search', $event)"
          @search="$emit('search', $event)"
        />
      </div>

      <!-- Toggle button — BTButton secondary-light icon-only.
           Open → |← (horizontal_align_left, minimize)
           Collapsed → →| (horizontal_align_right, expand) -->
      <BTButton
        :icon-only="true"
        variant="secondary-light"
        :size="open ? undefined : 'small'"
        :aria-label="open ? 'Collapse sidebar' : 'Expand sidebar'"
        @click="$emit('toggle')"
      >
        <!-- |← minimize icon (Figma: horizontal_align_left, node 2217:15706) -->
        <svg
          v-if="open"
          class="bt-sidebar__toggle-icon"
          viewBox="0 0 12 10.6667"
          fill="none"
          aria-hidden="true"
        >
          <path d="M0.191667 10.475C0.0638889 10.3472 0 10.1889 0 10V0.666667C0 0.477778 0.0638889 0.319444 0.191667 0.191667C0.319444 0.0638889 0.477778 0 0.666667 0C0.855556 0 1.01389 0.0638889 1.14167 0.191667C1.26944 0.319444 1.33333 0.477778 1.33333 0.666667V10C1.33333 10.1889 1.26944 10.3472 1.14167 10.475C1.01389 10.6028 0.855556 10.6667 0.666667 10.6667C0.477778 10.6667 0.319444 10.6028 0.191667 10.475ZM5.2 6L6.46667 7.26667C6.58889 7.38889 6.65 7.54444 6.65 7.73333C6.65 7.92222 6.58889 8.07778 6.46667 8.2C6.34444 8.32222 6.18889 8.38333 6 8.38333C5.81111 8.38333 5.65556 8.32222 5.53333 8.2L3.13333 5.8C3.06667 5.73333 3.01944 5.66111 2.99167 5.58333C2.96389 5.50556 2.95 5.42222 2.95 5.33333C2.95 5.24444 2.96389 5.16111 2.99167 5.08333C3.01944 5.00556 3.06667 4.93333 3.13333 4.86667L5.53333 2.46667C5.65556 2.34444 5.81111 2.28333 6 2.28333C6.18889 2.28333 6.34444 2.34444 6.46667 2.46667C6.58889 2.58889 6.65 2.74444 6.65 2.93333C6.65 3.12222 6.58889 3.27778 6.46667 3.4L5.2 4.66667H11.3333C11.5222 4.66667 11.6806 4.73056 11.8083 4.85833C11.9361 4.98611 12 5.14444 12 5.33333C12 5.52222 11.9361 5.68056 11.8083 5.80833C11.6806 5.93611 11.5222 6 11.3333 6H5.2Z" fill="currentColor"/>
        </svg>
        <!-- →| expand icon (Figma: horizontal_align_right, node 2346:2654) -->
        <svg
          v-else
          class="bt-sidebar__toggle-icon"
          viewBox="0 0 12 10.6667"
          fill="none"
          aria-hidden="true"
        >
          <path d="M10.8583 10.475C10.7306 10.3472 10.6667 10.1889 10.6667 10V0.666667C10.6667 0.477778 10.7306 0.319444 10.8583 0.191667C10.9861 0.0638889 11.1444 0 11.3333 0C11.5222 0 11.6806 0.0638889 11.8083 0.191667C11.9361 0.319444 12 0.477778 12 0.666667V10C12 10.1889 11.9361 10.3472 11.8083 10.475C11.6806 10.6028 11.5222 10.6667 11.3333 10.6667C11.1444 10.6667 10.9861 10.6028 10.8583 10.475ZM6.8 6H0.666667C0.477778 6 0.319444 5.93611 0.191667 5.80833C0.0638889 5.68056 0 5.52222 0 5.33333C0 5.14444 0.0638889 4.98611 0.191667 4.85833C0.319444 4.73056 0.477778 4.66667 0.666667 4.66667H6.8L5.53333 3.4C5.41111 3.27778 5.35 3.12222 5.35 2.93333C5.35 2.74444 5.41111 2.58889 5.53333 2.46667C5.65556 2.34444 5.81111 2.28333 6 2.28333C6.18889 2.28333 6.34444 2.34444 6.46667 2.46667L8.86667 4.86667C8.93333 4.93333 8.98056 5.00556 9.00833 5.08333C9.03611 5.16111 9.05 5.24444 9.05 5.33333C9.05 5.42222 9.03611 5.50556 9.00833 5.58333C8.98056 5.66111 8.93333 5.73333 8.86667 5.8L6.46667 8.2C6.34444 8.32222 6.18889 8.38333 6 8.38333C5.81111 8.38333 5.65556 8.32222 5.53333 8.2C5.41111 8.07778 5.35 7.92222 5.35 7.73333C5.35 7.54444 5.41111 7.38889 5.53333 7.26667L6.8 6Z" fill="currentColor"/>
        </svg>
      </BTButton>
    </div>

    <!-- ── Navigation items ────────────────────────────────────────────── -->
    <nav
      class="bt-sidebar__nav"
      :class="{ 'bt-sidebar__nav--scroll': hasScroll }"
      aria-label="Navigation"
    >
      <template v-for="item in items" :key="item.id">

        <!-- Divider: always visible — both open and collapsed states -->
        <div
          v-if="item.type === 'Divider'"
          class="bt-sidebar__divider"
          role="separator"
        />

        <!-- Sub Title: visible only when open — hidden when collapsed -->
        <div
          v-else-if="item.type === 'Sub Title' && open"
          class="bt-sidebar__subtitle"
        >
          {{ item.label }}
        </div>

        <!-- Main item: icon row, optionally expandable -->
        <div
          v-else-if="item.type === 'Main'"
          class="bt-sidebar__item-group"
          :class="{ 'bt-sidebar__item-group--expanded': isExpanded(item.id) }"
        >
          <BTSidebarItem
            :item="item"
            :expanded="isExpanded(item.id)"
            @click="handleItemClick"
          >
            <!-- Icon: CSS mask span — background-color changes with active/hover/disabled via CSS -->
            <template v-if="item.icon" #icon>
              <span
                class="bt-sidebar-item__icon"
                aria-hidden="true"
                :style="iconMaskStyle(item.icon)"
              />
            </template>
          </BTSidebarItem>

          <!-- Level-2 children (Submenu items) -->
          <div v-if="item.children?.length" class="bt-sidebar__children">
            <template v-for="sub in item.children" :key="sub.id">
              <div
                v-if="sub.type === 'Submenu'"
                class="bt-sidebar__item-group"
                :class="{ 'bt-sidebar__item-group--expanded': isExpanded(sub.id) }"
              >
                <BTSidebarItem
                  :item="sub"
                  :expanded="isExpanded(sub.id)"
                  @click="handleItemClick"
                >
                  <template #icon>
                    <span class="bt-sidebar-item__dot" aria-hidden="true" />
                  </template>
                </BTSidebarItem>

                <!-- Level-3 children (Sub Submenu items) -->
                <div v-if="sub.children?.length" class="bt-sidebar__children">
                  <BTSidebarItem
                    v-for="subsub in sub.children"
                    :key="subsub.id"
                    :item="subsub"
                    @click="handleItemClick"
                  >
                    <template #icon>
                      <span class="bt-sidebar-item__dot" aria-hidden="true" />
                    </template>
                  </BTSidebarItem>
                </div>
              </div>

              <!-- Flat Sub Submenu directly under Main (uncommon but valid) -->
              <BTSidebarItem
                v-else
                :item="sub"
                @click="handleItemClick"
              >
                <template #icon>
                  <span class="bt-sidebar-item__dot" aria-hidden="true" />
                </template>
              </BTSidebarItem>
            </template>
          </div>
        </div>

        <!-- Flat Submenu / Sub Submenu at root level (graceful fallback).
             Sub Title is excluded: when collapsed it falls through from the
             '&& open' condition above and must render nothing, not a dot row. -->
        <BTSidebarItem
          v-else-if="item.type !== 'Sub Title'"
          :item="item"
          @click="handleItemClick"
        >
          <template #icon>
            <span v-if="(['Submenu', 'Sub Submenu'] as string[]).includes(item.type)" class="bt-sidebar-item__dot" aria-hidden="true" />
            <span
              v-else-if="item.icon"
              class="bt-sidebar-item__icon"
              aria-hidden="true"
              :style="iconMaskStyle(item.icon)"
            />
          </template>
        </BTSidebarItem>

      </template>
    </nav>

    <!-- ── Footer ─────────────────────────────────────────────────────── -->
    <!-- Accepts any content via the #footer named slot. -->
    <div v-if="$slots.footer" class="bt-sidebar__footer">
      <slot name="footer" />
    </div>
  </aside>
</template>
