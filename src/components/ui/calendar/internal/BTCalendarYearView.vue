<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { calendarStrings } from '@/components/ui/calendar/internal/calendar.utils';

interface BTCalendarYearViewProps {
  displayDate: Date;
  selectedDate?: Date | null;
  locale?: string;
}

const props = withDefaults(defineProps<BTCalendarYearViewProps>(), {
  selectedDate: null,
  locale: 'id-ID',
});

const emit = defineEmits<{
  select: [date: Date];
}>();

const listRef = ref<HTMLElement | null>(null);

const years = computed(() => {
  const current = props.displayDate.getFullYear();
  const start = current - 10;
  const end = current + 10;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const selectedYear = computed(() =>
  props.selectedDate ? props.selectedDate.getFullYear() : null,
);

function onSelect(year: number) {
  const date = new Date(props.displayDate);
  date.setFullYear(year);
  date.setDate(1);
  emit('select', date);
}

onMounted(() => {
  // Scroll selected year into view
  if (listRef.value) {
    const selected = listRef.value.querySelector('.bt-calendar__year-item--selected');
    if (selected) {
      (selected as HTMLElement).scrollIntoView({ block: 'center' });
    }
  }
});
</script>

<template>
  <div
    ref="listRef"
    class="bt-calendar__year-list"
    role="listbox"
    :aria-label="calendarStrings(props.locale).pickYear"
  >
    <button
      v-for="year in years"
      :key="year"
      type="button"
      :class="[
        'bt-calendar__year-item',
        year === selectedYear && 'bt-calendar__year-item--selected',
      ]"
      role="option"
      :aria-selected="year === selectedYear"
      @click="onSelect(year)"
    >
      {{ year }}
    </button>
  </div>
</template>
