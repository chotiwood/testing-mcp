<script setup lang="ts">
import { computed } from 'vue';
import { generateCalendarDays, getWeekdayNames, type CalendarDay } from '@/components/ui/calendar/internal/calendar.utils';

interface BTCalendarGridProps {
  displayDate: Date;
  selectedDate?: Date | null;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  rangeHover?: Date | null;
  disabledDates?: (d: Date) => boolean;
  eventDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  locale?: string;
}

const props = withDefaults(defineProps<BTCalendarGridProps>(), {
  selectedDate: null,
  rangeStart: null,
  rangeEnd: null,
  rangeHover: null,
  locale: 'id-ID',
});

const emit = defineEmits<{
  select: [date: Date];
  hover: [date: Date | null];
}>();

const weekdays = computed(() => getWeekdayNames(props.locale));

const days = computed<CalendarDay[]>(() =>
  generateCalendarDays(props.displayDate.getFullYear(), props.displayDate.getMonth(), {
    selectedDate: props.selectedDate,
    rangeStart: props.rangeStart,
    rangeEnd: props.rangeEnd,
    rangeHover: props.rangeHover,
    disabledDates: props.disabledDates,
    eventDates: props.eventDates,
    minDate: props.minDate,
    maxDate: props.maxDate,
  }),
);

function getDayClasses(day: CalendarDay): string[] {
  const cls = ['bt-calendar__day'];
  if (!day.isCurrentMonth) cls.push('bt-calendar__day--outside');
  if (day.isDisabled) cls.push('bt-calendar__day--disabled');
  if (day.isToday) cls.push('bt-calendar__day--today');
  if (day.isSelected) cls.push('bt-calendar__day--selected');
  // Confirmed range endpoints
  if (day.isRangeStartOnly) cls.push('bt-calendar__day--range-start-only');
  if (day.isRangeStart && !day.isRangeStartOnly) {
    cls.push(day.isHoverPreviewPoint ? 'bt-calendar__day--range-start-hover' : 'bt-calendar__day--range-start');
  }
  if (day.isRangeEnd) {
    cls.push(day.isHoverPreviewPoint ? 'bt-calendar__day--range-end-hover' : 'bt-calendar__day--range-end');
  }
  // In-range fills
  if (day.isInRange && !day.isRangeStart && !day.isRangeEnd) cls.push('bt-calendar__day--in-range');
  if (day.isInRangeHover && !day.isRangeStart && !day.isRangeEnd) cls.push('bt-calendar__day--in-range-hover');
  return cls;
}

function onDayClick(day: CalendarDay) {
  if (day.isDisabled) return;
  emit('select', day.date);
}

function onDayMouseEnter(day: CalendarDay) {
  if (day.isDisabled) return;
  emit('hover', day.date);
}

function onGridMouseLeave() {
  emit('hover', null);
}
</script>

<template>
  <div>
    <!-- Weekday headers -->
    <div class="bt-calendar__weekdays">
      <div
        v-for="name in weekdays"
        :key="name"
        class="bt-calendar__weekday"
      >
        {{ name }}
      </div>
    </div>

    <!-- Day grid -->
    <div
      class="bt-calendar__days"
      role="grid"
      :aria-label="displayDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })"
      @mouseleave="onGridMouseLeave"
    >
      <button
        v-for="(day, idx) in days"
        :key="idx"
        type="button"
        :class="getDayClasses(day)"
        :disabled="day.isDisabled"
        :aria-pressed="day.isSelected || day.isRangeStart || day.isRangeEnd"
        :aria-label="day.date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })"
        role="gridcell"
        @click="onDayClick(day)"
        @mouseenter="onDayMouseEnter(day)"
      >
        {{ day.date.getDate() }}
        <span
          v-if="day.hasEvent"
          class="bt-calendar__day-dot"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
