import { createContext, useContext } from 'react';
import type { BTFormContextValue } from '@/components/ui/form/BTForm.types';

/**
 * Public BTForm context. BT inputs that declare a `name` prop subscribe via
 * `useBTForm()` and resolve their value/onChange/onBlur/error from form
 * state — no prop-drilling required.
 *
 * Provider is `BTForm` itself. Consumers should treat `null` as "not inside
 * a BTForm" and fall back to their own props / BTFormFieldContext.
 */
export const BTFormContext = createContext<BTFormContextValue | null>(null);

export function useBTForm(): BTFormContextValue | null {
  return useContext(BTFormContext);
}
