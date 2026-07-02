<!--
  BTInputRichEditor — rich text editor with floating label and toolbar.

  Powered by Quill (https://quilljs.com). Outputs HTML via v-model.

  Figma node 665-2254.

  ── Basic usage
    BTInputRichEditor label="Description" v-model="html"

  ── With attachments (v-model:attachments keeps File[] in sync)
    BTInputRichEditor v-model="html" v-model:attachments="files"
    @attach fires once per file — use for per-file upload progress.

  ── Imperative submit (recommended for "Send" buttons)
    const editorRef = ref();
    function onSend() {
      const { html, attachments } = editorRef.value.getContent();
      await sendMessage(html, attachments);
      editorRef.value.clearContent();
    }
    BTInputRichEditor ref="editorRef" label="Message" v-model="html"

  ── With validation
    BTInputRichEditor label="Notes" v-model="html" :maxLength="500" required
                      :validator="v => v ? null : 'Required'" ref="editorRef"
-->
<script setup lang="ts">
import '@/components/ui/input/RichEditor/BTInputRichEditor.css';
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick, getCurrentInstance } from 'vue';
import type { BTInputRichEditorProps, BTInputRichEditorToolbar, BTInputRichEditorContent } from '@/components/ui/input/RichEditor/BTInputRichEditor.types';
import BTInput from '@/components/ui/input/BTInput.vue';
import BTCheckbox from '@/components/ui/checkbox/BTCheckbox.vue';
import BTButton from '@/components/ui/button/BTButton.vue';
import { EMOJI_CATEGORIES } from '@/components/ui/input/RichEditor/BTInputRichEditor.emoji-data';
import RichEditorIcon from '@/components/ui/input/RichEditor/internal/RichEditorIcon.vue';

