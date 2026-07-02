<!--
  BTInputFieldUnit — split input combining a unit selector (left) with a
  text field (right). Each panel has its own independent border that activates
  on interaction: left activates when the dropdown opens, right activates when
  the text field is focused.

  Figma node 702-3937.

  Usage:
    <BTInputFieldUnit
      :units="[{ label: 'IDR', value: 'IDR' }, { label: 'USD', value: 'USD' }]"
      unit-label="Currency"
      label="Amount"
      v-model="rawAmount"
      :formatter="(v, u) => u?.value === 'USD' ? `$ ${v.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : `Rp ${v.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`"
      :sanitizer="(v) => v.replace(/\D/g, '')"
      keyboard-type="number"
      @unit-changed="onUnitChanged"
    />
-->
<script lang="ts">
// Module-level counter — runs once per module load; incremented per instance
let _idCounter = 0;
</script>

<script setup lang="ts">
import { ref, computed, inject, nextTick, watch, onMounted, onUnmounted } from 'vue';
import '@/components/ui/input/FieldUnit/BTInputFieldUnit.css';
import type { BTInputFieldUnitProps, BTInputFieldUnitOption } from '@/components/ui/input/FieldUnit/BTInputFieldUnit.types';

// Inline validator type so Vue SFC compiler always includes it in the runtime
// prop schema — importing only from the types file can be missed by Vite HMR.
type ValidatorFn = (value: string, unit: BTInputFieldUnitOption | null) => string | null;

const props = withDefaults(defineProps<BTInputFieldUnitProps & { validator?: ValidatorFn }>(), {
  disabled: false,
  required: false,
  clearable: true,
  hasSearch: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'unit-changed': [unit: BTInputFieldUnitOption];
}>();

const _localFieldId = `bt-input-field-unit-${++_idCounter}`;

const fieldId = computed(() => _localFieldId);

// ── BTForm wiring (direct coordinator) ───────────────────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() => isInForm.value ? (formValues![props.name as string] as string | undefined) : undefined);
const formError    = computed(() => isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null);

// ── State ─────────────────────────────────────────────────────────────────
const rootEl     = ref<HTMLElement | null>(null);
const fieldInput = ref<HTMLInputElement | null>(null);

const isDropdownOpen = ref(false);
const isFieldFocused = ref(false);
const searchQuery    = ref('');

const internalUnit = ref<BTInputFieldUnitOption | undefined>(
  props.initialUnit ?? props.units[0],
);

watch(
  () => props.units,
  (newUnits) => {
    // If the current internal selection is no longer in the new units list, reset to first
    const stillValid = newUnits.some(u => u.value === internalUnit.value?.value);
    if (!stillValid) {
      internalUnit.value = props.initialUnit ?? newUnits[0];
    }
  },
);

// ── Derived ───────────────────────────────────────────────────────────────
const currentUnit = computed<BTInputFieldUnitOption | undefined>(() =>
  props.selectedUnit !== undefined ? props.selectedUnit : internalUnit.value,
);

const errorTextInternal = ref<string | null>(null);
const activeError = computed(() => props.errorText ?? formError.value ?? errorTextInternal.value ?? null);
const hasError    = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);

const resolvedValue = computed(() => props.modelValue !== undefined ? props.modelValue : (formValue.value ?? ''));

const displayValue = computed(() => {
  const raw = resolvedValue.value;
  if (props.formatter && raw !== '') {
    return props.formatter(raw, currentUnit.value ?? null);
  }
  return raw;
});

const fieldLabelFloating = computed(
  () => !!props.label && (isFieldFocused.value || !!resolvedValue.value),
);

const showClear = computed(
  () =>
    props.clearable &&
    !!resolvedValue.value &&
    isFieldFocused.value &&
    !props.disabled,
);

const filteredUnits = computed(() => {
  if (!props.hasSearch || !searchQuery.value) return props.units;
  if (props.itemsFilter) return props.itemsFilter(props.units, searchQuery.value);
  const q = searchQuery.value.toLowerCase();
  return props.units.filter(u => u.label.toLowerCase().includes(q));
});

// Always use type="text" so the browser never rejects formatter output
// (type="number" rejects strings like "Rp 1.000", type="url" rejects bare domains).
// inputMode drives the mobile soft-keyboard without any browser value-mangling.
// tel keeps its own type — browsers accept dashes/spaces and show the dial-pad.
const inputType = computed(() =>
  props.keyboardType === 'tel' ? 'tel' : 'text',
);

const inputMode = computed((): string | undefined => {
  const map: Record<string, string> = {
    number:  'numeric',
    decimal: 'decimal',
    tel:     'tel',
    url:     'url',
  };
  return map[props.keyboardType ?? ''] ?? undefined;
});

// ── CSS class objects ──────────────────────────────────────────────────────
const leftClass = computed(() => ({
  'bt-input-field-unit__left': true,
  'bt-input-field-unit__left--active': isDropdownOpen.value,
  'bt-input-field-unit__left--error': hasError.value,
  'bt-input-field-unit__left--disabled': props.disabled,
}));

