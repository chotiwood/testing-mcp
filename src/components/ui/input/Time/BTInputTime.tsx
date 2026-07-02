'use client';
/**
 * BTInputTime — section-based masked time input (React).
 * Figma node 555-2975.
 *
 * Clicking a segment (hours / minutes / seconds / AM-PM) highlights it.
 * Typing digits fills the active segment and auto-advances to the next.
 * Backspace clears the current segment then retreats to the previous one.
 * No popup — user edits directly in the field.
 *
 * Usage — HH:mm (default):
 * ```tsx
 * <BTInputTime label="Time" value={time} onChange={setTime} />
 * ```
 * Usage — with seconds:
 * ```tsx
 * <BTInputTime label="Duration" format="HH:mm:ss" value={dur} onChange={setDur} />
 * ```
 * Usage — 12-hour (toggle AM/PM with A / P keys):
 * ```tsx
 * <BTInputTime label="Meeting" format="hh:mm a" value={t} onChange={setT} />
 * ```
 * Usage — with validation:
 * ```tsx
 * const ref = React.useRef<BTInputTimeHandle>(null);
 * <BTInputTime label="Start time" ref={ref}
 *              validator={(v) => v ? null : 'Required'} />
 * ```
 */
import * as React from 'react';
import '@/components/ui/input/Time/BTInputTime.css';
import type { BTInputTimeFormat, BTInputTimeHandle, BTInputTimeProps } from '@/components/ui/input/Time/BTInputTime.types';
import { BTInputAnimatedLabel } from '@/components/ui/input/internal/BTInputAnimatedLabel';
import { IconSchedule } from '@/components/ui/input/internal/BTInputFieldIcons';
import cancelIcon from '@/components/ui/input/Time/icons/cancel.svg';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

// ── Section type ─────────────────────────────────────────────────────────────

type Section = 'hours' | 'minutes' | 'seconds' | 'ampm';

function getSections(format: BTInputTimeFormat): Section[] {
  if (format === 'HH:mm:ss') return ['hours', 'minutes', 'seconds'];
  if (format === 'hh:mm a')  return ['hours', 'minutes', 'ampm'];
  return ['hours', 'minutes'];
}

// Character range [start, end] in the display string for each section.
// hh:mm a layout: "HH:MM AM" → hours[0,2] minutes[3,5] ampm[6,8]
// HH:mm:ss layout: "HH:MM:SS" → hours[0,2] minutes[3,5] seconds[6,8]
function sectionRange(section: Section): [number, number] {
  switch (section) {
    case 'hours':   return [0, 2];
    case 'minutes': return [3, 5];
    case 'seconds': return [6, 8];
    case 'ampm':    return [6, 8];
  }
}

function sectionAtPos(pos: number, format: BTInputTimeFormat): Section {
  if (pos <= 2) return 'hours';
  if (format === 'HH:mm:ss' && pos >= 6) return 'seconds';
  if (format === 'hh:mm a'  && pos >= 6) return 'ampm';
  return 'minutes';
}

function maxForSection(section: Section, format: BTInputTimeFormat): number {
  if (section === 'hours') return format === 'hh:mm a' ? 12 : 23;
  return 59;
}

function minForSection(section: Section, format: BTInputTimeFormat): number {
  return section === 'hours' && format === 'hh:mm a' ? 1 : 0;
}

function clampSection(value: string, section: Section, format: BTInputTimeFormat): string {
  const n = parseInt(value, 10);
  if (isNaN(n)) return '00';
  return String(Math.min(Math.max(n, minForSection(section, format)), maxForSection(section, format))).padStart(2, '0');
}

// While blurred with a value: show committed value.
// While focused or blurred+empty: show MUI-style format letters.
//   empty   → full placeholder ('HH', 'mm', 'ss')
//   partial → digit + remaining placeholder char (e.g. '1H', '4m')
//   full    → the value itself
function segDisplay(val: string, placeholder: string): string {
  if (!val) return placeholder;
  if (val.length === 1) return val + placeholder[1];
  return val;
}

// ── Component ────────────────────────────────────────────────────────────────

