'use client';
/**
 * BTCheckbox — Figma 504:4181
 *
 * @example
 * ```tsx
 * // Standalone controlled checkbox
 * const [checked, setChecked] = useState(false);
 * <BTCheckbox checked={checked} onChange={setChecked} label="I agree" />
 *
 * // Inside <BTForm> — auto-wires via `name`
 * <BTForm initialValues={{ agree: false }} validation={{ agree: (v) => v ? null : 'Required' }}>
 *   <BTCheckbox name="agree" label="I agree" />
 * </BTForm>
 * ```
 */
import { useRef, useEffect, useCallback } from 'react';
import '@/components/ui/checkbox/BTCheckbox.css';
import type { BTCheckboxProps } from '@/components/ui/checkbox/BTCheckbox.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';

export function BTCheckbox({
  name,
  checked,
  indeterminate = false,
  disabled = false,
  error = false,
  label,
  subtext,
  errorText,
  onChange,
  onBlur,
  className,
}: BTCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useBTForm();
  const isInForm = form !== null && typeof name === 'string';
  const formValue = isInForm ? (form.values[name] as boolean | undefined) : undefined;
  const formError = isInForm ? form.errorFor(name) : null;
  const resolvedChecked = checked ?? formValue ?? false;
  const resolvedError = errorText ?? formError ?? undefined;
  const hasError = error || !!resolvedError;
  const resolvedSubtext = resolvedError ?? subtext;

  // The indeterminate state is a DOM property, not an HTML attribute.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.checked;
      onChange?.(next);
      if (isInForm) form.setField(name, next);
    },
    [onChange, isInForm, form, name],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      if (isInForm) form.touch(name);
    },
    [onBlur, isInForm, form, name],
  );

  // bt-checkbox--no-padding mirrors Flutter's _hasPadding=false: centers the box when
  // used without label/subtext (e.g. inside BTDropdownList rows).
  const rootClass = [
    'bt-checkbox',
    disabled ? 'bt-checkbox--disabled' : '',
    hasError && !disabled ? 'bt-checkbox--error' : '',
    !label && !resolvedSubtext ? 'bt-checkbox--no-padding' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={rootClass}>
      <span className="bt-checkbox__control">
        <input
          ref={inputRef}
          type="checkbox"
          name={name}
          className="bt-checkbox__input"
          checked={resolvedChecked}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={hasError || undefined}
        />
        <span className="bt-checkbox__box" aria-hidden />
      </span>

      {(label || resolvedSubtext) && (
        <span className="bt-checkbox__text">
          {label && <span className="bt-checkbox__label">{label}</span>}
          {resolvedSubtext && <span className="bt-checkbox__subtext">{resolvedSubtext}</span>}
        </span>
      )}
    </label>
  );
}

BTCheckbox.displayName = 'BTCheckbox';
