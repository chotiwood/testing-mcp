<!--
  BTInputTime — section-based time input (MUI-style field editing).

  Clicking a segment (hours / minutes / seconds) highlights it.
  Typing digits fills the active segment and auto-advances to the next.
  Backspace clears the current segment then retreats to the previous one.
  No popup — no AM/PM button — user edits directly in the field.
  Figma node 555-2975.

  Usage — HH:mm (default):
    <BTInputTime label="Time" v-model="time" />

  Usage — with seconds:
    <BTInputTime label="Duration" format="HH:mm:ss" v-model="duration" />

  Usage — 12-hour (toggle AM/PM with A / P keys):
    <BTInputTime label="Meeting" format="hh:mm a" v-model="meeting" />

  Usage — with validation:
    <BTInputTime label="Start time" ref="timePicker"
                 :validator="(v) => v ? null : 'Required'" />
-->
<script setup lang="ts">
import '@/components/ui/input/Time/BTInputTime.css';
import { ref, computed, inject, watch, nextTick, getCurrentInstance } from 'vue';
import type { BTInputTimeProps } from '@/components/ui/input/Time/BTInputTime.types';
import cancelIcon   from '@/components/ui/input/Time/icons/cancel.svg';

// ── Inline types ──────────────────────────────────────────────
type ValidatorFn = (value: string | null) => string | null;
type Section     = 'hours' | 'minutes' | 'seconds' | 'ampm';

const props = withDefaults(
  defineProps<BTInputTimeProps & { validator?: ValidatorFn }>(),
  {
    format:   'HH:mm',
    size:     'default',
    disabled: false,
    readOnly: false,
    required: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  clear: [];
}>();

// ── BTForm wiring (direct coordinator) ───────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() => isInForm.value ? (formValues![props.name as string] as string | null | undefined) : undefined);
const formError    = computed(() => isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null);

// ── UID for label ─────────────────────────────────────────────
const _uid    = getCurrentInstance()?.uid;
const fieldId = computed(() => props.id ?? `bt-input-time-${_uid}`);

// ── Refs ──────────────────────────────────────────────────────
const inputRef      = ref<HTMLInputElement | null>(null);
const isFocused     = ref(false);
const activeSection = ref<Section | null>(null);
const sectionBuffer = ref('');        // digits typed in current section (1–2 chars)
const hoursVal      = ref('');        // '' = empty, '1' = partial, '08' = complete
const minutesVal    = ref('');
const secondsVal    = ref('');
const amPmVal       = ref<'AM' | 'PM'>('AM');
const errorInternal = ref<string | null>(null);

// ── Derived ──────────────────────────────────────────────────
const activeError   = computed(() => props.errorText ?? formError.value ?? errorInternal.value ?? null);
const hasError      = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);
const resolvedModelValue = computed(() => props.modelValue !== undefined ? props.modelValue : (formValue.value ?? null));
const hasValue      = computed(() => !!resolvedModelValue.value);
// Label always floats — format hint (__:__ AM etc.) is always visible when empty
const labelFloating = computed(() => true);
const showClear     = computed(() => isFocused.value && hasValue.value && !props.disabled && !props.readOnly);

// ── Section helpers ───────────────────────────────────────────
function getSections(): Section[] {
  if (props.format === 'HH:mm:ss') return ['hours', 'minutes', 'seconds'];
  if (props.format === 'hh:mm a')  return ['hours', 'minutes', 'ampm'];
  return ['hours', 'minutes'];
}

// Character range [start, end] in the display string for each section
// hh:mm a layout: "HH:MM AM" → hours[0,2] minutes[3,5] ampm[6,8]
// HH:mm:ss layout: "HH:MM:SS" → hours[0,2] minutes[3,5] seconds[6,8]
function sectionRange(section: Section): [number, number] {
  switch (section) {
    case 'hours':   return [0, 2];
    case 'minutes': return [3, 5];
    case 'seconds': return [6, 8];
    case 'ampm':    return [6, 8];
  }
}

// Map cursor position → section
function sectionAtPos(pos: number): Section {
  if (pos <= 2) return 'hours';
  if (props.format === 'HH:mm:ss' && pos >= 6) return 'seconds';
  if (props.format === 'hh:mm a'  && pos >= 6) return 'ampm';
  return 'minutes';
}