export const BTInputTime = React.forwardRef<BTInputTimeHandle, BTInputTimeProps>(
  function BTInputTime(
    {
      value,
      label,
      format = 'HH:mm',
      size = 'default',
      disabled = false,
      readOnly = false,
      required = false,
      errorText,
      helperText,
      id,
      onChange,
      onClear,
      validator,
      className,
    },
    ref,
  ) {
    const uid     = React.useId();
    const fieldId = id ?? `bt-input-time-${uid}`;

    const inputRef = React.useRef<HTMLInputElement>(null);

    const [isFocused,     setIsFocused]     = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<Section | null>(null);
    const [sectionBuffer, setSectionBuffer] = React.useState('');
    const [hoursVal,      setHoursVal]      = React.useState('');
    const [minutesVal,    setMinutesVal]    = React.useState('');
    const [secondsVal,    setSecondsVal]    = React.useState('');
    const [amPmVal,       setAmPmVal]       = React.useState<'AM' | 'PM'>('AM');
    const [errorInternal, setErrorInternal] = React.useState<string | null>(null);

    // Use refs for values that keyDown handler reads to avoid stale closures
    const hoursRef        = React.useRef(hoursVal);
    const minutesRef      = React.useRef(minutesVal);
    const secondsRef      = React.useRef(secondsVal);
    const amPmRef         = React.useRef(amPmVal);
    const sectionBuffRef  = React.useRef(sectionBuffer);
    const activeSectionRef = React.useRef(activeSection);

    React.useEffect(() => { hoursRef.current        = hoursVal;      }, [hoursVal]);
    React.useEffect(() => { minutesRef.current       = minutesVal;    }, [minutesVal]);
    React.useEffect(() => { secondsRef.current       = secondsVal;    }, [secondsVal]);
    React.useEffect(() => { amPmRef.current          = amPmVal;       }, [amPmVal]);
    React.useEffect(() => { sectionBuffRef.current   = sectionBuffer; }, [sectionBuffer]);
    React.useEffect(() => { activeSectionRef.current = activeSection; }, [activeSection]);

    // ── Derived ───────────────────────────────────────────────────

    const activeError = errorText ?? errorInternal ?? null;
    const hasError    = !!activeError;
    const hasValue    = !!value;
    // Label always floats — format hint is always visible
    const showClear   = isFocused && hasValue && !disabled && !readOnly;

    // ── Display string ────────────────────────────────────────────

    const displayStr = React.useMemo(() => {
      if (!isFocused && value) return value;

      const hPh = format === 'hh:mm a' ? 'hh' : 'HH';
      const h   = segDisplay(hoursVal,   hPh);
      const m   = segDisplay(minutesVal, 'mm');

      if (format === 'HH:mm:ss') {
        return `${h}:${m}:${segDisplay(secondsVal, 'ss')}`;
      }
      if (format === 'hh:mm a') {
        return `${h}:${m} ${amPmVal}`;
      }
      return `${h}:${m}`;
    }, [isFocused, value, format, hoursVal, minutesVal, secondsVal, amPmVal]);

    // ── Section highlight ─────────────────────────────────────────

    const highlightSection = React.useCallback((section: Section | null) => {
      if (!section || !inputRef.current) return;
      const [start, end] = sectionRange(section);
      // rAF ensures the input value update has flushed before we set selection
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(start, end);
      });
    }, []);

    // Re-apply highlight after displayStr changes (browser resets cursor on value update)
    React.useEffect(() => {
      if (isFocused && activeSection) {
        highlightSection(activeSection);
      }
    }, [displayStr, isFocused, activeSection, highlightSection]);

    // ── Parse value into sections ─────────────────────────────────

    function parseValue(v: string) {
      const parts = v.split(/[: ]/);
      setHoursVal((parts[0] ?? '').replace(/\D/g, '').slice(0, 2));
      setMinutesVal((parts[1] ?? '').replace(/\D/g, '').slice(0, 2));
      if (format === 'HH:mm:ss') {
        setSecondsVal((parts[2] ?? '').replace(/\D/g, '').slice(0, 2));
      }
      if (format === 'hh:mm a') {
        setAmPmVal(v.toUpperCase().includes('PM') ? 'PM' : 'AM');
      }
    }

    function clearSections() {
      setHoursVal('');
      setMinutesVal('');
      setSecondsVal('');
      setSectionBuffer('');
    }

    // ── Emit ─────────────────────────────────────────────────────

    function buildEmitValue(
      h: string, m: string, s: string, ap: string,
    ): string | null {
      const h2 = h.length === 2;
      const m2 = m.length === 2;
      const s2 = format !== 'HH:mm:ss' || s.length === 2;
      if (!h2 || !m2 || !s2) return null;

      const hC = clampSection(h, 'hours', format);
      const mC = clampSection(m, 'minutes', format);

      if (format === 'HH:mm:ss') {
        return `${hC}:${mC}:${clampSection(s, 'seconds', format)}`;
      }
      if (format === 'hh:mm a') {
        return `${hC}:${mC} ${ap}`;
      }
      return `${hC}:${mC}`;
    }

    function tryEmit(h: string, m: string, s: string, ap: string) {
      const built = buildEmitValue(h, m, s, ap);
      if (built !== null) {
        onChange?.(built);
        setErrorInternal(null);
      }
    }

    // ── Section state helpers (read from refs to avoid stale closures) ─

    function getSectionValue(section: Section): string {
      if (section === 'hours')   return hoursRef.current;
      if (section === 'minutes') return minutesRef.current;
      if (section === 'ampm')    return amPmRef.current;
      return secondsRef.current;
    }

    function setSectionValue(section: Section, val: string) {
      if (section === 'hours')   { setHoursVal(val);   hoursRef.current   = val; return; }
      if (section === 'minutes') { setMinutesVal(val); minutesRef.current = val; return; }
      if (section === 'ampm')    return; // AM/PM toggled only via A/P keys
      setSecondsVal(val); secondsRef.current = val;
    }

    // ── Focus / blur ──────────────────────────────────────────────

    function handleFocus() {
      if (disabled || readOnly) return;
      setIsFocused(true);
      if (value) {
        parseValue(value);
      } else {
        clearSections();
      }
      setActiveSection('hours');
      activeSectionRef.current = 'hours';
      highlightSection('hours');
    }

    function handleBlur() {
      setIsFocused(false);
      // Commit if all sections are filled
      const built = buildEmitValue(
        hoursRef.current, minutesRef.current, secondsRef.current, amPmRef.current,
      );
      if (built !== null && built !== value) {
        onChange?.(built);
      }
      clearSections();
      setActiveSection(null);
      activeSectionRef.current = null;

      // Validate on blur — use the newly committed value (built) if available,
      // falling back to the incoming prop value to avoid stale-closure read.
      if (validator) {
        const result = validator(built ?? value ?? null);
        setErrorInternal(result ?? null);
      }
    }

    // ── Click: snap selection to the clicked section ──────────────

    function handleClick() {
      if (!inputRef.current) return;
      const pos     = inputRef.current.selectionStart ?? 0;
      const section = sectionAtPos(pos, format);
      if (section !== activeSectionRef.current) {
        setSectionBuffer('');
        sectionBuffRef.current = '';
      }
      setActiveSection(section);
      activeSectionRef.current = section;
      highlightSection(section);
    }

    // ── Section navigation ────────────────────────────────────────

    function advanceSection(current: Section): Section | null {
      const list = getSections(format);
      const idx  = list.indexOf(current);
      if (idx >= 0 && idx < list.length - 1) return list[idx + 1] ?? null;
      return null;
    }

    function retreatSection(current: Section): Section | null {
      const list = getSections(format);
      const idx  = list.indexOf(current);
      if (idx > 0) return list[idx - 1] ?? null;
      return null;
    }

    // ── Keyboard ─────────────────────────────────────────────────

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Tab')    return; // let Tab blur normally
      if (e.key === 'Escape') { inputRef.current?.blur(); return; }

      const section = activeSectionRef.current;
      if (!section) return;

      // AM/PM toggle via A / P keys (12h only)
      if (format === 'hh:mm a') {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setAmPmVal('AM'); amPmRef.current = 'AM';
          tryEmit(hoursRef.current, minutesRef.current, secondsRef.current, 'AM');
          highlightSection(section);
          return;
        }
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setAmPmVal('PM'); amPmRef.current = 'PM';
          tryEmit(hoursRef.current, minutesRef.current, secondsRef.current, 'PM');
          highlightSection(section);
          return;
        }
      }

      // ArrowLeft / ArrowRight — navigate sections
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = retreatSection(section);
        if (prev) {
          setActiveSection(prev);
          activeSectionRef.current = prev;
          setSectionBuffer('');
          sectionBuffRef.current = '';
          highlightSection(prev);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = advanceSection(section);
        if (next) {
          setActiveSection(next);
          activeSectionRef.current = next;
          setSectionBuffer('');
          sectionBuffRef.current = '';
          highlightSection(next);
        }
        return;
      }

      // ArrowUp / ArrowDown — increment / decrement
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (section === 'ampm') {
          const toggled = amPmRef.current === 'AM' ? 'PM' : 'AM';
          setAmPmVal(toggled); amPmRef.current = toggled;
          tryEmit(hoursRef.current, minutesRef.current, secondsRef.current, toggled);
          highlightSection(section);
          return;
        }
        const curVal = getSectionValue(section);
        const curNum = curVal ? parseInt(curVal, 10) : (e.key === 'ArrowUp' ? minForSection(section, format) - 1 : maxForSection(section, format) + 1);
        const maxV   = maxForSection(section, format);
        const minV   = minForSection(section, format);
        const newNum = e.key === 'ArrowUp'
          ? (curNum >= maxV ? minV : curNum + 1)
          : (curNum <= minV ? maxV : curNum - 1);
        const newStr = clampSection(String(newNum), section, format);
        setSectionValue(section, newStr);
        const h = section === 'hours'   ? newStr : hoursRef.current;
        const m = section === 'minutes' ? newStr : minutesRef.current;
        const s = section === 'seconds' ? newStr : secondsRef.current;
        tryEmit(h, m, s, amPmRef.current);
        highlightSection(section);
        return;
      }

      // Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();

        if (section === 'ampm') {
          // Backspace from AM/PM → retreat to minutes
          const prev = retreatSection(section);
          if (prev) {
            setActiveSection(prev);
            activeSectionRef.current = prev;
            setSectionBuffer('');
            sectionBuffRef.current = '';
            highlightSection(prev);
          }
          return;
        }

        const buf    = sectionBuffRef.current;
        const curVal = getSectionValue(section);

        if (buf) {
          // Mid-typing: pop last digit
          const newBuf = buf.slice(0, -1);
          setSectionBuffer(newBuf);
          sectionBuffRef.current = newBuf;
          setSectionValue(section, newBuf);
        } else if (curVal) {
          // Section has a committed value: clear it
          setSectionValue(section, '');
          if (value) onChange?.(null);
        } else {
          // Section already empty: retreat and clear previous
          const prev = retreatSection(section);
          if (prev) {
            setActiveSection(prev);
            activeSectionRef.current = prev;
            setSectionBuffer('');
            sectionBuffRef.current = '';
            setSectionValue(prev, '');
            if (value) onChange?.(null);
            highlightSection(prev);
          }
        }
        highlightSection(activeSectionRef.current);
        return;
      }

      // Digit — skip if AM/PM section active
      if (/^\d$/.test(e.key)) {
        if (section === 'ampm') { e.preventDefault(); return; }
        e.preventDefault();
        onDigit(e.key, section);
        return;
      }

      e.preventDefault(); // block all other keys
    }

    function onDigit(digit: string, section: Section) {
      if (section === 'ampm') return;

      const newBuf = sectionBuffRef.current + digit;
      setSectionBuffer(newBuf);
      sectionBuffRef.current = newBuf;
      setSectionValue(section, newBuf);

      const bufNum = parseInt(newBuf, 10);
      const maxV   = maxForSection(section, format);

      // Auto-advance when:
      // 1. Buffer has 2 digits (section complete)
      // 2. First digit makes any second digit exceed max
      const shouldAdvance =
        newBuf.length === 2 ||
        (newBuf.length === 1 && bufNum * 10 > maxV);

      if (shouldAdvance) {
        const clamped = clampSection(newBuf, section, format);
        setSectionValue(section, clamped);
        setSectionBuffer('');
        sectionBuffRef.current = '';

        const next = advanceSection(section);
        if (next) {
          setActiveSection(next);
          activeSectionRef.current = next;
        } else {
          // Last digit-section complete — emit
          const h = section === 'hours'   ? clamped : hoursRef.current;
          const m = section === 'minutes' ? clamped : minutesRef.current;
          const s = section === 'seconds' ? clamped : secondsRef.current;
          tryEmit(h, m, s, amPmRef.current);
          activeSectionRef.current = section;
        }
      }

      highlightSection(activeSectionRef.current);
    }

    // ── Paste ─────────────────────────────────────────────────────

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text') ?? '').replace(/\D/g, '');
      const maxLen = format === 'HH:mm:ss' ? 6 : 4;
      const d = digits.slice(0, maxLen);

      const h = d.slice(0, 2); const m = d.slice(2, 4); const s = d.slice(4, 6);
      setHoursVal(h);   hoursRef.current   = h;
      setMinutesVal(m); minutesRef.current = m;
      if (format === 'HH:mm:ss') { setSecondsVal(s); secondsRef.current = s; }

      if (d.length >= maxLen) {
        tryEmit(h, m, s, amPmRef.current);
        const list = getSections(format);
        const last: Section = list[list.length - 1] ?? 'minutes';
        setActiveSection(last);
        activeSectionRef.current = last;
        highlightSection(last);
      } else {
        const next: Section = (!h || h.length < 2)
          ? 'hours'
          : (!m || m.length < 2)
            ? 'minutes'
            : (format === 'HH:mm:ss' ? 'seconds' : 'minutes');
        setActiveSection(next);
        activeSectionRef.current = next;
        highlightSection(next);
      }
    }

    // ── Clear ─────────────────────────────────────────────────────

    function handleClear(e: React.MouseEvent) {
      e.stopPropagation();
      setErrorInternal(null);
      clearSections();
      setAmPmVal('AM'); amPmRef.current = 'AM';
      onChange?.(null);
      onClear?.();
      // Re-activate hours so the field remains keyboard-operable after clearing
      setActiveSection('hours');
      activeSectionRef.current = 'hours';
      // Re-focus the input and highlight the hours segment
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        highlightSection('hours');
      });
    }

    // ── Imperative handle ─────────────────────────────────────────

    React.useImperativeHandle(ref, () => ({
      validate() {
        if (!validator) return true;
        const result = validator(value ?? null);
        setErrorInternal(result ?? null);
        return result === null;
      },
    }), [validator, value]);

    // ── Render ────────────────────────────────────────────────────

    const fieldClass = cn(
      'bt-input-time',
      isFocused   && 'bt-input-time--focused',
      'bt-input-time--label-floating', // label ALWAYS floats — format hint (HH:mm) is always visible (mirrors Vue: labelFloating = computed(() => true))
      hasError    && 'bt-input-time--error',
      disabled    && 'bt-input-time--disabled',
      size === 'small' && 'bt-input-time--small',
      className,
    );

    return (
      <div className="bt-input-time__wrapper">
        <div className={fieldClass}>
          {/* Clock icon */}
          <span className="bt-input-time__icon" aria-hidden="true">
            <IconSchedule />
          </span>

          {/* Floating label */}
          {label && (
            <BTInputAnimatedLabel
              label={label}
              required={required}
              className="bt-input-time__label"
              requiredClassName="bt-input-time__label-required"
            />
          )}

          {/* Section-based text input */}
          <input
            ref={inputRef}
            id={fieldId}
            type="text"
            className="bt-input-time__input"
            value={displayStr}
            disabled={disabled}
            readOnly /* always readOnly — keydown handles all input; aria-readonly reflects the readOnly prop */
            aria-invalid={hasError || undefined}
            aria-required={required || undefined}
            aria-readonly={readOnly}
            autoComplete="off"
            spellCheck={false}
            onChange={() => { /* no-op: keydown handles all state */ }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />

          {/* Clear (×) button */}
          {showClear && (
            <button
              type="button"
              className="bt-input-time__clear"
              aria-label="Clear time"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={handleClear}
            >
              <img src={cancelIcon} alt="" width={16} height={16} />
            </button>
          )}
        </div>

        {/* Helper / error text */}
        {(activeError || helperText) && (
          <div className="bt-input-time__helper">
            <span className={cn('bt-input-time__helper-text', hasError && 'bt-input-time__helper-text--error')}>
              {activeError || helperText}
            </span>
          </div>
        )}
      </div>
    );
  },
);

BTInputTime.displayName = 'BTInputTime';
