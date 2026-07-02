import type { InjectionKey, ComputedRef } from 'vue';

/**
 * Context provided by BTSidebar to all descendant BTSidebarItem components.
 * Allows items to reactively respond to the sidebar's open/collapsed state
 * without needing an explicit prop at every level.
 */
export interface BTSidebarContext {
  /** Whether the sidebar is in expanded (true) or icon-rail (false) state. */
  open: ComputedRef<boolean>;
}

export const SIDEBAR_INJECTION_KEY: InjectionKey<BTSidebarContext> =
  Symbol('BTSidebarContext');
