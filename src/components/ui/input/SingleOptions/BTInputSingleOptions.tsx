'use client';
/**
 * BTInputSingleOptions — labeled radio button group (Figma node 702-3422).
 *
 * A flex-wrap row of BTRadioButton items with a title label above and
 * optional validation / helper text below.
 *
 * @example
 * // Basic
 * const [val, setVal] = useState<string | null>(null);
 * const opts = [
 *   { value: 'a', label: 'Option A' },
 *   { value: 'b', label: 'Option B' },
 *   { value: 'c', label: 'Disabled', disabled: true },
 * ];
 * <BTInputSingleOptions label="Pilih opsi" items={opts} value={val} onChange={setVal} />
 *
 * @example
 * // Required + validator
 * const ref = useRef<BTInputSingleOptionsHandle>(null);
 * <BTInputSingleOptions
 *   label="Status"
 *   items={opts}
 *   value={val}
 *   onChange={setVal}
 *   required
 *   validator={v => v ? null : 'Wajib dipilih'}
 *   ref={ref}
 * />
 * // Trigger validation: ref.current?.validate()
 */
import React from 'react';
import '@/components/ui/input/SingleOptions/BTInputSingleOptions.css';
import type {
  BTInputSingleOptionsProps,
  BTInputSingleOptionsHandle,
} from '@/components/ui/input/SingleOptions/BTInputSingleOptions.types';
import { BTRadioButton } from '@/components/ui/radio-button/index';
import type { BTRadioButtonValue } from '@/components/ui/radio-button/BTRadioButton.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';

export const BTInputSingleOptions = React.forwardRef<
  BTInputSingleOptionsHandle,
  BTInputSingleOptionsProps
>(function BTInputSingleOptions(
  {
    value,
    onChange,
    label,
    required = false,
    items,
    disabled = false,
    errorText,
    helperText,
    name,
    validator,
    className,
  },
  ref,
) {
  // BTForm wrapping (optional)
  const form = useBTForm();
  const isInForm = form !== null && typeof name === 'string';
  const formValue = isInForm ? (form.values[name] as unknown) : undefined;
  const formError = isInForm ? form.errorFor(name) : null;
  const resolvedValue = (value ?? formValue) as Parameters<NonNullable<typeof onChange>>[0] | undefined;

  const [errorInternal, setErrorInternal] = React.useState<string | null>(null);
  const activeError = errorText ?? errorInternal ?? formError ?? null;
  const hasError = !!activeError;
  const resolvedRequired = required;

  React.useImperativeHandle(
    ref,
    () => ({
      validate() {
        if (!validator) return true;
        const result = validator((resolvedValue ?? null) as Parameters<NonNullable<typeof validator>>[0]);
        setErrorInternal(result ?? null);
        return result === null;
      },
    }),
    [validator, resolvedValue],
  );

  function handleSelect(radioValue: BTRadioButtonValue) {
    if (disabled) return;
    setErrorInternal(null);
    onChange?.(radioValue as Parameters<typeof onChange>[0]);
    if (isInForm) form.setField(name, radioValue);
  }

  const wrapperClass = [
    'bt-input-single-options__wrapper',
    hasError && !disabled && 'bt-input-single-options--error',
    disabled && 'bt-input-single-options--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {/* Label row */}
      {label && (
        <div className="bt-input-single-options__label-row">
          <span className="bt-input-single-options__label">
            {label}
            {required && (
              <span className="bt-input-single-options__required">*</span>
            )}
          </span>
        </div>
      )}

      {/* Radio group */}
      <div
        className="bt-input-single-options__group"
        role="radiogroup"
        aria-required={resolvedRequired || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={(hasError && !disabled) || undefined}
      >
        {items.map((item) => (
          <BTRadioButton
            key={String(item.value)}
            modelValue={(resolvedValue ?? '') as BTRadioButtonValue}
            value={item.value as BTRadioButtonValue}
            label={item.label}
            disabled={disabled || !!item.disabled}
            error={hasError && !disabled}
            name={name}
            onChange={handleSelect}
          />
        ))}
      </div>

      {((!disabled && activeError) || helperText) && (
        <div className="bt-input-single-options__helper">
          <span
            className={[
              'bt-input-single-options__helper-text',
              hasError && !disabled &&
                'bt-input-single-options__helper-text--error',
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

BTInputSingleOptions.displayName = 'BTInputSingleOptions';
