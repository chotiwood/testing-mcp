<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import '@/components/ui/data-table/BTDataTable.css';
import BTScrollbar from '@/components/ui/scrollbar/BTScrollbar.vue';
import BTHint from '@/components/ui/hint/BTHint.vue';
import type {
  BTDataTableCell,
  BTDataTableColumn,
  BTDataTableProps,
  BTDataTableRow,
} from '@/components/ui/data-table/BTDataTable.types';
import BTButton from '@/components/ui/button/BTButton.vue';
import BTButtonLink from '@/components/ui/button-link/BTButtonLink.vue';
import BTInputSearch from '@/components/ui/input-search/BTInputSearch.vue';
import BTPagination from '@/components/ui/pagination/BTPagination.vue';
import BTTag from '@/components/ui/tag/BTTag.vue';
import BTTableRow from '@/components/ui/data-table/BTTableRow.vue';
import BTTableTitle from '@/components/ui/data-table/BTTableTitle.vue';

const DEFAULT_COLUMNS: BTDataTableColumn[] = Array.from({ length: 10 }, (_, index) => ({
  key: `col${index + 1}`,
  label: 'LABEL',
  sortable: true,
}));

const DEFAULT_ROWS: BTDataTableRow[] = Array.from({ length: 10 }, (_, rowIndex) => ({
  id: `row-${rowIndex + 1}`,
  cells: DEFAULT_COLUMNS.reduce<Record<string, BTDataTableCell>>((acc, column) => {
    acc[column.key] = { type: 'text', value: 'Subtext' };
    return acc;
  }, {}),
}));

const props = withDefaults(defineProps<BTDataTableProps & { showFilter?: boolean }>(), {
  title: 'Table Title',
  variant: 'default',
  showToolbar: true,
  showFilters: true,
  showPagination: true,
  showSearch: true,
  showFilter: true,
  searchValue: '',
  rowsPerPage: 10,
  rowsPerPageOptions: () => [10, 20, 50],
  currentPage: 1,
  totalPages: 5,
  filters: () => ['Filter Active', 'Filter Active', 'Filter Active', 'Filter Active', 'Filter Active'],
  maxVisibleFilters: 4,
  expandedKeys: () => ({}),
  maxHeight: undefined,
  fixedHeader: false,
  hasCheckbox: false,
  fixedLeft: 0,
  fixedRight: 0,
  selectedRows: () => [],
});

const emit = defineEmits<{
  'update:searchValue': [value: string];
  'page-change': [page: number];
  'rows-change': [rows: number];
  action: [payload: { action: string; rowId?: string; columnKey?: string }];
  'cell-change': [payload: { rowId: string; columnKey: string; cell: BTDataTableCell }];
  'remove-filter': [filter: string];
  'remove-all-filters': [];
  'update:expandedKeys': [keys: Record<string, boolean>];
  sort: [payload: { columnKey: string; direction: import('./BTDataTable.types').BTDataTableSortDirection }];
  'search-submit': [value: string];
  'update:selectedRows': [ids: string[]];
}>();

const viewportRef    = ref<HTMLDivElement | null>(null);
const scrollbarRef   = ref<HTMLElement | null>(null);
const scrolledLeft   = ref(false);
const scrolledRight  = ref(false);
const scrollWidth    = ref(0);
const clientWidth    = ref(0);

let syncingFromViewport  = false;
let syncingFromScrollbar = false;

function updateScrollState() {
  const el = viewportRef.value;
  if (!el) return;
  // In RTL, scrollLeft is negative in modern browsers when scrolling toward
  // inline-end. Math.abs normalizes for both directions so the shadow tracking
  // works the same way regardless of writing direction.
  const sl = Math.abs(el.scrollLeft);
  scrolledLeft.value  = sl > 0;
  scrolledRight.value = sl < el.scrollWidth - el.clientWidth - 1;
  scrollWidth.value   = el.scrollWidth;
  clientWidth.value   = el.clientWidth;
}

function handleViewportScroll() {
  updateScrollState();
  if (syncingFromScrollbar) return;
  const vp = viewportRef.value;
  const sb = scrollbarRef.value;
  if (!vp || !sb) return;
  syncingFromViewport = true;
  sb.scrollLeft = vp.scrollLeft;
  syncingFromViewport = false;
}

