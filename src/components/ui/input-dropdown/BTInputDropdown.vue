<!--
  BTInputDropdown — Input-family select field with floating BTDropdownList panel.

  Clicking the field opens the panel. Selecting an item commits the value
  and closes the panel. Internal filtering when hasSearch=true.

  Figma node 555-3041.

  Usage — basic:
    <BTInputDropdown label="City" :items="cities" v-model="city" />

  Usage — with search:
    <BTInputDropdown label="Country" :items="countries" v-model="country" hasSearch />

  Usage — with validation:
    <BTInputDropdown label="Status" :items="statuses" v-model="status" ref="picker"
                     :validator="(v) => v ? null : 'Required'" />
-->
<script setup lang="ts" generic="T = string">
import '@/components/ui/input-dropdown/BTInputDropdown.css';
import { ref, computed, inject, watch, onBeforeUnmount, getCurrentInstance } from 'vue';
import type { BTInputDropdownProps } from '@/components/ui/input-dropdown/BTInputDropdown.types';
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';
import BTDropdownList from '@/components/ui/dropdown-list/BTDropdownList.vue';
import { positionBelow } from '@/components/ui/input-dropdown/internal/positionFloating';
import cancelIcon from '@/components/ui/input-dropdown/icons/cancel.svg';

// ── Inline types ──────────────────────────────────────────────
type ValidatorFn = (value: T | null) => string | null;

const props = withDefaults(
  defineProps<BTInputDropdownProps<T> & { validator?: ValidatorFn }>(),
  {
    hasSearch:   false,
    size:        'default',
    disabled:    false,
    readOnly:    false,
    required:    false,
    emptyLabel:  'No result found.',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: T | null];
  clear: [];
}>();

// ── BTForm wiring (direct coordinator) ───────────────────────
const formValues   = inject<Record<string, unknown> | null>('bt-form-values', null);
const formErrorFor = inject<((name: string) => string | null) | null>('bt-form-error-for', null);
const formSetField = inject<((name: string, v: unknown) => void) | null>('bt-form-set-field', null);
const formTouch    = inject<((name: string) => void) | null>('bt-form-touch', null);
const isInForm     = computed(() => formValues !== null && typeof props.name === 'string');
const formValue    = computed(() => isInForm.value ? (formValues![props.name as string] as T | null | undefined) : undefined);
const formError    = computed(() => isInForm.value && formErrorFor ? formErrorFor(props.name as string) : null);

// ── UID for label ─────────────────────────────────────────────
const _uid    = getCurrentInstance()?.uid;
const fieldId = computed(() => props.id ?? `bt-input-dropdown-${_uid}`);

// ── Refs ──────────────────────────────────────────────────────
const fieldRef      = ref<HTMLDivElement | null>(null);
const panelRef      = ref<HTMLDivElement | null>(null);
const isOpen        = ref(false);
const searchQuery   = ref('');
const errorInternal = ref<string | null>(null);

// ── Derived ──────────────────────────────────────────────────
const activeError   = computed(() => props.errorText ?? formError.value ?? errorInternal.value ?? null);
const hasError      = computed(() => !!activeError.value);
const resolvedRequired = computed(() => props.required);
const resolvedValue = computed(() => props.modelValue !== undefined ? props.modelValue : (formValue.value ?? null));
const hasValue      = computed(() => resolvedValue.value != null);
// Float label only when a value is selected — not on open-with-no-value.
// For the default (48px fixed height) this didn't matter, but for the small
// (auto-height) variant floating on open-empty shrinks padding from 12px → 4px,
// visually collapsing the field. A dropdown has no typed text to show while
// the panel is open, so there's no UX reason to float the label when empty.
const labelFloating = computed(() => hasValue.value);
// isOpen gate is intentional per spec (node 555-3041): clear only shows while
// the panel is active. Mirrors BTInputDate behaviour.
const showClear     = computed(
  () => isOpen.value && hasValue.value && !props.disabled && !props.readOnly,
);

// ── Selected item & display string ───────────────────────────
const selectedItem = computed<BTDropdownItem<T> | undefined>(() =>
  props.items.find(item => item.value === resolvedValue.value),
);

const displayStr = computed<string>(() => {
  if (!selectedItem.value) return '';
  if (props.getLabel) return props.getLabel(selectedItem.value);
  return selectedItem.value.label ?? '';
});

// ── Internal search filtering ─────────────────────────────────
const filteredItems = computed<BTDropdownItem<T>[]>(() => {
  const base = (props.hasSearch && searchQuery.value)
    ? props.items.filter(item => (item.label ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()))
    : props.items;
  // Mark the currently selected item so BTDropdownList renders the checked background
  return base.map(item => ({ ...item, checked: item.value === resolvedValue.value }));
});

// ── Panel positioning ─────────────────────────────────────────
function updatePosition() {
  const trigger = fieldRef.value;
  const panel   = panelRef.value;
  if (!trigger || !panel) return;
  panel.style.width = `${trigger.getBoundingClientRect().width}px`;
  positionBelow(trigger, panel, { gap: 4, margin: 8 });
  panel.classList.add('bt-input-dropdown__panel--visible');
}