// ── Toolbar icon imports (data URIs — no filesystem URL dependency) ─────────
import {
  undo              as iconUndo,
  redo              as iconRedo,
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

// ── Props & emits ─────────────────────────────────────────────────────────
// NOTE: toolbar is inlined here (not via BTInputRichEditorProps) because the
// Vue SFC compiler cannot always resolve external union-type aliases at build
// time — inlining guarantees it lands in the runtime props object.
const props = withDefaults(defineProps<{
  modelValue?:  string;
  label?:       string;
  placeholder?: string;
  required?:    boolean;
  disabled?:    boolean;
  errorText?:   string;
  helperText?:  string;
  maxLength?:   number;
  /** 'big' = full toolbar with undo/redo, alignment, delete. 'small' = compact. */
  toolbar?:     'big' | 'small';
  validator?:   (value: string) => string | null;
  /** Field name — used by BTForm coordinator to register the value. */
  name?:        string;
}>(), {
  modelValue:  '',
  label:       undefined,
  placeholder: undefined,
  required:    false,
  disabled:    false,
  errorText:   undefined,
  helperText:  undefined,
  maxLength:   2000,
  toolbar:     'big',
  validator:   undefined,
  name:        undefined,
});

const emit = defineEmits<{
  /** Emitted on every Quill text-change. Drives v-model. */
  'update:modelValue': [value: string];
  /**
   * Emitted whenever the attachment list changes (add or remove).
   * Drives v-model:attachments — always reflects the full current list.
   */
  'update:attachments': [files: File[]];
  /**
   * Emitted once per file immediately when the user picks it.
   * Use this for per-file upload progress tracking.
   * For the full list, use v-model:attachments or getContent().
   */
  'attach': [file: File];
}>();

// ── Refs ──────────────────────────────────────────────────────────────────
const editorRef = ref<HTMLDivElement | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let quill: any = null;

const isFocused     = ref(false);
const charCount     = ref(0);
const activeFormats = ref<Record<string, unknown>>({});
const errorInternal = ref<string | null>(null);

// ── Toolbar anchor refs (for picker positioning) ──────────────────────────
const toolbarWrapRef      = ref<HTMLDivElement | null>(null);
const emojiBtnRef         = ref<HTMLButtonElement | null>(null);
const linkBtnRef          = ref<HTMLButtonElement | null>(null);
const colorBtnRef         = ref<HTMLButtonElement | null>(null);
const highlightBtnRef     = ref<HTMLButtonElement | null>(null);
const emojiPickerLeft     = ref(0);
const linkPickerLeft      = ref(0);
const colorPickerLeft     = ref(0);
const highlightPickerLeft = ref(0);

// ── Color palette (8 cols × 4 rows) ──────────────────────────────────────
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

// ── Color picker state ────────────────────────────────────────────────────
const showColorPicker     = ref(false);
const showHighlightPicker = ref(false);

/** Returns the clamped left offset (px) so the picker aligns under its button
 *  without overflowing the right edge of the toolbar-wrap. */
function computePickerLeft(btnEl: HTMLElement | null, wrapEl: HTMLElement | null, pickerWidth: number): number {
  if (!btnEl || !wrapEl) return 0;
  const btnRect  = btnEl.getBoundingClientRect();
  const wrapRect = wrapEl.getBoundingClientRect();
  const ideal    = btnRect.left - wrapRect.left;
  return Math.max(0, Math.min(ideal, wrapRect.width - pickerWidth));
}

// ── Emoji picker ──────────────────────────────────────────────────────────
const showEmojiPicker  = ref(false);
const emojiSearch      = ref('');
const activeCatId      = ref(EMOJI_CATEGORIES[0]?.id ?? 'smileys');
const emojiScrollRef   = ref<HTMLDivElement | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let savedRange: any = null;

/** Emojis matching the search query across all categories (flat list) */
const searchResults = computed<string[]>(() => {
  const q = emojiSearch.value.trim().toLowerCase();
  if (!q) return [];
  return EMOJI_CATEGORIES.flatMap(cat =>
    cat.emojis
      .filter(([, kw]) => kw.includes(q))
      .map(([e]) => e),
  );
});

function scrollToCategory(id: string) {
  activeCatId.value = id;
  const container = emojiScrollRef.value;
  const section   = container?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
  if (container && section) {
    // Set scrollTop directly on the container — avoids scrollIntoView() which
    // bubbles up and scrolls the whole page as well.
    container.scrollTop = section.offsetTop;
  }
}

function onEmojiScroll() {
  if (!emojiScrollRef.value) return;
  const scrollTop = emojiScrollRef.value.scrollTop;
  // Find which section is currently in view
  for (const cat of [...EMOJI_CATEGORIES].reverse()) {
    const el = emojiScrollRef.value.querySelector<HTMLElement>(`[data-cat="${cat.id}"]`);
    if (el && el.offsetTop <= scrollTop + 8) {
      activeCatId.value = cat.id;
      break;
    }
  }
}

// ── Link popover ───────────────────────────────────────────────────────────
const showLinkDialog    = ref(false);
const linkUrlValue      = ref('');
const linkTextValue     = ref('');
const linkOpenNewTab    = ref(true);
const linkPopoverRef    = ref<HTMLDivElement | null>(null);

// ── File inputs ────────────────────────────────────────────────────────────
const imageFileInput  = ref<HTMLInputElement | null>(null);
const attachFileInput = ref<HTMLInputElement | null>(null);

// ── Attachments (non-image file cards) ───────────────────────────────────
interface AttachmentItem { id: string; file: File }
const attachments = ref<AttachmentItem[]>([]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function removeAttachment(id: string) {
  attachments.value = attachments.value.filter(a => a.id !== id);
  emit('update:attachments', attachments.value.map(a => a.file));
}

const _uid = getCurrentInstance()?.uid;
const fieldId = computed(() => `bt-input-rich-editor-${_uid}`);

// ── BTForm wiring (direct coordinator) ───────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formError    = computed(() => isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null);

// ── Derived ───────────────────────────────────────────────────────────────
const hasContent  = computed(() => (props.modelValue ?? '').length > 0 || charCount.value > 0);
const activeError = computed(() => props.errorText ?? formError.value ?? errorInternal.value ?? null);
const hasError    = computed(() => !!activeError.value && !props.disabled);
const resolvedRequired = computed(() => props.required);
const showClear   = computed(() => isFocused.value && hasContent.value && !props.disabled);

const wrapperClass = computed(() => ({
  'bt-input-rich-editor':            true,
  'bt-input-rich-editor--active':    isFocused.value && !props.disabled,
  'bt-input-rich-editor--filled':    hasContent.value && !isFocused.value,
  'bt-input-rich-editor--error':     hasError.value,
  'bt-input-rich-editor--disabled':  props.disabled,
}));

// toolbar variant helpers
const isBig = computed(() => props.toolbar !== 'small');

// ── Char count ────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  return n.toLocaleString('id-ID');
}

function updateCharCount() {
  if (!quill) return;
  // Quill appends a trailing '\n' — subtract it
  charCount.value = quill.getText().replace(/\n$/, '').length;
}

// ── Font size steps ────────────────────────────────────────────────────────
const SIZES = [10, 12, 14, 16, 18, 20, 24];

function getCurrentSize(): number {
  const fmt = quill?.getFormat() ?? {};
  const s = fmt.size as string | undefined;
  return s ? parseInt(s, 10) : 14;
}

function increaseSize() {
  if (!quill) return;
  const cur  = getCurrentSize();
  const next = SIZES.find(s => s > cur) ?? SIZES[SIZES.length - 1];
  quill.format('size', `${next}px`);
}

function decreaseSize() {
  if (!quill) return;
  const cur  = getCurrentSize();
  const prev = [...SIZES].reverse().find(s => s < cur) ?? SIZES[0];
  quill.format('size', `${prev}px`);
}

// ── Toolbar actions ────────────────────────────────────────────────────────
function toggle(format: string, value: unknown = true) {
  if (!quill) return;
  const current = quill.getFormat()[format];
  // If the exact value is active → turn off; otherwise apply (handles list type switching)
  quill.format(format, current === value ? false : value);
  activeFormats.value = quill.getFormat();
}

function setAlign(align: string) {
  if (!quill) return;
  quill.format('align', align || false);
  activeFormats.value = quill.getFormat();
}

function clearContent() {
  if (!quill) return;
  quill.setContents([]);
  emit('update:modelValue', '');
  charCount.value = 0;
  attachments.value = [];
  emit('update:attachments', []);
}

/**
 * Returns a snapshot of the full editor content.
 * Call this on submit — e.g. inside a "Send" button handler.
 *
 * ```ts
 * const { html, attachments } = editorRef.value!.getContent();
 * await api.sendMessage(html, attachments);
 * editorRef.value!.clearContent();
 * ```
 */
function getContent(): BTInputRichEditorContent {
  return {
    html:        props.modelValue ?? '',
    attachments: attachments.value.map(a => a.file),
  };
}

// ── is-active helper ──────────────────────────────────────────────────────
function isActive(format: string, value?: unknown): boolean {
  const v = activeFormats.value[format];
  if (value === undefined) return !!v;
  return v === value;
}

// ── Save / restore selection (buttons blur the editor) ────────────────────
function saveRange() {
  if (!quill) return;
  savedRange = quill.getSelection() ?? { index: quill.getLength() - 1, length: 0 };
}

// ── Outside-click handler (replaces full-screen overlay) ─────────────────
function onDocumentMousedown(e: MouseEvent) {
  if (!showEmojiPicker.value && !showLinkDialog.value &&
      !showColorPicker.value && !showHighlightPicker.value) return;
  if (toolbarWrapRef.value && !toolbarWrapRef.value.contains(e.target as Node)) {
    closePopovers();
  }
}

// ── Text Color picker ─────────────────────────────────────────────────────
function openColorPicker() {
  if (!quill) return;
  saveRange();
  if (!showColorPicker.value) {
    colorPickerLeft.value = computePickerLeft(colorBtnRef.value, toolbarWrapRef.value, 220);
  }
  showColorPicker.value     = !showColorPicker.value;
  showHighlightPicker.value = false;
  showEmojiPicker.value     = false;
  showLinkDialog.value      = false;
}

function applyTextColor(hex: string | null) {
  if (!quill) return;
  if (savedRange) quill.setSelection(savedRange.index, savedRange.length);
  quill.format('color', hex ?? false);
  activeFormats.value       = quill.getFormat();
  showColorPicker.value     = false;
}

// ── Highlight (background) color picker ───────────────────────────────────
function openHighlightPicker() {
  if (!quill) return;
  saveRange();
  if (!showHighlightPicker.value) {
    highlightPickerLeft.value = computePickerLeft(highlightBtnRef.value, toolbarWrapRef.value, 220);
  }
  showHighlightPicker.value = !showHighlightPicker.value;
  showColorPicker.value     = false;
  showEmojiPicker.value     = false;
  showLinkDialog.value      = false;
}

function applyHighlightColor(hex: string | null) {
  if (!quill) return;
  if (savedRange) quill.setSelection(savedRange.index, savedRange.length);
  quill.format('background', hex ?? false);
  activeFormats.value       = quill.getFormat();
  showHighlightPicker.value = false;
}

// ── Emoji ─────────────────────────────────────────────────────────────────
function openEmojiPicker() {
  if (!quill) return;
  saveRange();
  if (!showEmojiPicker.value) {
    emojiPickerLeft.value = computePickerLeft(emojiBtnRef.value, toolbarWrapRef.value, 320);
    emojiSearch.value  = '';
    activeCatId.value  = EMOJI_CATEGORIES[0]?.id ?? 'smileys';
  }
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showLinkDialog.value) showLinkDialog.value = false;
}

