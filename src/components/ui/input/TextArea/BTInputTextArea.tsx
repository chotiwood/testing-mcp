'use client';
/**
 * BTInputTextArea — auto-growing textarea with floating label.
 *
 * Label: always pinned top-left at 14px. Shrinks to 12px when focused or non-empty.
 *        Color turns brand-primary when focused.
 *
 * Cancel: position:absolute, right:0 in body (= 8px from wrapper border via padding).
 * Custom scrollbar: 4px overlay track starting 8px below cancel's bottom (body top:26px).
 *
 * Height animation (3-phase):
 * Phase 1 — pin wrapper height, disable transition, shrink to MIN_HEIGHT to measure
 *            scrollHeight accurately.
 * Phase 2 — unpin wrapper + restore prevH atomically in one reflow so the browser
 *            never paints the collapsed state (footer flicker fix).
 * Phase 3 — restore transition + set target → browser animates.
 *
 * scheduleAdjust flag prevents double-call (onChange + useEffect both fire on user
 * input), which would cause Phase-1 snap to cancel a running animation.
 *
 * ## Usage
 * ```tsx
 * <BTInputTextArea
 *   value={desc}
 *   onChange={setDesc}
 *   label="Description"
 *   required
 *   maxLength={256}
 *   validator={(v) => v.length < 10 ? 'Too short' : null}
 * />
 * ```
 */
import * as React from 'react';
import '@/components/ui/input/TextArea/BTInputTextArea.css';
import type { BTInputTextAreaHandle, BTInputTextAreaProps } from '@/components/ui/input/TextArea/BTInputTextArea.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';
import cancelFillIcon from '@/components/ui/input/TextArea/icons/cancel-fill.svg';

const MIN_HEIGHT = 62;   // → 80px wrapper  (62 + 2×8 pad + 2×1 border)
const MAX_HEIGHT = 142;  // → 160px wrapper

