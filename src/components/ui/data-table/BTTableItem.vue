<script setup lang="ts">
import { computed } from 'vue';
import type { BTTableItemProps, BTDataTableCell, BTDataTableOption } from '@/components/ui/data-table/BTDataTable.types';
import BTButton from '@/components/ui/button/BTButton.vue';
import BTCheckbox from '@/components/ui/checkbox/BTCheckbox.vue';
import BTRadioButton from '@/components/ui/radio-button/BTRadioButton.vue';
import BTSwitchField from '@/components/ui/switch-field/BTSwitchField.vue';
import BTInput from '@/components/ui/input/BTInput.vue';
import BTInputDropdown from '@/components/ui/input-dropdown/BTInputDropdown.vue';
import BTInputMultipleField from '@/components/ui/input-multiple-field/BTInputMultipleField.vue';
import BTTree from '@/components/ui/tree/BTTree.vue';

const props = withDefaults(defineProps<BTTableItemProps>(), {
  type: undefined,
  cell: null,
  label: undefined,
  header: false,
  as: 'div',
  columnKey: undefined,
  rowId: undefined,
  noFill: false,
});

const emit = defineEmits<{
  action: [payload: { action: string; rowId?: string; columnKey?: string }];
  'cell-change': [payload: { rowId: string; columnKey: string; cell: BTDataTableCell }];
}>();

const normalizedCell = computed<BTDataTableCell>(() => {
  if (props.cell != null && typeof props.cell === 'object') return props.cell as BTDataTableCell;
  return {
    type: props.type ?? 'text',
    value: props.cell as string | number | boolean | null,
  };
});

const cellType = computed(() => props.type ?? normalizedCell.value.type ?? 'text');
const textValue = computed(() => {
  const cell = normalizedCell.value;
  const raw = props.label ?? cell.label ?? cell.value;
  return raw == null ? '' : String(raw);
});
const componentTag = computed(() => props.as);
const className = computed(() => [
  'bt-table-item',
  props.header && 'bt-table-item--header',
  props.noFill && 'bt-table-item--no-fill',
  `bt-table-item--${cellType.value}`,
]);

const options = computed<BTDataTableOption[]>(() =>
  normalizedCell.value.options ?? [
    { label: 'Label', value: 'label-1' },
    { label: 'Label', value: 'label-2' },
  ],
);

function emitCellChange(patch: Partial<BTDataTableCell>) {
  if (!props.rowId || !props.columnKey) return;
  emit('cell-change', {
    rowId: props.rowId,
    columnKey: props.columnKey,
    cell: {
      ...normalizedCell.value,
      type: cellType.value,
      ...patch,
    },
  });
}
</script>

