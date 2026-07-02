<script setup lang="ts">
import { computed } from 'vue';
import { getMonthShortName, isSameDay, calendarStrings } from '@/components/ui/calendar/internal/calendar.utils';

interface BTCalendarMonthViewProps {
  displayDate: Date;
  locale?: string;
  selectedDate?: Date | null;
}

const props = withDefaults(defineProps<BTCalendarMonthViewProps>(), {
  locale: 'id-ID',
  selectedDate: null,
});

const emit = defineEmits<{
  select: [date: Date];
}>();

const months = computed(() => {
  const year = props.displayDate.getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(year, i, 1);
    return { date, label: getMonthShortName(date, props.locale) };
  });
});

function isSelectedMonth(date: Date): boolean {
  if (!props.selectedDate) return false;
  return (
    props.selectedDate.getFullYear() === date.getFullYear() &&
    props.selectedDate.getMonth() === date.getMonth()
  );
}

function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}
</script>

<template>
  <div class="bt-calendar__month-grid" role="grid" :aria-label="calendarStrings(props.locale).pickMonth">
    <button
      v-for="({ date, label }) in months"
      :key="date.getMonth()"
      type="button"
      :class="[
        'bt-calendar__month-item',
        isSelectedMonth(date) && 'bt-calendar__month-item--selected',
        isCurrentMonth(date) && !isSelectedMonth(date) && 'bt-calendar__month-item--current',
      ]"
      role="gridcell"
      :aria-pressed="isSelectedMonth(date)"
      @click="emit('select', date)"
    >
      {{ label }}
    </button>
  </div>
</template>