function getSection(s: Section): string {
  if (s === 'hours')   return hoursVal.value;
  if (s === 'minutes') return minutesVal.value;
  if (s === 'ampm')    return amPmVal.value;
  return secondsVal.value;
}

function setSection(s: Section, value: string) {
  if (s === 'hours')   { hoursVal.value   = value; return; }
  if (s === 'minutes') { minutesVal.value  = value; return; }
  if (s === 'ampm')    return; // ampm toggled only via A/P keys, not digit buffer
  secondsVal.value = value;
}

function maxForSection(s: Section): number {
  if (s === 'hours') return props.format === 'hh:mm a' ? 12 : 23;
  return 59;
}

function minForSection(s: Section): number {
  return s === 'hours' && props.format === 'hh:mm a' ? 1 : 0;
}

function clampSection(value: string, s: Section): string {
  const n = parseInt(value, 10);
  if (isNaN(n)) return '00';
  return String(Math.min(Math.max(n, minForSection(s)), maxForSection(s))).padStart(2, '0');
}

// ── Display string ────────────────────────────────────────────
// While blurred with a value: show committed modelValue.
// Otherwise (focused, or blurred+empty): show MUI-style format letters.
//   empty  → full placeholder ('HH', 'mm', 'ss')
//   partial → digit + remaining placeholder char (e.g. '1H', '4m')
//   full    → the value itself
function segDisplay(val: string, placeholder: string): string {
  if (!val) return placeholder;
  if (val.length === 1) return val + placeholder[1];
  return val;
}

const displayStr = computed<string>(() => {
  if (!isFocused.value && resolvedModelValue.value) return resolvedModelValue.value;

  const hPh = props.format === 'hh:mm a' ? 'hh' : 'HH';
  const h   = segDisplay(hoursVal.value,   hPh);
  const m   = segDisplay(minutesVal.value, 'mm');

  if (props.format === 'HH:mm:ss') {
    return `${h}:${m}:${segDisplay(secondsVal.value, 'ss')}`;
  }
  if (props.format === 'hh:mm a') {
    return `${h}:${m} ${amPmVal.value}`;
  }
  return `${h}:${m}`;
});

// ── Section highlight (setSelectionRange) ─────────────────────
async function highlightSection(section: Section | null) {
  if (!section || !inputRef.value) return;
  await nextTick();
  const [start, end] = sectionRange(section);
  inputRef.value.setSelectionRange(start, end);
}

// Re-apply highlight after displayStr changes (browser resets cursor on value update)
watch(displayStr, () => {
  if (isFocused.value && activeSection.value) {
    highlightSection(activeSection.value);
  }
});

// ── Parse committed value into sections ───────────────────────
function parseModelValue(v: string) {
  const parts = v.split(/[: ]/);
  hoursVal.value   = (parts[0] ?? '').replace(/\D/g, '').slice(0, 2);
  minutesVal.value = (parts[1] ?? '').replace(/\D/g, '').slice(0, 2);
  if (props.format === 'HH:mm:ss') {
    secondsVal.value = (parts[2] ?? '').replace(/\D/g, '').slice(0, 2);
  }
  if (props.format === 'hh:mm a') {
    amPmVal.value = v.toUpperCase().includes('PM') ? 'PM' : 'AM';
  }
}

function clearSections() {
  hoursVal.value   = '';
  minutesVal.value = '';
  secondsVal.value = '';
  sectionBuffer.value = '';
}

// ── Emit ─────────────────────────────────────────────────────
function buildEmitValue(): string | null {
  const h2 = hoursVal.value.length   === 2;
  const m2 = minutesVal.value.length === 2;
  const s2 = props.format !== 'HH:mm:ss' || secondsVal.value.length === 2;
  if (!h2 || !m2 || !s2) return null;

  const h = clampSection(hoursVal.value, 'hours');
  const m = clampSection(minutesVal.value, 'minutes');

  if (props.format === 'HH:mm:ss') {
    return `${h}:${m}:${clampSection(secondsVal.value, 'seconds')}`;
  }
  if (props.format === 'hh:mm a') {
    return `${h}:${m} ${amPmVal.value}`;
  }
  return `${h}:${m}`;
}

