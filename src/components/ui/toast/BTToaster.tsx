'use client';
/**
 * BTToaster — global toast container (React).
 *
 * Mount once at the application root. Reads from the imperative `toast`
 * singleton store. 9 positions supported; default = `bottom-right`.
 *
 * @example
 *   <BTToaster position="bottom-right" />
 */
import { useEffect, useRef, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/components/ui/toast/useToast';
import { BTToast } from '@/components/ui/toast/BTToast';
import type { BTToastItem, BTToastPosition } from '@/components/ui/toast/BTToast.types';
import '@/components/ui/toast/BTToast.css';

interface BTToasterProps {
  position?: BTToastPosition;
}

/** Augments a BTToastItem with an exit-animation flag. */
interface LocalToast extends BTToastItem {
  exiting: boolean;
}

/** Duration (ms) of the bt-toast-out leave animation. */
const LEAVE_DURATION_MS = 150;

export function BTToaster({ position = 'bottom-right' }: BTToasterProps): JSX.Element | null {
  const { toasts, remove } = useToast();
  const [mounted, setMounted] = useState(false);
  const [localToasts, setLocalToasts] = useState<LocalToast[]>([]);
  // exitTimers tracks pending cleanup timeouts so we never double-schedule.
  const exitTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Mount guard — avoids SSR mismatch.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect 1: sync the external store → local list.
  // When a toast is removed from the store (auto-dismiss or manual), mark it
  // as `exiting: true` so the leave animation plays before we drop it.
  useEffect(() => {
    setLocalToasts((prev) => {
      const storeIds = new Set(toasts.map((t) => t.id));

      // Mark toasts that are no longer in the store as exiting.
      const updated = prev.map((t): LocalToast => {
        if (!t.exiting && !storeIds.has(t.id)) {
          return { ...t, exiting: true };
        }
        return t;
      });

      // Append brand-new toasts that aren't in the local list yet.
      const existingIds = new Set(prev.map((t) => t.id));
      const added: LocalToast[] = toasts
        .filter((t) => !existingIds.has(t.id))
        .map((t) => ({ ...t, exiting: false }));

      return [...updated, ...added];
    });
  }, [toasts]);

  // Effect 2: schedule cleanup for toasts in the exiting state.
  // Runs whenever localToasts changes, picks up newly-exiting entries, and
  // removes them from local state after the CSS animation finishes.
  useEffect(() => {
    localToasts.forEach((t) => {
      if (t.exiting && !exitTimers.current[t.id]) {
        exitTimers.current[t.id] = setTimeout(() => {
          setLocalToasts((cur) => cur.filter((x) => x.id !== t.id));
          delete exitTimers.current[t.id];
        }, LEAVE_DURATION_MS);
      }
    });
  }, [localToasts]);

  // Cleanup all pending timers on unmount.
  useEffect(() => {
    return () => {
      Object.values(exitTimers.current).forEach(clearTimeout);
    };
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  function handleClose(id: string): void {
    remove(id); // Removes from store → Effect 1 marks it exiting → Effect 2 schedules cleanup
  }

  return createPortal(
    <div
      className={`bt-toaster bt-toaster--${position}`}
      role="region"
      aria-label="Notifications"
    >
      {localToasts.map((t: LocalToast) => (
        <div
          key={t.id}
          className={t.exiting ? 'bt-toast-leave-active' : 'bt-toast-enter-active'}
        >
          <BTToast item={t} onClose={() => handleClose(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
