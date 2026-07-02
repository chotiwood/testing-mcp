'use client';
/**
 * BTSidebarItem — single interactive nav row inside BTSidebar.
 * Figma: node 159-1729.
 *
 * Handles types: Main, Submenu, Sub Submenu.
 * Sub Title and Divider are rendered by the parent BTSidebar.
 *
 * @example
 * ```tsx
 * <BTSidebarItem
 *   item={{ id: 'home', type: 'Main', label: 'Home', active: true }}
 *   icon={<span className="bt-sidebar-item__icon" style={iconMaskStyle(src)} />}
 *   onClick={onItemClick}
 * />
 * ```
 */
import type { KeyboardEvent, ReactNode } from 'react';
import { useCallback } from 'react';
import '@/components/ui/sidebar/internal/BTSidebarItem.css';
import { BTTooltip } from '@/components/ui/tooltip/BTTooltip';
import type { BTSidebarNavItem } from '@/components/ui/sidebar/BTSidebar.types';
import { useBTSidebarContext } from '@/components/ui/sidebar/internal/BTSidebarContext';

interface BTSidebarItemProps {
  /** The navigation item data. */
  item: BTSidebarNavItem;
  /** Whether this item's submenu children are currently expanded. */
  expanded?: boolean;
  /** Icon or dot element — omit for no leading indicator. */
  icon?: ReactNode;
  /** Called when the item is clicked (disabled items are silently ignored). */
  onClick?: (item: BTSidebarNavItem) => void;
}

const TYPE_CLASS: Record<string, string> = {
  Main: 'bt-sidebar-item--main',
  Submenu: 'bt-sidebar-item--submenu',
  'Sub Submenu': 'bt-sidebar-item--sub-submenu',
};

export function BTSidebarItem({ item, expanded = false, icon, onClick }: BTSidebarItemProps) {
  const { open: sidebarOpen } = useBTSidebarContext();

  const handleClick = useCallback(() => {
    if (item.disabled) return;
    onClick?.(item);
  }, [item, onClick]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  // Show chevron when item has children, EXCEPT for Main + disabled (Figma 159-1729)
  const showChevron = !!item.children?.length && !(item.type === 'Main' && item.disabled);

  // Tooltip: only for Main items when sidebar is collapsed
  const tooltipDisabled = sidebarOpen || item.type !== 'Main' || !item.label;

  const cls = [
    'bt-sidebar-item',
    TYPE_CLASS[item.type] ?? 'bt-sidebar-item--main',
    item.active ? 'bt-sidebar-item--active' : '',
    item.disabled ? 'bt-sidebar-item--disabled' : '',
    expanded ? 'bt-sidebar-item--expanded' : '',
    !sidebarOpen ? 'bt-sidebar-item--collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <BTTooltip
      text={item.label}
      position="right"
      disabled={tooltipDisabled}
      showDelay={200}
      compact
    >
      <div
        className={cls}
        role="button"
        tabIndex={item.disabled ? -1 : 0}
        aria-disabled={item.disabled || undefined}
        aria-expanded={item.children?.length ? expanded : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Left icon / dot slot */}
        {icon}

        {/* Label (hidden via CSS in collapsed mode) */}
        <span className="bt-sidebar-item__label">{item.label}</span>

        {/* Chevron — data-driven; Main+disabled has none (Figma spec) */}
        {showChevron && (
          <svg
            className="bt-sidebar-item__chevron"
            viewBox="0 0 16 16"
            fill="none"
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
        )}
      </div>
    </BTTooltip>
  );
}

BTSidebarItem.displayName = 'BTSidebarItem';
