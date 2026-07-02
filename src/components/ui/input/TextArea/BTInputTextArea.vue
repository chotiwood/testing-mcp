<!--
  BTInputTextArea — auto-growing textarea with floating label.

  Label: always pinned top-left at 14px. Shrinks to 12px when focused or non-empty.
         Color turns brand-primary when focused.

  Cancel: position:absolute, right:0 in body (= 8px from wrapper border via padding).
  Custom scrollbar: 4px overlay track starting 8px below cancel's bottom (body top:26px).
  Layout (right side): [cancel 16px at right:0] / [scrollbar 4px at right:0, below cancel]

  Structure:
  ┌── wrapper (padding:8px) ──────────────────────────────────────────┐
  │ ┌── body (position:relative) ──────────────────────────────────┐  │
  │ │  label (absolute top-left)                                   │  │
  │ │  textarea (block, JS-height, padding-right:20px for cancel)  │  │
  │ │  cancel (absolute right:0 top:2px, z-index:3)                │  │
  │ │  scrollbar-track (absolute right:0 top:26px, z-index:2)      │  │
  │ └──────────────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────┘

  Height animation (3-phase):
  Phase 1 — pin wrapper height, disable transition, shrink to MIN_HEIGHT to measure
             scrollHeight accurately (content-height can be < current element height).
  Phase 2 — unpin wrapper + restore prevH atomically in one reflow so the browser
             never paints the collapsed state — this is the "footer flicker" fix.
  Phase 3 — restore transition + set target → browser animates.

  Wrapper pin (footer flicker fix):
  Phase 1 shrinks the textarea to MIN_HEIGHT so scrollHeight reflects true content
  size. Without pinning, the wrapper shrinks too and the footer (char counter) jumps
  up — the browser can paint this intermediate state. Fixing wrapper.style.height
  before Phase 1 keeps the outer layout frozen; releasing it together with the
  Phase 2 height restore means the browser only ever sees one coherent layout before
  the CSS animation begins.

  scheduleAdjust flag prevents double-call (onInput + watch both fire on
  user input), which caused Phase-1 snap to cancel a running animation.
-->
<script setup lang="ts">
import { ref, computed, inject, nextTick, watch, getCurrentInstance } from 'vue';
import '@/components/ui/input/TextArea/BTInputTextArea.css';
import type { BTInputTextAreaProps } from '@/components/ui/input/TextArea/BTInputTextArea.types';
import cancelFillIcon from '@/components/ui/input/TextArea/icons/cancel-fill.svg';

const MIN_HEIGHT = 62;   // → 80px wrapper  (62 + 2×8 pad + 2×1 border)
const MAX_HEIGHT = 142;  // → 160px wrapper

const _localFieldId = `bt-input-textarea-${getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2)}`;

const fieldId = computed(() => _localFieldId);

