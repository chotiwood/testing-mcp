// BTTree types — Figma node 2481:7383
import type { Component } from 'vue';

/** Tri-state for tree node checkboxes. */
export type BTTreeItemCheckState = 'unchecked' | 'indeterminate' | 'checked';

/**
 * Data model for a single node in the tree.
 *
 * - Provide `children` to make the node expandable (arrow is auto-shown).
 * - Omit `checkState` entirely to hide the checkbox.
 * - Either `label` or `body` (or both) should be provided for row content.
 *   When `body` is present it fills the content area; `label` still shows if
 *   you want both (e.g. label on left + badge on right via `body`).
 */
export interface BTTreeNode {
  /** Optional unique key; falls back to `label` if omitted. */
  key?: string;
  /** Row label text — optional when `body` is provided. */
  label?: string;
  /**
   * Custom content component rendered in the row body area (replaces or
   * supplements the label). The component receives no props — wrap state
   * access in a closure-based component if needed.
   */
  body?: Component;
  /** Optional 16×16 icon component — rendered via `<component :is>`. */
  icon?: Component;
  /** Whether the node is initially expanded. Defaults to false. */
  initiallyExpanded?: boolean;
  /** Render with brand-subtle selected background. */
  selected?: boolean;
  /** Disable all interaction (0.45 opacity). */
  disabled?: boolean;
  /**
   * Checkbox tri-state. When `undefined` (not provided), no checkbox is shown.
   * Clicking `checked` or `indeterminate` always transitions to `unchecked`;
   * clicking `unchecked` transitions to `checked`.
   */
  checkState?: BTTreeItemCheckState;
  /** Called when the row body is clicked (not the arrow or checkbox). */
  onPress?: () => void;
  /**
   * Called when the checkbox changes. Receives `'checked'` or `'unchecked'`
   * — never `'indeterminate'` (that transitions are internal to the component).
   */
  onCheck?: (state: 'unchecked' | 'checked') => void;
  /** Called when the expand/collapse state changes. */
  onToggle?: (expanded: boolean) => void;
  /** Child nodes — presence auto-enables the expand/collapse arrow. */
  children?: BTTreeNode[];
}

export interface BTTreeProps {
  /** Top-level tree nodes. */
  nodes: BTTreeNode[];
  class?: string;
}
