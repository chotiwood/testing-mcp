export interface BTInputFieldUnitOption {
  /** Display text shown in dropdown (e.g. "IDR", "https://") */
  label: string;
  /** Unique identifier (e.g. "IDR", "+62") */
  value: string;
}

export interface BTInputFieldUnitProps {
  // ── Left dropdown ────────────────────────────────────────────────────────
  /** Available unit options for the left selector panel. Required. */
  units: BTInputFieldUnitOption[];
  /** Controlled selected unit. When provided, overrides internal selection. */
  selectedUnit?: BTInputFieldUnitOption;
  /** Initial unit in uncontrolled mode. Defaults to units[0]. */
  initialUnit?: BTInputFieldUnitOption;
  /** Floating label shown above the selected unit text (e.g. "Currency"). */
  unitLabel?: string;
  /**
   * Show a search input at the top of the unit dropdown.
   * @default false
   */
  hasSearch?: boolean;
  /**
   * Custom filter applied when hasSearch is true and the user types a query.
   * Receives the full units list and the current query; returns the filtered
   * subset to display. Defaults to case-insensitive label.contains(query).
   */
  itemsFilter?: (items: BTInputFieldUnitOption[], query: string) => BTInputFieldUnitOption[];

  // ── Right text field ─────────────────────────────────────────────────────
  /** Floating label for the right text field (e.g. "Amount"). */
  label?: string;
  /** Controlled value (v-model). Always the sanitized raw value. */
  modelValue?: string;
  /**
   * Display transformer: receives the raw (sanitized) modelValue and the
   * current unit; returns the string to show in the <input>. Does NOT
   * affect the emitted value — modelValue is always raw.
   */
  formatter?: (value: string, unit: BTInputFieldUnitOption | null) => string;
  /**
   * Input transformer: called on every input event with the current
   * target.value; returns the raw value to emit. Use to strip formatting
   * characters typed by the user. Defaults to identity (emit as-is).
   */
  sanitizer?: (value: string, unit: BTInputFieldUnitOption | null) => string;
  /**
   * HTML input type for the right field.
   * @default 'text'
   */
  keyboardType?: 'text' | 'number' | 'decimal' | 'tel' | 'url';
  /** Placeholder shown in the right field when empty and unfocused. */
  hintText?: string;
  /**
   * Show a × clear button that slides in when the right field has content
   * and is focused. Clicking it emits update:modelValue with ''.
   * @default true
   */
  clearable?: boolean;

  // ── BTForm wiring ────────────────────────────────────────────────────────
  /** Field name — when set inside a `<BTForm>`, auto-wires value/error. */
  name?: string;

  // ── Shared ───────────────────────────────────────────────────────────────
  /**
   * Validation function called by the exposed `validate()` method.
   * Receives the current raw modelValue and the selected unit.
   * Return a non-null string to show as an error, or null to clear it.
   */
  validator?: (value: string, unit: BTInputFieldUnitOption | null) => string | null;
  /** External error message (takes precedence over the internal validator result). */
  errorText?: string;
  /** Helper text shown below when no error. */
  helperText?: string;
  /** @default false */
  disabled?: boolean;
  /** Appends " *" (red) to both labels. @default false */
  required?: boolean;
}