function tryEmitFromSections() {
  const value = buildEmitValue();
  if (value !== null) {
    emit('update:modelValue', value);
    errorInternal.value = null;
  }
}

// ── Section navigation ────────────────────────────────────────
function advanceSection(): boolean {
  const list = getSections();
  const idx  = list.indexOf(activeSection.value!);
  if (idx >= 0 && idx < list.length - 1) {
    activeSection.value = list[idx + 1];
    sectionBuffer.value = '';
    return true;
  }
  return false;
}

function retreatSection(): boolean {
  const list = getSections();
  const idx  = list.indexOf(activeSection.value!);
  if (idx > 0) {
    activeSection.value = list[idx - 1];
    sectionBuffer.value = '';
    return true;
  }
  return false;
}

// ── Focus / blur ──────────────────────────────────────────────
function onFocus() {
  if (props.disabled || props.readOnly) return;
  isFocused.value = true;
  if (resolvedModelValue.value) {
    parseModelValue(resolvedModelValue.value);
  } else {
    clearSections();
  }
  activeSection.value = 'hours';
  highlightSection('hours');
}

function onBlur() {
  isFocused.value = false;
  // Commit if all sections are filled
  const value = buildEmitValue();
  if (value !== null && value !== resolvedModelValue.value) {
    emit('update:modelValue', value);
    if (isInForm.value && formSetField && props.name) formSetField(props.name, value);
  }
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
  // Reset sections — re-parsed from modelValue on next focus
  clearSections();
  activeSection.value = null;
  validate();
}

// ── Click: snap selection to the clicked section ──────────────
function onClick() {
  if (!inputRef.value) return;
  const pos     = inputRef.value.selectionStart ?? 0;
  const section = sectionAtPos(pos);
  if (section !== activeSection.value) {
    sectionBuffer.value = '';
  }
  activeSection.value = section;
  highlightSection(section);
}

// ── Keyboard ─────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Tab')    return;                          // let Tab blur normally
  if (e.key === 'Escape') { inputRef.value?.blur(); return; }

  // AM/PM toggle via A / P keys (12h only)
  if (props.format === 'hh:mm a') {
    if (e.key === 'a' || e.key === 'A') { e.preventDefault(); amPmVal.value = 'AM'; tryEmitFromSections(); highlightSection(activeSection.value); return; }
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); amPmVal.value = 'PM'; tryEmitFromSections(); highlightSection(activeSection.value); return; }
  }

  // Section navigation with arrow keys
  if (e.key === 'ArrowLeft')  { e.preventDefault(); retreatSection();  highlightSection(activeSection.value); return; }
  if (e.key === 'ArrowRight') { e.preventDefault(); advanceSection();  highlightSection(activeSection.value); return; }

  // Backspace: on ampm just retreat; on others clear section then retreat
  if (e.key === 'Backspace') {
    e.preventDefault();
    const section = activeSection.value;
    if (!section) return;

    if (section === 'ampm') {
      // Backspace from AM/PM → retreat to minutes
      retreatSection();
    } else {
      const currentVal = getSection(section);

      if (sectionBuffer.value) {
        // Mid-typing: pop last digit
        sectionBuffer.value = sectionBuffer.value.slice(0, -1);
        setSection(section, sectionBuffer.value);
      } else if (currentVal) {
        // Section has a committed value: clear it
        setSection(section, '');
        if (props.modelValue) emit('update:modelValue', null);
      } else {
        // Section already empty: retreat to previous and clear it
        if (retreatSection()) {
          setSection(activeSection.value!, '');
          if (props.modelValue) emit('update:modelValue', null);
        }
      }
    }

    highlightSection(activeSection.value);
    return;
  }

  // Digit — skip if AM/PM section is active
  if (/^\d$/.test(e.key)) {
    if (activeSection.value === 'ampm') { e.preventDefault(); return; }
    e.preventDefault();
    onDigit(e.key);
    return;
  }

  e.preventDefault(); // block all other keys
}

