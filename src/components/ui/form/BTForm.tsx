'use client';
/**
 * BTForm — top-level form coordinator. Mirrors what you'd write with a
 * plain `<form>` element, but adds:
 *
 *   - A single `validator` prop (function OR per-field map) that runs once
 *     per render and produces a `field → error` map.
 *   - A context that BT input components subscribe to via their `name` prop —
 *     `value`, `onChange`, `onBlur`, and `error` wire automatically. No
 *     prop-spreading per input required.
 *   - `onSubmit` only fires when the form is valid. Browser-native HTML5
 *     validation tooltips are suppressed by default (we own the UI).
 *   - Errors gated on `touched` OR `submitted` so untouched fields stay
 *     clean until the user attempts submit.
 *
 * Per-input `errorText` and `validator` props still work — explicit prop
 * always wins. Use BTForm for the *form-level* shape; per-input rules layer
 * on top for client-side feedback that doesn't need cross-field context.
 */
import * as React from 'react';
import { BTFormContext } from '@/components/ui/form/BTFormContext';
import type {
  BTFormContextValue,
  BTFormFieldValidator,
  BTFormProps,
  BTFormState,
  BTFormStatus,
  BTFormValidator,
} from '@/components/ui/form/BTForm.types';

function runValidator<T extends Record<string, unknown>>(
  validator: BTFormValidator<T> | undefined,
  values: T,
): Partial<Record<keyof T, string | null>> {
  if (!validator) return {};
  if (typeof validator === 'function') {
    const raw = validator(values) ?? {};
    // Normalize undefined → null so downstream consumers don't have to
    // special-case "not set" vs "no error".
    const out: Partial<Record<keyof T, string | null>> = {};
    for (const k of Object.keys(raw) as Array<keyof T>) {
      const v = raw[k];
      out[k] = v == null ? null : v;
    }
    return out;
  }
  // Per-field map form.
  const out: Partial<Record<keyof T, string | null>> = {};
  for (const k of Object.keys(values) as Array<keyof T>) {
    const fn = (validator as Record<string, BTFormFieldValidator<unknown, T>>)[
      k as string
    ];
    if (!fn) continue;
    const result = fn(values[k], values);
    out[k] = result == null ? null : result;
  }
  return out;
}

export function BTForm<T extends Record<string, unknown>>({
  initialValues,
  validation,
  onSubmit,
  onInvalid,
  children,
  className,
  id,
  noValidate = true,
}: BTFormProps<T>) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [status, setStatus] = React.useState<BTFormStatus>('idle');

  // Errors recompute each render. Cheap unless the validator is expensive —
  // consumer can wrap the validator in useCallback / memoize per field if so.
  const errors = React.useMemo(
    () => runValidator(validation, values),
    [validation, values],
  );
  const isValid = React.useMemo(
    () => Object.values(errors).every((e) => !e),
    [errors],
  );

  const errorFor = React.useCallback(
    (name: keyof T): string | null =>
      submitted || touched[name] ? errors[name] ?? null : null,
    [submitted, touched, errors],
  );

  const setField = React.useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setValues((s) => ({ ...s, [name]: value }));
    },
    [],
  );

  const touch = React.useCallback((name: keyof T) => {
    setTouched((t) => ({ ...t, [name]: true }));
  }, []);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setTouched({});
    setSubmitted(false);
    setStatus('idle');
  }, [initialValues]);

  const validate = React.useCallback(() => errors, [errors]);

  const formState: BTFormState<T> = {
    values,
    errors,
    touched,
    submitted,
    status,
    isValid,
    errorFor,
    setField,
    touch,
    reset,
    validate,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) {
      setStatus('submitted-invalid');
      onInvalid?.(errors);
      return;
    }
    try {
      await onSubmit?.(values);
      setStatus('submitted-success');
    } catch {
      // User-thrown errors leave the form in `submitted-invalid` so the UI
      // can render a generic "submission failed" alongside field errors.
      setStatus('submitted-invalid');
      onInvalid?.(errors);
    }
  }

  function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    reset();
  }

  // Narrow the public context slice (omit setters that re-init values).
  const contextValue = React.useMemo(
    () => ({
      values,
      errors,
      touched,
      submitted,
      errorFor,
      setField,
      touch,
    }),
    [values, errors, touched, submitted, errorFor, setField, touch],
  );

  return (
    <BTFormContext.Provider
      value={contextValue as unknown as BTFormContextValue}
    >
      <form
        id={id}
        className={className}
        noValidate={noValidate}
        onSubmit={handleSubmit}
        onReset={handleReset}
      >
        {typeof children === 'function' ? children(formState) : children}
      </form>
    </BTFormContext.Provider>
  );
}

BTForm.displayName = 'BTForm';
