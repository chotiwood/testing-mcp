'use client';
/**
 * BTInputRichEditor — rich text editor with floating label and toolbar.
 *
 * Powered by Quill (https://quilljs.com). Outputs HTML via onChange.
 *
 * Figma node 665-2254.
 *
 * ── Basic usage
 *   <BTInputRichEditor label="Description" value={html} onChange={setHtml} />
 *
 * ── With attachments
 *   <BTInputRichEditor value={html} onChange={setHtml}
 *     onAttachmentsChange={setFiles} onAttach={handleFile} />
 *
 * ── Imperative submit (recommended for "Send" buttons)
 *   const editorRef = useRef<BTInputRichEditorHandle>(null);
 *   function onSend() {
 *     const { html, attachments } = editorRef.current!.getContent();
 *     await sendMessage(html, attachments);
 *     editorRef.current!.clearContent();
 *   }
 *   <BTInputRichEditor ref={editorRef} label="Message" value={html} onChange={setHtml} />
 *
 * ── With validation
 *   <BTInputRichEditor label="Notes" value={html} onChange={setHtml}
 *     maxLength={500} required
 *     validator={v => v ? null : 'Required'} ref={editorRef} />
 */
import * as React from 'react';
import '@/components/ui/input/RichEditor/BTInputRichEditor.css';
import type { BTInputRichEditorContent, BTInputRichEditorToolbar } from '@/components/ui/input/RichEditor/BTInputRichEditor.types';
import { BTCheckbox } from '@/components/ui/checkbox/BTCheckbox';
import { BTButton } from '@/components/ui/button/BTButton';
import { useBTForm } from '@/components/ui/form/BTFormContext';
import { EMOJI_CATEGORIES } from '@/components/ui/input/RichEditor/BTInputRichEditor.emoji-data';
import { RichEditorIcon } from '@/components/ui/input/RichEditor/internal/RichEditorIcon';

// ── Toolbar icon imports (data URIs — no filesystem URL dependency) ────────
import {
  undo        as iconUndo,
  redo        as iconRedo,
  formatBold        as iconBold,
  formatItalic      as iconItalic,
  formatUnderlined  as iconUnderline,
  textIncrease      as iconTextIncrease,
  textDecrease      as iconTextDecrease,
  formatColorText   as iconTextColor,
  borderColor       as iconHighlight,
  formatListBulleted as iconListBullet,
  formatListNumbered as iconListNumber,
  formatAlignLeft   as iconAlignLeft,
  formatAlignCenter as iconAlignCenter,
  formatAlignRight  as iconAlignRight,
  sentimentSatisfied as iconEmoji,
  addLink           as iconLink,
  image             as iconImage,
  attachFile        as iconAttach,
  deleteIcon        as iconDelete,
  cancel            as iconCancel,
  close             as iconClose,
  description       as iconDescription,
} from '@btech/assets/icons/rich-editor';

// ── Public API types ──────────────────────────────────────────────────────

export interface BTInputRichEditorHandle {
  /** Runs the `validator` prop. Returns true if valid (or no validator). */
  validate: () => boolean;
  /** Returns the full editor content snapshot: `{ html, attachments }`. */
  getContent: () => BTInputRichEditorContent;
  /** Resets the editor: clears Quill content and attachment cards. */
  clearContent: () => void;
}

export interface BTInputRichEditorProps {
  /** Field `name` — wires this input to BTForm context when wrapped. */
  name?: string;
  /** Editor HTML content. Quill outputs well-formed HTML. */
  value?: string;
  /** Floating label shown above the editor content. */
  label?: string;
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string;
  /** Shows a red `*` after the label. */
  required?: boolean;
  /** Disables the editor and hides the toolbar. */
  disabled?: boolean;
  /** External error message. Overrides internal validator error. */
  errorText?: string;
  /** Helper / info text shown below the editor in the default state. */
  helperText?: string;
  /** Maximum character count (plain text). @default 2000 */
  maxLength?: number;
  /** Toolbar layout variant. @default 'big' */
  toolbar?: BTInputRichEditorToolbar;
  /** Validation function called by `validate()`. Return error string or null. */
  validator?: (value: string) => string | null;
  /** Called on every Quill text-change with the new HTML. */
  onChange?: (html: string) => void;
  /** Called once per file immediately when picked (for upload progress). */
  onAttach?: (file: File) => void;
  /** Called whenever the attachment list changes with the full current list. */
  onAttachmentsChange?: (files: File[]) => void;
  className?: string;
}

// ── Internal ──────────────────────────────────────────────────────────────

interface AttachmentEntry { id: string; file: File; }

type ActiveFormats = Record<string, unknown>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuillInstance = any;

const COLOR_PALETTE: string[] = [
  // Gray scale
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#efefef', '#ffffff',
  // Vivid
  '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#9900ff', '#ff00ff',
  // Muted
  '#ea9999', '#f9cb9c', '#ffd966', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  // Dark
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#674ea7', '#a64d79',
];

const SIZES = [10, 12, 14, 16, 18, 20, 24];

