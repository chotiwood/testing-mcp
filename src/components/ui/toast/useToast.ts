import { useSyncExternalStore } from 'react';
import type {
  BTToastItem,
  BTToastOptions,
  BTToastType,
} from '@/components/ui/toast/BTToast.types';

let _id = 0;
let _toasts: BTToastItem[] = [];
const _listeners = new Set<() => void>();

function notify(): void {
  _listeners.forEach((cb) => cb());
}

function subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

function getSnapshot(): BTToastItem[] {
  return _toasts;
}

function add(item: Omit<BTToastItem, 'id'>): string {
  const id = String(++_id);
  _toasts = [..._toasts, { ...item, id }];
  notify();
  if (item.duration > 0) {
    setTimeout(() => remove(id), item.duration);
  }
  return id;
}

function remove(id: string): void {
  const next = _toasts.filter((t) => t.id !== id);
  if (next.length !== _toasts.length) {
    _toasts = next;
    notify();
  }
}

function make(type: BTToastType) {
  return (title: string, opts?: BTToastOptions): string =>
    add({
      type,
      title,
      description: opts?.description,
      actionLabel: opts?.actionLabel,
      onAction: opts?.onAction,
      duration: opts?.duration ?? 4000,
    });
}

/**
 * Imperative toast API. Call from anywhere in your app:
 *
 *   toast('Hello');
 *   toast.success('Saved!');
 *   toast.error('Failed', { description: 'Please retry' });
 *   toast.dismiss(id);
 */
export const toast = Object.assign(make('default'), {
  success: make('success'),
  error: make('error'),
  warning: make('warning'),
  info: make('info'),
  description: make('description'),
  dismiss: remove,
});

/** Reactive accessor used by `<BTToaster>`. */
export function useToast(): {
  toasts: BTToastItem[];
  remove: (id: string) => void;
} {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { toasts, remove };
}
