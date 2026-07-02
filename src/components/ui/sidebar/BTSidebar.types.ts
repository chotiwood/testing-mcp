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
   * Icon for Main items — any image/SVG URL (data URI or path).
   * Rendered via CSS mask-image so state colors (active/disabled) work automatically.
   * Pass a data-URI SVG for full color theming support.
   * For fully custom icon rendering, omit this and use the BTSidebarItem #icon slot directly.
   */
  icon?: string;
  /** Whether this item is the currently selected / active page. */
  active?: boolean;
  /** Non-interactive item (visually dimmed, no click). */
  disabled?: boolean;
  /** Child items: Main → Submenu → Sub Submenu. */
  children?: BTSidebarNavItem[];
}

/**
 * Sidebar header data — title and description only.
 * The logo is rendered via the `#logo` named slot on `<BTSidebar>` (any element accepted):
 *
 * ```vue
 * <BTSidebar :header="{ title: 'App', description: 'Workspace' }">
 *   <template #logo>
 *     <img src="/logo.svg" class="bt-sidebar__logo" alt="App" />
 *   </template>
 * </BTSidebar>
 * ```
 */
export interface BTSidebarHeader {
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
  /** Controlled search input value. */
  searchValue?: string;
  /**
   * Item IDs that should be expanded on first render.
   * Useful for demos and deep-link navigation.
   */
  initialExpandedIds?: string[];
  // footer content is passed via the #footer named slot
}
