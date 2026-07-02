<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { positionCentered } from '@/components/ui/calendar/internal/positionFloating';
import BTDropdownList from '@/components/ui/dropdown-list/BTDropdownList.vue';

interface BTCalendarHeaderProps {
  displayDate: Date;
  locale?: string;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

const props = withDefaults(defineProps<BTCalendarHeaderProps>(), {
  locale: 'id-ID',
  canGoPrev: true,
  canGoNext: true,
});

const emit = defineEmits<{
  prev: [];
  next: [];
  'select-month': [date: Date];
  'select-year': [date: Date];
}>();

// ── Local open state ──────────────────────────────────────────────────────────

const isMonthOpen = ref(false);
const isYearOpen = ref(false);
const monthPillRef = ref<HTMLElement | null>(null);
const yearPillRef = ref<HTMLElement | null>(null);
const monthDropdownRef = ref<HTMLElement | null>(null);
const yearDropdownRef = ref<HTMLElement | null>(null);
const monthDropdownStyle = ref<Record<string, string>>({});
const yearDropdownStyle = ref<Record<string, string>>({});

// Direction for the teleported dropdowns — Teleport-to-body breaks the
// inherited dir="rtl" from the calendar's ancestor, so we set it explicitly
// from the locale.
const dropdownDir = computed<'ltr' | 'rtl'>(() =>
  props.locale.startsWith('ar') ||
  props.locale.startsWith('he') ||
  props.locale.startsWith('iw')
    ? 'rtl'
    : 'ltr',
);

// ── Dropdown items ────────────────────────────────────────────────────────────

const monthItems = computed(() => {
  const year = props.displayDate.getFullYear();
  const current = props.displayDate.getMonth();
  return Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: new Date(year, i, 1).toLocaleDateString(props.locale, { month: 'long' }),
    checked: i === current,
  }));
});

const allYearItems = computed(() => {
  const current = props.displayDate.getFullYear();
  const from = Math.max(1924, current - 100);
  const to = Math.min(2124, current + 100);
  const items = [];
  for (let y = from; y <= to; y++) {
    items.push({ value: String(y), label: String(y), checked: y === current });
  }
  return items;
});

// ── Pill labels ───────────────────────────────────────────────────────────────

const monthLabel = computed(() =>
  props.displayDate.toLocaleDateString(props.locale, { month: 'long' }),
);

// ── Toggle helpers ────────────────────────────────────────────────────────────

// Base style applied before the dropdown is in the DOM (invisible, no top/left yet).
// positionCentered runs in a nextTick watcher once the element is rendered.
const DROPDOWN_BASE: Record<string, string> = {
  position: 'fixed',
  zIndex: '9999',
  minWidth: '160px',
  // invisible until positioned — prevents flash at (0,0)
  opacity: '0',
};

function toggleMonth() {
  if (!isMonthOpen.value) isYearOpen.value = false;
  isMonthOpen.value = !isMonthOpen.value;
}

function toggleYear() {
  if (!isYearOpen.value) isMonthOpen.value = false;
  isYearOpen.value = !isYearOpen.value;
}

// After month dropdown renders: measure and position with smart flip
watch(isMonthOpen, async (open) => {
  if (!open) return;
  monthDropdownStyle.value = { ...DROPDOWN_BASE };
  await nextTick();
  const pill = monthPillRef.value;
  const drop = monthDropdownRef.value;
  if (!pill || !drop) return;
  positionCentered(pill, drop, { gap: 4, margin: 8 });
  monthDropdownStyle.value = { ...DROPDOWN_BASE, opacity: '1' };
});

// After year dropdown renders: measure and position with smart flip
watch(isYearOpen, async (open) => {
  if (!open) return;
  yearDropdownStyle.value = { ...DROPDOWN_BASE };
  await nextTick();
  const pill = yearPillRef.value;
  const drop = yearDropdownRef.value;
  if (!pill || !drop) return;
  positionCentered(pill, drop, { gap: 4, margin: 8 });
  yearDropdownStyle.value = { ...DROPDOWN_BASE, opacity: '1' };
});

