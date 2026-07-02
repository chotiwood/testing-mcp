<script setup lang="ts">
/**
 * BTPagination — data pagination molecule.
 * Figma: node 749-2846.
 *
 * @example number
 * ```vue
 * <BTPagination
 *   :current-page="page"
 *   :total-pages="20"
 *   @page-change="page = $event"
 * />
 * ```
 *
 * @example display
 * ```vue
 * <BTPagination
 *   variant="display"
 *   :current-page="page"
 *   :total-count="137"
 *   :rows-per-page="rowsPerPage"
 *   :rows-per-page-options="[10, 20, 50]"
 *   @page-change="page = $event"
 *   @rows-change="rowsPerPage = $event"
 * />
 * ```
 *
 * @example step
 * ```vue
 * <BTPagination
 *   variant="step"
 *   :current-step="step"
 *   :total-steps="5"
 *   @prev="step > 1 && step--"
 *   @next="step < 5 && step++"
 * />
 * ```
 */
import '@/components/ui/pagination/BTPagination.css';
import { computed } from 'vue';
import type { BTPaginationProps } from '@/components/ui/pagination/BTPagination.types';
import BTStepNumber from '@/components/ui/step-number/BTStepNumber.vue';
import BTDropdown from '@/components/ui/dropdown/BTDropdown.vue';
import BTButton from '@/components/ui/button/BTButton.vue';
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';

const props = withDefaults(defineProps<BTPaginationProps>(), {
  variant: 'number',
  currentPage: 1,
  totalPages: 1,
  rowsPerPage: 10,
  rowsPerPageOptions: () => [10, 20, 50],
  currentStep: 1,
  totalSteps: 1,
  ariaLabel: 'Pagination',
});

const emit = defineEmits<{
  'page-change': [page: number];
  'rows-change': [rows: number];
  'prev': [];
  'next': [];
}>();

// ── Computed ──────────────────────────────────────────────────────────────────

const isFirstPage = computed(() => props.currentPage <= 1);
const isLastPage  = computed(() => props.currentPage >= props.totalPages);

type PageItem = number | 'ellipsis';

const visiblePages = computed((): PageItem[] => {
  const { totalPages, currentPage } = props;
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ];
});

/** Rows-per-page options mapped to BTDropdownItem list. */
const rowsItems = computed<BTDropdownItem<number>[]>(() =>
  props.rowsPerPageOptions.map((opt) => ({
    value: opt,
    label: String(opt),
    checked: opt === props.rowsPerPage,
  })),
);

// ── Methods ───────────────────────────────────────────────────────────────────

function goTo(page: number) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return;
  emit('page-change', page);
}

function goPrev() {
  if (!isFirstPage.value) goTo(props.currentPage - 1);
}

function goNext() {
  if (!isLastPage.value) goTo(props.currentPage + 1);
}

function goFirst() {
  goTo(1);
}

function goLast() {
  goTo(props.totalPages);
}

// ── RTL handling ─────────────────────────────────────────────────────────────
// No special detection needed — the component auto-mirrors via CSS logical
// properties + native flex direction. Labels stay tied to their semantic
// button (Previous → page-1, Next → page+1); in RTL the flex auto-reverses
// so "Previous" visually sits on the right and "Next" on the left, matching
// the reader's expectation. Chevron SVGs are mirrored via scoped CSS in
// BTPagination.css (not global) so they always point the right way.
</script>

