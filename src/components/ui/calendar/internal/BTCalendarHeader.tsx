'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BTDropdownList } from '@/components/ui/dropdown-list/BTDropdownList';

interface BTCalendarHeaderProps {
  displayDate: Date;
  locale?: string;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectMonth: (date: Date) => void;
  onSelectYear: (date: Date) => void;
}

export function BTCalendarHeader({
  displayDate,
  locale = 'id-ID',
  canGoPrev = true,
  canGoNext = true,
  onPrev,
  onNext,
  onSelectMonth,
  onSelectYear,
}: BTCalendarHeaderProps) {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [monthDropdownStyle, setMonthDropdownStyle] = useState<React.CSSProperties>({});
  const [yearDropdownStyle, setYearDropdownStyle] = useState<React.CSSProperties>({});
  const monthPillRef = useRef<HTMLDivElement>(null);
  const yearPillRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Teleporting to body loses the inherited dir="rtl" from the calendar's
  // ancestor — set it explicitly from the locale.
  const dropdownDir: 'ltr' | 'rtl' =
    locale.startsWith('ar') ||
    locale.startsWith('he') ||
    locale.startsWith('iw')
      ? 'rtl'
      : 'ltr';

  // ── Dropdown items ──────────────────────────────────────────────────────────

  const monthItems = useMemo(() => {
    const year = displayDate.getFullYear();
    const current = displayDate.getMonth();
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i),
      label: new Date(year, i, 1).toLocaleDateString(locale, { month: 'long' }),
      checked: i === current,
    }));
  }, [displayDate, locale]);

  const allYearItems = useMemo(() => {
    const current = displayDate.getFullYear();
    const from = Math.max(1924, current - 100);
    const to = Math.min(2124, current + 100);
    const items = [];
    for (let y = from; y <= to; y++) {
      items.push({ value: String(y), label: String(y), checked: y === current });
    }
    return items;
  }, [displayDate]);

  const monthLabel = displayDate.toLocaleDateString(locale, { month: 'long' });

  // ── Position helpers ────────────────────────────────────────────────────────

  function computeStyle(el: HTMLElement | null): React.CSSProperties {
    if (!el) return {};
    const rect = el.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
      zIndex: 9999,
      minWidth: 160,
    };
  }

  // ── Toggle handlers ─────────────────────────────────────────────────────────

  function toggleMonth() {
    if (!isMonthOpen) {
      setMonthDropdownStyle(computeStyle(monthPillRef.current));
      setIsYearOpen(false);
    }
    setIsMonthOpen((v) => !v);
  }

  function toggleYear() {
    if (!isYearOpen) {
      setYearDropdownStyle(computeStyle(yearPillRef.current));
      setIsMonthOpen(false);
    }
    setIsYearOpen((v) => !v);
  }

  // ── Select handlers ─────────────────────────────────────────────────────────

  function handleMonthSelect(value: string) {
    const monthIndex = parseInt(value, 10);
    onSelectMonth(new Date(displayDate.getFullYear(), monthIndex, 1));
    setIsMonthOpen(false);
  }

  function handleYearSelect(value: string) {
    const year = parseInt(value, 10);
    onSelectYear(new Date(year, displayDate.getMonth(), 1));
    setIsYearOpen(false);
  }

  // ── Click outside ───────────────────────────────────────────────────────────

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideMonth =
        monthPillRef.current?.contains(target) || monthDropdownRef.current?.contains(target);
      const insideYear =
        yearPillRef.current?.contains(target) || yearDropdownRef.current?.contains(target);
      if (!insideMonth) setIsMonthOpen(false);
      if (!insideYear) setIsYearOpen(false);
    }
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  // Recompute position on scroll/resize so the dropdown tracks its pill.
  useEffect(() => {
    function onScrollOrResize() {
      setMonthDropdownStyle((prev) =>
        Object.keys(prev).length ? computeStyle(monthPillRef.current) : prev,
      );
      setYearDropdownStyle((prev) =>
        Object.keys(prev).length ? computeStyle(yearPillRef.current) : prev,
      );
    }
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bt-calendar__header">
      {/* Left nav */}
      <button
        className="bt-calendar__nav-btn"
        type="button"
        disabled={!canGoPrev}
        aria-label="Bulan sebelumnya"
        onClick={onPrev}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 4L6 8L10 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Month + year pills */}
      <div className="bt-calendar__header-labels">

        {/* Month pill + dropdown */}
        <div ref={monthPillRef} className="bt-calendar__pill-wrapper">
          <button
            className="bt-calendar__header-pill"
            type="button"
            aria-expanded={isMonthOpen}
            onClick={toggleMonth}
          >
            {monthLabel}
            <svg
              className={`bt-calendar__header-arrow${isMonthOpen ? ' bt-calendar__header-arrow--open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isMonthOpen && createPortal(
            <div ref={monthDropdownRef} style={monthDropdownStyle} dir={dropdownDir}>
              <BTDropdownList
                variant="radio"
                items={monthItems}
                onSelect={handleMonthSelect}
              />
            </div>,
            document.body,
          )}
        </div>

        {/* Year pill + dropdown */}
        <div ref={yearPillRef} className="bt-calendar__pill-wrapper">
          <button
            className="bt-calendar__header-pill"
            type="button"
            aria-expanded={isYearOpen}
            onClick={toggleYear}
          >
            {displayDate.getFullYear()}
            <svg
              className={`bt-calendar__header-arrow${isYearOpen ? ' bt-calendar__header-arrow--open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isYearOpen && createPortal(
            <div ref={yearDropdownRef} style={yearDropdownStyle} dir={dropdownDir}>
              <BTDropdownList
                variant="radio"
                items={allYearItems}
                onSelect={handleYearSelect}
              />
            </div>,
            document.body,
          )}
        </div>
      </div>

      {/* Right nav */}
      <button
        className="bt-calendar__nav-btn"
        type="button"
        disabled={!canGoNext}
        aria-label="Bulan berikutnya"
        onClick={onNext}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

BTCalendarHeader.displayName = 'BTCalendarHeader';