const props = withDefaults(defineProps<BTInputTextAreaProps>(), {
  required: false,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  clear: [];
}>();

const textareaRef    = ref<HTMLTextAreaElement | null>(null);
const scrollTrackRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(false);
const errorTextInternal = ref<string | null>(null);

// ── Custom scrollbar state ────────────────────────────────────────────────────
const showScrollbar = ref(false);
const thumbHeight   = ref(0);
const thumbTop      = ref(0);

function updateScrollbar() {
  const el = textareaRef.value;
  if (!el) return;
  const { scrollHeight, clientHeight, scrollTop } = el;
  const overflows = scrollHeight > clientHeight + 1;
  showScrollbar.value = overflows;
  if (!overflows) return;

  const track = scrollTrackRef.value;
  const trackH = track ? track.clientHeight : 0;
  if (trackH <= 0) {
    // showScrollbar just toggled true but Vue hasn't re-rendered the track yet
    // (v-show element still has display:none → clientHeight = 0).
    // Retry after Vue flushes the DOM update so the track is measurable.
    nextTick(updateScrollbar);
    return;
  }

  const ratio   = clientHeight / scrollHeight;
  const tH      = Math.max(20, ratio * trackH);
  const maxTop  = trackH - tH;
  const scrollable = scrollHeight - clientHeight;
  thumbHeight.value = tH;
  thumbTop.value    = scrollable > 0 ? (scrollTop / scrollable) * maxTop : 0;
}

function onScroll() { updateScrollbar(); }

// ── Scrollbar drag ────────────────────────────────────────────────────────────
function onThumbMousedown(e: MouseEvent) {
  e.preventDefault();
  const el    = textareaRef.value;
  const track = scrollTrackRef.value;
  if (!el || !track) return;

  const startY         = e.clientY;
  const startScrollTop = el.scrollTop;
  const trackH         = track.clientHeight;
  const scrollable     = el.scrollHeight - el.clientHeight;
  const _el            = el;

  function onMove(ev: MouseEvent) {
    const delta = ev.clientY - startY;
    _el.scrollTop = Math.max(0, Math.min(startScrollTop + (delta / trackH) * scrollable, scrollable));
    updateScrollbar();
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// ── BTForm wrapping (optional) ──────────────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() =>
  isInForm.value ? (formValues![props.name as string] as string | undefined) : undefined
);
const formError    = computed(() =>
  isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null
);
const resolvedValue = computed<string | undefined>(() => props.modelValue ?? formValue.value);

const activeError  = computed(() => props.errorText ?? errorTextInternal.value ?? formError.value ?? null);
const hasError = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);
const isEmpty      = computed(() => !resolvedValue.value);
const showFloating = computed(() => isFocused.value || !isEmpty.value);
const showClear    = computed(() => isFocused.value && !isEmpty.value && !props.disabled);

// ── Height animation ─────────────────────────────────────────────────────────
// scheduleAdjust: prevents double-call cancellation.
// Both onInput and watch fire on user input → both call nextTick(adjustHeight).
// The second call's Phase 1 (height:1px) would snap and cancel the first call's
// running CSS transition. The flag ensures only one adjustHeight runs per tick.
let _adjustPending = false;
function scheduleAdjust() {
  if (_adjustPending) return;
  _adjustPending = true;
  nextTick(() => { _adjustPending = false; adjustHeight(); });
}

function adjustHeight() {
  const el = textareaRef.value;
  if (!el) return;

  const prevH = parseInt(el.style.height, 10) || el.offsetHeight || MIN_HEIGHT;

  // Pin wrapper height so Phase 1 never collapses the outer layout.
  // Without this, shrinking the textarea to MIN_HEIGHT also shrinks the wrapper,
  // which shifts the footer (char counter) up — the browser can paint that
  // intermediate state, causing the visible "flicker".
  const wrapper = el.closest<HTMLElement>('.bt-input-text-area__wrapper');
  if (wrapper) wrapper.style.height = `${wrapper.offsetHeight}px`;

  // Phase 1: measure content height.
  // Shrink to MIN_HEIGHT so scrollHeight reflects true content size even when
  // the textarea is currently taller than its content (e.g. after deletion).
  el.style.transition = 'none';
  el.style.height     = `${MIN_HEIGHT}px`;
  void el.offsetHeight;                   // sync reflow

  const scrollH = el.scrollHeight;
  const target  = Math.min(Math.max(scrollH, MIN_HEIGHT), MAX_HEIGHT);
  el.style.overflowY = scrollH > MAX_HEIGHT ? 'auto' : 'hidden';

  // Phase 2: unpin wrapper + restore prevH in ONE reflow.
  // Releasing wrapper.style.height and setting textarea back to prevH before the
  // forced reflow means the browser computes only the final prevH layout — it
  // never paints the collapsed (MIN_HEIGHT) wrapper state.
  if (wrapper) wrapper.style.height = '';
  el.style.height = `${prevH}px`;
  void el.offsetHeight;                   // sync reflow — browser commits prevH

  // Phase 3: animate
  el.style.transition = '';               // restore CSS transition:height 150ms
  el.style.height     = `${target}px`;

  // Update custom scrollbar after height settles
  nextTick(updateScrollbar);
}

function onInput(e: Event) {
  const next = (e.target as HTMLTextAreaElement).value;
  emit('update:modelValue', next);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, next);
  scheduleAdjust();
}
function onFocus() { isFocused.value = true; }
function onBlur()  {
  isFocused.value = false;
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
}

