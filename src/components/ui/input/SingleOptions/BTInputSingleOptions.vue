<!--
  BTInputSingleOptions — labeled radio button group.

  A flex-wrap row of BTRadioButton items with a title label above and
  optional validation / helper text below.

  Figma node 702-3422.

  Usage — basic:
    <BTInputSingleOptions label="Pilih opsi" :items="opts" v-model="val" />

  Usage — required + validator:
    <BTInputSingleOptions
      label="Status"
      :items="opts"
      v-model="val"
      required
      :validator="v => v ? null : 'Wajib dipilih'"
      ref="picker"
    />

  Usage — disabled:
    <BTInputSingleOptions label="Status" :items="opts" v-model="val" disabled />
-->
<script setup lang="ts" generic="T extends string | number | boolean = string">
import '@/components/ui/input/SingleOptions/BTInputSingleOptions.css';
import { ref, computed, inject, getCurrentInstance } from 'vue';
import type { BTInputSingleOptionsProps } from '@/components/ui/input/SingleOptions/BTInputSingleOptions.types';
import BTRadioButton from '@/components/ui/radio-button/BTRadioButton.vue';
import type { BTRadioButtonValue } from '@/components/ui/radio-button/BTRadioButton.types';

const props = withDefaults(
  defineProps<BTInputSingleOptionsProps<T>>(),
  {
    label:      undefined,
    required:   false,
    disabled:   false,
    errorText:  undefined,
    helperText: undefined,
    name:       undefined,
    validator:  undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: T | null];
}>();

const _uid = getCurrentInstance()?.uid;
const fieldId = computed(() => `bt-input-single-options-${_uid}`);

// ── BTForm wrapping (optional) ────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() =>
  isInForm.value ? (formValues![props.name as string] as T | null | undefined) : undefined
);
const formError    = computed(() =>
  isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null
);
const resolvedValue = computed<T | null | undefined>(() => props.modelValue ?? formValue.value);

// ── Internal validation ───────────────────────────────────────────
const errorInternal = ref<string | null>(null);
const activeError   = computed(() => props.errorText ?? errorInternal.value ?? formError.value ?? null);
const hasError      = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);

// ── State classes ─────────────────────────────────────────────────
const wrapperClass = computed(() => ({
  'bt-input-single-options__wrapper': true,
  'bt-input-single-options--error':    hasError.value && !props.disabled,
  'bt-input-single-options--disabled': props.disabled,
}));

// ── Selection ─────────────────────────────────────────────────────
function onSelect(value: BTRadioButtonValue) {
  if (props.disabled) return;
  errorInternal.value = null;
  emit('update:modelValue', value as T);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, value);
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
}

// ── Validation ────────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? null);
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });
</script>

<template>
  <div :class="wrapperClass">

    <!-- Label row -->
    <div v-if="label" class="bt-input-single-options__label-row">
      <span class="bt-input-single-options__label">
        {{ label }}<span v-if="required" class="bt-input-single-options__required">*</span>
      </span>
    </div>

    <!-- Radio group
         aria-required on role=radiogroup is valid per ARIA 1.2;
         older AT (NVDA+Firefox<115) may not announce it — acceptable trade-off. -->
    <div
      :id="fieldId"
      class="bt-input-single-options__group"
      role="radiogroup"
      :aria-required="resolvedRequired || undefined"
      :aria-disabled="disabled || undefined"
      :aria-invalid="(hasError && !disabled) || undefined"
    >
      <BTRadioButton
        v-for="item in items"
        :key="String(item.value)"
        :modelValue="(resolvedValue ?? '') as BTRadioButtonValue"
        :value="item.value"
        :label="item.label"
        :disabled="disabled || item.disabled"
        :error="hasError && !disabled"
        :name="name"
        @update:modelValue="onSelect"
      />
    </div>

    <!-- Helper / error text
         Error text is suppressed when the group is disabled — a disabled field
         should not display validation state. -->
    <div v-if="(!disabled && activeError) || helperText" class="bt-input-single-options__helper">
      <span
        class="bt-input-single-options__helper-text"
        :class="{ 'bt-input-single-options__helper-text--error': hasError && !disabled }"
      >
        {{ (!disabled && activeError) || helperText }}
      </span>
    </div>

  </div>
</template>
