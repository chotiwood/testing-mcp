'use client';
/**
 * BTInputMultipleField — multi-value tag input with checkbox dropdown (React).
 * Figma node 555-4109. Mirrors BTInputMultipleField.vue one-to-one.
 *
 * Layout (flex-row):
 * ┌── field ──────────────────────────────────────────────────┐
 * │  [content flex-1]                    [actions flex-none]   │
 * │   label (14px resting → 12px float)  [clear-all?]         │
 * │   body (tags + cursor)               [chevron ↓ / ↑]      │
 * └───────────────────────────────────────────────────────────┘
 *
 * Usage — free-text only:
 * ```tsx
 * <BTInputMultipleField value={tags} onChange={setTags} label="Skills" required />
 * ```
 *
 * Usage — with predefined items + search:
 * ```tsx
 * <BTInputMultipleField
 *   value={tags}
 *   onChange={setTags}
 *   label="Frameworks"
 *   items={frameworkItems}
 *   hasSearch
 * />
 * ```
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import '@/components/ui/input/MultipleField/BTInputMultipleField.css';
import { positionBelow } from '@/components/ui/input/internal/positionFloating';
import type {
  BTInputMultipleFieldProps,
  BTInputMultipleFieldHandle,
} from '@/components/ui/input/MultipleField/BTInputMultipleField.types';
import { BTTag } from '@/components/ui/tag/BTTag';
import { BTDropdownList } from '@/components/ui/dropdown-list/index';
import type { BTTagItem } from '@/components/ui/tag/BTTag.types';
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';
import { useBTForm } from '@/components/ui/form/BTFormContext';

// ── Utility ───────────────────────────────────────────────────────────────────
const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

// ── Component ─────────────────────────────────────────────────────────────────
export const BTInputMultipleField = React.forwardRef<
  BTInputMultipleFieldHandle,
  BTInputMultipleFieldProps
>(function BTInputMultipleField(
  {
    name,
    value,
    items = [],
    label,
    type = 'wrap',
    required = false,
    disabled = false,
    errorText,
    helperText,
    hasSearch = false,
    itemsFilter,
    emptyLabel = 'No result found.',
    onChange,
    validator,
  },
  ref,
) {
  // ── BTForm wrapping (optional) ─────────────────────────────────────────────
  const form = useBTForm();
  const isInForm = form !== null && typeof name === 'string';
  const formValue = isInForm ? (form.values[name] as BTTagItem[] | undefined) : undefined;
  const formError = isInForm ? form.errorFor(name) : null;
  const resolvedValue: BTTagItem[] = value ?? formValue ?? [];

  function emitChange(next: BTTagItem[]) {
    onChange?.(next);
    if (isInForm) form.setField(name, next);
  }

  // ── Unique id for label↔input association ──────────────────────────────────
  const uid        = React.useId();
  const fieldInputId = `bt-imf-input-${uid}`;
  const resolvedRequired = required;

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const wrapperRef         = React.useRef<HTMLDivElement>(null);
  const fieldRef           = React.useRef<HTMLDivElement>(null);
  const inputRef           = React.useRef<HTMLInputElement>(null);
  const overlayRef         = React.useRef<HTMLDivElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [isFocused,      setIsFocused]      = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [inputValue,     setInputValue]     = React.useState('');
  const [searchQuery,    setSearchQuery]    = React.useState('');
  const [overlayStyle,   setOverlayStyle]   = React.useState<React.CSSProperties>({});
  // Internal validator error — cleared on successful validate()
  const [errorTextInternal, setErrorTextInternal] = React.useState<string | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────
  const tags     = resolvedValue;
  const hasItems = items.length > 0;

  // Field is "active" when the native input is focused OR the dropdown is open
  const isActive = isFocused || isDropdownOpen;

  const hasContent = tags.length > 0 || inputValue.length > 0;

  const labelFloating = !!(label && (isActive || hasContent));

  // filteredItems: pre-filtered + checked-state-stamped list
  const filteredItems = React.useMemo<BTDropdownItem<string>[]>(() => {
    let filtered: BTDropdownItem<string>[];

    if (!hasSearch || !searchQuery) {
      filtered = items;
    } else if (itemsFilter) {
      filtered = itemsFilter(items, searchQuery);
    } else {
      const q = searchQuery.toLowerCase();
      filtered = items.filter(i => (i.label ?? '').toLowerCase().includes(q));
    }

    // Stamp checked state from current tags (match by item.value === tag.id)
    return filtered.map(item => ({
      ...item,
      checked: tags.some(t => t.id === item.value),
    }));
  }, [items, hasSearch, searchQuery, itemsFilter, tags]);

  // Active error: external errorText prop > internal validator > BTForm context
  const activeError = errorText ?? errorTextInternal ?? formError ?? null;

  // ── CSS classes ────────────────────────────────────────────────────────────
  const fieldClass = cn(
    'bt-input-multiple-field',
    `bt-input-multiple-field--${type}`,
    isActive  && 'bt-input-multiple-field--focused',
    !!activeError && 'bt-input-multiple-field--error',
    disabled  && 'bt-input-multiple-field--disabled',
  );

  // ── Overlay positioning ────────────────────────────────────────────────────
  // Sets the overlay width (tied to wrapper) via state.
  // top/left are handled by positionBelow() direct DOM mutations so that
  // smart flip (below ↔ above) works without re-render interference.
  function syncOverlayPosition() {
    if (!wrapperRef.current) return;
    const { width } = wrapperRef.current.getBoundingClientRect();
    setOverlayStyle({
      position: 'fixed',
      width:  `${width}px`,
      zIndex: 200,
    });
    // After state update → overlay re-renders with new width → positionBelow
    // re-anchors top/left (called from the isDropdownOpen useEffect below).
    if (overlayRef.current) {
      positionBelow(wrapperRef.current, overlayRef.current, { gap: 4, margin: 8 });
    }
  }

  // ── Height animation (wrap type) ───────────────────────────────────────────
  // Reads content.scrollHeight and explicitly sets the field container's height
  // so CSS `transition: height` can animate tag-row additions/removals.
  function syncFieldHeight() {
    if (type !== 'wrap' || !fieldRef.current) return;
    const content = fieldRef.current.querySelector<HTMLElement>(
      '.bt-input-multiple-field__content',
    );
    if (!content) return;
    const pad = labelFloating ? 8 : 0;
    const h   = Math.max(48, content.scrollHeight + pad);
    fieldRef.current.style.height = `${h}px`;
  }

  // ── Dropdown open / close ──────────────────────────────────────────────────
  function openDropdown() {
    if (disabled) return;
    syncOverlayPosition();
    setSearchQuery('');
    setIsDropdownOpen(true);
  }

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  function toggleDropdown() {
    isDropdownOpen ? closeDropdown() : openDropdown();
  }

  // ── Smart-flip positioning after portal mounts ────────────────────────────
  // The portal renders on the NEXT paint after isDropdownOpen → true.
  // positionBelow runs in rAF so the overlay height is measurable.
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    const id = requestAnimationFrame(() => {
      if (wrapperRef.current && overlayRef.current) {
        positionBelow(wrapperRef.current, overlayRef.current, { gap: 4, margin: 8 });
      }
    });
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen]);

  // ── Scroll / resize re-anchor while open ─────────────────────────────────
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    function reposition() {
      if (wrapperRef.current && overlayRef.current) {
        positionBelow(wrapperRef.current, overlayRef.current, { gap: 4, margin: 8 });
      }
    }
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen]);

  // ── Click-outside closes the dropdown ─────────────────────────────────────
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target) ?? false;
      const insideOverlay = overlayRef.current?.contains(target) ?? false;
      if (!insideWrapper && !insideOverlay) closeDropdown();
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen]);

  // ── Escape key while open ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isDropdownOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen]);

  // ── Height + overlay re-anchor after every relevant state change ───────────
  React.useEffect(() => {
    requestAnimationFrame(() => {
      syncFieldHeight();
      if (isDropdownOpen) {
        syncOverlayPosition();
        setTimeout(() => {
          if (isDropdownOpen) syncOverlayPosition();
        }, 210);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, isActive, labelFloating, type]);

  // ── ResizeObserver — live-track wrapper resize while dropdown is open ──────
  React.useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(() => {
      if (isDropdownOpen) syncOverlayPosition();
    });
    ro.observe(wrapperRef.current);
    // Initial sync
    syncFieldHeight();
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Focus ──────────────────────────────────────────────────────────────────
  function onBodyClick() {
    if (disabled) return;
    // Set isFocused first so the body v-show equivalent (display:none guard) is
    // lifted before we attempt to focus the input.
    setIsFocused(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onInputFocus() { setIsFocused(true); }
  function onInputBlur()  {
    setIsFocused(false);
    if (isInForm) form.touch(name);
  }

  // ── Tag operations ─────────────────────────────────────────────────────────
  // Enter: commit typed text as a free-text tag
  function onEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const v = inputValue.trim();
    if (!v) return;
    emitChange([...tags, { label: v, id: crypto.randomUUID() }]);
    setInputValue('');
  }

  // Backspace on empty cursor: remove the last tag
  function onBackspace() {
    if (inputValue === '' && tags.length > 0) {
      emitChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: BTTagItem) {
    emitChange(tags.filter(t => t.id !== tag.id));
  }

  // Clear all tags + typed input
  function clearAll(e: React.MouseEvent) {
    e.preventDefault();
    emitChange([]);
    setInputValue('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // ── Predefined item toggled from BTDropdownList ────────────────────────────
  function onItemSelect(val: string) {
    const existing = tags.find(t => t.id === val);
    if (existing) {
      // Deselect: remove from tag list
      emitChange(tags.filter(t => t.id !== val));
    } else {
      // Select: find item label and add as tag
      const item = items.find(i => i.value === val);
      if (!item?.label) return;
      emitChange([...tags, { label: item.label, id: val }]);
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    if (!validator) return true;
    const result = validator(tags);
    setErrorTextInternal(result ?? null);
    return result === null;
  }

  React.useImperativeHandle(ref, () => ({ validate }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="bt-input-multiple-field__wrapper">

      {/* Field container: flex-row, height controlled via JS (syncFieldHeight) */}
      <div
        ref={fieldRef}
        className={fieldClass}
        onClick={onBodyClick}
      >
        {/* Content column: label + body (tags + cursor) */}
        <div className="bt-input-multiple-field__content">

          {/* Label: inline flow, 14px resting → 12px floating */}
          {label && (
            <label
              htmlFor={fieldInputId}
              className={cn(
                'bt-input-multiple-field__label',
                labelFloating && 'bt-input-multiple-field__label--floating',
              )}
            >
              {label}
              {required && (
                <span className="bt-input-multiple-field__required">*</span>
              )}
            </label>
          )}

          {/* Body: tags + cursor — shown when label is floating or there is no label */}
          <div
            className="bt-input-multiple-field__body"
            style={{ display: labelFloating || !label ? undefined : 'none' }}
          >
            {/* Tags: × icon only when the field is active (focused / dropdown open).
                The onMouseDown.preventDefault keeps the input focused when the
                user clicks the × button — without it, mousedown steals focus from
                the input before click fires. */}
            {tags.map(tag => (
              <span
                key={tag.id ?? tag.label}
                onMouseDown={(e) => e.preventDefault()}
              >
                <BTTag
                  label={tag.label}
                  onRemove={isActive && !disabled ? () => removeTag(tag) : undefined}
                />
              </span>
            ))}

            {/* Inline text cursor — hidden when field is inactive so it doesn't
                leave a blank 20px row below the tags in the resting/filled state */}
            <input
              id={fieldInputId}
              ref={inputRef}
              className="bt-input-multiple-field__cursor"
              value={inputValue}
              disabled={disabled}
              placeholder={!hasContent && !label ? 'Type and press Enter...' : ''}
              style={{ display: isActive ? undefined : 'none' }}
              aria-invalid={!!activeError || undefined}
              aria-required={resolvedRequired || undefined}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter')     onEnter(e);
                if (e.key === 'Backspace') onBackspace();
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Right actions: clear-all (×) + chevron */}
        <div className="bt-input-multiple-field__actions">

          {/* Clear-all: shown only when active AND there are tags to clear */}
          {isActive && tags.length > 0 && (
            <button
              type="button"
              className="bt-input-multiple-field__clear-all"
              aria-label="Clear all"
              tabIndex={-1}
              onMouseDown={clearAll}
            >
              {/* Material cancel icon (filled circle with ×) */}
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            </button>
          )}

          {/* Chevron: ↓ when closed, ↑ when open (separate paths, no rotation) */}
          {hasItems && (
            <button
              type="button"
              className="bt-input-multiple-field__chevron"
              disabled={disabled}
              aria-expanded={isDropdownOpen}
              aria-label={isDropdownOpen ? 'Close options' : 'Open options'}
              onClick={(e) => { e.stopPropagation(); toggleDropdown(); }}
            >
              {!isDropdownOpen ? (
                /* keyboard_arrow_down */
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
              ) : (
                /* keyboard_arrow_up */
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Dropdown overlay — rendered in a portal so it escapes stacking contexts */}
      {isDropdownOpen && createPortal(
        <div
          ref={overlayRef}
          className="bt-input-mf-overlay"
          style={overlayStyle}
        >
          <BTDropdownList
            items={filteredItems}
            variant="checkbox"
            searchable={hasSearch}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            emptyLabel={emptyLabel}
            onSelect={onItemSelect}
          />
        </div>,
        document.body,
      )}

      {(activeError || helperText) && (
        <div className="bt-input-multiple-field__helper">
          <span
            className={cn(
              'bt-input-multiple-field__helper-text',
              !!activeError && 'bt-input-multiple-field__helper-text--error',
            )}
            role={activeError ? 'alert' : undefined}
          >
            {activeError || helperText}
          </span>
        </div>
      )}
    </div>
  );
});

BTInputMultipleField.displayName = 'BTInputMultipleField';