export const BTInputTextArea = React.forwardRef<BTInputTextAreaHandle, BTInputTextAreaProps>(
  function BTInputTextArea(
    {
      value,
      name,
      label,
      placeholder,
      required = false,
      disabled = false,
      errorText,
      helperText,
      maxLength,
      // rows kept for API compat — auto-grow handles height
      rows: _rows,
      onChange,
      onClear,
      validator,
      className,
    },
    ref,
  ) {
    const generatedId = React.useId();

    const fieldId = generatedId;
    const resolvedRequired = required;

    // BTForm wrapping (optional)
    const form = useBTForm();
    const isInForm = form !== null && typeof name === 'string';
    const formValue = isInForm ? (form.values[name] as string | undefined) : undefined;
    const formError = isInForm ? form.errorFor(name) : null;
    const resolvedValue = value ?? formValue;

    const textareaRef    = React.useRef<HTMLTextAreaElement>(null);
    const scrollTrackRef = React.useRef<HTMLDivElement>(null);

    const [isFocused, setIsFocused]         = React.useState(false);
    const [errorInternal, setErrorInternal] = React.useState<string | null>(null);

    // ── Custom scrollbar state ─────────────────────────────────────────────────
    const [showScrollbar, setShowScrollbar] = React.useState(false);
    const [thumbHeight, setThumbHeight]     = React.useState(0);
    const [thumbTop, setThumbTop]           = React.useState(0);

    const activeError  = errorText ?? errorInternal ?? formError ?? null;
    const isEmpty      = !resolvedValue;
    const showFloating = isFocused || !isEmpty;
    const showClear    = isFocused && !isEmpty && !disabled;

    // ── Scrollbar ──────────────────────────────────────────────────────────────
    function updateScrollbar() {
      const el = textareaRef.current;
      if (!el) return;

      const { scrollHeight, clientHeight, scrollTop } = el;
      const overflows = scrollHeight > clientHeight + 1;
      setShowScrollbar(overflows);

      if (!overflows) return;

      const track  = scrollTrackRef.current;
      const trackH = track ? track.clientHeight : 0;
      if (trackH <= 0) {
        // showScrollbar just toggled true but the track may not be measured yet
        // (display:none → clientHeight = 0). Retry after the next paint.
        requestAnimationFrame(updateScrollbar);
        return;
      }

      const ratio      = clientHeight / scrollHeight;
      const tH         = Math.max(20, ratio * trackH);
      const maxTop     = trackH - tH;
      const scrollable = scrollHeight - clientHeight;
      setThumbHeight(tH);
      setThumbTop(scrollable > 0 ? (scrollTop / scrollable) * maxTop : 0);
    }

    // ── Scrollbar drag ─────────────────────────────────────────────────────────
    function handleThumbMousedown(e: React.MouseEvent) {
      e.preventDefault();
      const elRaw   = textareaRef.current;
      const track   = scrollTrackRef.current;
      if (!elRaw || !track) return;

      // Capture non-null so TypeScript narrows correctly inside async closures.
      const el: HTMLTextAreaElement = elRaw;

      const startY         = e.clientY;
      const startScrollTop = el.scrollTop;
      const trackH         = track.clientHeight;
      const scrollable     = el.scrollHeight - el.clientHeight;

      function onMove(ev: MouseEvent) {
        const delta = ev.clientY - startY;
        el.scrollTop = Math.max(0, Math.min(startScrollTop + (delta / trackH) * scrollable, scrollable));
        updateScrollbar();
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    // ── Height animation ───────────────────────────────────────────────────────
    const adjustPendingRef = React.useRef(false);

    function adjustHeight() {
      const el = textareaRef.current;
      if (!el) return;

      const prevH = parseInt(el.style.height, 10) || el.offsetHeight || MIN_HEIGHT;

      // Pin wrapper height so Phase 1 never collapses the outer layout.
      // Without this, shrinking the textarea also shrinks the wrapper,
      // which shifts the footer (char counter) up — browser can paint that
      // intermediate state causing the visible "flicker".
      const wrapper = el.closest<HTMLElement>('.bt-input-text-area__wrapper');
      if (wrapper) wrapper.style.height = `${wrapper.offsetHeight}px`;

      // Phase 1: measure content height.
      // Shrink to MIN_HEIGHT so scrollHeight reflects true content size even
      // when textarea is currently taller than its content (e.g. after deletion).
      el.style.transition = 'none';
      el.style.height     = `${MIN_HEIGHT}px`;
      void el.offsetHeight; // sync reflow

      const scrollH = el.scrollHeight;
      const target  = Math.min(Math.max(scrollH, MIN_HEIGHT), MAX_HEIGHT);
      el.style.overflowY = scrollH > MAX_HEIGHT ? 'auto' : 'hidden';

      // Phase 2: unpin wrapper + restore prevH in ONE reflow.
      // Releasing wrapper.style.height and setting textarea back to prevH before
      // the forced reflow means the browser computes only the prevH layout —
      // it never paints the collapsed (MIN_HEIGHT) wrapper state.
      if (wrapper) wrapper.style.height = '';
      el.style.height = `${prevH}px`;
      void el.offsetHeight; // sync reflow — browser commits prevH

      // Phase 3: animate
      el.style.transition = ''; // restore CSS transition:height 150ms
      el.style.height     = `${target}px`;

      // Update custom scrollbar after height settles
      requestAnimationFrame(updateScrollbar);
    }

    function scheduleAdjust() {
      if (adjustPendingRef.current) return;
      adjustPendingRef.current = true;
      requestAnimationFrame(() => {
        adjustPendingRef.current = false;
        adjustHeight();
      });
    }

    // Mirror Vue's `watch(() => props.modelValue, scheduleAdjust)`
    React.useEffect(() => {
      scheduleAdjust();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedValue]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      setErrorInternal(null);
      const next = e.target.value;
      onChange?.(next);
      if (isInForm) form.setField(name, next);
      scheduleAdjust();
    }

    function handleBlur() {
      setIsFocused(false);
      if (isInForm) form.touch(name);
    }

    function handleClear() {
      onChange?.('');
      onClear?.();
      setErrorInternal(null);
      if (isInForm) form.setField(name, '');
      requestAnimationFrame(() => {
        adjustHeight();
        textareaRef.current?.focus();
      });
    }

    // ── Imperative handle ──────────────────────────────────────────────────────
    function validate(): boolean {
      if (!validator) return true;
      const result = validator(resolvedValue ?? '');
      setErrorInternal(result ?? null);
      return result === null;
    }

    React.useImperativeHandle(ref, () => ({ validate }), [resolvedValue, validator]);

    // ── Class helpers ──────────────────────────────────────────────────────────
    const wrapperClass = [
      'bt-input-text-area__wrapper',
      isFocused && !activeError ? 'bt-input-text-area__wrapper--focused' : '',
      activeError               ? 'bt-input-text-area__wrapper--error'   : '',
      disabled                  ? 'bt-input-text-area__wrapper--disabled' : '',
    ].filter(Boolean).join(' ');

    const labelClass = [
      'bt-input-text-area__label',
      showFloating  ? 'bt-input-text-area__label--floating'  : '',
      activeError   ? 'bt-input-text-area__label--error'     : '',
      disabled      ? 'bt-input-text-area__label--disabled'  : '',
    ].filter(Boolean).join(' ');

    const fieldClass = [
      'bt-input-text-area__field',
      label                    ? 'bt-input-text-area__field--has-label'      : '',
      label && showFloating    ? 'bt-input-text-area__field--label-floating' : '',
    ].filter(Boolean).join(' ');

    const showHelperText = activeError || helperText;
    const showFooter = showHelperText || maxLength !== undefined;

    return (
      <div className={['bt-input-text-area', className].filter(Boolean).join(' ')}>

        <div className={wrapperClass}>
          {/* Body: position:relative anchor for label + cancel (both absolute) */}
          <div className="bt-input-text-area__body">

            {/* Label: floats from inside content area to top-left on focus/fill */}
            {label && (
              <label htmlFor={fieldId} className={labelClass}>
                {label}
                {required && <span className="bt-input-text-area__required">*</span>}
              </label>
            )}

            {/* Textarea: padding-top:20px reserves space for the label (16px) + 4px gap */}
            <textarea
              id={fieldId}
              name={name}
              ref={textareaRef}
              rows={1}
              className={fieldClass}
              value={resolvedValue ?? ''}
              placeholder={isFocused ? (placeholder ?? '') : ''}
              disabled={disabled}
              maxLength={maxLength}
              aria-invalid={!!activeError || undefined}
              aria-required={resolvedRequired || undefined}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              onScroll={updateScrollbar}
            />

            {/* Cancel: absolute inside body, right:0 = 8px from wrapper border.
                position:absolute means conditional render doesn't shift layout. */}
            {showClear && (
              <button
                type="button"
                className="bt-input-text-area__clear"
                tabIndex={-1}
                aria-label="Clear text"
                onMouseDown={e => { e.preventDefault(); handleClear(); }}
              >
                <img src={cancelFillIcon} alt="" />
              </button>
            )}

            {/* Custom scrollbar: track starts 8px below cancel button bottom (top: 26px) */}
            <div
              ref={scrollTrackRef}
              className="bt-input-text-area__scrollbar-track"
              style={{ display: showScrollbar ? 'block' : 'none' }}
            >
              <div
                className="bt-input-text-area__scrollbar-thumb"
                style={{ height: thumbHeight, top: thumbTop }}
                onMouseDown={handleThumbMousedown}
              />
            </div>

          </div>
        </div>

        {/* Footer — helper/error + counter */}
        {showFooter && (
          <div className="bt-input-text-area__footer">
            {showHelperText && activeError
              ? <span className="bt-input-text-area__error" role="alert">{activeError}</span>
              : showHelperText && helperText
              ? <span className="bt-input-text-area__helper">{helperText}</span>
              : <span />}
            {maxLength !== undefined && (
              <span className="bt-input-text-area__char-count">
                {(resolvedValue ?? '').length}/{maxLength}
              </span>
            )}
          </div>
        )}

      </div>
    );
  },
);

BTInputTextArea.displayName = 'BTInputTextArea';