function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCount(n: number): string {
  return n.toLocaleString('id-ID');
}

/** Returns clamped left offset (px) so picker aligns under its button
 *  without overflowing the right edge of the toolbar-wrap. */
function computePickerLeft(
  btnEl: HTMLElement | null,
  wrapEl: HTMLElement | null,
  pickerWidth: number,
): number {
  if (!btnEl || !wrapEl) return 0;
  const btnRect  = btnEl.getBoundingClientRect();
  const wrapRect = wrapEl.getBoundingClientRect();
  const ideal    = btnRect.left - wrapRect.left;
  return Math.max(0, Math.min(ideal, wrapRect.width - pickerWidth));
}

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

// ── Component ─────────────────────────────────────────────────────────────

export const BTInputRichEditor = React.forwardRef<
  BTInputRichEditorHandle,
  BTInputRichEditorProps
>(function BTInputRichEditor(
  {
    name,
    value,
    label,
    placeholder,
    required = false,
    disabled = false,
    errorText,
    helperText,
    maxLength = 2000,
    toolbar = 'big',
    validator,
    onChange,
    onAttach,
    onAttachmentsChange,
    className,
  },
  ref,
) {
  const isBig = toolbar !== 'small';

  // ── Refs ─────────────────────────────────────────────────────────────────
  const editorDivRef     = React.useRef<HTMLDivElement>(null);
  const quillRef         = React.useRef<QuillInstance>(null);
  const savedRangeRef    = React.useRef<{ index: number; length: number } | null>(null);
  const toolbarWrapRef   = React.useRef<HTMLDivElement>(null);
  const emojiBtnRef      = React.useRef<HTMLButtonElement>(null);
  const linkBtnRef       = React.useRef<HTMLButtonElement>(null);
  const colorBtnRef      = React.useRef<HTMLButtonElement>(null);
  const highlightBtnRef  = React.useRef<HTMLButtonElement>(null);
  const emojiScrollRef   = React.useRef<HTMLDivElement>(null);
  const linkPopoverRef   = React.useRef<HTMLDivElement>(null);
  const imageFileRef     = React.useRef<HTMLInputElement>(null);
  const attachFileRef    = React.useRef<HTMLInputElement>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [isFocused,    setIsFocused]    = React.useState(false);
  const [charCount,    setCharCount]    = React.useState(0);
  const [activeFormats, setActiveFormats] = React.useState<ActiveFormats>({});
  const [errorInternal, setErrorInternal] = React.useState<string | null>(null);

  // Color pickers
  const [showColorPicker,     setShowColorPicker]     = React.useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = React.useState(false);
  const [colorPickerLeft,     setColorPickerLeft]     = React.useState(0);
  const [highlightPickerLeft, setHighlightPickerLeft] = React.useState(0);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [emojiSearch,     setEmojiSearch]     = React.useState('');
  const [activeCatId,     setActiveCatId]     = React.useState(
    EMOJI_CATEGORIES[0]?.id ?? 'smileys',
  );
  const [emojiPickerLeft, setEmojiPickerLeft] = React.useState(0);

  // Link popover
  const [showLinkDialog,  setShowLinkDialog]  = React.useState(false);
  const [linkUrl,         setLinkUrl]         = React.useState('');
  const [linkText,        setLinkText]        = React.useState('');
  const [linkOpenNewTab,  setLinkOpenNewTab]  = React.useState(true);
  const [linkPickerLeft,  setLinkPickerLeft]  = React.useState(0);

  // Attachments
  const [attachments, setAttachments] = React.useState<AttachmentEntry[]>([]);

  // ── BTForm wrapping (optional) ───────────────────────────────────────────
  const form = useBTForm();
  const isInForm = form !== null && typeof name === 'string';
  const formValue = isInForm ? (form.values[name] as string | undefined) : undefined;
  const formError = isInForm ? form.errorFor(name) : null;
  const resolvedValue = value ?? formValue;

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasContent  = (resolvedValue ?? '').length > 0 || charCount > 0;
  const activeError = errorText ?? errorInternal ?? formError ?? null;
  const hasError    = !!activeError && !disabled;
  const showClear   = isFocused && hasContent && !disabled;
  const resolvedRequired = required;

  const wrapperClass = cn(
    'bt-input-rich-editor',
    isFocused && !disabled && 'bt-input-rich-editor--active',
    !isFocused && hasContent && 'bt-input-rich-editor--filled',
    hasError && 'bt-input-rich-editor--error',
    disabled && 'bt-input-rich-editor--disabled',
    className,
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function updateCharCount() {
    const q = quillRef.current;
    if (!q) return;
    const count = q.getText().replace(/\n$/, '').length;
    setCharCount(count);
  }

  function saveRange() {
    const q = quillRef.current;
    if (!q) return;
    savedRangeRef.current = q.getSelection() ?? { index: q.getLength() - 1, length: 0 };
  }

  function closePopovers() {
    setShowEmojiPicker(false);
    setShowLinkDialog(false);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
  }

  function isActive(format: string, formatValue?: unknown): boolean {
    const v = activeFormats[format];
    if (formatValue === undefined) return !!v;
    return v === formatValue;
  }

  // ── Stable callback refs (prevent stale-closure bugs in Quill listeners) ──
  // Wraps onChange so emissions also flow into BTForm context (when wired).
  const emitChange = React.useCallback((next: string) => {
    onChange?.(next);
    if (isInForm) form.setField(name, next);
  }, [onChange, isInForm, form, name]);
  const onChangeRef = React.useRef(emitChange);
  React.useEffect(() => { onChangeRef.current = emitChange; }, [emitChange]);

  const onAttachmentsChangeRef = React.useRef(onAttachmentsChange);
  React.useEffect(() => { onAttachmentsChangeRef.current = onAttachmentsChange; }, [onAttachmentsChange]);

  // ── Quill init ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    let mounted = true;
    // Named handlers so we can remove them in cleanup
    let onTextChange: (() => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let onSelChange: ((range: any) => void) | null = null;

    async function init() {
      if (!editorDivRef.current || disabled) return;

      const { default: Quill } = await import('quill');
      if (!mounted) return;

      // Register custom font sizes (Quill 2.x requires a whitelist)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Size = Quill.import('attributors/style/size') as any;
      Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px'];
      Quill.register(Size, true);

      // Extend align attributor to support explicit 'left' so users can force
      // left alignment even inside an RTL container (default Quill whitelist is
      // ['right', 'center', 'justify']).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AlignStyle = Quill.import('attributors/style/align') as any;
      AlignStyle.whitelist = ['left', 'right', 'center', 'justify'];
      Quill.register(AlignStyle, true);

      const q = new Quill(editorDivRef.current, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        theme: false as any,
        placeholder: placeholder ?? '',
        modules: {
          history:  { delay: 1000, maxStack: 100, userOnly: true },
          keyboard: { bindings: {} },
        },
      });

      quillRef.current = q;

      // Set initial content
      if (resolvedValue) {
        q.clipboard.dangerouslyPasteHTML(resolvedValue);
        const count = q.getText().replace(/\n$/, '').length;
        setCharCount(count);
      }

      // text-change: emit new HTML + update active formats
      onTextChange = () => {
        const count = q.getText().replace(/\n$/, '').length;
        setCharCount(count);
        setActiveFormats(q.getFormat());
        const html = q.root.innerHTML;
        onChangeRef.current?.(html === '<p><br></p>' ? '' : html);
      };
      q.on('text-change', onTextChange);

      // selection-change: track focus + active formats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSelChange = (range: any) => {
        setIsFocused(!!range);
        if (range) setActiveFormats(q.getFormat(range));
        else if (isInForm) form.touch(name);
      };
      q.on('selection-change', onSelChange);
    }

    init();

    return () => {
      const q = quillRef.current;
      if (q) {
        if (onTextChange) q.off('text-change', onTextChange);
        if (onSelChange) q.off('selection-change', onSelChange);
      }
      mounted = false;
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Sync external value changes (avoid feedback loop)
  React.useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const current = q.root.innerHTML === '<p><br></p>' ? '' : q.root.innerHTML;
    if ((resolvedValue ?? '') !== current) {
      q.clipboard.dangerouslyPasteHTML(resolvedValue ?? '');
      updateCharCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedValue]);

  // Outside-click handler: close all pickers
  React.useEffect(() => {
    function onDocumentMousedown(e: MouseEvent) {
      if (!showEmojiPicker && !showLinkDialog && !showColorPicker && !showHighlightPicker) return;
      if (toolbarWrapRef.current && !toolbarWrapRef.current.contains(e.target as Node)) {
        closePopovers();
      }
    }
    document.addEventListener('mousedown', onDocumentMousedown);
    return () => document.removeEventListener('mousedown', onDocumentMousedown);
  }, [showEmojiPicker, showLinkDialog, showColorPicker, showHighlightPicker]);

  // ── Format handlers ───────────────────────────────────────────────────────
  function toggle(format: string, toggleValue: unknown = true) {
    const q = quillRef.current;
    if (!q) return;
    const current = q.getFormat()[format];
    q.format(format, current === toggleValue ? false : toggleValue);
    setActiveFormats(q.getFormat());
  }

  function setAlign(align: string) {
    const q = quillRef.current;
    if (!q) return;
    q.format('align', align || false);
    setActiveFormats(q.getFormat());
  }

  function getCurrentSize(): number {
    const fmt = quillRef.current?.getFormat() ?? {};
    const s = fmt.size as string | undefined;
    return s ? parseInt(s, 10) : 14;
  }

  function increaseSize() {
    const q = quillRef.current;
    if (!q) return;
    const cur  = getCurrentSize();
    const next = SIZES.find(s => s > cur) ?? SIZES[SIZES.length - 1];
    q.format('size', `${next}px`);
  }

  function decreaseSize() {
    const q = quillRef.current;
    if (!q) return;
    const cur  = getCurrentSize();
    const prev = [...SIZES].reverse().find(s => s < cur) ?? SIZES[0];
    q.format('size', `${prev}px`);
  }

  // ── Content ───────────────────────────────────────────────────────────────
  function clearContent() {
    const q = quillRef.current;
    if (!q) return;
    q.setContents([]);
    onChangeRef.current?.('');
    setCharCount(0);
    setAttachments([]);
    onAttachmentsChangeRef.current?.([]);
  }

  function getContent(): BTInputRichEditorContent {
    // Read live HTML from Quill to avoid stale prop snapshots when called in
    // the same tick as a text-change event.
    const liveHtml = quillRef.current
      ? (quillRef.current as { root: HTMLElement }).root.innerHTML
      : (resolvedValue ?? '');
    return {
      html:        liveHtml === '<p><br></p>' ? '' : liveHtml,
      attachments: attachments.map(a => a.file),
    };
  }

  function validate(): boolean {
    if (!validator) return true;
    const result = validator(resolvedValue ?? '');
    setErrorInternal(result ?? null);
    return result === null;
  }

  // ── Expose imperative API ─────────────────────────────────────────────────
  React.useImperativeHandle(ref, () => ({ validate, getContent, clearContent }), [
    resolvedValue, attachments, validator,
  ]);

  // ── Color pickers ─────────────────────────────────────────────────────────
  function openColorPicker() {
    const q = quillRef.current;
    if (!q) return;
    saveRange();
    setColorPickerLeft(
      showColorPicker ? colorPickerLeft :
        computePickerLeft(colorBtnRef.current, toolbarWrapRef.current, 220),
    );
    setShowColorPicker(v => !v);
    setShowHighlightPicker(false);
    setShowEmojiPicker(false);
    setShowLinkDialog(false);
  }

  function applyTextColor(hex: string | null) {
    const q = quillRef.current;
    if (!q) return;
    const sr = savedRangeRef.current;
    if (sr) q.setSelection(sr.index, sr.length);
    q.format('color', hex ?? false);
    setActiveFormats(q.getFormat());
    setShowColorPicker(false);
  }

  function openHighlightPicker() {
    const q = quillRef.current;
    if (!q) return;
    saveRange();
    setHighlightPickerLeft(
      showHighlightPicker ? highlightPickerLeft :
        computePickerLeft(highlightBtnRef.current, toolbarWrapRef.current, 220),
    );
    setShowHighlightPicker(v => !v);
    setShowColorPicker(false);
    setShowEmojiPicker(false);
    setShowLinkDialog(false);
  }

  function applyHighlightColor(hex: string | null) {
    const q = quillRef.current;
    if (!q) return;
    const sr = savedRangeRef.current;
    if (sr) q.setSelection(sr.index, sr.length);
    q.format('background', hex ?? false);
    setActiveFormats(q.getFormat());
    setShowHighlightPicker(false);
  }

  // ── Emoji ─────────────────────────────────────────────────────────────────
  const searchResults = React.useMemo<string[]>(() => {
    const q = emojiSearch.trim().toLowerCase();
    if (!q) return [];
    return EMOJI_CATEGORIES.flatMap(cat =>
      cat.emojis
        .filter(([, kw]) => kw.includes(q))
        .map(([e]) => e),
    );
  }, [emojiSearch]);

  function openEmojiPicker() {
    const q = quillRef.current;
    if (!q) return;
    saveRange();
    if (!showEmojiPicker) {
      setEmojiPickerLeft(computePickerLeft(emojiBtnRef.current, toolbarWrapRef.current, 320));
      setEmojiSearch('');
      setActiveCatId(EMOJI_CATEGORIES[0]?.id ?? 'smileys');
    }
    setShowEmojiPicker(v => !v);
    if (showLinkDialog) setShowLinkDialog(false);
  }

  function insertEmoji(emoji: string) {
    const q = quillRef.current;
    if (!q) return;
    const range = savedRangeRef.current ?? { index: q.getLength() - 1, length: 0 };
    q.insertText(range.index, emoji, 'user');
    q.setSelection(range.index + [...emoji].length, 0);
    setShowEmojiPicker(false);
  }

  function scrollToCategory(id: string) {
    setActiveCatId(id);
    const container = emojiScrollRef.current;
    const section   = container?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
    if (container && section) {
      container.scrollTop = section.offsetTop;
    }
  }

  function onEmojiScroll() {
    const container = emojiScrollRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    for (const cat of [...EMOJI_CATEGORIES].reverse()) {
      const el = container.querySelector<HTMLElement>(`[data-cat="${cat.id}"]`);
      if (el && el.offsetTop <= scrollTop + 8) {
        setActiveCatId(cat.id);
        break;
      }
    }
  }

  // ── Link ──────────────────────────────────────────────────────────────────
  function openLinkDialog() {
    const q = quillRef.current;
    if (!q) return;
    saveRange();
    const sr  = savedRangeRef.current!;
    const fmt = q.getFormat(sr.index, sr.length);
    setLinkUrl((fmt.link as string) ?? '');
    setLinkText(
      sr.length > 0 ? q.getText(sr.index, sr.length).replace(/\n$/, '') : '',
    );
    setLinkOpenNewTab(true);
    if (!showLinkDialog) {
      setLinkPickerLeft(computePickerLeft(linkBtnRef.current, toolbarWrapRef.current, 370));
    }
    setShowLinkDialog(v => !v);
    if (showEmojiPicker) setShowEmojiPicker(false);
    if (!showLinkDialog) {
      // Will be opened — focus first input after render
      requestAnimationFrame(() => {
        linkPopoverRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      });
    }
  }

  function submitLink() {
    const q  = quillRef.current;
    const sr = savedRangeRef.current;
    if (!q || !sr) return;

    if (linkUrl) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      if (sr.length > 0) {
        q.setSelection(sr.index, sr.length);
        q.format('link', url);
      } else {
        const text = linkText.trim() || url;
        q.insertText(sr.index, text, 'link', url, 'user');
        q.setSelection(sr.index + text.length, 0);
      }
      if (linkOpenNewTab) {
        requestAnimationFrame(() => {
          q.root.querySelectorAll(`a[href="${url}"]`).forEach((el: Element) => {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          });
        });
      }
    } else {
      q.setSelection(sr.index, sr.length);
      q.format('link', false);
    }
    setShowLinkDialog(false);
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  function openImagePicker() {
    const q = quillRef.current;
    if (!q) return;
    saveRange();
    imageFileRef.current?.click();
  }

  function onImageSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !quillRef.current) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const range  = savedRangeRef.current ?? { index: quillRef.current!.getLength() - 1, length: 0 };
      quillRef.current!.insertEmbed(range.index, 'image', base64, 'user');
      quillRef.current!.setSelection(range.index + 1, 0);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  // ── Attach ────────────────────────────────────────────────────────────────
  function openFilePicker() {
    saveRange();
    attachFileRef.current?.click();
  }

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const q = quillRef.current;
        if (!q) return;
        const range = savedRangeRef.current ?? { index: q.getLength() - 1, length: 0 };
        q.insertEmbed(range.index, 'image', base64, 'user');
        q.setSelection(range.index + 1, 0);
      };
      reader.readAsDataURL(file);
    } else {
      const entry: AttachmentEntry = { id: `${Date.now()}-${Math.random()}`, file };
      setAttachments(prev => {
        const next = [...prev, entry];
        onAttachmentsChangeRef.current?.(next.map(a => a.file));
        return next;
      });
      onAttach?.(file);
    }

    event.target.value = '';
  }

  function removeAttachment(id: string) {
    setAttachments(prev => {
      const next = prev.filter(a => a.id !== id);
      onAttachmentsChangeRef.current?.(next.map(a => a.file));
      return next;
    });
  }

  // ── Focus the Quill editor when the box is clicked ────────────────────────
  function onBoxClick() {
    editorDivRef.current?.querySelector<HTMLElement>('.ql-editor')?.focus();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={wrapperClass}
      aria-invalid={hasError || undefined}
      aria-required={resolvedRequired || undefined}
    >

      {/* ── Content box ───────────────────────────────────────────────────── */}
      <div className="bt-input-rich-editor__box" onClick={onBoxClick}>

        {/* Header: label + clear button */}
        <div className="bt-input-rich-editor__header">
          {label && (
            <label className="bt-input-rich-editor__label">
              {label}
              {required && (
                <span className="bt-input-rich-editor__required">*</span>
              )}
            </label>
          )}
          {showClear && (
            <button
              type="button"
              className="bt-input-rich-editor__clear"
              aria-label="Clear content"
              onPointerDown={e => { e.preventDefault(); e.stopPropagation(); clearContent(); }}
            >
              <RichEditorIcon src={iconCancel} />
            </button>
          )}
        </div>

        {/* Disabled: render HTML statically (Quill not initialized) */}
        {disabled && hasContent ? (
          <div
            className="bt-input-rich-editor__editor bt-input-rich-editor__editor--static"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: resolvedValue ?? '' }}
          />
        ) : (
          /* Live Quill mount point */
          <div ref={editorDivRef} className="bt-input-rich-editor__editor" />
        )}

        {/* Attachment cards (non-image files) */}
        {attachments.length > 0 && (
          <div
            className="bt-input-rich-editor__attachments"
            onClick={e => e.stopPropagation()}
          >
            {attachments.map(att => (
              <div key={att.id} className="bt-input-rich-editor__attachment">
                <div className="bt-input-rich-editor__attachment-icon" aria-hidden>
                  <RichEditorIcon src={iconDescription} size={24} />
                </div>
                <div className="bt-input-rich-editor__attachment-info">
                  <span className="bt-input-rich-editor__attachment-name" title={att.file.name}>
                    {att.file.name}
                  </span>
                  <span className="bt-input-rich-editor__attachment-meta">
                    {formatFileSize(att.file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  className="bt-input-rich-editor__attachment-remove"
                  aria-label={`Remove ${att.file.name}`}
                  onClick={e => { e.stopPropagation(); removeAttachment(att.id); }}
                >
                  <RichEditorIcon src={iconClose} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar (hidden when disabled) ──────────────────────────────── */}
      {!disabled && (
        <div ref={toolbarWrapRef} className="bt-input-rich-editor__toolbar-wrap">

          <div
            className="bt-input-rich-editor__toolbar"
            role="toolbar"
            aria-label={label ? `${label} toolbar` : 'Rich text toolbar'}
          >
            {/* Scrollable icon groups */}
            <div className="bt-input-rich-editor__toolbar-main">

              {/* ── Group 1: History — Big only ─────────────────────── */}
              {isBig && (<>
                <button type="button" className="bt-input-rich-editor__tool" title="Undo"
                  onMouseDown={e => { e.preventDefault(); quillRef.current?.getModule('history')?.undo(); }}>
                  <RichEditorIcon src={iconUndo} alt="Undo" />
                </button>
                <button type="button" className="bt-input-rich-editor__tool" title="Redo"
                  onMouseDown={e => { e.preventDefault(); quillRef.current?.getModule('history')?.redo(); }}>
                  <RichEditorIcon src={iconRedo} alt="Redo" />
                </button>
                <div className="bt-input-rich-editor__separator" aria-hidden />
              </>)}

              {/* ── Group 2: Text formatting ────────────────────────── */}
              <button type="button"
                className={cn('bt-input-rich-editor__tool', isActive('bold') && 'bt-input-rich-editor__tool--active')}
                title="Bold"
                onMouseDown={e => { e.preventDefault(); toggle('bold'); }}>
                <RichEditorIcon src={iconBold} alt="Bold" />
              </button>
              <button type="button"
                className={cn('bt-input-rich-editor__tool', isActive('italic') && 'bt-input-rich-editor__tool--active')}
                title="Italic"
                onMouseDown={e => { e.preventDefault(); toggle('italic'); }}>
                <RichEditorIcon src={iconItalic} alt="Italic" />
              </button>
              {/* Small only: separator after Italic, before Underline */}
              {!isBig && <div className="bt-input-rich-editor__separator" aria-hidden />}
              <button type="button"
                className={cn('bt-input-rich-editor__tool', isActive('underline') && 'bt-input-rich-editor__tool--active')}
                title="Underline"
                onMouseDown={e => { e.preventDefault(); toggle('underline'); }}>
                <RichEditorIcon src={iconUnderline} alt="Underline" />
              </button>
              {/* Big only: separator after Underline, before A+ */}
              {isBig && <div className="bt-input-rich-editor__separator" aria-hidden />}

              {/* ── Group 3: Font size ──────────────────────────────── */}
              <button type="button" className="bt-input-rich-editor__tool" title="Increase text size"
                onMouseDown={e => { e.preventDefault(); increaseSize(); }}>
                <RichEditorIcon src={iconTextIncrease} alt="Increase text size" />
              </button>
              <button type="button" className="bt-input-rich-editor__tool" title="Decrease text size"
                onMouseDown={e => { e.preventDefault(); decreaseSize(); }}>
                <RichEditorIcon src={iconTextDecrease} alt="Decrease text size" />
              </button>
              <div className="bt-input-rich-editor__separator" aria-hidden />

              {/* ── Group 4: Color ──────────────────────────────────── */}
              <button ref={colorBtnRef} type="button"
                className={cn('bt-input-rich-editor__tool', showColorPicker && 'bt-input-rich-editor__tool--active')}
                title="Text color"
                onMouseDown={e => { e.preventDefault(); openColorPicker(); }}>
                <RichEditorIcon src={iconTextColor} alt="Text color" />
              </button>
              <button ref={highlightBtnRef} type="button"
                className={cn('bt-input-rich-editor__tool', showHighlightPicker && 'bt-input-rich-editor__tool--active')}
                title="Highlight color"
                onMouseDown={e => { e.preventDefault(); openHighlightPicker(); }}>
                <RichEditorIcon src={iconHighlight} alt="Highlight color" />
              </button>
              <div className="bt-input-rich-editor__separator" aria-hidden />

              {/* ── Group 5: Lists ──────────────────────────────────── */}
              <button type="button"
                className={cn('bt-input-rich-editor__tool', isActive('list', 'bullet') && 'bt-input-rich-editor__tool--active')}
                title="Bullet list"
                onMouseDown={e => { e.preventDefault(); toggle('list', 'bullet'); }}>
                <RichEditorIcon src={iconListBullet} alt="Bullet list" />
              </button>
              <button type="button"
                className={cn('bt-input-rich-editor__tool', isActive('list', 'ordered') && 'bt-input-rich-editor__tool--active')}
                title="Numbered list"
                onMouseDown={e => { e.preventDefault(); toggle('list', 'ordered'); }}>
                <RichEditorIcon src={iconListNumber} alt="Numbered list" />
              </button>
              <div className="bt-input-rich-editor__separator" aria-hidden />

              {/* ── Group 6: Alignment — Big only ───────────────────── */}
              {isBig && (<>
                <button type="button"
                  className={cn('bt-input-rich-editor__tool',
                    isActive('align', 'left') && 'bt-input-rich-editor__tool--active')}
                  title="Align left"
                  onMouseDown={e => { e.preventDefault(); setAlign('left'); }}>
                  <RichEditorIcon src={iconAlignLeft} alt="Align left" />
                </button>
                <button type="button"
                  className={cn('bt-input-rich-editor__tool', isActive('align', 'center') && 'bt-input-rich-editor__tool--active')}
                  title="Align center"
                  onMouseDown={e => { e.preventDefault(); setAlign('center'); }}>
                  <RichEditorIcon src={iconAlignCenter} alt="Align center" />
                </button>
                <button type="button"
                  className={cn('bt-input-rich-editor__tool', isActive('align', 'right') && 'bt-input-rich-editor__tool--active')}
                  title="Align right"
                  onMouseDown={e => { e.preventDefault(); setAlign('right'); }}>
                  <RichEditorIcon src={iconAlignRight} alt="Align right" />
                </button>
                <div className="bt-input-rich-editor__separator" aria-hidden />
              </>)}

              {/* ── Group 7: Insert ─────────────────────────────────── */}
              <button ref={emojiBtnRef} type="button"
                className={cn('bt-input-rich-editor__tool', showEmojiPicker && 'bt-input-rich-editor__tool--active')}
                title="Emoji"
                onMouseDown={e => { e.preventDefault(); openEmojiPicker(); }}>
                <RichEditorIcon src={iconEmoji} alt="Emoji" />
              </button>
              <button ref={linkBtnRef} type="button"
                className={cn('bt-input-rich-editor__tool', showLinkDialog && 'bt-input-rich-editor__tool--active')}
                title="Insert link"
                onMouseDown={e => { e.preventDefault(); openLinkDialog(); }}>
                <RichEditorIcon src={iconLink} alt="Insert link" />
              </button>
              <button type="button" className="bt-input-rich-editor__tool" title="Insert image"
                onMouseDown={e => { e.preventDefault(); openImagePicker(); }}>
                <RichEditorIcon src={iconImage} alt="Insert image" />
              </button>
              <button type="button" className="bt-input-rich-editor__tool" title="Attach file"
                onMouseDown={e => { e.preventDefault(); openFilePicker(); }}>
                <RichEditorIcon src={iconAttach} alt="Attach file" />
              </button>

            </div>{/* end toolbar-main */}

            {/* ── Pinned end: delete — Big only ─────────────────────── */}
            {isBig && (
              <div className="bt-input-rich-editor__toolbar-end">
                <div className="bt-input-rich-editor__separator" aria-hidden />
                <button type="button" className="bt-input-rich-editor__tool" title="Clear all"
                  onMouseDown={e => { e.preventDefault(); clearContent(); }}>
                  <RichEditorIcon src={iconDelete} alt="Clear all" />
                </button>
              </div>
            )}
          </div>{/* end toolbar */}

          {/* ── Text color picker ──────────────────────────────────── */}
          {showColorPicker && (
            <div
              className="bt-input-rich-editor__color-picker"
              style={{ left: colorPickerLeft }}
              role="dialog"
              aria-label="Text color"
            >
              <p className="bt-input-rich-editor__color-picker-label">Text color</p>
              <button type="button" className="bt-input-rich-editor__color-none"
                onMouseDown={e => { e.preventDefault(); applyTextColor(null); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
                  fill="none" stroke="var(--icon-secondary)" strokeWidth="2" aria-hidden>
                  <line x1="4" y1="4" x2="20" y2="20"/>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span>Remove color</span>
              </button>
              <div className="bt-input-rich-editor__color-grid">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={cn('bt-input-rich-editor__color-swatch',
                      (activeFormats.color as string) === color && 'bt-input-rich-editor__color-swatch--active')}
                    style={{ background: color }}
                    title={color}
                    onMouseDown={e => { e.preventDefault(); applyTextColor(color); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Highlight (background) color picker ────────────────── */}
          {showHighlightPicker && (
            <div
              className="bt-input-rich-editor__color-picker"
              style={{ left: highlightPickerLeft }}
              role="dialog"
              aria-label="Highlight color"
            >
              <p className="bt-input-rich-editor__color-picker-label">Highlight color</p>
              <button type="button" className="bt-input-rich-editor__color-none"
                onMouseDown={e => { e.preventDefault(); applyHighlightColor(null); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
                  fill="none" stroke="var(--icon-secondary)" strokeWidth="2" aria-hidden>
                  <line x1="4" y1="4" x2="20" y2="20"/>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span>Remove color</span>
              </button>
              <div className="bt-input-rich-editor__color-grid">
                {COLOR_PALETTE.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={cn('bt-input-rich-editor__color-swatch',
                      (activeFormats.background as string) === color && 'bt-input-rich-editor__color-swatch--active')}
                    style={{ background: color }}
                    title={color}
                    onMouseDown={e => { e.preventDefault(); applyHighlightColor(color); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Emoji picker ────────────────────────────────────────── */}
          {showEmojiPicker && (
            <div
              className="bt-input-rich-editor__emoji-picker"
              style={{ left: emojiPickerLeft }}
              role="dialog"
              aria-label="Emoji picker"
            >
              {/* Search */}
              <div className="bt-input-rich-editor__emoji-search-wrap">
                <input
                  type="text"
                  className="bt-input-rich-editor__emoji-search"
                  placeholder="Search"
                  autoComplete="off"
                  value={emojiSearch}
                  onChange={e => setEmojiSearch(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                  className="bt-input-rich-editor__emoji-search-icon" aria-hidden>
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>

              {/* Category tabs */}
              <div className="bt-input-rich-editor__emoji-cats" role="tablist">
                {EMOJI_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    className={cn('bt-input-rich-editor__emoji-cat',
                      activeCatId === cat.id && !emojiSearch && 'bt-input-rich-editor__emoji-cat--active')}
                    title={cat.name}
                    onMouseDown={e => { e.preventDefault(); scrollToCategory(cat.id); setEmojiSearch(''); }}
                  >{cat.icon}</button>
                ))}
              </div>

              {/* Scrollable emoji grid */}
              <div
                ref={emojiScrollRef}
                className="bt-input-rich-editor__emoji-scroll"
                onScroll={onEmojiScroll}
              >
                {emojiSearch ? (
                  searchResults.length > 0 ? (
                    <div className="bt-input-rich-editor__emoji-grid">
                      {searchResults.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className="bt-input-rich-editor__emoji-btn"
                          aria-label={emoji}
                          onMouseDown={e => { e.preventDefault(); insertEmoji(emoji); }}
                        >{emoji}</button>
                      ))}
                    </div>
                  ) : (
                    <p className="bt-input-rich-editor__emoji-empty">No results</p>
                  )
                ) : (
                  EMOJI_CATEGORIES.map(cat => (
                    <div
                      key={cat.id}
                      data-cat={cat.id}
                      className="bt-input-rich-editor__emoji-section"
                    >
                      <div className="bt-input-rich-editor__emoji-cat-label">{cat.name}</div>
                      <div className="bt-input-rich-editor__emoji-grid">
                        {cat.emojis.map(([emoji]) => (
                          <button
                            key={emoji}
                            type="button"
                            className="bt-input-rich-editor__emoji-btn"
                            aria-label={emoji}
                            onMouseDown={e => { e.preventDefault(); insertEmoji(emoji); }}
                          >{emoji}</button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Link popover ────────────────────────────────────────── */}
          {showLinkDialog && (
            <div
              ref={linkPopoverRef}
              className="bt-input-rich-editor__link-popover"
              style={{ left: linkPickerLeft }}
            >
              {/* URL field */}
              <div className="bt-input-rich-editor__link-field">
                <label className="bt-input-rich-editor__link-label">URL</label>
                <div className="bt-input-rich-editor__link-input-wrap">
                  <input
                    type="url"
                    className="bt-input-rich-editor__link-input"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); submitLink(); }
                      if (e.key === 'Escape') { e.preventDefault(); setShowLinkDialog(false); }
                    }}
                    placeholder="https://"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                    className="bt-input-rich-editor__link-suffix-icon" aria-hidden>
                    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                </div>
              </div>

              {/* Text field */}
              <div className="bt-input-rich-editor__link-field">
                <label className="bt-input-rich-editor__link-label">Text</label>
                <input
                  type="text"
                  className="bt-input-rich-editor__link-input"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); submitLink(); }
                    if (e.key === 'Escape') { e.preventDefault(); setShowLinkDialog(false); }
                  }}
                />
              </div>

              {/* Open in new tab */}
              <BTCheckbox
                checked={linkOpenNewTab}
                label="Open in new tab"
                onChange={setLinkOpenNewTab}
              />

              {/* Actions */}
              <div className="bt-input-rich-editor__link-actions">
                <BTButton
                  variant="secondary-white"
                  size="small"
                  label="Cancel"
                  onMouseDown={e => { e.preventDefault(); setShowLinkDialog(false); }}
                />
                <BTButton
                  variant="primary"
                  size="small"
                  label="Insert"
                  onMouseDown={e => { e.preventDefault(); submitLink(); }}
                />
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
          <input ref={imageFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageSelected} />
          <input ref={attachFileRef} type="file" style={{ display: 'none' }} onChange={onFileSelected} />

        </div>
      )}

      {hasError ? (
        <div className="bt-input-rich-editor__footer">
          <span className="bt-input-rich-editor__footer-error" role="alert">{activeError}</span>
          <span className="bt-input-rich-editor__footer-count bt-input-rich-editor__footer-count--error">
            {formatCount(charCount)}/{formatCount(maxLength)}
          </span>
        </div>
      ) : helperText && !disabled ? (
        <div className="bt-input-rich-editor__helper">{helperText}</div>
      ) : (
        <div className="bt-input-rich-editor__footer">
          <span className="bt-input-rich-editor__footer-count">
            {formatCount(charCount)}/{formatCount(maxLength)}
          </span>
        </div>
      )}

    </div>
  );
});

BTInputRichEditor.displayName = 'BTInputRichEditor';