function onDigit(digit: string) {
  const section = activeSection.value;
  if (!section || section === 'ampm') return;

  sectionBuffer.value += digit;
  setSection(section, sectionBuffer.value);

  const bufNum = parseInt(sectionBuffer.value, 10);
  const maxVal = maxForSection(section);

  // Auto-advance when:
  // 1. Buffer has 2 digits (section complete)
  // 2. First digit makes any second digit exceed max (e.g. hour '3' → 30-39 all > 23)
  const shouldAdvance =
    sectionBuffer.value.length === 2 ||
    (sectionBuffer.value.length === 1 && bufNum * 10 > maxVal);

  if (shouldAdvance) {
    setSection(section, clampSection(sectionBuffer.value, section));
    sectionBuffer.value = '';
    const advanced = advanceSection();
    if (!advanced) {
      // Last digit-section complete — emit
      tryEmitFromSections();
    }
  }

  highlightSection(activeSection.value);
}

// ── Paste ─────────────────────────────────────────────────────
function onPaste(e: ClipboardEvent) {
  e.preventDefault();
  const digits = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
  const maxLen = props.format === 'HH:mm:ss' ? 6 : 4;
  const d = digits.slice(0, maxLen);

  hoursVal.value   = d.slice(0, 2);
  minutesVal.value = d.slice(2, 4);
  if (props.format === 'HH:mm:ss') secondsVal.value = d.slice(4, 6);

  if (d.length >= maxLen) {
    tryEmitFromSections();
    const list = getSections();
    activeSection.value = list[list.length - 1];
  } else {
    activeSection.value = !hoursVal.value ? 'hours'
      : !minutesVal.value ? 'minutes'
      : 'seconds';
  }
  highlightSection(activeSection.value);
}

// ── Clear ─────────────────────────────────────────────────────
function onClear(e: Event) {
  e.stopPropagation();
  errorInternal.value = null;
  clearSections();
  amPmVal.value = 'AM';
  activeSection.value = null;
  emit('update:modelValue', null);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, null);
  emit('clear');
}

// ── Validation ────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? null);
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });

// ── CSS classes ──────────────────────────────────────────────
const fieldClass = computed(() => ({
  'bt-input-time':                 true,
  'bt-input-time--focused':        isFocused.value,
  'bt-input-time--error':          hasError.value,
  'bt-input-time--disabled':       props.disabled,
  'bt-input-time--label-floating': labelFloating.value,
  'bt-input-time--small':          props.size === 'small',
}));
</script>

<template>
  <div class="bt-input-time__wrapper">

    <div :class="fieldClass">

      <!-- Left clock icon -->
      <span class="bt-input-time__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor" />
        </svg>
      </span>

      <!-- Floating label (absolute) -->
      <label
        v-if="label"
        :for="fieldId"
        class="bt-input-time__label"
      >
        {{ label }}<span v-if="required" class="bt-input-time__label-required">*</span>
      </label>

      <!-- Section-based text input -->
      <input
        ref="inputRef"
        :id="fieldId"
        type="text"
        class="bt-input-time__input"
        :value="displayStr"
        :disabled="disabled"
        :readonly="readOnly"
        :aria-invalid="hasError || undefined"
        :aria-required="resolvedRequired || undefined"
        :aria-readonly="readOnly || undefined"
        autocomplete="off"
        spellcheck="false"
        @focus="onFocus"
        @blur="onBlur"
        @click="onClick"
        @keydown="onKeyDown"
        @paste="onPaste"
      />

      <!-- Clear (×) button -->
      <Transition name="bt-input-clear">
        <button
          v-if="showClear"
          type="button"
          class="bt-input-time__clear"
          aria-label="Clear time"
          @pointerdown.prevent="onClear"
        >
          <img :src="cancelIcon" alt="" />
        </button>
      </Transition>

    </div>

    <!-- Helper / error -->
    <div v-if="activeError || helperText" class="bt-input-time__helper">
      <span
        class="bt-input-time__helper-text"
        :class="{ 'bt-input-time__helper-text--error': hasError }"
      >
        {{ activeError || helperText }}
      </span>
    </div>

  </div>
</template>
