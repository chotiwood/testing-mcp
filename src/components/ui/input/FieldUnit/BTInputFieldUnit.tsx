'use client';
/**
 * BTInputFieldUnit — Split input: unit selector (left) + text field (right).
 * Each panel has its own independent border that activates separately:
 * left border activates when the dropdown opens, right when the field is focused.
 *
 * Sliced from Figma node 702-3937.
 *
 * ## Usage:
 * ```tsx
 * <BTInputFieldUnit
 *   units={[{ label: 'IDR', value: 'IDR' }, { label: 'USD', value: 'USD' }]}
 *   unitLabel="Currency"
 *   label="Amount"
 *   value={amount}
 *   onChange={setAmount}
 *   formatter={(v, u) => u?.value === 'IDR' ? formatRupiah(v) : v}
 *   sanitizer={(v) => v.replace(/\D/g, '')}
 *   onUnitChanged={handleUnitChange}
 * />
 * ```
 */
import * as React from 'react';
import '@/components/ui/input/FieldUnit/BTInputFieldUnit.css';
import type {
  BTInputFieldUnitHandle,
  BTInputFieldUnitProps,
  BTInputFieldUnitOption,
} from '@/components/ui/input/FieldUnit/BTInputFieldUnit.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const BTInputFieldUnit = React.forwardRef<BTInputFieldUnitHandle, BTInputFieldUnitProps>(
  function BTInputFieldUnit(
    {
      name,
      units,
      selectedUnit,
      initialUnit,
      unitLabel,
      hasSearch = false,
      itemsFilter,
      onUnitChanged,
      label,
      value,
      onChange,
      formatter,
      sanitizer,
      keyboardType = 'text',
      hintText,
      clearable = true,
      validator,
      errorText,
      helperText,
      disabled = false,
      required = false,
      className,
    },
    ref,
  ) {
    // ── State ───────────────────────────────────────────────────────────────
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [isFieldFocused, setIsFieldFocused] = React.useState(false);
    const [internalUnit, setInternalUnit] = React.useState<BTInputFieldUnitOption | undefined>(
      initialUnit ?? units[0],
    );
    const [errorInternal, setErrorInternal] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const rootRef  = React.useRef<HTMLDivElement>(null);
    const fieldRef = React.useRef<HTMLInputElement>(null);

    // ── BTForm wrapping (optional) ─────────────────────────────────────────
    const form = useBTForm();
    const isInForm = form !== null && typeof name === 'string';
    const formValue = isInForm ? (form.values[name] as string | undefined) : undefined;
    const formError = isInForm ? form.errorFor(name) : null;
    const resolvedValue = value ?? formValue;

    // ── Derived ─────────────────────────────────────────────────────────────
    const currentUnit = selectedUnit !== undefined ? selectedUnit : internalUnit;
    const activeError = errorText ?? errorInternal ?? formError ?? null;
    const hasError    = !!activeError;
    const resolvedRequired = required;
    const uid = React.useId();
    const fieldId = `bt-input-field-unit-${uid}`;
    const showClear   = clearable && !!resolvedValue && isFieldFocused && !disabled;
    const fieldLabelFloating = !!label && (isFieldFocused || !!resolvedValue);

    // ── Click-outside to close dropdown ────────────────────────────────────
    React.useEffect(() => {
      function onClickOutside(e: MouseEvent) {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setIsDropdownOpen(false);
        }
      }
      document.addEventListener('mousedown', onClickOutside);
      return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    // ── Display value (formatted) ───────────────────────────────────────────
    const displayValue = React.useMemo(() => {
      const raw = resolvedValue ?? '';
      if (formatter && raw !== '') return formatter(raw, currentUnit ?? null);
      return raw;
    }, [resolvedValue, formatter, currentUnit]);

    // ── Filtered units for search ────────────────────────────────────────────
    const filteredUnits = React.useMemo(() => {
      if (!hasSearch || !searchQuery) return units;
      if (itemsFilter) return itemsFilter(units, searchQuery);
      const q = searchQuery.toLowerCase();
      return units.filter((u) => u.label.toLowerCase().includes(q));
    }, [units, hasSearch, searchQuery, itemsFilter]);

    // ── Input type / inputMode ───────────────────────────────────────────────
    const inputType = keyboardType === 'tel' ? 'tel' : 'text';
    const inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode'] =
      keyboardType === 'number'  ? 'numeric'
      : keyboardType === 'decimal' ? 'decimal'
      : keyboardType === 'tel'     ? 'tel'
      : keyboardType === 'url'     ? 'url'
      : undefined;

    // ── Handlers ─────────────────────────────────────────────────────────────
    function toggleDropdown() {
      if (disabled) return;
      if (!isDropdownOpen) setSearchQuery('');
      setIsDropdownOpen((open) => !open);
    }

    function selectUnit(option: BTInputFieldUnitOption) {
      setInternalUnit(option);
      onUnitChanged?.(option);
      setIsDropdownOpen(false);
    }

    function handleFieldInput(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      const sanitized = sanitizer ? sanitizer(raw, currentUnit ?? null) : raw;
      onChange?.(sanitized);
      if (isInForm) form.setField(name, sanitized);
    }

    function handleFieldBlur() {
      setIsFieldFocused(false);
      if (isInForm) form.touch(name);
    }

    function handleClear() {
      onChange?.('');
      if (isInForm) form.setField(name, '');
      setErrorInternal(null);
      fieldRef.current?.focus();
    }

    function validate(): boolean {
      if (!validator) return true;
      const result = validator(resolvedValue ?? '', currentUnit ?? null);
      setErrorInternal(result ?? null);
      return result === null;
    }

    React.useImperativeHandle(ref, () => ({ validate }), [resolvedValue, currentUnit, validator]);

    // ── CSS classes ──────────────────────────────────────────────────────────
    const leftClass = cn(
      'bt-input-field-unit__left',
      isDropdownOpen && 'bt-input-field-unit__left--active',
      hasError && 'bt-input-field-unit__left--error',
      disabled && 'bt-input-field-unit__left--disabled',
    );


    const rightClass = cn(
      'bt-input-field-unit__right',
      isFieldFocused && 'bt-input-field-unit__right--active',
      hasError && 'bt-input-field-unit__right--error',
      disabled && 'bt-input-field-unit__right--disabled',
    );

    return (
      <div ref={rootRef} className={cn('bt-input-field-unit__wrapper', className)}>
        <div className="bt-input-field-unit__row">

          {/* ── Left panel: unit selector ── */}
          <div
            className={leftClass}
            role="button"
            aria-expanded={isDropdownOpen}
            tabIndex={disabled ? -1 : 0}
            onClick={toggleDropdown}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
              if (e.key === 'Escape') setIsDropdownOpen(false);
            }}
          >
            {unitLabel && (
              <span className="bt-input-field-unit__unit-label">
                {unitLabel}
                {required && <span className="bt-input-field-unit__required">*</span>}
              </span>
            )}
            <div className="bt-input-field-unit__unit-row">
              <span className="bt-input-field-unit__unit-value">
                {currentUnit?.label ?? '—'}
              </span>
              <button
                type="button"
                className={cn(
                  'bt-input-field-unit__unit-chevron',
                  isDropdownOpen && 'bt-input-field-unit__unit-chevron--open',
                )}
                disabled={disabled}
                aria-label={isDropdownOpen ? 'Close unit selector' : 'Open unit selector'}
                tabIndex={-1}
                onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>
            </div>

            {/* Dropdown list */}
            {isDropdownOpen && (
              <div className="bt-input-field-unit__dropdown" role="listbox">
                {hasSearch && (
                  <input
                    className="bt-input-field-unit__dropdown-search"
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { e.stopPropagation(); setIsDropdownOpen(false); }
                    }}
                  />
                )}
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        'bt-input-field-unit__dropdown-item',
                        currentUnit?.value === option.value &&
                          'bt-input-field-unit__dropdown-item--selected',
                      )}
                      role="option"
                      aria-selected={currentUnit?.value === option.value}
                      onMouseDown={(e) => { e.preventDefault(); selectUnit(option); }}
                    >
                      {option.label}
                    </div>
                  ))
                ) : (
                  <div className="bt-input-field-unit__dropdown-empty">No result found.</div>
                )}
              </div>
            )}
          </div>

          {/* ── Divider ── */}

          {/* ── Right panel: text field ── */}
          <div className={rightClass}>
            {label && (
              <label
                className={cn(
                  'bt-input-field-unit__field-label',
                  fieldLabelFloating && 'bt-input-field-unit__field-label--floating',
                )}
              >
                {label}
                {required && <span className="bt-input-field-unit__required">*</span>}
              </label>
            )}
            <div className="bt-input-field-unit__right-inner">
              <input
                ref={fieldRef}
                id={fieldId}
                name={name}
                className={cn(
                  'bt-input-field-unit__field',
                  !!label && 'bt-input-field-unit__field--has-label',
                )}
                type={inputType}
                inputMode={inputMode}
                value={displayValue}
                placeholder={fieldLabelFloating || !label ? (hintText ?? '') : ''}
                disabled={disabled}
                aria-invalid={hasError || undefined}
                aria-required={resolvedRequired || undefined}
                onChange={handleFieldInput}
                onFocus={() => setIsFieldFocused(true)}
                onBlur={handleFieldBlur}
              />
              {showClear && (
                <button
                  type="button"
                  className="bt-input-field-unit__clear"
                  aria-label="Clear value"
                  tabIndex={-1}
                  onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                >
                  {/* Material cancel filled (circle with ×) */}
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

        </div>

        {(activeError || helperText) && (
          <div className="bt-input-field-unit__helper">
            <span
              className={cn(
                'bt-input-field-unit__helper-text',
                hasError && 'bt-input-field-unit__helper-text--error',
              )}
              role={hasError ? 'alert' : undefined}
            >
              {activeError || helperText}
            </span>
          </div>
        )}
      </div>
    );
  },
);

BTInputFieldUnit.displayName = 'BTInputFieldUnit';