<template>
  <component :is="componentTag" :class="className" :scope="as === 'th' ? 'col' : undefined">
    <slot :cell="normalizedCell" :type="cellType" :value="textValue">
      <span v-if="cellType === 'tree'" class="bt-table-item__tree">
        <BTTree
          :nodes="normalizedCell.treeNodes ?? [{ label: textValue || 'Subtext', initiallyExpanded: true, children: [{ label: 'Level 2' }, { label: 'Level 3' }] }]"
        />
      </span>

      <span v-else-if="cellType === 'title' || cellType === 'checkbox-title'" class="bt-table-item__content">
        <BTCheckbox
          v-if="cellType === 'checkbox-title'"
          :model-value="!!normalizedCell.checked"
          @update:model-value="emit('action', { action: 'check-title', rowId, columnKey })"
        />
        <span class="bt-table-item__header-label">{{ textValue || 'LABEL' }}</span>
        <span class="bt-table-item__sort" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none"><path d="M5 6L8 3L11 6H5ZM11 10L8 13L5 10H11Z" fill="currentColor"/></svg>
        </span>
      </span>

      <span v-else-if="cellType === 'button'" class="bt-table-item__actions">
        <BTButton
          size="small"
          :label="textValue || 'Label'"
          @click="emit('action', { action: 'button', rowId, columnKey })"
        />
      </span>

      <span v-else-if="cellType === 'double-button'" class="bt-table-item__actions">
        <BTButton size="small" :icon-only="true" aria-label="Primary action" @click="emit('action', { action: 'primary', rowId, columnKey })">
          <svg viewBox="0 0 16 16" fill="none"><path d="M3 8.67V12.5H6.83L12.13 7.2L8.3 3.37L3 8.67ZM13.03 6.3L13.75 5.58C14.08 5.25 14.08 4.73 13.75 4.4L11.6 2.25C11.27 1.92 10.75 1.92 10.42 2.25L9.7 2.97L13.03 6.3Z" fill="currentColor"/></svg>
        </BTButton>
        <BTButton size="small" variant="secondary-light" :icon-only="true" aria-label="Secondary action" @click="emit('action', { action: 'secondary', rowId, columnKey })">
          <svg viewBox="0 0 16 16" fill="none"><path d="M3.5 4.5H12.5V5.83H3.5V4.5ZM3.5 7.33H12.5V8.67H3.5V7.33ZM3.5 10.17H12.5V11.5H3.5V10.17Z" fill="currentColor"/></svg>
        </BTButton>
      </span>

      <span v-else-if="cellType === 'checkbox'" class="bt-table-item__control">
        <BTCheckbox
          :model-value="normalizedCell.checked ?? true"
          :disabled="normalizedCell.disabled"
          @update:model-value="emitCellChange({ checked: $event })"
        />
      </span>

      <span v-else-if="cellType === 'radio'" class="bt-table-item__control">
        <BTRadioButton
          :model-value="normalizedCell.selected ? 'on' : 'off'"
          value="on"
          :disabled="normalizedCell.disabled"
          @update:model-value="emitCellChange({ selected: $event === 'on' })"
        />
      </span>

      <span v-else-if="cellType === 'option'" class="bt-table-item__option-group">
        <span v-for="option in options" :key="option.value" class="bt-table-item__option">
          <BTRadioButton
            :model-value="String(normalizedCell.value ?? '')"
            :value="option.value"
            @update:model-value="emitCellChange({ value: $event, label: option.label })"
          />
          <span class="bt-table-item__text">{{ option.label }}</span>
        </span>
      </span>

      <span v-else-if="cellType === 'field'" class="bt-table-item__field">
        <BTInput
          :model-value="textValue"
          label="Title"
          @update:model-value="emitCellChange({ value: $event })"
        />
      </span>

      <span v-else-if="cellType === 'dropdown' || cellType === 'title-dropdown'" class="bt-table-item__field">
        <BTInputDropdown
          :model-value="String(normalizedCell.value ?? options[0]?.value ?? '')"
          label="Title"
          :items="options"
          @update:model-value="emitCellChange({ value: $event ?? '', label: options.find((option) => option.value === $event)?.label })"
        />
      </span>

      <span v-else-if="cellType === 'multiple-selection'" class="bt-table-item__field">
        <BTInputMultipleField
          :model-value="normalizedCell.tags ?? [{ id: 'tag-1', label: 'Tag' }, { id: 'tag-2', label: 'Tag' }]"
          label="Title"
          type="scroll"
          @update:model-value="emitCellChange({ tags: $event })"
        />
      </span>

      <span v-else-if="cellType === 'badge'" class="bt-table-item__badge">
        {{ normalizedCell.badgeLabel ?? textValue ?? 'Badge' }}
      </span>

      <span v-else-if="cellType === 'toggle'" class="bt-table-item__control">
        <BTSwitchField
          :model-value="!!normalizedCell.checked"
          size="sm"
          @update:model-value="emitCellChange({ checked: $event })"
        />
      </span>

      <span v-else class="bt-table-item__content">
        <span class="bt-table-item__text">{{ textValue || (cellType === 'number' ? '9999' : 'Subtext') }}</span>
      </span>
    </slot>
  </component>
</template>
