'use client';
/**
 * BTInput — Material M3 outlined-style text input. Foundation of the btech
 * input family. All composites (BTInputDate, BTInputDropdown, BTInputUnit,
 * etc.) wrap this atom and add overlay/chip behaviour.
 *
 * Sliced from Figma InputField (node 85:2484) + InputWithLabel (node 368:6832).
 *
 * Variant precedence (suffix priority, highest first):
 *   1. focused + value non-empty + not disabled/readOnly + not password → clear ✕
 *   2. type=password + showPasswordToggle → eye/eye-off toggle
 *   3. suffix prop (only when none of 1–2 apply)
 *
 * Error state shows ONLY via border colour + red helper text — no suffix icon.
 * NOTE: `clearable` prop kept for backward-compat but no longer required — the
 * cancel icon appears automatically whenever the field is focused and non-empty.
 *
 * ## Usage:
 * ```tsx
 * <BTInput label="Username" required placeholder="Type your username"
 *          value={val} onChange={setVal} />
 * <BTInput label="Password" type="password" showPasswordToggle
 *          value={pwd} onChange={setPwd} />
 * <BTInput label="Email" type="email" errorText="Invalid email" />
 * ```
 */
import * as React from 'react';
import '@/components/ui/input/BTInput.css';
import type { BTInputProps } from '@/components/ui/input/BTInput.types';
import { BTInputAnimatedLabel } from '@/components/ui/input/internal/BTInputAnimatedLabel';
import { IconEye, IconEyeOff } from '@/components/ui/input/internal/BTInputFieldIcons';
import cancelIcon from '@/components/ui/input/icons/cancel.svg';

type SuffixKind = 'clear' | 'password' | 'slot' | null;

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const BTInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  BTInputProps
>(function BTInput(
  {
    value,
    placeholder,
    label,
    required = false,
    disabled = false,
    readOnly = false,
    errorText,
    helperText,
    type = 'text',
    showPasswordToggle = false,
    multiline = false,
    rows = 5,
    maxLength,
    showCharCount = false,
    clearable = false,
    id,
    name,
    prefix,
    suffix,
    onChange,
    onFocus,
    onBlur,
    onClear,
    className,
  },
  ref,
) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  const hasError = !!errorText;
  const isEmpty = !value;
  const hasPrefix = !!prefix;
  const showFloatingLabel = !!label && (isFocused || !isEmpty);

  const inputType: React.HTMLInputTypeAttribute =
    type === 'password' ? (passwordVisible ? 'text' : 'password') : type;

  // Suffix priority: clear (focused + non-empty, no clearable gate) > password-toggle > slot
  // Error shows only via border + helper text — no suffix icon.
  const suffixKind = React.useMemo<SuffixKind>(() => {
    if (!isEmpty && !disabled && !readOnly && isFocused && type !== 'password') return 'clear';
    if (type === 'password' && showPasswordToggle) return 'password';
    if (suffix) return 'slot';
    return null;
  }, [isEmpty, disabled, readOnly, isFocused, type, showPasswordToggle, suffix]);

  const wrapperClass = cn(
    'bt-input',
    isFocused && 'bt-input--focused',
    hasError && 'bt-input--error',
    disabled && 'bt-input--disabled',
    label && 'bt-input--with-label',
    hasPrefix && 'bt-input--with-prefix',
    showFloatingLabel && 'bt-input--label-floating',
    multiline && 'bt-input--multiline',
    className,
  );

  function handleInput(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange?.(e.target.value);
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setIsFocused(true);
    onFocus?.(e);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setIsFocused(false);
    onBlur?.(e);
  }

  function handleClear() {
    onChange?.('');
    onClear?.();
  }

  const sharedFieldProps = {
    id,
    name,
    value: value ?? '',
    placeholder: !label || showFloatingLabel ? placeholder : '',
    disabled,
    maxLength,
    className: 'bt-input__field',
    onChange: handleInput,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  return (
    <div className="bt-input__wrapper">
      <div className={wrapperClass}>
        {hasPrefix && (
          <span className="bt-input__prefix">{prefix}</span>
        )}

        {label && (
          <BTInputAnimatedLabel label={label} required={required} />
        )}

        {multiline ? (
          <textarea
            {...sharedFieldProps}
            ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
            rows={rows}
            readOnly={readOnly}
          />
        ) : (
          <input
            {...sharedFieldProps}
            ref={ref as React.ForwardedRef<HTMLInputElement>}
            type={inputType}
            readOnly={readOnly}
          />
        )}

        {/* Clear button — direct child of flex row so animation fires on enter/exit.
            Uses onPointerDown.preventDefault() to avoid blur firing before clear. */}
        {suffixKind === 'clear' && (
          <button
            type="button"
            className="bt-input__icon-btn bt-input-clear-enter"
            aria-label="Clear input"
            onPointerDown={(e) => { e.preventDefault(); handleClear(); }}
          >
            <img src={cancelIcon} alt="" />
          </button>
        )}

        {/* Password toggle + suffix slot */}
        {(suffixKind === 'password' || suffixKind === 'slot') && (
          <span className="bt-input__suffix">
            {suffixKind === 'password' && (
              <button
                type="button"
                className="bt-input__icon-btn"
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                onClick={() => setPasswordVisible((v) => !v)}
              >
                {passwordVisible ? <IconEyeOff /> : <IconEye />}
              </button>
            )}
            {suffixKind === 'slot' && suffix}
          </span>
        )}
      </div>

      {(errorText || helperText || (showCharCount && maxLength)) && (
        <div className="bt-input__helper">
          <span className={cn('bt-input__helper-text', hasError && 'bt-input__helper-text--error')}>
            {errorText || helperText}
          </span>
          {showCharCount && maxLength && (
            <span className="bt-input__counter">
              {(value ?? '').length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

BTInput.displayName = 'BTInput';
