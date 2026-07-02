<!--
  BTInputDate — click-to-open date / date-range picker (Vue).

  Layout follows BTInput exactly:
  - Field div is position:relative (no inner content wrapper)
  - Label is position:absolute inside the field div
  - Value span is flex:1 with padding-top:16px when floating

  Clicking the field opens a popover containing BTCalendar.
  Selecting a date (single) or completing a range closes the panel automatically.

  Figma node 543-2651.

  Usage — single:
    <BTInputDate label="Date" v-model="date" />

  Usage — range:
    <BTInputDate mode="range" label="Period" v-model:rangeValue="range" />

  Usage — with validation:
    <BTInputDate label="Start date" v-model="date" ref="picker"
                 :validator="(d) => d ? null : 'Required'" />
-->
<script setup lang="ts">
import '@/components/ui/input/Date/BTInputDate.css';
import { ref, computed, inject, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import type { BTInputDateProps } from '@/components/ui/input/Date/BTInputDate.types';
import { BTCalendar } from '@/components/ui/calendar/index';
import { positionBelow } from '@/components/ui/input/internal/positionFloating';
import cancelIcon   from '@/components/ui/input/icons/cancel.svg';

// ── Inline validator types (avoids Vite HMR miss on function props) ──────────
type ValidatorFn = (value: Date | null) => string | null;
type RangeValidatorFn = (value: [Date, Date] | null) => string | null;

const props = withDefaults(
  defineProps<BTInputDateProps & { validator?: ValidatorFn; rangeValidator?: RangeValidatorFn }>(),
  {
    mode:        'single',
    size:        'default',
    disabled:    false,
    readOnly:    false,
    required:    false,
    showFooter:  true,   // always show Apply/Cancel footer — user must confirm before panel closes
    showPreset:  false,
  },
);

const emit = defineEmits<{
  'update:modelValue':  [value: Date | null];
  'update:rangeValue':  [value: [Date, Date] | null];
  clear: [];
}>();

// ── Refs ─────────────────────────────────────────────────────────────────────
const isOpen   = ref(false);
const fieldRef = ref<HTMLDivElement | null>(null);
const panelRef = ref<HTMLDivElement | null>(null);

const errorInternal = ref<string | null>(null);

// Pending (draft) selection — local state while the panel is open.
// Passed to BTCalendar so the calendar reflects the in-progress selection.
// Only emitted to the parent on Apply; Cancel discards it silently.
// This prevents the input field from updating until the user confirms.
const pendingValue = ref<Date | null>(null);
const pendingRange = ref<[Date, Date] | null>(null);

// ── BTForm wiring (direct coordinator) ───────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string' && props.mode !== 'range');
const formValue    = computed(() => isInForm.value ? (formValues![props.name as string] as Date | null | undefined) : undefined);
const formError    = computed(() => isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null);

// ── UID for label ─────────────────────────────────────────────────────────────
const _uid    = getCurrentInstance()?.uid;
const fieldId = computed(() => props.id ?? `bt-input-date-${_uid}`);

// ── Derived ──────────────────────────────────────────────────────────────────
const activeError = computed(() => props.errorText ?? formError.value ?? errorInternal.value ?? null);
const hasError    = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);

// Single-mode: fall back to form-injected value when modelValue not provided
const resolvedSingleValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : (formValue.value ?? null),
);

const hasValue = computed(() =>
  props.mode === 'range' ? !!(props.rangeValue?.[0]) : !!resolvedSingleValue.value,
);

// Label floats when open (like BTInput's isFocused) or when a value is present
const labelFloating = computed(() => isOpen.value || hasValue.value);

// Clear button visible only while the panel is open (active) AND a value exists.
// Matches BTInput / BTInputSearch pattern: clear shows when focused+filled, not on fill alone.
const showClear = computed(
  () => isOpen.value && hasValue.value && !props.disabled && !props.readOnly,
);

// Placeholder shown when open but no value yet — mirrors BTInput placeholder
// (BTInput shows placeholder when label is floating but field is empty)
const placeholder = computed(() =>
  props.mode === 'range' ? 'DD MMM YYYY – DD MMM YYYY' : 'DD MMM YYYY',
);
const showPlaceholder = computed(() => isOpen.value && !hasValue.value);

