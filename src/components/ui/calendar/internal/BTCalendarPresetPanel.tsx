import type { BTCalendarPreset } from '@/components/ui/calendar/BTCalendar.types';

interface BTCalendarPresetPanelProps {
  presets: BTCalendarPreset[];
  activePresetIndex?: number;
  onSelect: (index: number) => void;
}

export function BTCalendarPresetPanel({
  presets,
  activePresetIndex = -1,
  onSelect,
}: BTCalendarPresetPanelProps) {
  return (
    <div className="bt-calendar__preset-panel" role="list" aria-label="Preset rentang tanggal">
      {presets.map((preset, idx) => (
        <button
          key={idx}
          type="button"
          className={[
            'bt-calendar__preset-item',
            idx === activePresetIndex ? 'bt-calendar__preset-item--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="listitem"
          aria-pressed={idx === activePresetIndex}
          onClick={() => onSelect(idx)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

BTCalendarPresetPanel.displayName = 'BTCalendarPresetPanel';