function insertEmoji(emoji: string) {
  if (!quill) return;
  const range = savedRange ?? { index: quill.getLength() - 1, length: 0 };
  quill.insertText(range.index, emoji, 'user');
  quill.setSelection(range.index + [...emoji].length, 0);
  showEmojiPicker.value = false;
}

function closePopovers() {
  showEmojiPicker.value     = false;
  showLinkDialog.value      = false;
  showColorPicker.value     = false;
  showHighlightPicker.value = false;
}

// ── Link ──────────────────────────────────────────────────────────────────
function openLinkDialog() {
  if (!quill) return;
  saveRange();
  const fmt = quill.getFormat(savedRange.index, savedRange.length);
  linkUrlValue.value = (fmt.link as string) ?? '';
  // Pre-fill text from selected range (strip trailing newline Quill appends)
  linkTextValue.value = savedRange.length > 0
    ? quill.getText(savedRange.index, savedRange.length).replace(/\n$/, '')
    : '';
  linkOpenNewTab.value = true;
  if (!showLinkDialog.value) {
    linkPickerLeft.value = computePickerLeft(linkBtnRef.value, toolbarWrapRef.value, 370);
  }
  showLinkDialog.value = !showLinkDialog.value;
  if (showEmojiPicker.value) showEmojiPicker.value = false;
  if (showLinkDialog.value) {
    nextTick(() => linkPopoverRef.value?.querySelector<HTMLInputElement>('input')?.focus());
  }
}

