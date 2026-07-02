/**
 * BTInputRichEditor — rich text editor input types.
 *
 * Figma node 665-2254.
 * Editor engine: Quill (https://quilljs.com)
 */

/**
 * Toolbar layout variant.
 *
 * **`big`** — Full toolbar (Figma node 651-2850):
 * `Undo · Redo` | `Bold · Italic · Underline` | `A+ · A-` | `Tc · Hi` |
 * `• · #` | `← · ↔ · →` | `😊 · 🔗 · 🖼 · 📎` | `🗑`
 *
 * **`small`** — Compact toolbar (Figma node 651-3185):
 * `Bold · Italic` | `Underline · A+ · A-` | `Tc · Hi` | `• · #` | `😊 · 🔗 · 🖼 · 📎`
 * (no undo/redo, no alignment, no delete)
 *
 * The grouping/separators between variants intentionally differ:
 * - Big: Bold/Italic/Underline share one group; separator before A+
 * - Small: Bold/Italic share one group; separator before Underline+A+
 *
 * @default 'big'
 */
export type BTInputRichEditorToolbar = 'big' | 'small';

/**
 * Full editor content snapshot returned by `getContent()`.
 *
 * Use this when you need everything at once — e.g. on a "Send" button click:
 *
 * ```ts
 * const { html, attachments } = editorRef.value.getContent();
 * await sendMessage(html, attachments);
 * editorRef.value.clearContent();
 * ```
 */
export interface BTInputRichEditorContent {
  /** Rich-text HTML from Quill. Empty string when the editor is blank. */
  html: string;
  /** All non-image files the user has attached (card-style attachments). */
  attachments: File[];
}

export interface BTInputRichEditorProps {
  /**
   * Editor HTML content (v-model).
   * Quill outputs well-formed HTML; consumers may sanitise on the server.
   */
  modelValue?: string;
  /** Floating label shown above the editor content. */
  label?: string;
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string;
  /** Shows a red `*` after the label. */
  required?: boolean;
  /** Disables the editor and hides the toolbar. */
  disabled?: boolean;
  /**
   * External error message. Triggers error border on the content box and
   * shows validation text below. Overrides internal validator error.
   */
  errorText?: string;
  /** Helper / info text shown below the editor in the default state. */
  helperText?: string;
  /**
   * Maximum character count (plain text, not HTML).
   * Shown in the footer as `X/maxLength`. Defaults to 2000.
   * @default 2000
   */
  maxLength?: number;
  /**
   * Toolbar layout variant.
   * - `big`   — full toolbar with undo/redo, alignment, and delete.
   * - `small` — compact toolbar without undo/redo, alignment or delete.
   * @default 'big'
   */
  toolbar?: BTInputRichEditorToolbar;
  /**
   * Validation function called by `validate()`.
   * Return an error string or null.
   */
  validator?: (value: string) => string | null;
}