// ── Date formatting ───────────────────────────────────────────────────────────
function fmt(date: Date): string {
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(date.getDate()).padStart(2,'0')} ${M[date.getMonth()]} ${date.getFullYear()}`;
}

const displayValue = computed<string>(() => {
  if (props.mode === 'range') {
    const r = props.rangeValue;
    if (!r) return '';
    return `${fmt(r[0])} – ${fmt(r[1])}`;
  }
  return resolvedSingleValue.value ? fmt(resolvedSingleValue.value) : '';
});

// ── CSS classes ──────────────────────────────────────────────────────────────
const fieldClass = computed(() => ({
  'bt-input-date':                 true,
  'bt-input-date--open':           isOpen.value,
  'bt-input-date--error':          hasError.value,
  'bt-input-date--disabled':       props.disabled,
  'bt-input-date--label-floating': labelFloating.value,
  'bt-input-date--small':          props.size === 'small',
}));

const valueClass = computed(() => ({
  'bt-input-date__value':             true,
  'bt-input-date__value--placeholder': showPlaceholder.value,
}));

// ── Panel positioning (smart flip) ───────────────────────────────────────────
function updatePosition() {
  const trigger = fieldRef.value;
  const panel   = panelRef.value;
  if (!trigger || !panel) return;

  positionBelow(trigger, panel, { gap: 4, margin: 8 });
  panel.classList.add('bt-input-date__panel--visible');
}

// Run positioning AFTER Vue patches the DOM (flush:post = v-if div is rendered)
watch(
  () => isOpen.value,
  (open) => { if (open) updatePosition(); },
  { flush: 'post' },
);

// ── Open / close ──────────────────────────────────────────────────────────────
function openPanel() {
  if (props.disabled || props.readOnly || isOpen.value) return;
  // Init pending from the currently-committed value so the calendar opens
  // with the existing selection highlighted.
  pendingValue.value = resolvedSingleValue.value ?? null;
  pendingRange.value = props.rangeValue ? [...props.rangeValue] as [Date, Date] : null;
  isOpen.value = true;
}

function closePanel() {
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
  isOpen.value = false;
}

function togglePanel() {
  isOpen.value ? closePanel() : openPanel();
}

// ── Calendar selection handlers ───────────────────────────────────────────────
function onDateSelected(date: Date | null) {
  errorInternal.value = null;
  if (props.showFooter) {
    // Footer mode: buffer in pending — DO NOT emit to parent yet.
    // The input field stays unchanged until Terapkan is clicked.
    pendingValue.value = date;
  } else {
    // No footer: commit immediately and auto-close.
    emit('update:modelValue', date);
    if (isInForm.value && formSetField && props.name) formSetField(props.name, date ?? null);
    if (date) closePanel();
  }
}

function onRangeSelected(range: [Date, Date] | null) {
  errorInternal.value = null;
  if (props.showFooter) {
    // Footer mode: buffer in pending — DO NOT emit to parent yet.
    pendingRange.value = range;
  } else {
    // No footer: commit immediately and auto-close.
    emit('update:rangeValue', range);
    if (range) closePanel();
  }
}

// ── Footer Apply / Cancel ─────────────────────────────────────────────────────
function onApply() {
  errorInternal.value = null;
  // Commit pending → parent. Input field updates here (and only here).
  if (props.mode === 'range') {
    emit('update:rangeValue', pendingRange.value);
  } else {
    emit('update:modelValue', pendingValue.value);
    if (isInForm.value && formSetField && props.name) formSetField(props.name, pendingValue.value ?? null);
  }
  closePanel();
}

function onCancel() {
  // Discard pending — parent value is untouched (no emit needed).
  errorInternal.value = null;
  closePanel();
}

// ── Clear ─────────────────────────────────────────────────────────────────────
function onClear(e: Event) {
  e.stopPropagation();
  errorInternal.value = null;
  if (props.mode === 'range') {
    emit('update:rangeValue', null);
  } else {
    emit('update:modelValue', null);
  }
  emit('clear');
  closePanel();
}

// ── External validation ───────────────────────────────────────────────────────
function validate(): boolean {
  if (props.mode === 'range') {
    if (!props.rangeValidator) return true;
    const result = props.rangeValidator(props.rangeValue ?? null);
    errorInternal.value = result ?? null;
    return result === null;
  }
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? null);
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });

// ── Keyboard + scroll ─────────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePanel();
}

function onScroll() {
  if (isOpen.value) updatePosition();
}

// Click outside the panel (bubble phase, no capture).
// Clicks INSIDE the panel are stopped by @click.stop on the panel div,
// so they never reach document and never trigger this handler.
// Clicks on the field bubble up too, but fieldRef.contains() guard exits early.
function onDocClick(e: MouseEvent) {
  if (!isOpen.value) return;
  if (fieldRef.value?.contains(e.target as Node)) return; // field toggles itself
  // Month/year dropdowns in BTCalendarHeader are teleported to <body>, so they
  // sit outside .bt-input-date__panel. Guard against closing when clicking them.
  if ((e.target as Element)?.closest?.('[data-bt-calendar-dropdown]')) return;
  closePanel();
}

onMounted(() => {
  document.addEventListener('click',   onDocClick);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('scroll',  onScroll, true);
  window.addEventListener  ('resize',  onScroll);
});

onUnmounted(() => {
  document.removeEventListener('click',   onDocClick);
  document.removeEventListener('keydown', onKeyDown);
  document.removeEventListener('scroll',  onScroll, true);
  window.removeEventListener  ('resize',  onScroll);
});
</script>

<template>
  <div class="bt-input-date__wrapper">

    <!-- ── Field row ── -->
    <!--
      position:relative on this div — the label is absolutely positioned inside it.
      This is the same structure as BTInput, not a nested content wrapper.
    -->
    <div
      ref="fieldRef"
      :id="fieldId"
      :class="fieldClass"
      :aria-expanded="isOpen"
      :aria-haspopup="'dialog'"
      :aria-invalid="hasError || undefined"
      :aria-required="resolvedRequired || undefined"
      role="button"
      :tabindex="disabled ? -1 : 0"
      @click="togglePanel"
      @keydown.enter.space.prevent="togglePanel"
    >
      <!-- Left calendar icon -->
      <span class="bt-input-date__icon" aria-hidden="true">
        <svg viewBox="0 0 12 13.3333" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M1.33333 13.3333C0.966667 13.3333 0.652778 13.2028 0.391667 12.9417C0.130556 12.6806 0 12.3667 0 12V2.66667C0 2.3 0.130556 1.98611 0.391667 1.725C0.652778 1.46389 0.966667 1.33333 1.33333 1.33333H2V0.666667C2 0.477778 2.06389 0.319444 2.19167 0.191667C2.31944 0.0638889 2.47778 0 2.66667 0C2.85556 0 3.01389 0.0638889 3.14167 0.191667C3.26944 0.319444 3.33333 0.477778 3.33333 0.666667V1.33333H8.66667V0.666667C8.66667 0.477778 8.73056 0.319444 8.85833 0.191667C8.98611 0.0638889 9.14444 0 9.33333 0C9.52222 0 9.68056 0.0638889 9.80833 0.191667C9.93611 0.319444 10 0.477778 10 0.666667V1.33333H10.6667C11.0333 1.33333 11.3472 1.46389 11.6083 1.725C11.8694 1.98611 12 2.3 12 2.66667V12C12 12.3667 11.8694 12.6806 11.6083 12.9417C11.3472 13.2028 11.0333 13.3333 10.6667 13.3333H1.33333ZM1.33333 12H10.6667V5.33333H1.33333V12ZM6 8C5.81111 8 5.65278 7.93611 5.525 7.80833C5.39722 7.68056 5.33333 7.52222 5.33333 7.33333C5.33333 7.14444 5.39722 6.98611 5.525 6.85833C5.65278 6.73056 5.81111 6.66667 6 6.66667C6.18889 6.66667 6.34722 6.73056 6.475 6.85833C6.60278 6.98611 6.66667 7.14444 6.66667 7.33333C6.66667 7.52222 6.60278 7.68056 6.475 7.80833C6.34722 7.93611 6.18889 8 6 8ZM2.85833 7.80833C2.73056 7.68056 2.66667 7.52222 2.66667 7.33333C2.66667 7.14444 2.73056 6.98611 2.85833 6.85833C2.98611 6.73056 3.14444 6.66667 3.33333 6.66667C3.52222 6.66667 3.68056 6.73056 3.80833 6.85833C3.93611 6.98611 4 7.14444 4 7.33333C4 7.52222 3.93611 7.68056 3.80833 7.80833C3.68056 7.93611 3.52222 8 3.33333 8C3.14444 8 2.98611 7.93611 2.85833 7.80833ZM8.66667 8C8.47778 8 8.31944 7.93611 8.19167 7.80833C8.06389 7.68056 8 7.52222 8 7.33333C8 7.14444 8.06389 6.98611 8.19167 6.85833C8.31944 6.73056 8.47778 6.66667 8.66667 6.66667C8.85556 6.66667 9.01389 6.73056 9.14167 6.85833C9.26945 6.98611 9.33333 7.14444 9.33333 7.33333C9.33333 7.52222 9.26945 7.68056 9.14167 7.80833C9.01389 7.93611 8.85556 8 8.66667 8ZM6 10.6667C5.81111 10.6667 5.65278 10.6028 5.525 10.475C5.39722 10.3472 5.33333 10.1889 5.33333 10C5.33333 9.81111 5.39722 9.65278 5.525 9.525C5.65278 9.39722 5.81111 9.33333 6 9.33333C6.18889 9.33333 6.34722 9.39722 6.475 9.525C6.60278 9.65278 6.66667 9.81111 6.66667 10C6.66667 10.1889 6.60278 10.3472 6.475 10.475C6.34722 10.6028 6.18889 10.6667 6 10.6667ZM2.85833 10.475C2.73056 10.3472 2.66667 10.1889 2.66667 10C2.66667 9.81111 2.73056 9.65278 2.85833 9.525C2.98611 9.39722 3.14444 9.33333 3.33333 9.33333C3.52222 9.33333 3.68056 9.39722 3.80833 9.525C3.93611 9.65278 4 9.81111 4 10C4 10.1889 3.93611 10.3472 3.80833 10.475C3.68056 10.6028 3.52222 10.6667 3.33333 10.6667C3.14444 10.6667 2.98611 10.6028 2.85833 10.475ZM8.66667 10.6667C8.47778 10.6667 8.31944 10.6028 8.19167 10.475C8.06389 10.3472 8 10.1889 8 10C8 9.81111 8.06389 9.65278 8.19167 9.525C8.31944 9.39722 8.47778 9.33333 8.66667 9.33333C8.85556 9.33333 9.01389 9.39722 9.14167 9.525C9.26945 9.65278 9.33333 9.81111 9.33333 10C9.33333 10.1889 9.26945 10.3472 9.14167 10.475C9.01389 10.6028 8.85556 10.6667 8.66667 10.6667Z" fill="currentColor" />
        </svg>
      </span>

      <!-- Floating label (absolute) — mirrors BTInput's BTInputAnimatedLabel -->
      <label
        v-if="label"
        :for="fieldId"
        class="bt-input-date__label"
      >
        {{ label }}<span v-if="required" class="bt-input-date__label-required">*</span>
      </label>

      <!-- Value / placeholder — flex:1, mirrors BTInput's <input> element -->
      <span :class="valueClass">
        <template v-if="hasValue">{{ displayValue }}</template>
        <template v-else-if="showPlaceholder">{{ placeholder }}</template>
      </span>

      <!-- Clear button — sibling of value so it stays right-aligned -->
      <Transition name="bt-input-clear">
        <button
          v-if="showClear"
          type="button"
          class="bt-input-date__clear"
          aria-label="Clear date"
          @pointerdown.prevent="onClear"
        >
          <img :src="cancelIcon" alt="" />
        </button>
      </Transition>
    </div>

    <!-- ── Helper / error ── -->
    <div v-if="activeError || helperText" class="bt-input-date__helper">
      <span
        class="bt-input-date__helper-text"
        :class="{ 'bt-input-date__helper-text--error': hasError }"
      >
        {{ activeError || helperText }}
      </span>
    </div>

    <!-- ── Calendar panel (teleported to body) ── -->
    <Teleport to="body">
      <!--
        @click.stop on the panel — stops click events from bubbling to document.
        The document 'click' handler (onDocClick) therefore only fires for
        clicks that originate OUTSIDE this panel, which is exactly when we
        want to close it. No overlay needed; z-index stacking is irrelevant.
      -->
      <div
        v-if="isOpen"
        ref="panelRef"
        class="bt-input-date__panel"
        role="dialog"
        :aria-label="label ?? 'Date picker'"
        tabindex="-1"
        @click.stop
      >
        <BTCalendar
          v-if="mode === 'single'"
          mode="single"
          :model-value="pendingValue"
          :min-date="minDate"
          :max-date="maxDate"
          :locale="locale"
          :show-footer="showFooter"
          :show-preset="showPreset"
          @update:model-value="onDateSelected"
          @apply="onApply"
          @cancel="onCancel"
        />
        <BTCalendar
          v-else
          mode="range"
          :range-value="pendingRange"
          :min-date="minDate"
          :max-date="maxDate"
          :locale="locale"
          :show-footer="showFooter"
          :show-preset="showPreset"
          @update:range-value="onRangeSelected"
          @apply="onApply"
          @cancel="onCancel"
        />
      </div>
    </Teleport>

  </div>
</template>
