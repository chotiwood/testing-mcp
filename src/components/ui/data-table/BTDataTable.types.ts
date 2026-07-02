import type { BTTreeNode } from '@/components/ui/tree/BTTree.types';

export type BTTableCellType =
  | 'tree'
  | 'text'
  | 'button'
  | 'double-button'
  | 'checkbox'
  | 'radio'
  | 'option'
  | 'field'
  | 'dropdown'
  | 'multiple-selection'
  | 'badge'
  | 'toggle'
  | 'title'
  | 'checkbox-title'
  | 'title-dropdown'
  | 'number';

export type BTDataTableVariant =
  | 'default'
  | 'secondary'
  | 'no-fill';

export type BTDataTableSortDirection = 'asc' | 'desc' | 'none';

export interface BTDataTableOption {
  label: string;
  value: string;
}

export interface BTDataTableTag {
  id?: string;
  label: string;
}

export interface BTDataTableCell {
  type?: BTTableCellType;
  value?: string | number | boolean | null;
  label?: string;
  badgeLabel?: string;
  options?: BTDataTableOption[];
  tags?: BTDataTableTag[];
  treeNodes?: BTTreeNode[];
  checked?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export interface BTDataTableCellChangePayload {
  rowId: string;
  columnKey: string;
  cell: BTDataTableCell;
}

export interface BTTableActionPayload {
  action: string;
  rowId?: string;
  columnKey?: string;
}

export interface BTDataTableColumn {
  key: string;
  label: string;
  /**
   * Fixed pixel/rem width for this column, e.g. `"120px"`.
   * Omit (or use `fill: true`) to let the column fill remaining space.
   */
  width?: string;
  /**
   * When true the column fills available space proportionally with other
   * fill columns — equivalent to leaving `width` unset.
   * Useful for making the intent explicit in column definitions.
   */
  fill?: boolean;
  sortable?: boolean;
  sortDirection?: BTDataTableSortDirection;
  headerType?: Extract<BTTableCellType, 'title' | 'checkbox-title' | 'title-dropdown'>;
  /** Mark this column as the expander — renders indent + chevron for tree rows */
  expander?: boolean;
  /**
   * Horizontal alignment of cell content and header label.
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
}

export interface BTDataTableRow {
  id: string;
  cells: Record<string, BTDataTableCell | string | number | boolean | null | undefined>;
  /** Nested child rows — presence triggers tree behaviour */
  children?: BTDataTableRow[];
}

export interface BTTableItemProps {
  type?: BTTableCellType;
  cell?: BTDataTableCell | string | number | boolean | null;
  label?: string;
  header?: boolean;
  as?: 'div' | 'td' | 'th';
  columnKey?: string;
  rowId?: string;
  noFill?: boolean;
}

export interface BTTableRowProps {
  row: BTDataTableRow;
  columns: BTDataTableColumn[];
  noFill?: boolean;
  /** Nesting depth — 0 = root, 1 = first child level, etc. */
  depth?: number;
  expandedKeys?: Record<string, boolean>;
  hasCheckbox?: boolean;
  fixedLeft?: number;
  fixedRight?: number;
  selectedRows?: string[];
  totalRowCount?: number;
}

export interface BTSortPayload {
  columnKey: string;
  direction: BTDataTableSortDirection;
}

export interface BTTableTitleProps {
  columns: BTDataTableColumn[];
  variant?: BTDataTableVariant;
  hasCheckbox?: boolean;
  fixedLeft?: number;
  fixedRight?: number;
  selectedRows?: string[];
  totalRowCount?: number;
  headerAllSelected?: boolean;
  headerSomeSelected?: boolean;
}

export interface BTDataTableProps {
  title?: string;
  columns?: BTDataTableColumn[];
  rows?: BTDataTableRow[];
  variant?: BTDataTableVariant;
  showToolbar?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  searchValue?: string;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  currentPage?: number;
  totalPages?: number;
  filters?: string[];
  /**
   * Max number of filter tags shown before collapsing into a "+N" badge.
   * @default 4
   */
  maxVisibleFilters?: number;
  /** Controlled expansion state — keys are row IDs, values are true=expanded */
  expandedKeys?: Record<string, boolean>;
  /** Max height of the table viewport. When set, rows scroll vertically inside the container. Pass `null` or omit for auto height (no restriction). */
  maxHeight?: string | null;
  /** Keeps the table header pinned while the viewport scrolls vertically. */
  fixedHeader?: boolean;
  /** Prepends a checkbox column (width 48px) as column 0 */
  hasCheckbox?: boolean;
  /** Number of columns to fix from left (checkbox counts if hasCheckbox) */
  fixedLeft?: number;
  /** Number of columns to fix from right */
  fixedRight?: number;
  /** Controlled array of selected row IDs */
  selectedRows?: string[];
}
