<script setup lang="ts">
/**
 * BTCheckbox — Figma 504:4181
 *
 * @example
 * ```vue
 * <!-- Standalone -->
 * <BTCheckbox v-model="accepted" label="I agree" />
 *
 * <!-- Inside <BTForm> — auto-wires via `name` -->
 * <BTForm :initial-values="{ agree: false }" :validation="{ agree: v => v ? null : 'Required' }">
 *   <BTCheckbox name="agree" label="I agree" />
 * </BTForm>
 * ```
 */
import { computed, inject, onMounted, ref, watch } from 'vue';
import '@/components/ui/checkbox/BTCheckbox.css';
import type { BTCheckboxProps } from '@/components/ui/checkbox/BTCheckbox.types';

const props = withDefaults(defineProps<BTCheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false,
  error: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// ── BTForm wiring (optional) ────────────────────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() =>
  isInForm.value ? (formValues![props.name as string] as boolean | undefined) : undefined,
);
const formError    = computed(() =>
  isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null,
);

const resolvedChecked = computed(() => (props.modelValue ?? formValue.value ?? false));
const resolvedError   = computed(() => props.errorText ?? formError.value ?? null);
const hasError        = computed(() => props.error || !!resolvedError.value);
const resolvedSubtext = computed(() => resolvedError.value ?? props.subtext);

function syncIndeterminate() {
  if (inputRef.value) {
    inputRef.value.indeterminate = props.indeterminate;
  }
}

onMounted(syncIndeterminate);
watch(() => props.indeterminate, syncIndeterminate);

function onChange(event: Event) {
  if (props.disabled) return;
  const next = (event.target as HTMLInputElement).checked;
  emit('update:modelValue', next);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, next);
}

function onBlur() {
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
}
</script>

<template>
  <label
    class="bt-checkbox"
    :class="{
      'bt-checkbox--disabled': disabled,
      'bt-checkbox--error': hasError && !disabled,
      'bt-checkbox--no-padding': !label && !resolvedSubtext,
    }"
  >
    <span class="bt-checkbox__control">
      <input
        ref="inputRef"
        type="checkbox"
        class="bt-checkbox__input"
        :name="name"
        :checked="resolvedChecked"
        :disabled="disabled"
        :aria-invalid="hasError || undefined"
        @change="onChange"
        @blur="onBlur"
      />
      <span class="bt-checkbox__box" aria-hidden="true" />
    </span>

    <span v-if="label || resolvedSubtext" class="bt-checkbox__text">
      <span v-if="label" class="bt-checkbox__label">{{ label }}</span>
      <span v-if="resolvedSubtext" class="bt-checkbox__subtext">{{ resolvedSubtext }}</span>
    </span>
  </label>
</template>