<template>
  <nav
    class="bt-pagination"
    :class="`bt-pagination--${variant}`"
    role="navigation"
    :aria-label="ariaLabel"
  >
    <!-- ── NUMBER variant ─────────────────────────────────────────────────── -->
    <template v-if="variant === 'number'">
      <!-- Left nav -->
      <div class="bt-pagination__nav">
        <!-- First page -->
        <BTButton variant="ghost" size="small" :icon-only="true" :disabled="isFirstPage" aria-label="First page" @click="goFirst">
          <span class="bt-pagination__icon">
            <!-- viewBox pads the 8.27×8 path to match Figma's 25% inset inside a 16px icon container -->
            <svg viewBox="-4 -4 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0 8V0H1.33333V8H0ZM7.33333 8L3.33333 4L7.33333 0L8.26667 0.933333L5.2 4L8.26667 7.06667L7.33333 8Z" fill="currentColor"/>
            </svg>
          </span>
        </BTButton>
        <!-- Previous -->
        <BTButton variant="ghost" size="small" label="Previous" :disabled="isFirstPage" aria-label="Previous page" @click="goPrev">
          <template #leftIcon>
            <span class="bt-pagination__icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor"/>
              </svg>
            </span>
          </template>
        </BTButton>
      </div>

      <!-- Center pages — BTStepNumber pills -->
      <div class="bt-pagination__pages" role="list">
        <BTStepNumber
          v-for="(page, idx) in visiblePages"
          :key="page === 'ellipsis' ? `ellipsis-${idx}` : page"
          :page="page === 'ellipsis' ? 0 : (page as number)"
          :isActive="page !== 'ellipsis' && page === currentPage"
          :isEllipsis="page === 'ellipsis'"
          role="listitem"
          @click="page !== 'ellipsis' && goTo(page as number)"
        />
      </div>

      <!-- Right nav -->
      <div class="bt-pagination__nav">
        <!-- Next -->
        <BTButton variant="ghost" size="small" label="Next" :disabled="isLastPage" aria-label="Next page" @click="goNext">
          <template #rightIcon>
            <span class="bt-pagination__icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="currentColor"/>
              </svg>
            </span>
          </template>
        </BTButton>
        <!-- Last page -->
        <BTButton variant="ghost" size="small" :icon-only="true" :disabled="isLastPage" aria-label="Last page" @click="goLast">
          <span class="bt-pagination__icon">
            <!-- viewBox pads the 8.27×8 path to match Figma's 25% inset inside a 16px icon container -->
            <svg viewBox="-4 -4 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0.933333 8L0 7.06667L3.06667 4L0 0.933333L0.933333 0L4.93333 4L0.933333 8ZM6.93333 8V0H8.26667V8H6.93333Z" fill="currentColor"/>
            </svg>
          </span>
        </BTButton>
      </div>
    </template>

    <!-- ── DISPLAY variant ────────────────────────────────────────────────── -->
    <template v-else-if="variant === 'display'">
      <!-- Left: rows per page via BTDropdown -->
      <div class="bt-pagination__display-left">
        <span class="bt-pagination__rows-label">Rows per page</span>
        <BTDropdown
          :items="rowsItems"
          :value="rowsPerPage"
          @select="emit('rows-change', $event)"
        >
          <template #trigger="{ toggle, isOpen }">
            <button
              class="bt-pagination__rows-trigger"
              :class="{ 'bt-pagination__rows-trigger--open': isOpen }"
              :aria-label="`Rows per page, currently ${rowsPerPage}`"
              :aria-expanded="isOpen"
              @click="toggle"
            >
              {{ rowsPerPage }}
              <span class="bt-pagination__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  class="bt-pagination__rows-chevron-icon"
                  :class="{ 'bt-pagination__rows-chevron-icon--open': isOpen }"
                >
                  <path d="M7.41 8.59L12 13.17L16.59 8.59L18 10L12 16L6 10L7.41 8.59Z" fill="currentColor"/>
                </svg>
              </span>
            </button>
          </template>
        </BTDropdown>
      </div>

      <!-- Right: prev/next -->
      <div class="bt-pagination__nav">
        <BTButton variant="ghost" size="small" label="Previous" :disabled="isFirstPage" aria-label="Previous page" @click="goPrev">
          <template #leftIcon>
            <span class="bt-pagination__icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor"/>
              </svg>
            </span>
          </template>
        </BTButton>
        <BTButton variant="ghost" size="small" label="Next" :disabled="isLastPage" aria-label="Next page" @click="goNext">
          <template #rightIcon>
            <span class="bt-pagination__icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="currentColor"/>
              </svg>
            </span>
          </template>
        </BTButton>
      </div>
    </template>

    <!-- ── STEP variant ───────────────────────────────────────────────────── -->
    <template v-else-if="variant === 'step'">
      <!-- Left: step label -->
      <span class="bt-pagination__step-label">Step {{ currentStep }} of {{ totalSteps }}</span>

      <!-- Right: Prev / Next — secondary-light, 16px gap -->
      <div class="bt-pagination__nav bt-pagination__nav--step">
        <BTButton
          variant="secondary-light"
          label="Prev"
          :disabled="currentStep <= 1"
          aria-label="Previous step"
          @click="emit('prev')"
        />
        <BTButton
          variant="secondary-light"
          label="Next"
          :disabled="currentStep >= totalSteps"
          aria-label="Next step"
          @click="emit('next')"
        />
      </div>
    </template>
  </nav>
</template>