function onClear() {
  emit('update:modelValue', '');
  if (isInForm.value && formSetField && props.name) formSetField(props.name, '');
  emit('clear');
  errorTextInternal.value = null;
  nextTick(() => { adjustHeight(); textareaRef.value?.focus(); });
}

function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? '');
  errorTextInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });

watch(() => props.modelValue, scheduleAdjust);
watch(formValue, scheduleAdjust);
</script>

<template>
  <div class="bt-input-text-area">

    <div
      class="bt-input-text-area__wrapper"
      :class="{
        'bt-input-text-area__wrapper--focused':  isFocused && !activeError,
        'bt-input-text-area__wrapper--error':    !!activeError,
        'bt-input-text-area__wrapper--disabled': disabled,
      }"
    >

      <!-- Body: position:relative anchor for label + cancel (both absolute) -->
      <div class="bt-input-text-area__body">

        <!-- Label: floats from inside content area to top-left on focus/fill -->
        <label
          v-if="label"
          :for="fieldId"
          class="bt-input-text-area__label"
          :class="{
            'bt-input-text-area__label--floating': showFloating,
            'bt-input-text-area__label--error':    !!activeError,
            'bt-input-text-area__label--disabled': disabled,
          }"
        >
          {{ label }}<span v-if="required" class="bt-input-text-area__required">*</span>
        </label>

        <!-- Textarea: padding-top:20px reserves space for the label (16px) + 4px gap -->
        <textarea
          :id="fieldId"
          ref="textareaRef"
          rows="1"
          class="bt-input-text-area__field"
          :class="{
            'bt-input-text-area__field--has-label':      !!label,
            'bt-input-text-area__field--label-floating': !!label && showFloating,
          }"
          :value="resolvedValue ?? ''"
          :name="name"
          :placeholder="isFocused ? (placeholder ?? '') : ''"
          :disabled="disabled"
          :maxlength="maxLength"
          :aria-invalid="hasError || undefined"
          :aria-required="resolvedRequired || undefined"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @scroll="onScroll"
        />

        <!-- Cancel: absolute inside body, right:0 = 8px from wrapper border (via padding).
             position:absolute means v-if removal doesn't shift layout — safe to use here. -->
        <Transition name="bt-input-clear">
          <button
            v-if="showClear"
            type="button"
            class="bt-input-text-area__clear"
            tabindex="-1"
            aria-label="Clear text"
            @mousedown.prevent="onClear"
          >
            <img :src="cancelFillIcon" alt="" />
          </button>
        </Transition>

        <!-- Custom scrollbar: track starts 8px below cancel button bottom (top: 26px) -->
        <div
          v-show="showScrollbar"
          ref="scrollTrackRef"
          class="bt-input-text-area__scrollbar-track"
        >
          <div
            class="bt-input-text-area__scrollbar-thumb"
            :style="{ height: thumbHeight + 'px', top: thumbTop + 'px' }"
            @mousedown.prevent="onThumbMousedown"
          />
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div
      v-if="(activeError || helperText) || maxLength !== undefined"
      class="bt-input-text-area__footer"
    >
      <span v-if="activeError"     class="bt-input-text-area__error" role="alert">{{ activeError }}</span>
      <span v-else-if="helperText" class="bt-input-text-area__helper">{{ helperText }}</span>
      <span v-else aria-hidden="true" style="flex: 1" />
      <span v-if="maxLength !== undefined" class="bt-input-text-area__char-count">
        {{ (resolvedValue ?? '').length }}/{{ maxLength }}
      </span>
    </div>

  </div>
</template>
