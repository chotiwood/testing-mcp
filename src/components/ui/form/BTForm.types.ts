import type React from 'react';

/**
 * Per-field validator. Receives the field's current value and the full
 * `values` snapshot for cross-field rules (e.g. "confirm-password matches
 * password"). Return `null`/`undefined` for a valid field, or a string
 * error message to fail validation.
 */
export type BTFormFieldValidator<V = unknown, T = Record<string, unknown>> = (
  value: V,
  allValues: T,
) => string | null | undefined;

/**
 * Form-wide validator. Two shapes are accepted:
 *
 *   1. **Function form** — receives the full `values` snapshot, returns a
 *      partial map of `field → error` (or null). Most flexible — wrap a
 *      Zod schema, do cross-field logic, etc.
 *
 *   2. **Per-field map form** — `{ field: (value, all) => error | null }`.
 *      Ergonomic when each field has a self-contained rule. Compose with
 *      utility helpers (`required`, `pattern`, etc.) or chain via
 *      `composeValidators(...)`.
 *
 * Either form returns the same `{ field: error | null }` shape internally.
 */
export type BTFormValidator<T extends Record<string, unknown> = Record<string, unknown>> =
  | ((values: T) => Partial<Record<keyof T, string | null | undefined>>)
  | { [K in keyof T]?: BTFormFieldValidator<T[K], T> };

/**
 * Form lifecycle status. Surfaces via `state.status` so consumers can render
 * a confirmation banner / error toast without owning extra state.
 *
 *   - `'idle'`              — initial; no submit attempt yet
 *   - `'submitted-invalid'` — last submit attempt found errors
 *   - `'submitted-success'` — last submit attempt passed validation
 *                              (after the user's `onSubmit` resolved)
 */
export type BTFormStatus = 'idle' | 'submitted-invalid' | 'submitted-success';

export interface BTFormState<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Current values for every field. */
  values: T;
  /** All current errors (null = valid). NOT gated on touched/submitted. */
  errors: Partial<Record<keyof T, string | null>>;
  /** Whether each field has been blurred at least once. */
  touched: Partial<Record<keyof T, boolean>>;
  /** Whether the user has attempted submit at least once. */
  submitted: boolean;
  /** Lifecycle status — see BTFormStatus. */
  status: BTFormStatus;
  /** True when no field currently has a validation error. */
  isValid: boolean;

  /**
   * Resolved error for a field — returns `null` until the field has been
   * blurred (`touched`) OR the user has attempted submit. Matches Flutter's
   * `autovalidateMode: onUserInteraction`.
   */
  errorFor: (name: keyof T) => string | null;
  /** Set a field's value (also wires the input's `onChange` automatically). */
  setField: <K extends keyof T>(name: K, value: T[K]) => void;
  /** Mark a field touched (also wires the input's `onBlur` automatically). */
  touch: (name: keyof T) => void;
  /** Reset values/touched/submitted/status to initial. */
  reset: () => void;
  /** Run the full validator and return the latest errors. */
  validate: () => Partial<Record<keyof T, string | null>>;
}

export interface BTFormProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Initial values keyed by field `name`. Determines the field shape `T`. */
  initialValues: T;
  /**
   * Form-wide validation — function form OR per-field map. See
   * `BTFormValidator` for the shape.
   *
   * Skipped entirely when omitted (form always reports `isValid: true`).
   */
  validation?: BTFormValidator<T>;
  /**
   * Called when the user submits AND the form is valid. Receives the latest
   * `values`. Can be async; while resolving, `status` stays `'idle'` then
   * flips to `'submitted-success'` once it resolves cleanly.
   *
   * Throwing or rejecting leaves `status` at `'submitted-invalid'` and also
   * fires `onInvalid` with the current errors.
   */
  onSubmit?: (values: T) => void | Promise<void>;
  /**
   * Called when the user attempts submit but `validation` returns errors.
   * Receives the full error map. Useful for focusing the first invalid input
   * or logging.
   */
  onInvalid?: (errors: Partial<Record<keyof T, string | null>>) => void;
  /**
   * Render. Two children shapes are accepted:
   *
   *   - **JSX nodes**: any children — BT inputs that declare a `name` prop
   *     auto-wire (value/onChange/onBlur/error) via context.
   *
   *   - **Render-prop function**: `(form) => ReactNode` — receives the full
   *     `BTFormState`. Useful when you need form values to drive logic
   *     outside the inputs (e.g. conditional sections).
   */
  children: React.ReactNode | ((form: BTFormState<T>) => React.ReactNode);
  /** Extra class names applied to the `<form>` element. */
  className?: string;
  /** Forwarded to the `<form>` element. */
  id?: string;
  /**
   * Suppress browser-native HTML5 validation tooltips. Defaults to `true` —
   * `BTForm` does its own validation and double-prompting is confusing.
   */
  noValidate?: boolean;
}

/**
 * Public context value — what each BT input sees when wrapped in `<BTForm>`.
 * Inputs read the active field by `name` and call the wiring helpers.
 *
 * Keep this *narrow* — it's the public contract for input components and
 * should NOT leak internals like raw setState dispatchers.
 */
export interface BTFormContextValue<T extends Record<string, unknown> = Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string | null>>;
  touched: Partial<Record<keyof T, boolean>>;
  submitted: boolean;
  errorFor: (name: keyof T) => string | null;
  setField: <K extends keyof T>(name: K, value: T[K]) => void;
  touch: (name: keyof T) => void;
}
