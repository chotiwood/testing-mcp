import type { ReactNode } from 'react';
import type { BTAvatarItem } from '@/components/ui/avatar/BTAvatar.types';

export type { BTAvatarItem };

export type BTSidebarItemType = 'Main' | 'Submenu' | 'Sub Submenu' | 'Sub Title' | 'Divider';

export interface BTSidebarNavItem {
  /** Unique identifier for the item. */
  id: string;
  /** Layout / visual type. */
  type: BTSidebarItemType;
  /** Display label — unused for Divider. */
  label?: string;
  /**
   * Icon for Main items — any ReactNode (img, svg, icon component, etc.).
   * Rendered as-is inside the icon slot area of the sidebar item row.
   * Ignored for Submenu / Sub Submenu (dot used instead).
   *
   * @example
   * ```tsx
   * icon: <img src="/icons/home.svg" className="bt-sidebar-item__icon-img" alt="" />
   * ```
   */
  icon?: ReactNode;
  /** Whether this item is the currently selected / active page. */
  active?: boolean;
  /** Non-interactive item (visually dimmed, no click). */
  disabled?: boolean;
  /** Child items: Main → Submenu → Sub Submenu. */
  children?: BTSidebarNavItem[];
}

/**
 * Sidebar header data — title, description, and logo.
 * The `logo` field accepts any ReactNode (img, svg, icon component, etc.):
 *
 * ```tsx
 * header={{
 *   logo: <img src="/logo.svg" className="bt-sidebar__logo" alt="App" />,
 *   title: 'App',
 *   description: 'Workspace',
 * }}
 * ```
 */
export interface BTSidebarHeader {
  /** Logo element — any ReactNode rendered in the header. */
  logo?: ReactNode;
  /** Application or workspace title (bold 14 px). */
  title?: string;
  /** Subtitle / description line (12 px text-secondary). */
  description?: string;
}

export interface BTSidebarFooterUser {
  /**
   * Avatar payload passed directly to BTAvatar.
   * Contains: `name` (for initials fallback), optional `imageUrl`, optional `color`.
   * When omitted, BTAvatar renders the empty/person-icon state.
   */
  item?: BTAvatarItem;
  /** User email address (12 px text-secondary). */
  email?: string;
}

export interface BTSidebarProps {
  /** Expanded (258 px) when true, collapsed (64 px) when false. */
  open?: boolean;
  /** Show scrollbar in the nav area. */
  hasScroll?: boolean;
  /** Header logo + title + description. */
  header?: BTSidebarHeader;
  /** Navigation item tree (Main → Submenu → Sub Submenu). */
  items?: BTSidebarNavItem[];
  /**
   * Footer content — accepts any ReactNode.
   * Rendered inside `.bt-sidebar__footer` which handles layout and collapsed state.
   * Use `bt-sidebar__footer-text`, `bt-sidebar__footer-name`, `bt-sidebar__footer-email`
   * CSS classes for the standard avatar + name/email layout.
   */
  footer?: ReactNode;
  /** Controlled search input value (omit to hide the search bar). */
  searchValue?: string;
  /**
   * Item IDs that should be expanded on first render.
   * Useful for demos and deep-link navigation.
   */
  initialExpandedIds?: string[];
  /** Called when the toggle button is clicked. */
  onToggle?: () => void;
  /** Called on search input change. */
  onSearch?: (value: string) => void;
  /** Called when any nav item is clicked. */
  onItemClick?: (item: BTSidebarNavItem) => void;
}