function handleScrollbarScroll() {
  if (syncingFromViewport) return;
  const vp = viewportRef.value;
  const sb = scrollbarRef.value;
  if (!vp || !sb) return;
  syncingFromScrollbar = true;
  vp.scrollLeft = sb.scrollLeft;
  syncingFromScrollbar = false;
}

let _scrollRo: ResizeObserver | null = null;

onMounted(() => {
  updateScrollState();
  viewportRef.value?.addEventListener('scroll', handleViewportScroll, { passive: true });
  _scrollRo = new ResizeObserver(updateScrollState);
  if (viewportRef.value) _scrollRo.observe(viewportRef.value);
});

onUnmounted(() => {
  viewportRef.value?.removeEventListener('scroll', handleViewportScroll);
  _scrollRo?.disconnect();
});

const titleVariant = computed(() =>
  props.variant === 'secondary' ? 'secondary' : props.variant === 'no-fill' ? 'no-fill' : 'default',
);
const resolvedColumns = computed(() => props.columns?.length ? props.columns : DEFAULT_COLUMNS);
const resolvedRows = computed(() => props.rows?.length ? props.rows : DEFAULT_ROWS);

function getAllRowIds(rows: BTDataTableRow[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    ids.push(row.id);
    if (row.children?.length) ids.push(...getAllRowIds(row.children));
  }
  return ids;
}

function findRow(rows: BTDataTableRow[], id: string): BTDataTableRow | null {
  for (const row of rows) {
    if (row.id === id) return row;
    if (row.children?.length) {
      const found = findRow(row.children, id);
      if (found) return found;
    }
  }
  return null;
}

function countAllRows(rows: BTDataTableRow[]): number {
  return rows.reduce((n, r) => n + 1 + countAllRows(r.children ?? []), 0);
}

function rowCheckState(row: BTDataTableRow, sel: string[]): 'checked' | 'indeterminate' | 'unchecked' {
  if (!row.children?.length) return (sel ?? []).includes(row.id) ? 'checked' : 'unchecked';
  const states = row.children.map((c) => rowCheckState(c, sel ?? []));
  if (states.every((s) => s === 'checked')) return 'checked';
  if (states.every((s) => s === 'unchecked')) return 'unchecked';
  return 'indeterminate';
}

function computeHeaderCheckState(rows: BTDataTableRow[], sel: string[]): 'checked' | 'indeterminate' | 'unchecked' {
  if (!rows.length) return 'unchecked';
  const safesel = sel ?? [];
  const states = rows.map((r) => rowCheckState(r, safesel));
  if (states.every((s) => s === 'checked')) return 'checked';
  if (states.every((s) => s === 'unchecked')) return 'unchecked';
  return 'indeterminate';
}

const totalRowCount = computed(() => countAllRows(resolvedRows.value));

const headerCheckState = computed(() => computeHeaderCheckState(resolvedRows.value, props.selectedRows ?? []));

function handleAction(payload: { action: string; rowId?: string; columnKey?: string }) {
  if (payload.action === 'check-all') {
    const allIds = getAllRowIds(resolvedRows.value);
    const allSelected = allIds.every((id) => props.selectedRows.includes(id));
    emit('update:selectedRows', allSelected ? [] : allIds);
  } else if (payload.action === 'check-row' && payload.rowId) {
    const target = findRow(resolvedRows.value, payload.rowId);
    const affectedIds = target ? getAllRowIds([target]) : [payload.rowId];
    const allAffectedSelected = affectedIds.every((id) => props.selectedRows.includes(id));
    let next: string[];
    if (allAffectedSelected) {
      next = props.selectedRows.filter((id) => !affectedIds.includes(id));
    } else {
      const toAdd = affectedIds.filter((id) => !props.selectedRows.includes(id));
      next = [...props.selectedRows, ...toAdd];
    }
    emit('update:selectedRows', next);
  } else {
    emit('action', payload);
  }
}
</script>

