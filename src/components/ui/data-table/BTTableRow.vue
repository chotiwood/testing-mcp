<script setup lang="ts">
import { computed } from "vue";
import type {
  BTDataTableCell,
  BTDataTableColumn,
  BTDataTableRow,
  BTTableRowProps,
} from "./BTDataTable.types";
import BTTableItem from "./BTTableItem.vue";
import BTCheckbox from "@/components/ui/checkbox/BTCheckbox.vue";

// Explicit name required for recursive self-reference to survive bundling
defineOptions({ name: "BTTableRow" });

const CHECKBOX_WIDTH = 32;

const props = withDefaults(defineProps<BTTableRowProps>(), {
  noFill: false,
  depth: 0,
  expandedKeys: () => ({}),
  hasCheckbox: false,
  fixedLeft: 0,
  fixedRight: 0,
  selectedRows: () => [],
  totalRowCount: 0,
});

const emit = defineEmits<{
  action: [payload: { action: string; rowId?: string; columnKey?: string }];
  "cell-change": [
    payload: { rowId: string; columnKey: string; cell: BTDataTableCell },
  ];
  "update:expandedKeys": [keys: Record<string, boolean>];
}>();

const hasChildren = computed(() => (props.row.children?.length ?? 0) > 0);
const isExpanded = computed(() => !!props.expandedKeys?.[props.row.id]);
const clampedDepth = computed(() => Math.min(5, props.depth));
const indentWidth = computed(() => `${props.depth * 24}px`);
const levelClass = computed(() =>
  props.depth > 0 ? `bt-table-row--depth-${clampedDepth.value}` : null,
);
const totalCols = computed(
  () => (props.hasCheckbox ? 1 : 0) + props.columns.length,
);

function getColWidth(col: BTDataTableColumn | undefined): number {
  if (!col?.width) return 148;
  return parseInt(col.width);
}

function rowCheckState(
  row: BTDataTableRow,
  selectedRows: string[],
): "checked" | "indeterminate" | "unchecked" {
  if (!row.children?.length) {
    return selectedRows.includes(row.id) ? "checked" : "unchecked";
  }
  const childStates = row.children.map((c) => rowCheckState(c, selectedRows));
  if (childStates.every((s) => s === "checked")) return "checked";
  if (childStates.every((s) => s === "unchecked")) return "unchecked";
  return "indeterminate";
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
      zIndex: "2",
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
      zIndex: "2",
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

function toggleExpand() {
  emit("update:expandedKeys", {
    ...props.expandedKeys,
    [props.row.id]: !isExpanded.value,
  });
}

const checkState = computed(() => rowCheckState(props.row, props.selectedRows));
const isRowSelected = computed(() =>
  hasChildren.value
    ? checkState.value === "checked"
    : props.selectedRows.includes(props.row.id),
);
</script>

<template>
  <tr
    class="bt-table-row"
    :class="[
      levelClass,
      {
        'bt-table-row--no-fill': noFill,
        'bt-table-row--selected': isRowSelected,
      },
    ]"
  >
    <!-- Checkbox cell -->
    <td
      v-if="hasCheckbox"
      class="bt-table-item bt-data-table__fixed-cell"
      :style="{
        position: 'sticky',
        insetInlineStart: '0px',
        zIndex: '2',
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
          :model-value="checkState === 'checked'"
          :indeterminate="checkState === 'indeterminate'"
          @update:model-value="
            emit('action', { action: 'check-row', rowId: row.id })
          "
        />
      </span>
    </td>

    <!-- User-defined cells -->
    <BTTableItem
      v-for="(column, index) in columns"
      :key="column.key"
      as="td"
      :cell="row.cells[column.key]"
      :column-key="column.key"
      :row-id="row.id"
      :no-fill="noFill"
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
              '--col-halign': column.align === 'right' ? 'flex-end' : 'center',
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
      @cell-change="emit('cell-change', $event)"
    >
      <template v-if="column.expander" #default="{ value }">
        <span class="bt-table-item__expander-cell">
          <span
            class="bt-table-item__expander-indent"
            :style="{ width: indentWidth }"
          />

          <button
            v-if="hasChildren"
            type="button"
            class="bt-table-item__expander-btn"
            :class="{ 'bt-table-item__expander-btn--expanded': isExpanded }"
            :aria-expanded="isExpanded"
            :aria-label="isExpanded ? 'Collapse row' : 'Expand row'"
            @click.stop="toggleExpand"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              width="12"
              height="12"
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

          <span class="bt-table-item__text">{{ value || "Subtext" }}</span>
        </span>
      </template>
    </BTTableItem>
  </tr>

  <!-- Children rendered as flat <tr> siblings in the same <tbody> so the
       outer table's colgroup governs all rows — column widths stay aligned. -->
  <template v-if="hasChildren && isExpanded">
    <BTTableRow
      v-for="child in row.children"
      :key="child.id"
      :row="child"
      :columns="columns"
      :no-fill="noFill"
      :has-checkbox="hasCheckbox"
      :fixed-left="fixedLeft"
      :fixed-right="fixedRight"
      :selected-rows="selectedRows"
      :depth="depth + 1"
      :expanded-keys="expandedKeys"
      @action="emit('action', $event)"
      @cell-change="emit('cell-change', $event)"
      @update:expanded-keys="emit('update:expandedKeys', $event)"
    />
  </template>
</template>
