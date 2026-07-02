<!--
  BTInputWithLabel — text input with static label pill(s) attached on the
  left, right, or both sides — all sharing one unified border.

  Extends BTInput's floating-label behaviour. The pill is a static text badge
  (e.g. "kg", "IDR", "m²") — not a dropdown (use BTInputFieldUnit for that).

  Figma node 368-6832.

  Variants (driven by which label props are provided):
    - leftLabel only  → L Label
    - rightLabel only → R Label
    - both            → L R Label
    - neither         → plain input (identical to BTInput)

  Usage:
    <BTInputWithLabel left-label="kg" label="Weight" v-model="value" />
    <BTInputWithLabel right-label="m²" label="Area" v-model="value" />
    <BTInputWithLabel left-label="From" right-label="IDR" label="Amount" v-model="value" />
    <BTInputWithLabel left-label="kg" label="Weight" required v-model="value"
                      :validator="(v) => v ? null : 'Required'" ref="fieldRef" />
-->
<script setup lang="ts">
import { ref, computed, inject, getCurrentInstance } from 'vue';
import '@/components/ui/input/WithLabel/BTInputWithLabel.css';
import type { BTInputWithLabelProps } from '@/components/ui/input/WithLabel/BTInputWithLabel.types';
import cancelIcon from '@/components/ui/input/icons/cancel.svg';

// Inline validator type so Vue SFC compiler always includes it in the runtime
// prop schema — importing only from the types file can be missed by Vite HMR.
type ValidatorFn = (value: string) => string | null;

const props = withDefaults(
  defineProps<BTInputWithLabelProps & { validator?: ValidatorFn }>(),
  {
    required:      false,
    disabled:      false,
    readOnly:      false,
    showCharCount: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  focus:  [event: FocusEvent];
  blur:   [event: FocusEvent];
  clear:  [];
}>();

// ── State ───────────────────────────────────────────────────────────────────
const isFocused     = ref(false);
const errorInternal = ref<string | null>(null);

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

// ── Derived ─────────────────────────────────────────────────────────────────
const activeError = computed(() => props.errorText ?? errorInternal.value ?? formError.value ?? null);
const hasError    = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);
const isEmpty     = computed(() => !resolvedValue.value);

const labelFloating = computed(
  () => !!props.label && (isFocused.value || !isEmpty.value),
);

// Show clear (×) when focused and non-empty (mirrors BTInput behaviour)
const showClear = computed(
  () => !isEmpty.value && isFocused.value && !props.disabled && !props.readOnly,
);

// Stable id for label <for>/<input id> binding
const _uid    = getCurrentInstance()?.uid;
const fieldId = computed(() => props.id ?? `bt-input-wl-${_uid}`);

// ── CSS classes ──────────────────────────────────────────────────────────────
const fieldClass = computed(() => ({
  'bt-input-with-label':            true,
  'bt-input-with-label--has-left':  !!props.leftLabel,
  'bt-input-with-label--has-right': !!props.rightLabel,
  'bt-input-with-label--focused':   isFocused.value,
  'bt-input-with-label--error':     hasError.value,
  'bt-input-with-label--disabled':  props.disabled,
}));

const contentClass = computed(() => ({
  'bt-input-with-label__content':           true,
  'bt-input-with-label__content--floating': labelFloating.value,
}));

const labelClass = computed(() => ({
  'bt-input-with-label__label':          true,
  'bt-input-with-label__label--floating': labelFloating.value,
}));

const fieldInputClass = computed(() => ({
  'bt-input-with-label__field':            true,
  'bt-input-with-label__field--with-label': labelFloating.value,
}));

// ── Handlers ─────────────────────────────────────────────────────────────────
function onInput(e: Event) {
  errorInternal.value = null;
  const next = (e.target as HTMLInputElement).value;
  emit('update:modelValue', next);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, next);
}

function onFocus(e: FocusEvent) {
  isFocused.value = true;
  emit('focus', e);
}

function onBlur(e: FocusEvent) {
  isFocused.value = false;
  emit('blur', e);
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
}

function onClear() {
  errorInternal.value = null;
  emit('update:modelValue', '');
  if (isInForm.value && formSetField && props.name) formSetField(props.name, '');
  emit('clear');
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? '');
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });
</script>

<template>
  <div class="bt-input-with-label__wrapper">

    <!-- Field container -->
    <div :class="fieldClass">

      <!-- Left label pill -->
      <div
        v-if="leftLabel"
        class="bt-input-with-label__pill bt-input-with-label__pill--left"
        aria-hidden="true"
      >
        <span class="bt-input-with-label__pill-text">{{ leftLabel }}</span>
      </div>

      <!-- Content: floating label + input -->
      <div :class="contentClass">

        <!-- Floating label -->
        <label
          v-if="label"
          :for="fieldId"
          :class="labelClass"
        >
          {{ label }}<span v-if="required" class="bt-input-with-label__label-required">*</span>
        </label>

        <!-- Input -->
        <input
          :id="fieldId"
          :name="name"
          :value="resolvedValue ?? ''"
          :class="fieldInputClass"
          :placeholder="!label || labelFloating ? (placeholder ?? '') : ''"
          :disabled="disabled"
          :readonly="readOnly"
          :maxlength="maxLength"
          :aria-invalid="hasError || undefined"
          :aria-required="resolvedRequired || undefined"
          type="text"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />
      </div>

      <!-- Clear (×) button — sibling of content so align-self: center works
           independently of the content area's padding state -->
      <Transition name="bt-input-clear">
        <button
          v-if="showClear"
          type="button"
          class="bt-input-with-label__clear"
          aria-label="Clear input"
          @pointerdown.prevent="onClear"
        >
          <img :src="cancelIcon" alt="" />
        </button>
      </Transition>

      <!-- Right label pill -->
      <div
        v-if="rightLabel"
        class="bt-input-with-label__pill bt-input-with-label__pill--right"
        aria-hidden="true"
      >
        <span class="bt-input-with-label__pill-text">{{ rightLabel }}</span>
      </div>

    </div>

    <!-- Helper / error text -->
    <div
      v-if="(activeError || helperText) || (showCharCount && maxLength)"
      class="bt-input-with-label__helper"
    >
      <span
        v-if="activeError || helperText"
        class="bt-input-with-label__helper-text"
        :class="{ 'bt-input-with-label__helper-text--error': hasError }"
        :role="hasError ? 'alert' : undefined"
      >
        {{ activeError || helperText }}
      </span>
      <span v-else aria-hidden="true" style="flex: 1" />
      <span v-if="showCharCount && maxLength" class="bt-input-with-label__counter">
        {{ (resolvedValue || '').length }}/{{ maxLength }}
      </span>
    </div>

  </div>
</template>
