/**
 * BTDropdownList — floating option list atom.
 * Figma source: node 668-8852.
 *
 * Purely presentational — caller handles positioning, filtering, and
 * visibility toggling.
 *
 * @example
 * // List variant
 * <BTDropdownList
 *   items={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
 *   onSelect={handleSelect}
 * />
 *
 * @example
 * // Combobox variant with search
 * <BTDropdownList
 *   variant="combobox"
 *   searchable
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   items={filteredUsers}
 *   onSelect={handleSelectUser}
 * />
 *
 * @example
 * // Checkbox multi-select
 * <BTDropdownList
 *   variant="checkbox"
 *   items={items}
 *   onSelect={handleToggle}
 * />
 */
import '@/components/ui/dropdown-list/BTDropdownList.css';
import type { BTDropdownListProps, BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';
import { BTCheckbox } from '@/components/ui/checkbox/BTCheckbox';
import { BTRadioButton } from '@/components/ui/radio-button/BTRadioButton';
import { BTScrollbar } from '@/components/ui/scrollbar/BTScrollbar';
import { BTInputSearch } from '@/components/ui/input-search/BTInputSearch';
import emptyStateImg from '@/components/ui/dropdown-list/illus/empty-state.svg';

// Avatar color map — mirrors BTAvatar component-specific palette
const AVATAR_COLORS: Record<string, string> = {
  green: '#89ae68',
  blue: '#93c6ef',
  orange: '#f0a070',
  purple: '#b39ddb',
  teal: '#80cbc4',
  pink: '#f48fb1',
};

function deriveInitials(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
}

export function BTDropdownList<T = string>({
  variant = 'list',
  items,
  searchable = false,
  searchQuery = '',
  onSearchChange,
  onSelect,
  emptyLabel = 'No result found.',
  className,
}: BTDropdownListProps<T>) {
  const isEmpty = items.length === 0;
  const isCombobox = variant === 'combobox';
  const isCheckbox = variant === 'checkbox';
  const isRadio = variant === 'radio';

  function renderItem(item: BTDropdownItem<T>) {
    const avatarBg = AVATAR_COLORS[item.avatar?.color ?? 'green'] ?? '#89ae68';
    const isChecked = item.checked ?? false;

    const itemClass = [
      'bt-dropdown-list__item',
      isCombobox ? 'bt-dropdown-list__item--combobox' : '',
      isCheckbox || isRadio ? 'bt-dropdown-list__item--selectable' : '',
      item.disabled ? 'bt-dropdown-list__item--disabled' : '',
      isChecked ? 'bt-dropdown-list__item--checked' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={item.value !== undefined ? String(item.value) : item.label}
        className={itemClass}
        role="option"
        aria-selected={isChecked}
        aria-disabled={item.disabled}
        onClick={() => !item.disabled && item.value !== undefined && onSelect?.(item.value)}
      >
        {/* Checkbox control — className applied directly (matches Vue structure, no wrapper span) */}
        {isCheckbox && (
          <BTCheckbox
            checked={isChecked}
            disabled={item.disabled}
            onChange={() => {/* row handles click */}}
            className="bt-dropdown-list__checkbox"
          />
        )}

        {/* Radio control — className applied directly so BTRadioButton IS the flex item
             (mirrors Flutter's IgnorePointer > BTRadioButton, no wrapper widget).
             bt-dropdown-list__radio-control merges onto the root label via className prop. */}
        {isRadio && (
          <BTRadioButton
            className="bt-dropdown-list__radio-control"
            modelValue={item.checked ?? false}
            value={true}
            onChange={() => {/* row handles click */}}
            disabled={item.disabled}
          />
        )}

        {/* Avatar (combobox only) */}
        {isCombobox && item.avatar && (
          <div
            className="bt-dropdown-list__avatar"
            style={item.avatar.imageUrl ? undefined : { background: avatarBg }}
            aria-hidden="true"
          >
            {item.avatar.imageUrl ? (
              <img
                src={item.avatar.imageUrl}
                alt={item.avatar.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
              />
            ) : (
              <span>{deriveInitials(item.avatar.name)}</span>
            )}
          </div>
        )}

        <span className="bt-dropdown-list__item-label">{item.label}</span>

        {/* Remove (×) affordance — space-between with label.
            Same path as BTTag __close (filled-circle ×, single fill). */}
        {item.removable && (
          <svg
            className="bt-dropdown-list__item-remove"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM11 10.29L10.29 11L8 8.71L5.71 11L5 10.29L7.29 8L5 5.71L5.71 5L8 7.29L10.29 5L11 5.71L8.71 8L11 10.29Z" fill="currentColor"/>
          </svg>
        )}
      </div>
    );
  }

  return (
    <div className={['bt-dropdown-list', className].filter(Boolean).join(' ')} role="listbox">
      {/* Search bar */}
      {searchable && (
        <div className="bt-dropdown-list__search">
          <BTInputSearch
            value={searchQuery}
            placeholder="Search"
            onChange={(v) => onSearchChange?.(v)}
          />
        </div>
      )}

      {/* Items / empty state — scrollable when content exceeds 240px */}
      <div className="bt-dropdown-list__items">
      <BTScrollbar direction="y">
        {!isEmpty
          ? items.map((item) => renderItem(item))
          : (
            <div className="bt-dropdown-list__empty" role="status" aria-live="polite">
              <img src={emptyStateImg} alt="" className="bt-dropdown-list__empty-image" />
              <span className="bt-dropdown-list__empty-text">{emptyLabel}</span>
            </div>
          )}
      </BTScrollbar>
      </div>
    </div>
  );
}

BTDropdownList.displayName = 'BTDropdownList';
