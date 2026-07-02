<!--
  BTInputMultiOptions — labeled checkbox group (multi-select).

  A flex-wrap row of BTCheckbox items with a title label above and
  optional validation / helper text below.

  Figma node 859-2091.

  Usage — basic:
    <BTInputMultiOptions label="Pilih opsi" :items="opts" v-model="selected" />

  Usage — required + validator:
    <BTInputMultiOptions
      label="Kategori"
      :items="opts"
      v-model="selected"
      required
      :validator="v => v.length ? null : 'Pilih minimal satu opsi'"
      ref="picker"
    />

  Usage — disabled:
    <BTInputMultiOptions label="Pilih opsi" :items="opts" v-model="selected" disabled />
-->
<script setup lang="ts" generic="T extends string | number | boolean = string">
import '@/components/ui/input/MultiOptions/BTInputMultiOptions.css';
import { ref, computed, inject, getCurrentInstance } from 'vue';
import type { BTInputMultiOptionsProps } from '@/components/ui/input/MultiOptions/BTInputMultiOptions.types';
import BTCheckbox from '@/components/ui/checkbox/BTCheckbox.vue';

const props = withDefaults(
  defineProps<BTInputMultiOptionsProps<T>>(),
  {
    modelValue: () => [] as T[],
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
  'update:modelValue': [value: T[]];
}>();

const _uid = getCurrentInstance()?.uid;
const fieldId = computed(() => `bt-input-multi-options-${_uid}`);

// ── BTForm wrapping (optional) ────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() =>
  isInForm.value ? (formValues![props.name as string] as T[] | undefined) : undefined
);
const formError    = computed(() =>
  isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null
);
const resolvedValue = computed<T[]>(() => props.modelValue ?? formValue.value ?? []);

// ── Internal validation ───────────────────────────────────────────
const errorInternal = ref<string | null>(null);
const activeError   = computed(() => props.errorText ?? errorInternal.value ?? formError.value ?? null);
const hasError      = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);

// ── State classes ─────────────────────────────────────────────────
const wrapperClass = computed(() => ({
  'bt-input-multi-options__wrapper': true,
  'bt-input-multi-options--error':    hasError.value && !props.disabled,
  'bt-input-multi-options--disabled': props.disabled,
}));

// ── Toggle ────────────────────────────────────────────────────────
function onToggle(itemValue: T, checked: boolean) {
  if (props.disabled) return;
  errorInternal.value = null;
  const current = resolvedValue.value;
  const next = checked
    ? [...current, itemValue]
    : current.filter(v => v !== itemValue);
  emit('update:modelValue', next);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, next);
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
}

// ── Validation ────────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? []);
  errorInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });
</script>

<template>
  <div :class="wrapperClass">

    <!-- Label row -->
    <div v-if="label" class="bt-input-multi-options__label-row">
      <span class="bt-input-multi-options__label">
        {{ label }}<span v-if="required" class="bt-input-multi-options__required">*</span>
      </span>
    </div>

    <!-- Checkbox group -->
    <!-- aria-required on role=group is valid per ARIA 1.2; older AT may not announce it. -->
    <div
      :id="fieldId"
      class="bt-input-multi-options__group"
      role="group"
      :aria-required="resolvedRequired || undefined"
      :aria-disabled="disabled || undefined"
      :aria-invalid="(hasError && !disabled) || undefined"
    >
      <BTCheckbox
        v-for="item in items"
        :key="String(item.value)"
        :modelValue="resolvedValue.includes(item.value)"
        :label="item.label"
        :disabled="disabled || item.disabled"
        :error="hasError && !disabled"
        @update:modelValue="onToggle(item.value, $event)"
      />
    </div>

    <!-- Helper / error text — error text suppressed when the group is disabled. -->
    <div v-if="(!disabled && activeError) || helperText" class="bt-input-multi-options__helper">
      <span
        class="bt-input-multi-options__helper-text"
        :class="{ 'bt-input-multi-options__helper-text--error': hasError && !disabled }"
      >
        {{ (!disabled && activeError) || helperText }}
      </span>
    </div>

  </div>
</template>
