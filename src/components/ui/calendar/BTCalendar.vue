<script setup lang="ts">
/**
 * BTCalendar — date picker organism.
 * Figma source: node 2561:1340.
 * Supports single-date and date-range modes with optional preset sidebar,
 * month/year dropdown navigation, event dots, and an Apply/Cancel footer.
 *
 * @example Single date picker
 * <BTCalendar v-model="date" />
 *
 * @example Range picker with presets
 * <BTCalendar
 *   mode="range"
 *   v-model:rangeValue="range"
 *   :presets="myPresets"
 *   :show-footer="true"
 *   @apply="onApply"
 *   @cancel="onCancel"
 * />
 */
import '@/components/ui/calendar/BTCalendar.css';
import { ref, computed, watch } from 'vue';
import type { BTCalendarProps } from '@/components/ui/calendar/BTCalendar.types';
import BTCalendarHeader from '@/components/ui/calendar/internal/BTCalendarHeader.vue';
import BTCalendarGrid from '@/components/ui/calendar/internal/BTCalendarGrid.vue';
import BTCalendarPresetPanel from '@/components/ui/calendar/internal/BTCalendarPresetPanel.vue';
import BTButton from '@/components/ui/button/BTButton.vue';
import { addMonths, isSameDay, getMonthName, calendarStrings } from '@/components/ui/calendar/internal/calendar.utils';

type PresetChip = { key: string; label: string; date: Date; range: [Date, Date] };

const props = withDefaults(defineProps<BTCalendarProps & { showPreset?: boolean }>(), {
  mode: 'single',
  locale: 'id-ID',
  showFooter: true,
  showPreset: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: Date | null];
  'update:rangeValue': [value: [Date, Date] | null];
  apply: [value: Date | [Date, Date] | null];
  cancel: [];
}>();

// ── Display state ─────────────────────────────────────────────────────────────

const displayDate = ref<Date>(
  (() => {
    if (props.initialMonth) return new Date(props.initialMonth);
    if (props.modelValue) return new Date(props.modelValue);
    if (props.rangeValue?.[0]) return new Date(props.rangeValue[0]);
    return new Date();
  })(),
);

const displayDate2 = computed(() => addMonths(displayDate.value, 1));

// ── Range selection state ─────────────────────────────────────────────────────

const rangeStart = ref<Date | null>(props.rangeValue?.[0] ?? null);
const rangeEnd = ref<Date | null>(props.rangeValue?.[1] ?? null);
const rangeHover = ref<Date | null>(null);

watch(
  () => props.rangeValue,
  (val) => {
    rangeStart.value = val?.[0] ?? null;
    rangeEnd.value = val?.[1] ?? null;
  },
);

// ── Preset state ──────────────────────────────────────────────────────────────

const activePresetIndex = ref<number>(-1);

function onPresetSelect(index: number) {
  activePresetIndex.value = index;
  const preset = props.presets?.[index];
  if (!preset) return;
  const [start, end] = preset.getValue();
  if (props.mode === 'range' && start) {
    rangeStart.value = start;
    rangeEnd.value = end ?? null;
    displayDate.value = new Date(start);
    emit('update:rangeValue', end ? [start, end] : null);
  } else if (props.mode === 'single' && start) {
    displayDate.value = new Date(start);
    emit('update:modelValue', start);
  }
}

// ── Built-in preset chips ─────────────────────────────────────────────────────

const presetChips = computed<PresetChip[]>(() => {
  if (!props.showPreset) return [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const s = calendarStrings(props.locale);

  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const dow = today.getDay(); // 0=Sun … 6=Sat
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - daysFromMonday);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart); lastWeekEnd.setDate(weekStart.getDate() - 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { key: 'yesterday',  label: s.yesterday,  date: yesterday,      range: [yesterday,      yesterday]      },
    { key: 'today',      label: s.today,      date: today,          range: [today,          today]          },
    { key: 'tomorrow',   label: s.tomorrow,   date: tomorrow,       range: [tomorrow,       tomorrow]       },
    { key: 'thisWeek',   label: s.thisWeek,   date: weekStart,      range: [weekStart,      weekEnd]        },
    { key: 'lastWeek',   label: s.lastWeek,   date: lastWeekStart,  range: [lastWeekStart,  lastWeekEnd]    },
    { key: 'thisMonth',  label: s.thisMonth,  date: thisMonthStart, range: [thisMonthStart, thisMonthEnd]   },
    { key: 'lastMonth',  label: s.lastMonth,  date: lastMonthStart, range: [lastMonthStart, lastMonthEnd]   },
  ];
});