function submitLink() {
  if (!quill || !savedRange) return;
  if (linkUrlValue.value) {
    const url = linkUrlValue.value.startsWith('http')
      ? linkUrlValue.value
      : `https://${linkUrlValue.value}`;
    if (savedRange.length > 0) {
      // Has selection: apply link format to existing text
      quill.setSelection(savedRange.index, savedRange.length);
      quill.format('link', url);
    } else {
      // No selection: insert text+link at cursor position
      const text = linkTextValue.value.trim() || url;
      quill.insertText(savedRange.index, text, 'link', url, 'user');
      quill.setSelection(savedRange.index + text.length, 0);
    }
    // Patch target="_blank" on all matching anchors (Quill has no native support)
    if (linkOpenNewTab.value) {
      nextTick(() => {
        quill.root.querySelectorAll(`a[href="${url}"]`).forEach((el: Element) => {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        });
      });
    }
  } else {
    // No URL → remove link
    quill.setSelection(savedRange.index, savedRange.length);
    quill.format('link', false);
  }
  showLinkDialog.value = false;
}

// ── Image ─────────────────────────────────────────────────────────────────
function openImagePicker() {
  if (!quill) return;
  saveRange();
  imageFileInput.value?.click();
}

function onImageSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !quill) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;
    const range = savedRange ?? { index: quill.getLength() - 1, length: 0 };
    quill.insertEmbed(range.index, 'image', base64, 'user');
    quill.setSelection(range.index + 1, 0);
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = '';
}

// ── Attach ────────────────────────────────────────────────────────────────
function openFilePicker() {
  saveRange();
  attachFileInput.value?.click();
}

function onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (file.type.startsWith('image/')) {
    // Image files → insert inline into Quill (same as the image toolbar button)
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const range  = savedRange ?? { index: quill?.getLength() - 1, length: 0 };
      quill?.insertEmbed(range.index, 'image', base64, 'user');
      quill?.setSelection(range.index + 1, 0);
    };
    reader.readAsDataURL(file);
  } else {
    // Non-image files → show Teams-style attachment card + emit for parent to handle upload
    attachments.value.push({ id: `${Date.now()}-${Math.random()}`, file });
    emit('attach', file);
    emit('update:attachments', attachments.value.map(a => a.file));
  }

  (event.target as HTMLInputElement).value = '';
}

// ── Validation ────────────────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? '');
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({
  /**
   * Runs the `validator` prop and surfaces the error below the editor.
   * Returns `true` if valid (or no validator), `false` otherwise.
   */
  validate,
  /**
   * Returns the full editor content snapshot: `{ html, attachments }`.
   * The recommended way to collect data on form submit.
   */
  getContent,
  /**
   * Resets the editor: clears Quill content, attachment cards, and emits
   * `update:modelValue` + `update:attachments` with empty values.
   */
  clearContent,
});