// ── Click outside ─────────────────────────────────────────────
function onDocumentClick(e: MouseEvent) {
  if (
    !fieldRef.value?.contains(e.target as Node) &&
    !panelRef.value?.contains(e.target as Node)
  ) {
    if (isOpen.value) closePanel();
  }
}

// ── Scroll / resize tracking ──────────────────────────────────
// Capture-phase scroll catches ALL ancestor scroll containers (overflow:auto/scroll,
// modal panels, etc.). resize ensures repositioning after layout changes.
let rafId = 0;
function onScrollOrResize() {
  if (!isOpen.value) return;
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updatePosition);
}

// Run after Vue patches the DOM (panel div rendered via v-if)
watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      updatePosition();
      // Defer click-outside listener by one frame so the opening click doesn't
      // immediately trigger onDocumentClick
      requestAnimationFrame(() => {
        document.addEventListener('click', onDocumentClick);
      });
      // capture:true catches scroll on any ancestor container (modal, drawer, etc.)
      window.addEventListener('scroll',  onScrollOrResize, { capture: true, passive: true });
      window.addEventListener('resize',  onScrollOrResize, { passive: true });
    } else {
      document.removeEventListener('click', onDocumentClick);
      window.removeEventListener('scroll',  onScrollOrResize, { capture: true });
      window.removeEventListener('resize',  onScrollOrResize);
      cancelAnimationFrame(rafId);
    }
  },
  { flush: 'post' },
);

// ── Open / close ──────────────────────────────────────────────
function openPanel() {
  if (props.disabled || props.readOnly || isOpen.value) return;
  searchQuery.value = '';
  isOpen.value = true;
}

function closePanel() {
  isOpen.value = false;
  searchQuery.value = '';
}

function togglePanel() {
  isOpen.value ? closePanel() : openPanel();
}

// ── Keyboard ──────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (isOpen.value) { e.preventDefault(); closePanel(); }
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    togglePanel();
  }
}

// ── Selection ─────────────────────────────────────────────────
function onSelect(value: T) {
  emit('update:modelValue', value);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, value);
  if (isInForm.value && formTouch  && props.name) formTouch(props.name);
  errorInternal.value = null;
  closePanel();
}

// ── Clear ─────────────────────────────────────────────────────
function onClear(e: Event) {
  e.stopPropagation();
  errorInternal.value = null;
  emit('update:modelValue', null);
  if (isInForm.value && formSetField && props.name) formSetField(props.name, null);
  if (isInForm.value && formTouch  && props.name) formTouch(props.name);
  emit('clear');
  closePanel();
}

// ── Validation ────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(props.modelValue ?? null);
  errorInternal.value = result ?? null;
  return result === null;
}

// Cleanup on unmount in case the component is destroyed while panel is open
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  window.removeEventListener('scroll',  onScrollOrResize, { capture: true });
  window.removeEventListener('resize',  onScrollOrResize);
  cancelAnimationFrame(rafId);
});

defineExpose({ validate });

// ── CSS classes ──────────────────────────────────────────────
const fieldClass = computed(() => ({
  'bt-input-dropdown':                 true,
  'bt-input-dropdown--open':           isOpen.value,
  'bt-input-dropdown--error':          hasError.value,
  'bt-input-dropdown--disabled':       props.disabled,
  'bt-input-dropdown--label-floating': labelFloating.value,
  'bt-input-dropdown--small':          props.size === 'small',
}));
</script>

<template>
  <div class="bt-input-dropdown__wrapper">

    <div
      ref="fieldRef"
      :id="fieldId"
      :class="fieldClass"
      role="combobox"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-required="resolvedRequired || undefined"
      :aria-disabled="disabled || undefined"
      :aria-invalid="hasError || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="togglePanel"
      @keydown="onKeyDown"
    >

      <!-- Floating label -->
      <label
        v-if="label"
        :for="fieldId"
        class="bt-input-dropdown__label"
      >
        {{ label }}<span v-if="required" class="bt-input-dropdown__label-required">*</span>
      </label>

      <!-- Selected value text -->
      <span class="bt-input-dropdown__value">
        {{ displayStr }}
      </span>

      <!-- Clear (×) button — only when open and has value -->
      <Transition name="bt-input-clear">
        <button
          v-if="showClear"
          type="button"
          class="bt-input-dropdown__clear"
          aria-label="Clear selection"
          @pointerdown.prevent.stop="onClear"
        >
          <img :src="cancelIcon" alt="" />
        </button>
      </Transition>

      <!-- Chevron — rotates 180° via CSS when --open -->
      <span class="bt-input-dropdown__chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
        </svg>
      </span>

    </div>

    <!-- Floating panel (teleported to body for z-index correctness) -->
    <Teleport to="body">
      <div v-if="isOpen" ref="panelRef" class="bt-input-dropdown__panel">
        <BTDropdownList
          :items="filteredItems"
          :searchable="hasSearch"
          v-model:searchQuery="searchQuery"
          :emptyLabel="emptyLabel"
          @select="onSelect"
        />
      </div>
    </Teleport>

    <!-- Helper / error -->
    <div v-if="activeError || helperText" class="bt-input-dropdown__helper">
      <span
        class="bt-input-dropdown__helper-text"
        :class="{ 'bt-input-dropdown__helper-text--error': hasError }"
      >
        {{ activeError || helperText }}
      </span>
    </div>

  </div>
</template>
