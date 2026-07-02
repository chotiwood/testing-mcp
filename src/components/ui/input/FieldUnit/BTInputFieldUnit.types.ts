export interface BTInputFieldUnitHandle {
  validate: () => boolean;
}

export interface BTInputFieldUnitOption {
  /** Display text shown in dropdown (e.g. "IDR", "https://") */
  label: string;
  /** Unique identifier (e.g. "IDR", "+62") */
  value: string;
}

export interface BTInputFieldUnitProps {
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;

  // ── Left dropdown ────────────────────────────────────────────────────────
  /** Available unit options for the left selector panel. Required. */
  units: BTInputFieldUnitOption[];
  /** Controlled selected unit. When provided, overrides internal selection. */
  selectedUnit?: BTInputFieldUnitOption;
  /** Initial unit in uncontrolled mode. Defaults to units[0]. */
  initialUnit?: BTInputFieldUnitOption;
  /** Floating label shown above the selected unit text (e.g. "Currency"). */
  unitLabel?: string;
  /** Show a search input at the top of the unit dropdown. @default false */
  hasSearch?: boolean;
  /**
   * Custom filter applied when hasSearch is true.
   * Defaults to case-insensitive label.contains(query).
   */
  itemsFilter?: (items: BTInputFieldUnitOption[], query: string) => BTInputFieldUnitOption[];
  /** Called when a unit option is selected. */
  onUnitChanged?: (unit: BTInputFieldUnitOption) => void;

  // ── Right text field ─────────────────────────────────────────────────────
  /** Floating label for the right text field (e.g. "Amount"). */
  label?: string;
  /** Controlled value — always the sanitized raw value. */
  value?: string;
  /** Called when the text value changes. */
  onChange?: (value: string) => void;
  /**
   * Display transformer: receives the raw value and current unit; returns
   * the string to show in the <input>. Does NOT affect the emitted value.
   */
  formatter?: (value: string, unit: BTInputFieldUnitOption | null) => string;
  /**
   * Input transformer: called on every input event; returns the raw value
   * to emit. Use to strip formatting characters. Defaults to identity.
   */
  sanitizer?: (value: string, unit: BTInputFieldUnitOption | null) => string;
  /** HTML input keyboard hint. @default 'text' */
  keyboardType?: 'text' | 'number' | 'decimal' | 'tel' | 'url';
  /** Placeholder shown in the right field when empty. */
  hintText?: string;
  /**
   * Show a × clear button when the right field has content and is focused.
   * @default true
   */
  clearable?: boolean;

  // ── Shared ───────────────────────────────────────────────────────────────
  /**
   * Validation function called by the exposed `validate()` method.
   * Return a non-null string for an error, or null to clear.
   */
  validator?: (value: string, unit: BTInputFieldUnitOption | null) => string | null;
  /** External error message (takes precedence over the internal validator). */
  errorText?: string;
  /** Helper text shown below when no error. */
  helperText?: string;
  /** @default false */
  disabled?: boolean;
  /** Appends " *" (red) to both labels. @default false */
  required?: boolean;
  className?: string;
}