// ── Quill init ────────────────────────────────────────────────────────────
onMounted(async () => {
  document.addEventListener('mousedown', onDocumentMousedown);
  if (!editorRef.value || props.disabled) return;

  const { default: Quill } = await import('quill');

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

  quill = new Quill(editorRef.value, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: false as any,
    placeholder: props.placeholder ?? '',
    modules: {
      history:  { delay: 1000, maxStack: 100, userOnly: true },
      keyboard: { bindings: {} },
    },
  });

  // Set initial content
  if (props.modelValue) {
    quill.clipboard.dangerouslyPasteHTML(props.modelValue);
    updateCharCount();
  }

  // text-change: emit new HTML
  quill.on('text-change', () => {
    updateCharCount();
    const html = quill.root.innerHTML;
    const value = html === '<p><br></p>' ? '' : html;
    emit('update:modelValue', value);
    if (isInForm.value && formSetField && props.name) formSetField(props.name, value);
  });

  // selection-change: track focus + active formats
  quill.on('selection-change', (range: unknown) => {
    const wasFocused = isFocused.value;
    isFocused.value = !!range;
    if (range) activeFormats.value = quill.getFormat(range);
    // blur (range → null): touch the form field
    if (wasFocused && !range && isInForm.value && formTouch && props.name) formTouch(props.name);
  });
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMousedown);
  quill = null;
});

// Sync external model changes (avoid feedback loop)
watch(() => props.modelValue, (newVal) => {
  if (!quill) return;
  const current = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML;
  if ((newVal ?? '') !== current) {
    quill.clipboard.dangerouslyPasteHTML(newVal ?? '');
    updateCharCount();
  }
});
</script>

