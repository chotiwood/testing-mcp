'use client';
/**
 * BTInputSearch — standalone search field.
 *
 * ## Usage
 * ```tsx
 * <BTInputSearch
 *   value={query}
 *   onChange={setQuery}
 *   onSearch={(q) => doSearch(q)}
 *   placeholder="Search products..."
 *   helperText="Minimum 3 characters"
 *   validator={(v) => v.length < 3 ? 'Enter at least 3 characters' : null}
 * />
 * ```
 */
import * as React from 'react';
import '@/components/ui/input/Search/BTInputSearch.css';
import type { BTInputSearchHandle, BTInputSearchProps } from '@/components/ui/input/Search/BTInputSearch.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';

export const BTInputSearch = React.forwardRef<BTInputSearchHandle, BTInputSearchProps>(
  function BTInputSearch(
    {
      value,
      name,
      placeholder = 'Search',
      disabled = false,
      errorText,
      helperText,
      onChange,
      onSearch,
      onClear,
      validator,
      className,
    },
    ref,
  ) {
    // BTForm wrapping (optional)
    const form = useBTForm();
    const isInForm = form !== null && typeof name === 'string';
    const formValue = isInForm ? (form.values[name] as string | undefined) : undefined;
    const formError = isInForm ? form.errorFor(name) : null;
    const resolvedValue = value ?? formValue ?? '';

    const [isFocused, setIsFocused] = React.useState(false);
    const [errorInternal, setErrorInternal] = React.useState<string | null>(null);

    const activeError = errorText ?? errorInternal ?? formError ?? null;
    const showCancel = isFocused && !!resolvedValue && !disabled;

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
      setErrorInternal(null);
      const next = e.target.value;
      onChange?.(next);
      if (isInForm) form.setField(name, next);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter') {
        onSearch?.(resolvedValue);
      }
    }

    function handleClear() {
      onChange?.('');
      onClear?.();
      setErrorInternal(null);
      if (isInForm) form.setField(name, '');
    }

    function handleBlur() {
      setIsFocused(false);
      if (isInForm) form.touch(name);
    }

    function validate(): boolean {
      if (!validator) return true;
      const result = validator(resolvedValue);
      setErrorInternal(result ?? null);
      return result === null;
    }

    React.useImperativeHandle(ref, () => ({ validate }), [resolvedValue, validator]);

    const fieldClass = [
      'bt-input-search__field',
      isFocused && !activeError ? 'bt-input-search__field--focused' : '',
      activeError ? 'bt-input-search__field--error' : '',
      disabled ? 'bt-input-search__field--disabled' : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={['bt-input-search', className].filter(Boolean).join(' ')}>
        {/* Field row */}
        <div className={fieldClass}>
          {/* Search icon */}
          <span className={['bt-input-search__icon', disabled ? 'bt-input-search__icon--disabled' : ''].filter(Boolean).join(' ')}>
            <svg width="12" height="12" viewBox="0 0 11.7167 11.7167" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4.33333 8.66667C3.12222 8.66667 2.09722 8.24722 1.25833 7.40833C0.419444 6.56944 0 5.54444 0 4.33333C0 3.12222 0.419444 2.09722 1.25833 1.25833C2.09722 0.419444 3.12222 0 4.33333 0C5.54444 0 6.56944 0.419444 7.40833 1.25833C8.24722 2.09722 8.66667 3.12222 8.66667 4.33333C8.66667 4.82222 8.58889 5.28333 8.43333 5.71667C8.27778 6.15 8.06667 6.53333 7.8 6.86667L11.5333 10.6C11.6556 10.7222 11.7167 10.8778 11.7167 11.0667C11.7167 11.2556 11.6556 11.4111 11.5333 11.5333C11.4111 11.6556 11.2556 11.7167 11.0667 11.7167C10.8778 11.7167 10.7222 11.6556 10.6 11.5333L6.86667 7.8C6.53333 8.06667 6.15 8.27778 5.71667 8.43333C5.28333 8.58889 4.82222 8.66667 4.33333 8.66667ZM4.33333 7.33333C5.16667 7.33333 5.875 7.04167 6.45833 6.45833C7.04167 5.875 7.33333 5.16667 7.33333 4.33333C7.33333 3.5 7.04167 2.79167 6.45833 2.20833C5.875 1.625 5.16667 1.33333 4.33333 1.33333C3.5 1.33333 2.79167 1.625 2.20833 2.20833C1.625 2.79167 1.33333 3.5 1.33333 4.33333C1.33333 5.16667 1.625 5.875 2.20833 6.45833C2.79167 7.04167 3.5 7.33333 4.33333 7.33333Z" fill="currentColor"/>
            </svg>
          </span>

          {/* Input */}
          <input
            name={name}
            className={['bt-input-search__input', activeError && !disabled ? 'bt-input-search__input--error' : ''].filter(Boolean).join(' ')}
            type="search"
            value={resolvedValue}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={!!activeError || undefined}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
          />

          {/* Clear button — shown when focused + has value */}
          {showCancel && (
            <button
              type="button"
              className="bt-input-search__cancel"
              tabIndex={-1}
              aria-label="Clear search"
              onPointerDown={(e) => { e.preventDefault(); handleClear(); }}
            >
              <svg width="13" height="13" viewBox="0 0 13.3333 13.3333" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6.66667 7.6L8.6 9.53333C8.72222 9.65555 8.87778 9.71667 9.06667 9.71667C9.25555 9.71667 9.41111 9.65555 9.53333 9.53333C9.65555 9.41111 9.71667 9.25555 9.71667 9.06667C9.71667 8.87778 9.65555 8.72222 9.53333 8.6L7.6 6.66667L9.53333 4.73333C9.65555 4.61111 9.71667 4.45556 9.71667 4.26667C9.71667 4.07778 9.65555 3.92222 9.53333 3.8C9.41111 3.67778 9.25555 3.61667 9.06667 3.61667C8.87778 3.61667 8.72222 3.67778 8.6 3.8L6.66667 5.73333L4.73333 3.8C4.61111 3.67778 4.45556 3.61667 4.26667 3.61667C4.07778 3.61667 3.92222 3.67778 3.8 3.8C3.67778 3.92222 3.61667 4.07778 3.61667 4.26667C3.61667 4.45556 3.67778 4.61111 3.8 4.73333L5.73333 6.66667L3.8 8.6C3.67778 8.72222 3.61667 8.87778 3.61667 9.06667C3.61667 9.25555 3.67778 9.41111 3.8 9.53333C3.92222 9.65555 4.07778 9.71667 4.26667 9.71667C4.45556 9.71667 4.61111 9.65555 4.73333 9.53333L6.66667 7.6ZM6.66667 13.3333C5.74444 13.3333 4.87778 13.1583 4.06667 12.8083C3.25556 12.4583 2.55 11.9833 1.95 11.3833C1.35 10.7833 0.875 10.0778 0.525 9.26667C0.175 8.45556 0 7.58889 0 6.66667C0 5.74444 0.175 4.87778 0.525 4.06667C0.875 3.25556 1.35 2.55 1.95 1.95C2.55 1.35 3.25556 0.875 4.06667 0.525C4.87778 0.175 5.74444 0 6.66667 0C7.58889 0 8.45556 0.175 9.26667 0.525C10.0778 0.875 10.7833 1.35 11.3833 1.95C11.9833 2.55 12.4583 3.25556 12.8083 4.06667C13.1583 4.87778 13.3333 5.74444 13.3333 6.66667C13.3333 7.58889 13.1583 8.45556 12.8083 9.26667C12.4583 10.0778 11.9833 10.7833 11.3833 11.3833C10.7833 11.9833 10.0778 12.4583 9.26667 12.8083C8.45556 13.1583 7.58889 13.3333 6.66667 13.3333Z" fill="currentColor"/>
              </svg>
            </button>
          )}
        </div>

        {(activeError || helperText) && (
          <div
            className={['bt-input-search__validation', activeError ? 'bt-input-search__validation--error' : ''].filter(Boolean).join(' ')}
            role={activeError ? 'alert' : undefined}
          >
            {activeError ?? helperText}
          </div>
        )}
      </div>
    );
  },
);

BTInputSearch.displayName = 'BTInputSearch';