function isChipActive(chip: PresetChip): boolean {
  if (props.mode === 'single') {
    return props.modelValue ? isSameDay(props.modelValue, chip.date) : false;
  }
  return rangeStart.value !== null && rangeEnd.value !== null
    ? isSameDay(rangeStart.value, chip.range[0]) && isSameDay(rangeEnd.value, chip.range[1])
    : false;
}

function onChipClick(chip: PresetChip) {
  activePresetIndex.value = -1;
  if (props.mode === 'single') {
    displayDate.value = new Date(chip.date);
    emit('update:modelValue', chip.date);
  } else {
    rangeStart.value = chip.range[0];
    rangeEnd.value = chip.range[1];
    rangeHover.value = null;
    displayDate.value = new Date(chip.range[0]);
    emit('update:rangeValue', chip.range);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

const canGoPrev = computed(() => {
  if (!props.minDate) return true;
  const prev = addMonths(displayDate.value, -1);
  return (
    prev.getFullYear() > props.minDate.getFullYear() ||
    (prev.getFullYear() === props.minDate.getFullYear() &&
      prev.getMonth() >= props.minDate.getMonth())
  );
});

const canGoNext = computed(() => {
  if (!props.maxDate) return true;
  const next = addMonths(displayDate.value, props.mode === 'range' ? 2 : 1);
  return (
    next.getFullYear() < props.maxDate.getFullYear() ||
    (next.getFullYear() === props.maxDate.getFullYear() &&
      next.getMonth() <= props.maxDate.getMonth())
  );
});

function onPrev() {
  displayDate.value = addMonths(displayDate.value, -1);
}

function onNext() {
  displayDate.value = addMonths(displayDate.value, 1);
}

function onHeaderSelectMonth(date: Date) {
  displayDate.value = date;
}

function onHeaderSelectYear(date: Date) {
  displayDate.value = date;
}

// ── Day selection ─────────────────────────────────────────────────────────────

function onDaySelect(date: Date) {
  activePresetIndex.value = -1;
  if (props.mode === 'single') {
    emit('update:modelValue', date);
    return;
  }
  if (!rangeStart.value) {
    rangeStart.value = date;
    rangeEnd.value = null;
  } else if (!rangeEnd.value) {
    if (isSameDay(date, rangeStart.value)) {
      rangeStart.value = null;
      emit('update:rangeValue', null);
    } else if (date < rangeStart.value) {
      rangeEnd.value = rangeStart.value;
      rangeStart.value = date;
      emit('update:rangeValue', [rangeStart.value, rangeEnd.value]);
    } else {
      rangeEnd.value = date;
      emit('update:rangeValue', [rangeStart.value, rangeEnd.value]);
    }
    rangeHover.value = null;
  } else {
    if (isSameDay(date, rangeStart.value)) {
      rangeEnd.value = null;
      rangeHover.value = null;
    } else if (isSameDay(date, rangeEnd.value!)) {
      rangeStart.value = rangeEnd.value!;
      rangeEnd.value = null;
      rangeHover.value = null;
    } else if (date >= rangeStart.value) {
      rangeEnd.value = date;
      emit('update:rangeValue', [rangeStart.value, rangeEnd.value]);
      rangeHover.value = null;
    } else {
      rangeStart.value = date;
      emit('update:rangeValue', [rangeStart.value, rangeEnd.value]);
    }
  }
}

function onDayHover(date: Date | null) {
  if (props.mode === 'range' && rangeStart.value && !rangeEnd.value) {
    rangeHover.value = date;
  }
}

// ── Formatted date display ────────────────────────────────────────────────────

function formatDate(date: Date, locale: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString(locale, { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

const placeholder = computed(() => (props.mode === 'range' ? 'DD MMM YYYY - DD MMM YYYY' : 'DD MMM YYYY'));

const formattedDateDisplay = computed(() => {
  if (props.mode === 'single') {
    return props.modelValue ? formatDate(props.modelValue, props.locale) : placeholder.value;
  }
  const start = rangeStart.value ? formatDate(rangeStart.value, props.locale) : 'DD MMM YYYY';
  const end = rangeEnd.value ? formatDate(rangeEnd.value, props.locale) : 'DD MMM YYYY';
  return `${start} - ${end}`;
});

const cancelLabel = computed(() => calendarStrings(props.locale).cancel);
const applyLabel = computed(() => calendarStrings(props.locale).apply);
const calendarAriaLabel = computed(() => calendarStrings(props.locale).calendar);

// Apply is only enabled once a valid selection exists:
// - single: a date has been picked (modelValue is set)
// - range:  both start AND end are picked
const canApply = computed(() =>
  props.mode === 'range'
    ? !!rangeStart.value && !!rangeEnd.value
    : !!props.modelValue,
);

// ── Footer actions ────────────────────────────────────────────────────────────

function onApply() {
  if (props.mode === 'single') {
    emit('apply', props.modelValue ?? null);
  } else {
    emit(
      'apply',
      rangeStart.value && rangeEnd.value ? [rangeStart.value, rangeEnd.value] : null,
    );
  }
}
</script>

<template>
  <div
    class="bt-calendar"
    :class="{ 'bt-calendar--has-presets': !!props.presets?.length }"
    role="application"
    :aria-label="calendarAriaLabel"
  >
    <!-- Preset panel (left sidebar) -->
    <BTCalendarPresetPanel
      v-if="props.presets?.length"
      :presets="props.presets"
      :active-preset-index="activePresetIndex"
      @select="onPresetSelect"
    />

    <!-- Calendar body -->
    <div class="bt-calendar__body">

      <!-- Single mode: header inside body, one month -->
      <template v-if="props.mode === 'single'">
        <div class="bt-calendar__months">
          <div class="bt-calendar__month">
            <BTCalendarHeader
              :display-date="displayDate"
              :locale="props.locale"
              :can-go-prev="canGoPrev"
              :can-go-next="canGoNext"
              @prev="onPrev"
              @next="onNext"
              @select-month="onHeaderSelectMonth"
              @select-year="onHeaderSelectYear"
            />
            <BTCalendarGrid
              :display-date="displayDate"
              :selected-date="props.modelValue ?? null"
              :disabled-dates="props.disabledDates"
              :event-dates="props.eventDates"
              :min-date="props.minDate"
              :max-date="props.maxDate"
              :locale="props.locale"
              @select="onDaySelect"
              @hover="onDayHover"
            />
          </div>
        </div>
      </template>

      <!-- Range mode: single shared header + two month columns with subtitles -->
      <template v-else>
        <BTCalendarHeader
          :display-date="displayDate"
          :locale="props.locale"
          :can-go-prev="canGoPrev"
          :can-go-next="canGoNext"
          @prev="onPrev"
          @next="onNext"
          @select-month="onHeaderSelectMonth"
          @select-year="onHeaderSelectYear"
        />

        <div class="bt-calendar__months">
          <!-- Left month -->
          <div class="bt-calendar__month">
            <div class="bt-calendar__month-subtitle">
              {{ getMonthName(displayDate, props.locale) }}
            </div>
            <BTCalendarGrid
              :display-date="displayDate"
              :range-start="rangeStart"
              :range-end="rangeEnd"
              :range-hover="rangeHover"
              :disabled-dates="props.disabledDates"
              :event-dates="props.eventDates"
              :min-date="props.minDate"
              :max-date="props.maxDate"
              :locale="props.locale"
              @select="onDaySelect"
              @hover="onDayHover"
            />
          </div>

          <!-- Right month -->
          <div class="bt-calendar__month">
            <div class="bt-calendar__month-subtitle">
              {{ getMonthName(displayDate2, props.locale) }}
            </div>
            <BTCalendarGrid
              :display-date="displayDate2"
              :range-start="rangeStart"
              :range-end="rangeEnd"
              :range-hover="rangeHover"
              :disabled-dates="props.disabledDates"
              :event-dates="props.eventDates"
              :min-date="props.minDate"
              :max-date="props.maxDate"
              :locale="props.locale"
              @select="onDaySelect"
              @hover="onDayHover"
            />
          </div>
        </div>
      </template>

      <!-- Preset chips (wrap row below the day grid) -->
      <div v-if="props.showPreset && presetChips.length" class="bt-calendar__preset-chips">
        <BTButton
          v-for="chip in presetChips"
          :key="chip.key"
          variant="secondary-white"
          size="small"
          :label="chip.label"
          @click="onChipClick(chip)"
        />
      </div>

      <!-- Footer: date display + actions -->
      <div
        v-if="showFooter"
        class="bt-calendar__footer"
        :class="{ 'bt-calendar__footer--range': props.mode === 'range' }"
      >
        <div class="bt-calendar__date-display">{{ formattedDateDisplay }}</div>
        <div class="bt-calendar__footer-actions">
          <BTButton
            variant="secondary-light"
            :label="cancelLabel"
            @click="emit('cancel')"
          />
          <BTButton
            variant="primary"
            :label="applyLabel"
            :disabled="!canApply"
            @click="onApply"
          />
        </div>
      </div>
    </div>
  </div>
</template>