// ── Select handlers ───────────────────────────────────────────────────────────

function onMonthSelect(value: string) {
  const monthIndex = parseInt(value, 10);
  const d = new Date(props.displayDate.getFullYear(), monthIndex, 1);
  emit('select-month', d);
  isMonthOpen.value = false;
}

function onYearSelect(value: string) {
  const year = parseInt(value, 10);
  const d = new Date(year, props.displayDate.getMonth(), 1);
  emit('select-year', d);
  isYearOpen.value = false;
}

// ── Click outside ─────────────────────────────────────────────────────────────

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  const insideMonth =
    monthPillRef.value?.contains(target) || monthDropdownRef.value?.contains(target);
  const insideYear =
    yearPillRef.value?.contains(target) || yearDropdownRef.value?.contains(target);
  if (!insideMonth) isMonthOpen.value = false;
  if (!insideYear) isYearOpen.value = false;
}

// Recompute position on scroll so the dropdown tracks its pill as the page scrolls.
function onScrollOrResize() {
  if (isMonthOpen.value && monthPillRef.value && monthDropdownRef.value) {
    positionCentered(monthPillRef.value, monthDropdownRef.value, { gap: 4, margin: 8 });
  }
  if (isYearOpen.value && yearPillRef.value && yearDropdownRef.value) {
    positionCentered(yearPillRef.value, yearDropdownRef.value, { gap: 4, margin: 8 });
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
  window.removeEventListener('scroll', onScrollOrResize, true);
  window.removeEventListener('resize', onScrollOrResize);
});
</script>

<template>
  <div class="bt-calendar__header">
    <!-- Left nav -->
    <button
      class="bt-calendar__nav-btn"
      type="button"
      :disabled="!canGoPrev"
      aria-label="Bulan sebelumnya"
      @click="emit('prev')"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 4L6 8L10 12"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- Month + year pills -->
    <div class="bt-calendar__header-labels">

      <!-- Month pill + dropdown -->
      <div ref="monthPillRef" class="bt-calendar__pill-wrapper">
        <button
          class="bt-calendar__header-pill"
          type="button"
          :aria-expanded="isMonthOpen"
          @click="toggleMonth"
        >
          {{ monthLabel }}
          <svg
            class="bt-calendar__header-arrow"
            :class="{ 'bt-calendar__header-arrow--open': isMonthOpen }"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <Teleport to="body">
          <div v-if="isMonthOpen" ref="monthDropdownRef" :style="monthDropdownStyle" :dir="dropdownDir" data-bt-calendar-dropdown>
            <BTDropdownList
              variant="radio"
              :items="monthItems"
              @select="onMonthSelect"
            />
          </div>
        </Teleport>
      </div>

      <!-- Year pill + dropdown -->
      <div ref="yearPillRef" class="bt-calendar__pill-wrapper">
        <button
          class="bt-calendar__header-pill"
          type="button"
          :aria-expanded="isYearOpen"
          @click="toggleYear"
        >
          {{ displayDate.getFullYear() }}
          <svg
            class="bt-calendar__header-arrow"
            :class="{ 'bt-calendar__header-arrow--open': isYearOpen }"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <Teleport to="body">
          <div v-if="isYearOpen" ref="yearDropdownRef" :style="yearDropdownStyle" :dir="dropdownDir" data-bt-calendar-dropdown>
            <BTDropdownList
              variant="radio"
              :items="allYearItems"
              @select="onYearSelect"
            />
          </div>
        </Teleport>
      </div>
    </div>

    <!-- Right nav -->
    <button
      class="bt-calendar__nav-btn"
      type="button"
      :disabled="!canGoNext"
      aria-label="Bulan berikutnya"
      @click="emit('next')"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
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
    </button>
  </div>
</template>
