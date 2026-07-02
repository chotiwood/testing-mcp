import { reactive } from 'vue';
import type { BTToastItem, BTToastOptions, BTToastType } from '@/components/ui/toast/BTToast.types';

let _id = 0;
const _toasts = reactive<BTToastItem[]>([]);

function add(item: Omit<BTToastItem, 'id'>): string {
  const id = String(++_id);
  _toasts.push({ ...item, id });
  if (item.duration > 0) {
    setTimeout(() => remove(id), item.duration);
  }
  return id;
}

function remove(id: string): void {
  const i = _toasts.findIndex((t) => t.id === id);
  if (i >= 0) _toasts.splice(i, 1);
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

/** Reactive accessor for the `<BTToaster>` component. */
export function useToast() {
  return { toasts: _toasts, remove };
}
