<!--
  BTInput — Material M3 outlined-style text input. Foundation of the btech
  input family. All composites (BTInputDate, BTInputDropdown, BTInputUnit,
  etc.) wrap this atom and add overlay/chip behaviour.

  Sliced from Figma InputField (node 85:2484) + InputWithLabel (node 368:6832).

  Variant precedence (suffix priority, highest first):
    1. clearable + value non-empty + not disabled/readOnly + focused → clear ✕
    2. type=password + showPasswordToggle → eye/eye-off toggle
    3. suffix slot (only when none of 1–2 apply)

  Error state shows ONLY via border colour + red helper text — no suffix icon.

  Usage:
    <BTInput label="Username" required placeholder="Type your username"
             v-model="value" />
    <BTInput label="Password" type="password" show-password-toggle v-model="pwd" />
    <BTInput label="Search" clearable v-model="q" />
    <BTInput label="Email" type="email" error-text="Invalid email" />
    <BTInput label="Email" :validator="(v) => v.includes('@') ? null : 'Invalid email'"
             v-model="email" ref="inputRef" />
    <!-- call inputRef.validate() to trigger validation -->
-->
<script setup lang="ts">
import { ref, computed, inject, useSlots, getCurrentInstance } from 'vue';
import '@/components/ui/input/BTInput.css';
import type { BTInputProps } from '@/components/ui/input/BTInput.types';
import BTInputAnimatedLabel from '@/components/ui/input/internal/BTInputAnimatedLabel.vue';
import cancelIcon from '@/components/ui/input/icons/cancel.svg';

const props = withDefaults(defineProps<BTInputProps>(), {
  type: 'text',
  required: false,
  disabled: false,
  readOnly: false,
  showPasswordToggle: false,
  multiline: false,
  rows: 5,
  showCharCount: false,
  clearable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
  clear: [];
}>();

const slots = useSlots();
const isFocused = ref(false);
const passwordVisible = ref(false);
const errorInternal = ref<string | null>(null);

// Optional BTForm wrapping — when this input has a `name` prop AND lives
// inside a <BTForm>, auto-wire value / change / blur / error from the form.
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

// Merge external errorText with internal validator result + BTForm error
const activeError = computed(() =>
  props.errorText ?? errorInternal.value ?? formError.value ?? null
);
const hasError = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);
const isEmpty = computed(() => !resolvedValue.value);
const showFloatingLabel = computed(
  () => !!props.label && (isFocused.value || !isEmpty.value),
);
const hasPrefix = computed(() => !!slots.prefix);

// Stable field ID for label <for> / input <id> binding
const _uid = getCurrentInstance()?.uid;
const fieldId = computed(() => props.id ?? `bt-input-${_uid}`);

const inputType = computed(() => {
  if (props.type === 'password') {
    return passwordVisible.value ? 'text' : 'password';
  }
  return props.type;
});

const inputClass = computed(() => ({
  'bt-input': true,
  'bt-input--focused': isFocused.value,
  'bt-input--error': hasError.value,
  'bt-input--disabled': props.disabled,
  'bt-input--with-label': !!props.label,
  'bt-input--with-prefix': hasPrefix.value,
  'bt-input--label-floating': showFloatingLabel.value,
  'bt-input--multiline': props.multiline,
}));

function onInput(e: Event) {
  errorInternal.value = null;   // reset internal error on each keystroke
  const target = e.target as HTMLInputElement;
  const next = target.value;
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

/** Call this (via template ref) to trigger prop-based validation. */
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? '');
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });

// Suffix priority: clear (focused + non-empty, no clearable gate) > password-toggle > slot
// Error shows only via border + helper text — no suffix icon.
// NOTE: clearable prop kept for backward-compat but no longer required — Figma shows the
//       cancel icon whenever the field is active (focused) and non-empty.
type SuffixKind = 'clear' | 'password' | 'slot' | null;
const suffixKind = computed<SuffixKind>(() => {
  if (
    !isEmpty.value &&
    !props.disabled &&
    !props.readOnly &&
    isFocused.value &&
    props.type !== 'password'
  ) return 'clear';
  if (props.type === 'password' && props.showPasswordToggle) return 'password';
  if (slots.suffix) return 'slot';
  return null;
});
</script>

<template>
  <div class="bt-input__wrapper">
    <div :class="inputClass">
      <span v-if="hasPrefix" class="bt-input__prefix">
        <slot name="prefix" />
      </span>

      <BTInputAnimatedLabel
        v-if="label"
        :label="label"
        :required="required"
        :field-id="fieldId"
      />

      <input
        v-if="!multiline"
        :id="fieldId"
        :name="name"
        :type="inputType"
        :value="resolvedValue ?? ''"
        :placeholder="!label || showFloatingLabel ? placeholder : ''"
        :disabled="disabled"
        :readonly="readOnly"
        :maxlength="maxLength"
        :aria-invalid="hasError || undefined"
        :aria-required="resolvedRequired || undefined"
        class="bt-input__field"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <textarea
        v-else
        :id="fieldId"
        :name="name"
        :value="resolvedValue ?? ''"
        :placeholder="!label || showFloatingLabel ? placeholder : ''"
        :disabled="disabled"
        :readonly="readOnly"
        :rows="rows"
        :maxlength="maxLength"
        :aria-invalid="hasError || undefined"
        :aria-required="resolvedRequired || undefined"
        class="bt-input__field"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />

      <!-- Clear button: direct child of flex row (no parent v-if) so the
           Transition leave animation fires when isFocused flips to false. -->
      <Transition name="bt-input-clear">
        <button
          v-if="suffixKind === 'clear'"
          type="button"
          class="bt-input__icon-btn"
          aria-label="Clear input"
          @pointerdown.prevent="onClear"
        ><img :src="cancelIcon" alt="" /></button>
      </Transition>

      <!-- Password toggle + suffix slot (no animation needed here) -->
      <span v-if="suffixKind === 'password' || suffixKind === 'slot'" class="bt-input__suffix">
        <button
          v-if="suffixKind === 'password'"
          type="button"
          class="bt-input__icon-btn"
          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
          @click="passwordVisible = !passwordVisible"
        ><svg viewBox="0 -960 960 960" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path v-if="passwordVisible" d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" fill="currentColor" />
          <path v-else d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" fill="currentColor" />
        </svg></button>
        <slot v-if="suffixKind === 'slot'" name="suffix" />
      </span>
    </div>

    <div
      v-if="(activeError || helperText) || (showCharCount && maxLength)"
      class="bt-input__helper"
    >
      <span
        v-if="activeError || helperText"
        class="bt-input__helper-text"
        :class="{ 'bt-input__helper-text--error': hasError }"
        :role="hasError ? 'alert' : undefined"
      >
        {{ activeError || helperText }}
      </span>
      <span v-else aria-hidden="true" style="flex: 1" />
      <span v-if="showCharCount && maxLength" class="bt-input__counter">
        {{ (resolvedValue || '').length }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>