const rightClass = computed(() => ({
  'bt-input-field-unit__right': true,
  'bt-input-field-unit__right--active': isFieldFocused.value,
  'bt-input-field-unit__right--error': hasError.value,
  'bt-input-field-unit__right--disabled': props.disabled,
}));

// ── Dropdown ──────────────────────────────────────────────────────────────
function openDropdown() {
  if (props.disabled) return;
  searchQuery.value = '';
  isDropdownOpen.value = true;
}
function closeDropdown() { isDropdownOpen.value = false; }
function toggleDropdown() { isDropdownOpen.value ? closeDropdown() : openDropdown(); }

function selectUnit(option: BTInputFieldUnitOption) {
  internalUnit.value = option;
  emit('unit-changed', option);
  closeDropdown();
}

function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));

// ── Field ─────────────────────────────────────────────────────────────────
function onFieldInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  const sanitized = props.sanitizer
    ? props.sanitizer(raw, currentUnit.value ?? null)
    : raw;
  emit('update:modelValue', sanitized);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, sanitized);
}

function onFieldFocus() { isFieldFocused.value = true; }
function onFieldBlur()  {
  isFieldFocused.value = false;
  if (isInForm.value && formTouch && props.name) formTouch(props.name);
}

function onClear() {
  emit('update:modelValue', '');
  if (isInForm.value && formSetField && props.name) formSetField(props.name, '');
  errorTextInternal.value = null;
  nextTick(() => fieldInput.value?.focus());
}

function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? '', currentUnit.value ?? null);
  errorTextInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });
</script>

<template>
  <div ref="rootEl" class="bt-input-field-unit__wrapper">
    <div class="bt-input-field-unit__row">

      <!-- Left panel: unit selector -->
      <div
        :class="leftClass"
        role="button"
        :aria-expanded="isDropdownOpen"
        tabindex="0"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.escape="closeDropdown"
      >
        <span v-if="unitLabel" class="bt-input-field-unit__unit-label">
          {{ unitLabel }}<span v-if="required" class="bt-input-field-unit__required">*</span>
        </span>
        <div class="bt-input-field-unit__unit-row">
          <span class="bt-input-field-unit__unit-value">
            {{ currentUnit?.label ?? '—' }}
          </span>
          <button
            type="button"
            class="bt-input-field-unit__unit-chevron"
            :class="{ 'bt-input-field-unit__unit-chevron--open': isDropdownOpen }"
            :disabled="disabled"
            tabindex="-1"
            @click.stop="toggleDropdown"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        <!-- Dropdown -->
        <div v-if="isDropdownOpen" class="bt-input-field-unit__dropdown" role="listbox">
          <input
            v-if="hasSearch"
            v-model="searchQuery"
            class="bt-input-field-unit__dropdown-search"
            type="text"
            placeholder="Search..."
            @mousedown.stop
            @click.stop
            @keydown.escape.stop="closeDropdown"
          />
          <template v-if="filteredUnits.length > 0">
            <div
              v-for="option in filteredUnits"
              :key="option.value"
              class="bt-input-field-unit__dropdown-item"
              :class="{ 'bt-input-field-unit__dropdown-item--selected': currentUnit?.value === option.value }"
              role="option"
              :aria-selected="currentUnit?.value === option.value"
              @mousedown.prevent="selectUnit(option)"
            >
              {{ option.label }}
            </div>
          </template>
          <div v-else class="bt-input-field-unit__dropdown-empty">No result found.</div>
        </div>
      </div>

      <!-- Right panel: text field -->
      <div :class="rightClass">
        <label
          v-if="label"
          :for="fieldId"
          class="bt-input-field-unit__field-label"
          :class="{ 'bt-input-field-unit__field-label--floating': fieldLabelFloating }"
        >
          {{ label }}<span v-if="required" class="bt-input-field-unit__required">*</span>
        </label>
        <div class="bt-input-field-unit__right-inner">
          <input
            ref="fieldInput"
            :id="fieldId"
            class="bt-input-field-unit__field"
            :class="{ 'bt-input-field-unit__field--has-label': !!label }"
            :type="inputType"
            :inputmode="inputMode as 'text' | 'none' | 'search' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | undefined"
            :value="displayValue"
            :placeholder="fieldLabelFloating || !label ? (hintText ?? '') : ''"
            :disabled="disabled"
            :aria-invalid="hasError || undefined"
            :aria-required="resolvedRequired || undefined"
            @input="onFieldInput"
            @focus="onFieldFocus"
            @blur="onFieldBlur"
          />
          <Transition name="bt-input-clear">
            <button
              v-if="showClear"
              type="button"
              class="bt-input-field-unit__clear"
              aria-label="Clear value"
              tabindex="-1"
              @mousedown.prevent="onClear"
            >
              <!-- Material cancel filled (circle with ×) -->
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
            </button>
          </Transition>
        </div>
      </div>

    </div>

    <!-- Helper / error text -->
    <div v-if="activeError || helperText" class="bt-input-field-unit__helper">
      <span
        class="bt-input-field-unit__helper-text"
        :class="{ 'bt-input-field-unit__helper-text--error': hasError }"
      >
        {{ activeError || helperText }}
      </span>
    </div>
  </div>
</template>
