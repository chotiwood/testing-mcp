'use client';
/**
 * BTInputDropdown — Input-family select field with floating BTDropdownList panel (React).
 * Figma node 555-3041. Mirrors BTInputDropdown.vue one-to-one.
 *
 * Usage — basic:
 * ```tsx
 * <BTInputDropdown label="City" items={cities} value={city} onChange={setCity} />
 * ```
 * Usage — with search:
 * ```tsx
 * <BTInputDropdown label="Country" items={countries} value={country}
 *                  onChange={setCountry} hasSearch />
 * ```
 */
import * as React from 'react';
import '@/components/ui/input/Dropdown/BTInputDropdown.css';
import type { BTInputDropdownProps } from '@/components/ui/input/Dropdown/BTInputDropdown.types';
import { BTDropdownList } from '@/components/ui/dropdown-list/index';
import { BTInputAnimatedLabel } from '@/components/ui/input/internal/BTInputAnimatedLabel';
import cancelIcon from '@/components/ui/input/Dropdown/icons/cancel.svg';
import { IconExpandMore } from '@/components/ui/input/internal/BTInputFieldIcons';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export function BTInputDropdown<T = string>({
  value,
  label,
  items,
  hasSearch = false,
  size = 'default',
  disabled = false,
  readOnly = false,
  required = false,
  errorText,
  helperText,
  id,
  emptyLabel = 'No result found.',
  getLabel,
  onChange,
  onClear,
  className,
}: BTInputDropdownProps<T>) {
  const uid     = React.useId();
  const fieldId = id ?? `bt-input-dropdown-${uid}`;

  const [isOpen,      setIsOpen]      = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fieldRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // ── Derived ─────────────────────────────────────────────────────
  const hasError    = !!errorText;
  const hasValue    = value != null;
  // Float label only when a value is selected — not on open-with-no-value.
  // A dropdown has no typed text to show while the panel is open, so there's
  // no UX reason to float the label when empty (mirrors Vue spec: node 555-3041).
  const labelFloating = hasValue;
  // showClear: only while panel is open AND value is set
  const showClear = isOpen && hasValue && !disabled && !readOnly;

  // ── Selected item & display string ──────────────────────────────
  const selectedItem = React.useMemo(
    () => items.find(item => item.value === value),
    [items, value],
  );

  const displayStr = React.useMemo<string>(() => {
    if (!selectedItem) return '';
    if (getLabel) return getLabel(selectedItem);
    return selectedItem.label ?? '';
  }, [selectedItem, getLabel]);

  // ── Internal search filtering ────────────────────────────────────
  const filteredItems = React.useMemo(() => {
    const base = hasSearch && searchQuery
      ? items.filter(item =>
          (item.label ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : items;
    // Mark selected item so BTDropdownList renders checked background
    return base.map(item => ({ ...item, checked: item.value === value }));
  }, [items, hasSearch, searchQuery, value]);

  // ── Panel positioning ────────────────────────────────────────────
  function positionPanel() {
    const trigger = fieldRef.current;
    const panel   = panelRef.current;
    if (!trigger || !panel) return;
    const rect = trigger.getBoundingClientRect();
    // Panel is position:fixed — use viewport coords directly (no scrollX/Y)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pRect = panel.getBoundingClientRect();
    const gap    = 4;
    const margin = 8;

    // Vertical: prefer below, flip above when there's not enough space
    const spaceBelow = vh - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const goAbove    = spaceBelow < pRect.height && spaceAbove >= pRect.height;
    const top = goAbove
      ? rect.top  - pRect.height - gap
      : rect.bottom + gap;

    // Horizontal: align to trigger left, clamp to viewport
    let left = rect.left;
    if (left + rect.width > vw - margin) left = vw - margin - rect.width;
    if (left < margin) left = margin;

    panel.style.top   = `${Math.round(top)}px`;
    panel.style.left  = `${Math.round(left)}px`;
    panel.style.width = `${rect.width}px`;
    panel.classList.add('bt-input-dropdown__panel--visible');
  }

  // ── Open / close ─────────────────────────────────────────────────
  function openPanel() {
    if (disabled || readOnly || isOpen) return;
    setSearchQuery('');
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
    setSearchQuery('');
  }

  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  // ── Selection ─────────────────────────────────────────────────────
  function handleSelect(val: T) {
    onChange?.(val);
    closePanel();
  }

  // ── Clear ─────────────────────────────────────────────────────────
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(null);
    onClear?.();
    closePanel();
  }

  // ── Keyboard ───────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (isOpen) { e.preventDefault(); closePanel(); }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
  }

  // ── Outside click ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isOpen) return;
    function onDocumentClick(e: MouseEvent) {
      if (
        fieldRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return;
      closePanel();
    }
    // Defer by one frame so the opening click doesn't immediately close
    const rafId = requestAnimationFrame(() => {
      document.addEventListener('click', onDocumentClick);
    });
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', onDocumentClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Escape key while open ─────────────────────────────────────────
  React.useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Position panel on open ────────────────────────────────────────
  React.useEffect(() => {
    if (isOpen) positionPanel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Scroll / resize repositioning while open ──────────────────────
  React.useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    function onScrollOrResize() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(positionPanel);
    }
    // capture:true catches scroll on any ancestor container (modal, drawer, etc.)
    window.addEventListener('scroll', onScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, { capture: true });
      window.removeEventListener('resize', onScrollOrResize);
      cancelAnimationFrame(rafId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── CSS classes ───────────────────────────────────────────────────
  const fieldClass = cn(
    'bt-input-dropdown',
    isOpen         && 'bt-input-dropdown--open',
    hasError       && 'bt-input-dropdown--error',
    disabled       && 'bt-input-dropdown--disabled',
    labelFloating  && 'bt-input-dropdown--label-floating',
    size === 'small' && 'bt-input-dropdown--small',
    className,
  );

  return (
    <div className="bt-input-dropdown__wrapper">
      {/* Field trigger */}
      <div
        ref={fieldRef}
        id={fieldId}
        className={fieldClass}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={hasError || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={togglePanel}
        onKeyDown={handleKeyDown}
      >
        {/* Floating label */}
        {label && (
          <BTInputAnimatedLabel
            label={label}
            required={required}
            className="bt-input-dropdown__label"
            requiredClassName="bt-input-dropdown__label-required"
          />
        )}

        {/* Selected value text */}
        <span className="bt-input-dropdown__value">
          {displayStr}
        </span>

        {/* Clear (×) button — only when open and has value */}
        {showClear && (
          <button
            type="button"
            className="bt-input-dropdown__clear"
            aria-label="Clear selection"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={handleClear}
          >
            <img src={cancelIcon} alt="" width={16} height={16} />
          </button>
        )}

        {/* Chevron — rotates 180° via CSS when --open; hidden when clear button shown */}
        {!showClear && (
          <span className="bt-input-dropdown__chevron" aria-hidden="true">
            <IconExpandMore />
          </span>
        )}
      </div>

      {/* Helper / error text */}
      {(errorText || helperText) && (
        <div className="bt-input-dropdown__helper">
          <span
            className={cn(
              'bt-input-dropdown__helper-text',
              hasError && 'bt-input-dropdown__helper-text--error',
            )}
          >
            {errorText || helperText}
          </span>
        </div>
      )}

      {/* Floating panel — rendered in fixed position (teleported equivalent) */}
      {isOpen && (
        <div
          ref={panelRef}
          className="bt-input-dropdown__panel"
          role="listbox"
          aria-label={label}
        >
          <BTDropdownList
            items={filteredItems}
            searchable={hasSearch}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            emptyLabel={emptyLabel}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}

BTInputDropdown.displayName = 'BTInputDropdown';
