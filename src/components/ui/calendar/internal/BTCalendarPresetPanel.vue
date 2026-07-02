<script setup lang="ts">
import type { BTCalendarPreset } from '@/components/ui/calendar/BTCalendar.types';

interface BTCalendarPresetPanelProps {
  presets: BTCalendarPreset[];
  activePresetIndex?: number;
}

const props = withDefaults(defineProps<BTCalendarPresetPanelProps>(), {
  activePresetIndex: -1,
});

const emit = defineEmits<{
  select: [index: number];
}>();
</script>

<template>
  <div class="bt-calendar__preset-panel" role="list" aria-label="Preset rentang tanggal">
    <button
      v-for="(preset, idx) in presets"
      :key="idx"
      type="button"
      :class="[
        'bt-calendar__preset-item',
        idx === activePresetIndex && 'bt-calendar__preset-item--active',
      ]"
      role="listitem"
      :aria-pressed="idx === activePresetIndex"
      @click="emit('select', idx)"
    >
      {{ preset.label }}
    </button>
  </div>
</template>
