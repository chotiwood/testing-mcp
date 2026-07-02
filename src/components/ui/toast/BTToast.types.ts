// BTToast / BTToaster types — Figma node 95:101.

export type BTToastType =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'description';

export type BTToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface BTToastItem {
  id: string;
  type: BTToastType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** ms — 0 means persistent (no auto-dismiss). */
  duration: number;
}

export interface BTToastOptions {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** ms — 0 means persistent. Defaults to 4000. */
  duration?: number;
}
