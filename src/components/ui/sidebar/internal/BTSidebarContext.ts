import { createContext, useContext } from 'react';

/**
 * Context provided by BTSidebar to all descendant BTSidebarItem components.
 * Allows items to reactively respond to the sidebar's open/collapsed state
 * without needing an explicit prop at every level.
 */
export interface BTSidebarContextValue {
  /** Whether the sidebar is in expanded (true) or icon-rail (false) state. */
  open: boolean;
}

export const BTSidebarContext = createContext<BTSidebarContextValue>({ open: true });

export function useBTSidebarContext(): BTSidebarContextValue {
  return useContext(BTSidebarContext);
}
