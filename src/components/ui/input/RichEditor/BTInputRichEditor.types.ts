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