<template>
  <div :class="wrapperClass">

    <!-- ── Content box ─────────────────────────────────────────────────── -->
    <div
      class="bt-input-rich-editor__box"
      @click="(editorRef?.querySelector('.ql-editor') as HTMLElement | null)?.focus()"
    >
      <!-- Header: floating label + clear button -->
      <div class="bt-input-rich-editor__header">
        <label v-if="label" class="bt-input-rich-editor__label">
          {{ label }}<span v-if="required" class="bt-input-rich-editor__required">*</span>
        </label>

        <Transition name="bt-input-clear">
          <button
            v-if="showClear"
            type="button"
            class="bt-input-rich-editor__clear"
            aria-label="Clear content"
            @pointerdown.prevent.stop="clearContent"
          >
            <RichEditorIcon :src="iconCancel" />
          </button>
        </Transition>
      </div>

      <!-- Disabled: render HTML statically (Quill not initialized) -->
      <div
        v-if="disabled && hasContent"
        :id="fieldId"
        class="bt-input-rich-editor__editor bt-input-rich-editor__editor--static"
        :aria-invalid="hasError || undefined"
        :aria-required="resolvedRequired || undefined"
        v-html="modelValue"
      />
      <!-- Live Quill mount point (not disabled) -->
      <div
        v-else
        ref="editorRef"
        :id="fieldId"
        class="bt-input-rich-editor__editor"
        :aria-invalid="hasError || undefined"
        :aria-required="resolvedRequired || undefined"
      />

      <!-- Attachment cards (non-image files) -->
      <div v-if="attachments.length" class="bt-input-rich-editor__attachments" @click.stop>
        <div
          v-for="att in attachments"
          :key="att.id"
          class="bt-input-rich-editor__attachment"
        >
          <!-- File icon -->
          <div class="bt-input-rich-editor__attachment-icon" aria-hidden="true">
            <RichEditorIcon :src="iconDescription" :size="24" />
          </div>
          <!-- File info -->
          <div class="bt-input-rich-editor__attachment-info">
            <span class="bt-input-rich-editor__attachment-name" :title="att.file.name">{{ att.file.name }}</span>
            <span class="bt-input-rich-editor__attachment-meta">{{ formatFileSize(att.file.size) }}</span>
          </div>
          <!-- Remove button -->
          <button
            type="button"
            class="bt-input-rich-editor__attachment-remove"
            :aria-label="`Remove ${att.file.name}`"
            @click.stop="removeAttachment(att.id)"
          >
            <RichEditorIcon :src="iconClose" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Toolbar (hidden when disabled) ─────────────────────────────── -->
    <div v-if="!disabled" ref="toolbarWrapRef" class="bt-input-rich-editor__toolbar-wrap">

      <div
        class="bt-input-rich-editor__toolbar"
        role="toolbar"
        :aria-label="label ? label + ' toolbar' : 'Rich text toolbar'"
      >
        <!-- Scrollable icon groups (all except delete) -->
        <div class="bt-input-rich-editor__toolbar-main">

          <!-- ── Group 1: History — Big only ──────────────────────────────── -->
          <template v-if="isBig">
            <button type="button" class="bt-input-rich-editor__tool" title="Undo"
              @mousedown.prevent="quill?.getModule('history')?.undo()">
              <RichEditorIcon :src="iconUndo" alt="Undo" />
            </button>
            <button type="button" class="bt-input-rich-editor__tool" title="Redo"
              @mousedown.prevent="quill?.getModule('history')?.redo()">
              <RichEditorIcon :src="iconRedo" alt="Redo" />
            </button>
            <div class="bt-input-rich-editor__separator" aria-hidden="true" />
          </template>

          <!-- ── Group 2: Text formatting ─────────────────────────────────── -->
          <!--
            Big:   Bold · Italic · Underline | sep | A+ · A- | sep | …
            Small: Bold · Italic | sep | Underline · A+ · A- | sep | …
            Both variants always have a separator immediately before A+/A-.
            The only difference is whether Underline sits before or after it.
          -->
          <button type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': isActive('bold') }"
            title="Bold" @mousedown.prevent="toggle('bold')">
            <RichEditorIcon :src="iconBold" alt="Bold" />
          </button>
          <button type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': isActive('italic') }"
            title="Italic" @mousedown.prevent="toggle('italic')">
            <RichEditorIcon :src="iconItalic" alt="Italic" />
          </button>
          <!-- Small only: separator comes here (after Italic, before Underline) -->
          <div v-if="!isBig" class="bt-input-rich-editor__separator" aria-hidden="true" />
          <button type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': isActive('underline') }"
            title="Underline" @mousedown.prevent="toggle('underline')">
            <RichEditorIcon :src="iconUnderline" alt="Underline" />
          </button>
          <!-- Big only: separator comes here (after Underline, before A+) -->
          <div v-if="isBig" class="bt-input-rich-editor__separator" aria-hidden="true" />

          <!-- ── Group 3: Font size ────────────────────────────────────────── -->
          <button type="button" class="bt-input-rich-editor__tool" title="Increase text size"
            @mousedown.prevent="increaseSize">
            <RichEditorIcon :src="iconTextIncrease" alt="Increase text size" />
          </button>
          <button type="button" class="bt-input-rich-editor__tool" title="Decrease text size"
            @mousedown.prevent="decreaseSize">
            <RichEditorIcon :src="iconTextDecrease" alt="Decrease text size" />
          </button>
          <!-- Separator after size group (both variants) -->
          <div class="bt-input-rich-editor__separator" aria-hidden="true" />

          <!-- ── Group 4: Color ────────────────────────────────────────────── -->
          <button ref="colorBtnRef" type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': showColorPicker }"
            title="Text color" @mousedown.prevent="openColorPicker">
            <RichEditorIcon :src="iconTextColor" alt="Text color" />
          </button>
          <button ref="highlightBtnRef" type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': showHighlightPicker }"
            title="Highlight color" @mousedown.prevent="openHighlightPicker">
            <RichEditorIcon :src="iconHighlight" alt="Highlight color" />
          </button>
          <div class="bt-input-rich-editor__separator" aria-hidden="true" />

          <!-- ── Group 5: Lists ────────────────────────────────────────────── -->
          <button type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': isActive('list', 'bullet') }"
            title="Bullet list" @mousedown.prevent="toggle('list', 'bullet')">
            <RichEditorIcon :src="iconListBullet" alt="Bullet list" />
          </button>
          <button type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': isActive('list', 'ordered') }"
            title="Numbered list" @mousedown.prevent="toggle('list', 'ordered')">
            <RichEditorIcon :src="iconListNumber" alt="Numbered list" />
          </button>
          <div class="bt-input-rich-editor__separator" aria-hidden="true" />

          <!-- ── Group 6: Alignment — Big only ─────────────────────────────── -->
          <template v-if="isBig">
            <button type="button" class="bt-input-rich-editor__tool"
              :class="{ 'bt-input-rich-editor__tool--active': isActive('align', 'left') }"
              title="Align left" @mousedown.prevent="setAlign('left')">
              <RichEditorIcon :src="iconAlignLeft" alt="Align left" />
            </button>
            <button type="button" class="bt-input-rich-editor__tool"
              :class="{ 'bt-input-rich-editor__tool--active': isActive('align', 'center') }"
              title="Align center" @mousedown.prevent="setAlign('center')">
              <RichEditorIcon :src="iconAlignCenter" alt="Align center" />
            </button>
            <button type="button" class="bt-input-rich-editor__tool"
              :class="{ 'bt-input-rich-editor__tool--active': isActive('align', 'right') }"
              title="Align right" @mousedown.prevent="setAlign('right')">
              <RichEditorIcon :src="iconAlignRight" alt="Align right" />
            </button>
            <div class="bt-input-rich-editor__separator" aria-hidden="true" />
          </template>

          <!-- ── Group 7: Insert (both variants) ──────────────────────────── -->
          <button ref="emojiBtnRef" type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': showEmojiPicker }"
            title="Emoji" @mousedown.prevent="openEmojiPicker">
            <RichEditorIcon :src="iconEmoji" alt="Emoji" />
          </button>
          <button ref="linkBtnRef" type="button" class="bt-input-rich-editor__tool"
            :class="{ 'bt-input-rich-editor__tool--active': showLinkDialog }"
            title="Insert link" @mousedown.prevent="openLinkDialog">
            <RichEditorIcon :src="iconLink" alt="Insert link" />
          </button>
          <button type="button" class="bt-input-rich-editor__tool" title="Insert image"
            @mousedown.prevent="openImagePicker">
            <RichEditorIcon :src="iconImage" alt="Insert image" />
          </button>
          <button type="button" class="bt-input-rich-editor__tool" title="Attach file"
            @mousedown.prevent="openFilePicker">
            <RichEditorIcon :src="iconAttach" alt="Attach file" />
          </button>
        </div>

        <!-- ── Pinned end: delete — Big only ──────────────────────────────── -->
        <div v-if="isBig" class="bt-input-rich-editor__toolbar-end">
          <div class="bt-input-rich-editor__separator" aria-hidden="true" />
          <button type="button" class="bt-input-rich-editor__tool" title="Clear all"
            @mousedown.prevent="clearContent">
            <RichEditorIcon :src="iconDelete" alt="Clear all" />
          </button>
        </div>
      </div>

      <!-- ── Text color picker ───────────────────────────────────────────── -->
      <div v-if="showColorPicker"
           class="bt-input-rich-editor__color-picker"
           :style="{ left: colorPickerLeft + 'px' }"
           role="dialog" aria-label="Text color">
        <p class="bt-input-rich-editor__color-picker-label">Text color</p>
        <button type="button" class="bt-input-rich-editor__color-none"
                @mousedown.prevent="applyTextColor(null)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="var(--icon-secondary)" stroke-width="2" aria-hidden="true">
            <line x1="4" y1="4" x2="20" y2="20"/>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          <span>Remove color</span>
        </button>
        <div class="bt-input-rich-editor__color-grid">
          <button
            v-for="color in COLOR_PALETTE"
            :key="color"
            type="button"
            class="bt-input-rich-editor__color-swatch"
            :class="{ 'bt-input-rich-editor__color-swatch--active': (activeFormats.color as string) === color }"
            :style="{ background: color }"
            :title="color"
            @mousedown.prevent="applyTextColor(color)"
          />
        </div>
      </div>

      <!-- ── Highlight (background) color picker ─────────────────────────── -->
      <div v-if="showHighlightPicker"
           class="bt-input-rich-editor__color-picker"
           :style="{ left: highlightPickerLeft + 'px' }"
           role="dialog" aria-label="Highlight color">
        <p class="bt-input-rich-editor__color-picker-label">Highlight color</p>
        <button type="button" class="bt-input-rich-editor__color-none"
                @mousedown.prevent="applyHighlightColor(null)">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="var(--icon-secondary)" stroke-width="2" aria-hidden="true">
            <line x1="4" y1="4" x2="20" y2="20"/>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          <span>Remove color</span>
        </button>
        <div class="bt-input-rich-editor__color-grid">
          <button
            v-for="color in COLOR_PALETTE"
            :key="color"
            type="button"
            class="bt-input-rich-editor__color-swatch"
            :class="{ 'bt-input-rich-editor__color-swatch--active': (activeFormats.background as string) === color }"
            :style="{ background: color }"
            :title="color"
            @mousedown.prevent="applyHighlightColor(color)"
          />
        </div>
      </div>

      <!-- ── Emoji picker ──────────────────────────────────────────────── -->
      <div v-if="showEmojiPicker" class="bt-input-rich-editor__emoji-picker"
           :style="{ left: emojiPickerLeft + 'px' }" role="dialog" aria-label="Emoji picker">

        <!-- Search -->
        <div class="bt-input-rich-editor__emoji-search-wrap">
          <input
            v-model="emojiSearch"
            type="text"
            class="bt-input-rich-editor__emoji-search"
            placeholder="Search"
            autocomplete="off"
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
               class="bt-input-rich-editor__emoji-search-icon" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>

        <!-- Category tabs -->
        <div class="bt-input-rich-editor__emoji-cats" role="tablist">
          <button
            v-for="cat in EMOJI_CATEGORIES"
            :key="cat.id"
            type="button"
            role="tab"
            class="bt-input-rich-editor__emoji-cat"
            :class="{ 'bt-input-rich-editor__emoji-cat--active': activeCatId === cat.id && !emojiSearch }"
            :title="cat.name"
            @mousedown.prevent="scrollToCategory(cat.id); emojiSearch = ''"
          >{{ cat.icon }}</button>
        </div>

        <!-- Scrollable emoji grid -->
        <div ref="emojiScrollRef" class="bt-input-rich-editor__emoji-scroll" @scroll.passive="onEmojiScroll">

          <!-- Search results (flat) -->
          <template v-if="emojiSearch">
            <div v-if="searchResults.length" class="bt-input-rich-editor__emoji-grid">
              <button
                v-for="emoji in searchResults" :key="emoji"
                type="button" class="bt-input-rich-editor__emoji-btn"
                :aria-label="emoji" @mousedown.prevent="insertEmoji(emoji)"
              >{{ emoji }}</button>
            </div>
            <p v-else class="bt-input-rich-editor__emoji-empty">No results</p>
          </template>

          <!-- Categorised view -->
          <template v-else>
            <div
              v-for="cat in EMOJI_CATEGORIES" :key="cat.id"
              :data-cat="cat.id"
              class="bt-input-rich-editor__emoji-section"
            >
              <div class="bt-input-rich-editor__emoji-cat-label">{{ cat.name }}</div>
              <div class="bt-input-rich-editor__emoji-grid">
                <button
                  v-for="[emoji] in cat.emojis" :key="emoji"
                  type="button" class="bt-input-rich-editor__emoji-btn"
                  :aria-label="emoji" @mousedown.prevent="insertEmoji(emoji)"
                >{{ emoji }}</button>
              </div>
            </div>
          </template>

        </div>
      </div>

      <!-- ── Link popover ──────────────────────────────────────────────── -->
      <div v-if="showLinkDialog" ref="linkPopoverRef" class="bt-input-rich-editor__link-popover"
           :style="{ left: linkPickerLeft + 'px' }">

        <!-- URL field — uses BTInput with suffix slot for the open_in_new icon -->
        <BTInput
          v-model="linkUrlValue"
          label="URL"
          type="url"
          @keydown.enter.prevent="submitLink"
          @keydown.escape.prevent="showLinkDialog = false"
        >
          <template #suffix>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                 class="bt-input-rich-editor__link-suffix-icon" aria-hidden="true">
              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </template>
        </BTInput>

        <!-- Text field -->
        <BTInput
          v-model="linkTextValue"
          label="Text"
          @keydown.enter.prevent="submitLink"
          @keydown.escape.prevent="showLinkDialog = false"
        />

        <!-- Open in new tab -->
        <BTCheckbox
          :model-value="linkOpenNewTab"
          label="Open in new tab"
          @update:model-value="linkOpenNewTab = $event"
        />

        <!-- Cancel / Insert actions -->
        <div class="bt-input-rich-editor__link-actions">
          <BTButton
            variant="secondary-white"
            size="small"
            label="Cancel"
            @mousedown.prevent="showLinkDialog = false"
          />
          <BTButton
            variant="primary"
            size="small"
            label="Insert"
            @mousedown.prevent="submitLink"
          />
        </div>

      </div>

      <!-- Hidden file inputs -->
      <input ref="imageFileInput" type="file" accept="image/*" style="display:none" @change="onImageSelected" />
      <input ref="attachFileInput" type="file" style="display:none" @change="onFileSelected" />
    </div>

    <!-- ── Footer ─────────────────────────────────────────────────────── -->
    <!-- Error state: left error message + right char count (suppress text when wrapped, keep counter) -->
    <div v-if="hasError" class="bt-input-rich-editor__footer">
      <span class="bt-input-rich-editor__footer-error">{{ activeError }}</span>
      <span class="bt-input-rich-editor__footer-count bt-input-rich-editor__footer-count--error">
        {{ formatCount(charCount) }}/{{ formatCount(maxLength) }}
      </span>
    </div>

    <!-- Helper text (non-error, non-disabled, non-wrapped) -->
    <div v-else-if="helperText && !disabled" class="bt-input-rich-editor__helper">
      {{ helperText }}
    </div>

    <!-- Default: right-aligned char count only -->
    <div v-else class="bt-input-rich-editor__footer">
      <span aria-hidden="true" style="flex: 1" />
      <span
        class="bt-input-rich-editor__footer-count"
        :class="{ 'bt-input-rich-editor__footer-count--error': hasError }"
      >
        {{ formatCount(charCount) }}/{{ formatCount(maxLength) }}
      </span>
    </div>

  </div>
</template>
