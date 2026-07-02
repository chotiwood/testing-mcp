<script setup lang="ts">
/**
 * BTSwitchField — Figma 504:8352 + 504:8234
 *
 * @example
 * ```vue
 * <!-- Right label (default) -->
 * <BTSwitchField v-model="enabled" labelRight="Enable notifications" />
 *
 * <!-- Both sides -->
 * <BTSwitchField v-model="value" labelLeft="Auto-save" labelRight="Enabled" />
 *
 * <!-- With subtext + error -->
 * <BTSwitchField
 *   v-model="value"
 *   labelRight="Notifications"
 *   subtextRight="Required field"
 *   :error="true"
 * />
 *
 * <!-- Inner text inside the track pill -->
 * <BTSwitchField v-model="value" :innerText="value ? 'ON' : 'OFF'" />
 * ```
 */
import '@/components/ui/switch-field/BTSwitchField.css';
import { computed, inject, nextTick, ref, watch } from 'vue';
import type { BTSwitchFieldProps } from '@/components/ui/switch-field/BTSwitchField.types';

const props = withDefaults(defineProps<BTSwitchFieldProps>(), {
  modelValue: false,
  disabled: false,
  error: false,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

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

const resolvedChecked = computed(() => props.modelValue ?? formValue.value ?? false);
const resolvedError   = computed(() => props.errorText ?? formError.value ?? null);
const hasError        = computed(() => props.error || !!resolvedError.value);
const resolvedSubtextRight = computed(() =>
  resolvedError.value && (props.labelRight || (!props.labelLeft && !props.labelRight))
    ? resolvedError.value
    : props.subtextRight,
);
const resolvedSubtextLeft = computed(() =>
  resolvedError.value && props.labelLeft && !props.labelRight
    ? resolvedError.value
    : props.subtextLeft,
);

const thumbEl = ref<HTMLSpanElement | null>(null);
const innerTextEl = ref<HTMLSpanElement | null>(null);

/** FLIP animation: slide element from `fromDx` back to its natural position. */
function flipEl(el: HTMLElement, fromDx: number): void {
  if (Math.abs(fromDx) < 0.5) return;
  el.style.transition = 'none';
  el.style.transform = `translateX(${fromDx}px)`;
  void el.getBoundingClientRect(); // force reflow so browser registers the start state
  el.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
  el.style.transform = 'translateX(0)';
  el.addEventListener(
    'transitionend',
    () => {
      el.style.removeProperty('transition');
      el.style.removeProperty('transform');
    },
    { once: true },
  );
}

// Before the DOM updates (flush:'pre'), snapshot element positions.
// After the DOM updates (nextTick), compute the delta and play FLIP.
watch(
  () => props.modelValue,
  () => {
    if (!props.innerText || !thumbEl.value || !innerTextEl.value) return;
    const thumbBefore = thumbEl.value.getBoundingClientRect();
    const textBefore = innerTextEl.value.getBoundingClientRect();
    nextTick(() => {
      if (!thumbEl.value || !innerTextEl.value) return;
      const thumbAfter = thumbEl.value.getBoundingClientRect();
      const textAfter = innerTextEl.value.getBoundingClientRect();
      flipEl(thumbEl.value, thumbBefore.left - thumbAfter.left);
      flipEl(innerTextEl.value, textBefore.left - textAfter.left);
    });
  },
  { flush: 'pre' },
);

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
    class="bt-switch-field"
    :class="{
      'bt-switch-field--disabled': disabled,
      'bt-switch-field--error': hasError && !disabled,
      'bt-switch-field--inner-text': !!innerText,
      'bt-switch-field--sm': size === 'sm',
    }"
  >
    <!-- Left text slot -->
    <span
      v-if="labelLeft || resolvedSubtextLeft"
      class="bt-switch-field__text"
    >
      <span v-if="labelLeft" class="bt-switch-field__label">{{ labelLeft }}</span>
      <span v-if="resolvedSubtextLeft" class="bt-switch-field__subtext">{{ resolvedSubtextLeft }}</span>
    </span>

    <!-- Hidden native checkbox for a11y -->
    <input
      type="checkbox"
      class="bt-switch-field__input"
      :name="name"
      :checked="resolvedChecked"
      :disabled="disabled"
      :aria-checked="resolvedChecked"
      :aria-invalid="hasError || undefined"
      @change="onChange"
      @blur="onBlur"
    />

    <!-- Visual track + thumb (+ optional inner text) -->
    <span class="bt-switch-field__track" aria-hidden="true">
      <span ref="thumbEl" class="bt-switch-field__thumb" />
      <span v-if="innerText" ref="innerTextEl" class="bt-switch-field__inner-text">{{ innerText }}</span>
    </span>

    <!-- Right text slot (default) -->
    <span
      v-if="labelRight || resolvedSubtextRight"
      class="bt-switch-field__text"
    >
      <span v-if="labelRight" class="bt-switch-field__label">{{ labelRight }}</span>
      <span v-if="resolvedSubtextRight" class="bt-switch-field__subtext">{{ resolvedSubtextRight }}</span>
    </span>
  </label>
</template>
