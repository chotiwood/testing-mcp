'use client';
/**
 * BTInputMultiOptions — labeled checkbox group / multi-select (Figma node 859-2091).
 *
 * A flex-wrap row of BTCheckbox items with a title label above and
 * optional validation / helper text below.
 *
 * @example
 * // Basic
 * const [selected, setSelected] = useState<string[]>([]);
 * const opts = [
 *   { value: 'a', label: 'Option A' },
 *   { value: 'b', label: 'Option B' },
 *   { value: 'c', label: 'Disabled', disabled: true },
 * ];
 * <BTInputMultiOptions label="Pilih opsi" items={opts} value={selected} onChange={setSelected} />
 *
 * @example
 * // Required + validator
 * const ref = useRef<BTInputMultiOptionsHandle>(null);
 * <BTInputMultiOptions
 *   label="Kategori"
 *   items={opts}
 *   value={selected}
 *   onChange={setSelected}
 *   required
 *   validator={v => v.length ? null : 'Pilih minimal satu opsi'}
 *   ref={ref}
 * />
 * // Trigger validation: ref.current?.validate()
 */
import React from 'react';
import '@/components/ui/input/MultiOptions/BTInputMultiOptions.css';
import type {
  BTInputMultiOptionsProps,
  BTInputMultiOptionsHandle,
} from '@/components/ui/input/MultiOptions/BTInputMultiOptions.types';
import { BTCheckbox } from '@/components/ui/checkbox/index';
import { useBTForm } from '@/components/ui/form/BTFormContext';

export const BTInputMultiOptions = React.forwardRef<
  BTInputMultiOptionsHandle,
  BTInputMultiOptionsProps
>(function BTInputMultiOptions(
  {
    name,
    value,
    onChange,
    label,
    required = false,
    items,
    disabled = false,
    errorText,
    helperText,
    validator,
    className,
  },
  ref,
) {
  // BTForm wrapping (optional)
  const form = useBTForm();
  const isInForm = form !== null && typeof name === 'string';
  const formValue = isInForm ? (form.values[name] as unknown[] | undefined) : undefined;
  const formError = isInForm ? form.errorFor(name) : null;
  const resolvedValue = (value ?? formValue) as unknown[] | undefined;

  const [errorInternal, setErrorInternal] = React.useState<string | null>(null);
  const activeError = errorText ?? errorInternal ?? formError ?? null;
  const hasError = !!activeError;
  const resolvedRequired = required;

  React.useImperativeHandle(
    ref,
    () => ({
      validate() {
        if (!validator) return true;
        const result = validator((resolvedValue ?? []) as Parameters<NonNullable<typeof validator>>[0]);
        setErrorInternal(result ?? null);
        return result === null;
      },
    }),
    [validator, resolvedValue],
  );

  function handleToggle(itemValue: unknown, checked: boolean) {
    if (disabled) return;
    setErrorInternal(null);
    const current = (resolvedValue ?? []) as unknown[];
    const next = checked
      ? [...current, itemValue]
      : current.filter((v) => v !== itemValue);
    onChange?.(next as Parameters<typeof onChange>[0]);
    if (isInForm) form.setField(name, next);
  }

  const wrapperClass = [
    'bt-input-multi-options__wrapper',
    hasError && !disabled && 'bt-input-multi-options--error',
    disabled && 'bt-input-multi-options--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {/* Label row */}
      {label && (
        <div className="bt-input-multi-options__label-row">
          <span className="bt-input-multi-options__label">
            {label}
            {required && (
              <span className="bt-input-multi-options__required">*</span>
            )}
          </span>
        </div>
      )}

      {/* Checkbox group */}
      <div
        className="bt-input-multi-options__group"
        role="group"
        aria-required={resolvedRequired || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={(hasError && !disabled) || undefined}
      >
        {items.map((item) => (
          <BTCheckbox
            key={String(item.value)}
            checked={((resolvedValue ?? []) as unknown[]).includes(item.value)}
            label={item.label}
            disabled={disabled || !!item.disabled}
            error={hasError && !disabled}
            onChange={(checked) => handleToggle(item.value, checked)}
          />
        ))}
      </div>

      {((!disabled && activeError) || helperText) && (
        <div className="bt-input-multi-options__helper">
          <span
            className={[
              'bt-input-multi-options__helper-text',
              hasError && !disabled &&
                'bt-input-multi-options__helper-text--error',
            ]
              .filter(Boolean)
              .join(' ')}
            role={hasError && !disabled ? 'alert' : undefined}
          >
            {(!disabled && activeError) || helperText}
          </span>
        </div>
      )}
    </div>
  );
});

BTInputMultiOptions.displayName = 'BTInputMultiOptions';
