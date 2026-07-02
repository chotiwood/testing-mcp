'use client';
/*
 * BTInputWithLabel — text input with static label pill(s) attached on the
 * left, right, or both sides — all sharing one unified border.
 *
 * Extends BTInput's floating-label behaviour. The pill is a static text badge
 * (e.g. "kg", "IDR", "m²") — not a dropdown (use BTInputFieldUnit for that).
 *
 * Figma node 368-6832.
 *
 * Variants (driven by which label props are provided):
 *   - leftLabel only  → L Label
 *   - rightLabel only → R Label
 *   - both            → L R Label
 *   - neither         → plain input (identical to BTInput)
 *
 * Usage:
 *   <BTInputWithLabel leftLabel="kg" label="Weight" value={v} onChange={setV} />
 *   <BTInputWithLabel rightLabel="m²" label="Area" value={v} onChange={setV} />
 *   <BTInputWithLabel leftLabel="From" rightLabel="IDR" label="Amount" value={v} onChange={setV} />
 *   <BTInputWithLabel
 *     leftLabel="Rp" label="Amount" required
 *     validator={(v) => (!v || isNaN(Number(v)) || Number(v) <= 0) ? 'Enter a positive number.' : null}
 *     ref={fieldRef}
 *   />
 */
import '@/components/ui/input/WithLabel/BTInputWithLabel.css';
import { forwardRef, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { BTInputWithLabelHandle, BTInputWithLabelProps } from '@/components/ui/input/WithLabel/BTInputWithLabel.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';
import cancelIcon from '@/components/ui/input/icons/cancel.svg';

export const BTInputWithLabel = forwardRef<BTInputWithLabelHandle, BTInputWithLabelProps>(
  function BTInputWithLabel(props, ref) {
    const {
      value,
      onChange,
      leftLabel,
      rightLabel,
      label,
      required = false,
      placeholder,
      disabled = false,
      readOnly = false,
      errorText,
      helperText,
      id,
      name,
      maxLength,
      showCharCount = false,
      validator,
      onClear,
      onFocus,
      onBlur,
    } = props;

    // BTForm wrapping (optional)
    const form = useBTForm();
    const isInForm = form !== null && typeof name === 'string';
    const formValue = isInForm ? (form.values[name] as string | undefined) : undefined;
    const formError = isInForm ? form.errorFor(name) : null;
    const resolvedValue = value ?? formValue ?? '';

    const [isFocused,     setIsFocused]     = useState(false);
    const [errorInternal, setErrorInternal] = useState<string | null>(null);

    const generatedId = useId();
    const fieldId     = id ?? `bt-input-wl-${generatedId}`;
    const inputRef    = useRef<HTMLInputElement>(null);

    const activeError = errorText ?? errorInternal ?? formError ?? null;
    const hasError    = !!activeError;
    const isEmpty     = !resolvedValue;
    const resolvedRequired = required;

    const labelFloating = useMemo(
      () => !!label && (isFocused || !isEmpty),
      [label, isFocused, isEmpty],
    );

    const showClear = !isEmpty && isFocused && !disabled && !readOnly;

    // ── CSS classes ────────────────────────────────────────────────────────
    const fieldClass = [
      'bt-input-with-label',
      leftLabel  && 'bt-input-with-label--has-left',
      rightLabel && 'bt-input-with-label--has-right',
      isFocused  && 'bt-input-with-label--focused',
      hasError   && 'bt-input-with-label--error',
      disabled   && 'bt-input-with-label--disabled',
    ].filter(Boolean).join(' ');

    const contentClass = [
      'bt-input-with-label__content',
      labelFloating && 'bt-input-with-label__content--floating',
    ].filter(Boolean).join(' ');

    const labelClass = [
      'bt-input-with-label__label',
      labelFloating && 'bt-input-with-label__label--floating',
    ].filter(Boolean).join(' ');

    // ── Handlers ──────────────────────────────────────────────────────────
    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
      setErrorInternal(null);
      const next = e.target.value;
      onChange?.(next);
      if (isInForm) form.setField(name, next);
    }

    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      setIsFocused(true);
      onFocus?.(e);
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      setIsFocused(false);
      onBlur?.(e);
      if (isInForm) form.touch(name);
    }

    function handleClear() {
      setErrorInternal(null);
      onChange?.('');
      onClear?.();
      if (isInForm) form.setField(name, '');
      inputRef.current?.focus();
    }

    // ── Validation ────────────────────────────────────────────────────────
    function validate(): boolean {
      if (!validator) return true;
      const result = validator(resolvedValue);
      setErrorInternal(result ?? null);
      return result === null;
    }

    useImperativeHandle(ref, () => ({ validate }));

    // ── Render ────────────────────────────────────────────────────────────
    return (
      <div className="bt-input-with-label__wrapper">

        {/* Field container */}
        <div className={fieldClass}>

          {/* Left label pill */}
          {leftLabel && (
            <div
              className="bt-input-with-label__pill bt-input-with-label__pill--left"
              aria-hidden="true"
            >
              <span className="bt-input-with-label__pill-text">{leftLabel}</span>
            </div>
          )}

          {/* Content: floating label + input */}
          <div className={contentClass}>

            {/* Floating label */}
            {label && (
              <label htmlFor={fieldId} className={labelClass}>
                {label}
                {required && (
                  <span className="bt-input-with-label__label-required">*</span>
                )}
              </label>
            )}

            {/* Input */}
            <input
              ref={inputRef}
              id={fieldId}
              name={name}
              value={resolvedValue}
              className="bt-input-with-label__field"
              placeholder={!label || labelFloating ? (placeholder ?? '') : ''}
              disabled={disabled}
              readOnly={readOnly}
              maxLength={maxLength}
              type="text"
              aria-invalid={hasError || undefined}
              aria-required={resolvedRequired || undefined}
              onChange={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Clear (×) button — sibling of content so align-self: center works
              independently of the content area's padding state */}
          {showClear && (
            <button
              type="button"
              className="bt-input-with-label__clear"
              aria-label="Clear input"
              onPointerDown={(e) => { e.preventDefault(); handleClear(); }}
            >
              <img src={cancelIcon} alt="" />
            </button>
          )}

          {/* Right label pill */}
          {rightLabel && (
            <div
              className="bt-input-with-label__pill bt-input-with-label__pill--right"
              aria-hidden="true"
            >
              <span className="bt-input-with-label__pill-text">{rightLabel}</span>
            </div>
          )}

        </div>

        {/* Helper / error text — when wrapped, suppress error/helper text but keep char counter */}
        {(() => {
          const showHelperText = activeError || helperText;
          const showCounter = showCharCount && !!maxLength;
          if (!showHelperText && !showCounter) return null;
          return (
            <div className="bt-input-with-label__helper">
              {showHelperText ? (
                <span
                  className={[
                    'bt-input-with-label__helper-text',
                    hasError && 'bt-input-with-label__helper-text--error',
                  ].filter(Boolean).join(' ')}
                  role={hasError ? 'alert' : undefined}
                >
                  {activeError || helperText}
                </span>
              ) : (
                <span aria-hidden="true" style={{ flex: 1 }} />
              )}
              {showCounter && (
                <span className="bt-input-with-label__counter">
                  {(resolvedValue || '').length}/{maxLength}
                </span>
              )}
            </div>
          );
        })()}

      </div>
    );
  },
);

BTInputWithLabel.displayName = 'BTInputWithLabel';
