'use client';
/**
 * BTInputDate — click-to-open date / date-range picker (React).
 * Figma node 543-2651. Mirrors BTInputDate.vue one-to-one.
 *
 * Usage — single:
 * ```tsx
 * <BTInputDate label="Date" value={date} onChange={setDate} />
 * ```
 * Usage — range:
 * ```tsx
 * <BTInputDate mode="range" label="Period"
 *   rangeValue={range} onRangeValueChange={setRange} />
 * ```
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import '@/components/ui/input/Date/BTInputDate.css';
import type { BTInputDateHandle, BTInputDateProps } from '@/components/ui/input/Date/BTInputDate.types';
import { BTCalendar } from '@/components/ui/calendar/index';
import { BTInputAnimatedLabel } from '@/components/ui/input/internal/BTInputAnimatedLabel';
import { useBTForm } from '@/components/ui/form/BTFormContext';
import { positionBelow } from '@/components/ui/input/internal/positionFloating';
import { IconCalendar } from '@/components/ui/input/internal/BTInputFieldIcons';
import cancelIcon   from '@/components/ui/input/Date/icons/cancel.svg';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(date: Date): string {
  return `${String(date.getDate()).padStart(2,'0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export const BTInputDate = React.forwardRef<BTInputDateHandle, BTInputDateProps>(
  function BTInputDate(
    {
      mode = 'single',
      size = 'default',
      name,
      value,
      rangeValue,
      label,
      required = false,
      disabled = false,
      readOnly = false,
      errorText,
      helperText,
      id,
      minDate,
      maxDate,
      locale,
      showFooter = true,
      showPreset = false,
      onChange,
      onRangeValueChange,
      onClear,
      validator,
      rangeValidator,
      className,
    },
    ref,
  ) {
    const uid = React.useId();

    // BTForm wrapping (optional)
    const form = useBTForm();
    const isInForm = form !== null && typeof name === 'string';
    const formValue = isInForm ? (form.values[name] as Date | null | undefined) : undefined;
    const formRangeValue = isInForm
      ? (form.values[name] as [Date, Date] | null | undefined)
      : undefined;
    const formError = isInForm ? form.errorFor(name) : null;
    const resolvedValue = value ?? (mode === 'single' ? formValue : undefined);
    const resolvedRangeValue = rangeValue ?? (mode === 'range' ? formRangeValue : undefined);

    const fieldId = id ?? `bt-input-date-${uid}`;

    const [isOpen, setIsOpen] = React.useState(false);
    const [errorInternal, setErrorInternal] = React.useState<string | null>(null);
    const [pendingValue, setPendingValue] = React.useState<Date | null>(null);
    const [pendingRange, setPendingRange] = React.useState<[Date, Date] | null>(null);

    const fieldRef = React.useRef<HTMLDivElement>(null);
    const panelRef = React.useRef<HTMLDivElement>(null);

    const activeError = errorText ?? errorInternal ?? formError ?? null;
    const hasError    = !!activeError;
    const resolvedRequired = required;
    const hasValue    = mode === 'range' ? !!(resolvedRangeValue?.[0]) : !!resolvedValue;
    const labelFloating  = isOpen || hasValue;
    const showClear      = isOpen && hasValue && !disabled && !readOnly;
    const showPlaceholder = isOpen && !hasValue;
    const placeholder    = mode === 'range' ? 'DD MMM YYYY – DD MMM YYYY' : 'DD MMM YYYY';

    const displayValue = React.useMemo(() => {
      if (mode === 'range') {
        const r = resolvedRangeValue;
        if (!r) return '';
        return `${fmt(r[0])} – ${fmt(r[1])}`;
      }
      return resolvedValue ? fmt(resolvedValue) : '';
    }, [mode, resolvedValue, resolvedRangeValue]);

    // Position panel below (or above if no room) the field
    function positionPanel() {
      const f = fieldRef.current;
      const p = panelRef.current;
      if (!f || !p) return;
      // Smart-flip: prefers below, flips above when viewport space is tight
      positionBelow(f, p, { gap: 4, margin: 8 });
      p.classList.add('bt-input-date__panel--visible');
    }

    function openPanel() {
      if (disabled || readOnly || isOpen) return;
      setPendingValue(resolvedValue ?? null);
      setPendingRange(resolvedRangeValue ?? null);
      setIsOpen(true);
    }

    function closePanel() {
      setIsOpen(false);
      if (isInForm) form.touch(name);
    }

    function handleClear(e: React.MouseEvent) {
      e.stopPropagation();
      if (mode === 'range') onRangeValueChange?.(null);
      else onChange?.(null);
      if (isInForm) form.setField(name, null);
      onClear?.();
    }

    function handleApply(val: Date | [Date, Date] | null) {
      if (mode === 'range') {
        const next = Array.isArray(val) ? val as [Date, Date] : null;
        onRangeValueChange?.(next);
        if (isInForm) form.setField(name, next);
      } else {
        const next = val instanceof Date ? val : null;
        onChange?.(next);
        if (isInForm) form.setField(name, next);
      }
      setErrorInternal(null);
      closePanel();
    }

    function handleCalendarValue(val: Date | null) {
      setPendingValue(val);
      if (!showFooter) {
        onChange?.(val);
        if (isInForm) form.setField(name, val);
        setErrorInternal(null);
        closePanel();
      }
    }

    function handleCalendarRange(val: [Date, Date] | null) {
      setPendingRange(val);
      if (!showFooter && val) {
        onRangeValueChange?.(val);
        if (isInForm) form.setField(name, val);
        setErrorInternal(null);
        closePanel();
      }
    }

    function handleCancel() {
      closePanel();
    }

    // Outside click + Escape key
    React.useEffect(() => {
      if (!isOpen) return;
      function onDown(e: MouseEvent) {
        if (
          fieldRef.current?.contains(e.target as Node) ||
          panelRef.current?.contains(e.target as Node)
        ) return;
        closePanel();
      }
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') closePanel();
      }
      document.addEventListener('mousedown', onDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [isOpen]);

    // Reposition on open
    React.useEffect(() => {
      if (isOpen) positionPanel();
    }, [isOpen]);

    // Reposition on scroll / resize while open
    React.useEffect(() => {
      if (!isOpen) return;
      function reposition() { positionPanel(); }
      document.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      return () => {
        document.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
      };
    }, [isOpen]);

    // Expose validate()
    React.useImperativeHandle(ref, () => ({
      validate() {
        if (mode === 'range') {
          if (!rangeValidator) return true;
          const r = rangeValidator(resolvedRangeValue ?? null);
          setErrorInternal(r ?? null);
          return r === null;
        }
        if (!validator) return true;
        const r = validator(resolvedValue ?? null);
        setErrorInternal(r ?? null);
        return r === null;
      },
    }), [mode, resolvedValue, resolvedRangeValue, validator, rangeValidator]);

    const fieldClass = cn(
      'bt-input-date',
      isOpen       && 'bt-input-date--open',
      hasError     && 'bt-input-date--error',
      disabled     && 'bt-input-date--disabled',
      labelFloating && 'bt-input-date--label-floating',
      size === 'small' && 'bt-input-date--small',
      className,
    );

    return (
      <>
        <div className="bt-input-date__wrapper">
          <div
            ref={fieldRef}
            id={fieldId}
            className={fieldClass}
            role="button"
            tabIndex={disabled || readOnly ? -1 : 0}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-invalid={hasError || undefined}
            aria-required={resolvedRequired || undefined}
            onClick={openPanel}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openPanel(); }}
          >
            {/* Calendar icon */}
            <span className={cn('bt-input-date__icon', isOpen && 'bt-input-date__icon--open')}>
              <IconCalendar />
            </span>

            {/* Floating label */}
            {label && (
              <BTInputAnimatedLabel
                label={label}
                required={required}
                className="bt-input-date__label"
                requiredClassName="bt-input-date__label-required"
              />
            )}

            {/* Value / placeholder */}
            <span className={cn('bt-input-date__value', labelFloating && 'bt-input-date__value--floating')}>
              {showPlaceholder
                ? <span className="bt-input-date__placeholder">{placeholder}</span>
                : hasValue
                  ? displayValue
                  : null}
            </span>

            {/* Clear button */}
            {showClear && (
              <button
                type="button"
                className="bt-input-date__clear"
                aria-label="Clear date"
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                onClick={handleClear}
              >
                <img src={cancelIcon} alt="" width={16} height={16} />
              </button>
            )}
          </div>

          {(activeError || helperText) && (
            <div className="bt-input__helper">
              <span
                className={cn('bt-input__helper-text', hasError && 'bt-input__helper-text--error')}
                role={hasError ? 'alert' : undefined}
              >
                {activeError || helperText}
              </span>
            </div>
          )}
        </div>

        {/* Calendar panel — teleported to body (mirrors Vue's <Teleport to="body">).
            Rendering at body keeps the panel out of the field's DOM subtree so that
            mounting/unmounting the panel does NOT interfere with the CSS padding
            transition on the field (small-size height animation). */}
        {isOpen && createPortal(
          <div ref={panelRef} className="bt-input-date__panel" role="dialog" aria-modal="true">
            <BTCalendar
              mode={mode}
              value={pendingValue}
              rangeValue={pendingRange}
              onValueChange={handleCalendarValue}
              onRangeValueChange={handleCalendarRange}
              minDate={minDate}
              maxDate={maxDate}
              locale={locale}
              showFooter={showFooter}
              showPreset={showPreset}
              onApply={handleApply}
              onCancel={handleCancel}
            />
          </div>,
          document.body,
        )}
      </>
    );
  },
);

BTInputDate.displayName = 'BTInputDate';