<template>
  <section
    class="bt-data-table"
    :class="[
      `bt-data-table--${variant}`,
      { 'bt-data-table--fixed-header': fixedHeader },
    ]"
    data-testid="bt-data-table"
  >
    <!-- Header layout (Figma 2373-11585): single row.
         Title (left) · Search + Filter + toolbar actions (right). Filter tags
         live in their own row directly below (.bt-data-table__filters). -->
    <div class="bt-data-table__top">
      <h3 class="bt-data-table__title">{{ title }}</h3>
      <div v-if="showToolbar" class="bt-data-table__toolbar">
        <BTInputSearch
          v-if="showSearch"
          class="bt-data-table__search"
          :value="searchValue"
          placeholder="Search"
          @change="emit('update:searchValue', $event)"
          @search="emit('search-submit', $event)"
          @clear="() => { emit('update:searchValue', ''); emit('search-submit', ''); }"
        />
        <BTButton
          v-if="showFilter"
          variant="secondary-light"
          :icon-only="true"
          aria-label="Filter"
          @click="emit('action', { action: 'filter' })"
        >
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 3H14L9.33 8.33V13L6.67 14V8.33L2 3Z" fill="currentColor"/></svg>
          <template v-if="filters.length > 0" #rightIcon>
            <BTHint :count="filters.length" size="sm" />
          </template>
        </BTButton>
        <slot name="toolbar-actions" />
      </div>
    </div>

    <div v-if="showFilters && filters.length" class="bt-data-table__filters">
      <!-- Horizontally scrollable strip of filter tags. No "+N" overflow —
           native scroll handles long lists. "Remove All" link sits outside
           the scroll area so it's always reachable. -->
      <div class="bt-data-table__filters-scroll">
        <BTTag
          v-for="(filter, index) in filters"
          :key="`${filter}-${index}`"
          :label="filter"
          :on-remove="() => emit('remove-filter', filter)"
        />
      </div>
      <BTButtonLink label="Remove All" @click="emit('remove-all-filters')" />
    </div>

    <div
      ref="viewportRef"
      class="bt-data-table__viewport"
      :class="{
        'bt-data-table__viewport--scrolled-left':  scrolledLeft,
        'bt-data-table__viewport--scrolled-right': scrolledRight,
      }"
      :style="maxHeight ? { maxHeight, overflowY: 'auto' } : undefined"
    >
      <table class="bt-data-table__table">
        <colgroup>
          <col v-if="hasCheckbox" style="width: 32px" />
          <col
            v-for="column in resolvedColumns"
            :key="column.key"
            :style="column.fill || !column.width ? undefined : { width: column.width }"
          />
        </colgroup>
        <BTTableTitle
          :columns="resolvedColumns"
          :variant="titleVariant"
          :has-checkbox="hasCheckbox"
          :fixed-left="fixedLeft"
          :fixed-right="fixedRight"
          :selected-rows="selectedRows"
          :total-row-count="totalRowCount"
          :header-all-selected="headerCheckState === 'checked'"
          :header-some-selected="headerCheckState === 'indeterminate'"
          @action="handleAction"
          @sort="emit('sort', $event)"
        />
        <tbody>
          <BTTableRow
            v-for="row in resolvedRows"
            :key="row.id"
            :row="row"
            :columns="resolvedColumns"
            :no-fill="variant === 'no-fill'"
            :has-checkbox="hasCheckbox"
            :fixed-left="fixedLeft"
            :fixed-right="fixedRight"
            :selected-rows="selectedRows"
            :total-row-count="totalRowCount"
            :depth="0"
            :expanded-keys="expandedKeys"
            @action="handleAction"
            @cell-change="emit('cell-change', $event)"
            @update:expanded-keys="emit('update:expandedKeys', $event)"
          />
        </tbody>
      </table>
    </div>

    <BTScrollbar
      v-if="scrollWidth > clientWidth"
      ref="scrollbarRef"
      direction="x"
      class="bt-data-table__scrollbar-outer"
      aria-hidden="true"
      @scroll.passive="handleScrollbarScroll"
    >
      <div :style="{ width: `${scrollWidth}px`, height: '1px' }" />
    </BTScrollbar>

    <div v-if="showPagination" class="bt-data-table__pagination">
      <BTPagination
        variant="display"
        :current-page="currentPage"
        :total-pages="totalPages"
        :rows-per-page="rowsPerPage"
        :rows-per-page-options="rowsPerPageOptions"
        @page-change="emit('page-change', $event)"
        @rows-change="emit('rows-change', $event)"
      />
    </div>
  </section>
</template>
