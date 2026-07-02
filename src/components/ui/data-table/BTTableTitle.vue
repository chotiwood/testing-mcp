<script setup lang="ts">
import { computed } from "vue";
import type {
  BTDataTableColumn,
  BTDataTableSortDirection,
  BTSortPayload,
  BTTableTitleProps,
} from "./BTDataTable.types";
import BTTableItem from "./BTTableItem.vue";
import BTCheckbox from "@/components/ui/checkbox/BTCheckbox.vue";

const CHECKBOX_WIDTH = 32;

const props = withDefaults(defineProps<BTTableTitleProps>(), {
  variant: "default",
  hasCheckbox: false,
  fixedLeft: 0,
  fixedRight: 0,
  selectedRows: () => [],
  totalRowCount: 0,
});

const emit = defineEmits<{
  action: [payload: { action: string; columnKey?: string; rowId?: string }];
  sort: [payload: BTSortPayload];
}>();

const className = computed(() => [
  "bt-table-title",
  props.variant === "secondary" && "bt-table-title--secondary",
  props.variant === "no-fill" && "bt-table-title--no-fill",
]);

function getColWidth(col: BTDataTableColumn | undefined): number {
  if (!col?.width) return 148;
  return parseInt(col.width);
}

function stickyStyle(
  effectiveIndex: number,
  columns: BTDataTableColumn[],
  hasCheckbox: boolean,
  fixedLeft: number,
  fixedRight: number,
): Record<string, string> | undefined {
  const totalCols = (hasCheckbox ? 1 : 0) + columns.length;

  if (fixedLeft > 0 && effectiveIndex < fixedLeft) {
    let left = 0;
    for (let i = 0; i < effectiveIndex; i++) {
      if (i === 0 && hasCheckbox) left += CHECKBOX_WIDTH;
      else {
        const colIdx = hasCheckbox ? i - 1 : i;
        left += getColWidth(columns[colIdx]);
      }
    }
    const isLast = effectiveIndex === fixedLeft - 1;
    const style: Record<string, string> = {
      position: "sticky",
      insetInlineStart: `${left}px`,
      zIndex: "3",
      background: "var(--row-bg, var(--bg-primary))",
    };
    if (isLast) {
      style.boxShadow =
        "var(--bt-dt-shadow-cast-inline-end, 4px 0) 6px -2px var(--fixed-left-shadow-color, transparent)";
      style.transition = "box-shadow 0.2s ease";
    }
    return style;
  }

  if (fixedRight > 0 && effectiveIndex >= totalCols - fixedRight) {
    let right = 0;
    for (let i = effectiveIndex + 1; i < totalCols; i++) {
      if (i === 0 && hasCheckbox) right += CHECKBOX_WIDTH;
      else {
        const colIdx = hasCheckbox ? i - 1 : i;
        right += getColWidth(columns[colIdx]);
      }
    }
    const isFirst = effectiveIndex === totalCols - fixedRight;
    const style: Record<string, string> = {
      position: "sticky",
      insetInlineEnd: `${right}px`,
      zIndex: "3",
      background: "var(--row-bg, var(--bg-primary))",
    };
    if (isFirst) {
      style.boxShadow =
        "var(--bt-dt-shadow-cast-inline-start, -4px 0) 6px -2px var(--fixed-right-shadow-color, transparent)";
      style.transition = "box-shadow 0.2s ease";
    }
    return style;
  }

  return undefined;
}

const allSelected = computed(
  () =>
    props.headerAllSelected ??
    (props.totalRowCount > 0 &&
      props.selectedRows.length >= props.totalRowCount),
);
const someSelected = computed(
  () =>
    props.headerSomeSelected ??
    (props.selectedRows.length > 0 && !allSelected.value),
);

function nextDirection(
  current: BTDataTableSortDirection | undefined,
): BTDataTableSortDirection {
  if (!current || current === "none") return "asc";
  if (current === "asc") return "desc";
  return "none";
}

function handleSortClick(column: BTDataTableColumn) {
  if (!column.sortable) return;
  emit("sort", {
    columnKey: column.key,
    direction: nextDirection(column.sortDirection),
  });
}
</script>

<template>
  <thead :class="className">
    <tr>
      <!-- Checkbox column header -->
      <th
        v-if="hasCheckbox"
        class="bt-table-item bt-table-item--header bt-data-table__fixed-cell"
        :style="{
          position: 'sticky',
          insetInlineStart: '0px',
          zIndex: '3',
          background: 'var(--row-bg, var(--bg-primary))',
          boxShadow:
            fixedLeft <= 1
              ? 'var(--bt-dt-shadow-cast-inline-end, 4px 0) 6px -2px var(--fixed-left-shadow-color, transparent)'
              : undefined,
          transition: fixedLeft <= 1 ? 'box-shadow 0.2s ease' : undefined,
        }"
      >
        <span class="bt-table-item__control">
          <BTCheckbox
            :model-value="allSelected"
            :indeterminate="someSelected"
            @update:model-value="emit('action', { action: 'check-all' })"
          />
        </span>
      </th>

      <!-- User-defined columns -->
      <BTTableItem
        v-for="(column, index) in columns"
        :key="column.key"
        as="th"
        header
        :type="column.headerType ?? 'title'"
        :label="column.label"
        :cell="{ type: column.headerType ?? 'title', label: column.label }"
        :column-key="column.key"
        :class="[column.sortable && 'bt-table-title__sortable']"
        :style="{
          ...(column.fill || !column.width
            ? { minWidth: '148px' }
            : {
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width,
              }),
          ...(column.align && column.align !== 'left'
            ? {
                '--col-halign':
                  column.align === 'right' ? 'flex-end' : 'center',
                textAlign: column.align,
              }
            : {}),
          ...(stickyStyle(
            hasCheckbox ? index + 1 : index,
            columns,
            hasCheckbox,
            fixedLeft,
            fixedRight,
          ) ?? {}),
        }"
        @action="emit('action', $event)"
        @click="handleSortClick(column)"
      >
        <!-- Override default rendering for plain title columns for sort-direction arrow -->
        <template
          v-if="!column.headerType || column.headerType === 'title'"
          #default
        >
          <span class="bt-table-item__content">
            <span class="bt-table-item__header-label">{{ column.label }}</span>
            <span class="bt-table-item__sort" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M5 6L8 3L11 6H5Z"
                  fill="currentColor"
                  :fill-opacity="column.sortDirection === 'desc' ? 0.3 : 1"
                />
                <path
                  d="M11 10L8 13L5 10H11Z"
                  fill="currentColor"
                  :fill-opacity="column.sortDirection === 'asc' ? 0.3 : 1"
                />
              </svg>
            </span>
          </span>
        </template>
      </BTTableItem>
    </tr>
  </thead>
</template>
