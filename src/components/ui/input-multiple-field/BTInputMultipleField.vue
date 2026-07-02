<!--
  BTInputMultipleField — multi-value tag input with checkbox dropdown.

  Layout (flex-row):
  ┌── field ──────────────────────────────────────────────────┐
  │  [content flex-1]                    [actions flex-none]   │
  │   label (14px resting → 12px float)  [clear-all?]         │
  │   body (tags + cursor)               [chevron ↓ / ↑]      │
  └───────────────────────────────────────────────────────────┘

  Height contract:
  • Resting (empty + idle): min-height 48px, align-items:center
    → label (20px line-height) is vertically centered in the field.
  • Expanded (label floating):
    – wrap type:   py-6, grows with tag rows.
    – scroll type: py-6, locked 48px (6+16label+20body+6 = 48).

  Chevron behaviour:
  • keyboard_arrow_down  — always visible when items are provided + not open.
  • keyboard_arrow_up    — when the dropdown is open.
  • cancel (clear-all)   — shown when active (focused/open) AND tags exist.

  Tag × icons: only rendered when the field is active (isFocused || isDropdownOpen).
  In the resting/filled state tags are display-only (no remove button).

  Figma node 555-4109.

  Usage:
    <BTInputMultipleField
      v-model="tags"
      label="Frameworks"
      :items="frameworkItems"
      has-search
    />

    <BTInputMultipleField v-model="tags" label="Skills" required />
-->
<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue';
import '@/components/ui/input-multiple-field/BTInputMultipleField.css';
import type { BTInputMultipleFieldProps } from '@/components/ui/input-multiple-field/BTInputMultipleField.types';
import BTTag from '@/components/ui/tag/BTTag.vue';
import BTDropdownList from '@/components/ui/dropdown-list/BTDropdownList.vue';
import type { BTTagItem } from '@/components/ui/tag/BTTag.types';
import type { BTDropdownItem } from '@/components/ui/dropdown-list/BTDropdownList.types';

// Inline validator type so Vue SFC compiler always includes it in the runtime
// prop schema — importing only from the types file can be missed by Vite HMR.
type ValidatorFn = (tags: BTTagItem[]) => string | null;

const props = withDefaults(defineProps<BTInputMultipleFieldProps & { validator?: ValidatorFn }>(), {
  items: () => [],
  type: 'wrap',
  required: false,
  disabled: false,
  hasSearch: false,
  emptyLabel: 'No result found.',
});

const emit = defineEmits<{
  'update:modelValue': [tags: BTTagItem[]];
}>();

// Generate a unique id per instance for label-input association
const _localInputId = `bt-imf-input-${Math.random().toString(36).slice(2, 9)}`;

const fieldInputId = computed(() => _localInputId);

// ── Refs ──────────────────────────────────────────────────────────────────
const wrapperEl         = ref<HTMLElement | null>(null);
const fieldContainerEl  = ref<HTMLElement | null>(null);  // .bt-input-multiple-field
const inputEl           = ref<HTMLInputElement | null>(null);
const dropdownOverlayEl = ref<HTMLElement | null>(null);

// Internal validator error (cleared on successful validate(); overridden by errorText prop)
const errorTextInternal = ref<string | null>(null);

const isFocused      = ref(false);
const isDropdownOpen = ref(false);
const inputValue     = ref('');
const searchQuery    = ref('');

// Fixed-position overlay style (computed on open via getBoundingClientRect)
const overlayStyle = ref<Record<string, string>>({});

// ── Derived state ─────────────────────────────────────────────────────────
const tags     = computed<BTTagItem[]>(() => props.modelValue ?? []);
const hasItems = computed(() => (props.items?.length ?? 0) > 0);

// Field is "active" when the native input is focused OR the dropdown is open
const isActive = computed(() => isFocused.value || isDropdownOpen.value);

const hasContent = computed(() => tags.value.length > 0 || inputValue.value.length > 0);

const labelFloating = computed(
  () => !!props.label && (isActive.value || hasContent.value),
);

// filteredItems: pre-filtered + checked-state-stamped list passed to BTDropdownList
const filteredItems = computed<BTDropdownItem<string>[]>(() => {
  const src = props.items ?? [];
  let filtered: BTDropdownItem<string>[];

  if (!props.hasSearch || !searchQuery.value) {
    filtered = src;
  } else if (props.itemsFilter) {
    filtered = props.itemsFilter(src, searchQuery.value);
  } else {
    const q = searchQuery.value.toLowerCase();
    filtered = src.filter(i => (i.label ?? '').toLowerCase().includes(q));
  }

  // Stamp checked state from current tags (match by item.value === tag.id)
  return filtered.map(item => ({
    ...item,
    checked: tags.value.some(t => t.id === item.value),
  }));
});

// Active error: external errorText prop takes priority over internal validator result
const activeError = computed(() => props.errorText ?? errorTextInternal.value ?? null);
const resolvedRequired = computed(() => props.required);

// ── CSS classes ───────────────────────────────────────────────────────────
const fieldClass = computed(() => ({
  'bt-input-multiple-field': true,
  [`bt-input-multiple-field--${props.type}`]: true,
  'bt-input-multiple-field--focused':  isActive.value,
  'bt-input-multiple-field--error':    !!activeError.value,
  'bt-input-multiple-field--disabled': props.disabled,
}));

// ── Overlay positioning ───────────────────────────────────────────────────
function syncOverlayPosition() {
  if (!wrapperEl.value) return;
  const { bottom, left, width } = wrapperEl.value.getBoundingClientRect();
  overlayStyle.value = {
    position: 'fixed',
    top:   `${bottom + 4}px`,
    left:  `${left}px`,
    width: `${width}px`,
    zIndex: '200',
  };
}

// ── Dropdown ──────────────────────────────────────────────────────────────
function openDropdown() {
  if (props.disabled) return;
  syncOverlayPosition();
  searchQuery.value    = '';
  isDropdownOpen.value = true;
}

function closeDropdown() { isDropdownOpen.value = false; }
function toggleDropdown() { isDropdownOpen.value ? closeDropdown() : openDropdown(); }

// Click-outside closes the dropdown
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node;
  const insideWrapper = wrapperEl.value?.contains(target) ?? false;
  const insideOverlay = dropdownOverlayEl.value?.contains(target) ?? false;
  if (!insideWrapper && !insideOverlay) closeDropdown();
}

// ── Height animation (wrap type) ──────────────────────────────────────────
// When tags add/remove a row, measure the content height and explicitly set
// the field container's height so the CSS `transition: height` can animate it.
//
// Padding math (must match the :has(.--floating) CSS rule):
//   floating label → 4px top + 4px bottom = 8px total
//   resting        → 0px (min-height:48px + align-items:center handles it)
function syncFieldHeight() {
  if (props.type !== 'wrap' || !fieldContainerEl.value) return;
  const content = fieldContainerEl.value.querySelector<HTMLElement>(
    '.bt-input-multiple-field__content',
  );
  if (!content) return;
  const pad = labelFloating.value ? 8 : 0;
  const h   = Math.max(48, content.scrollHeight + pad);
  fieldContainerEl.value.style.height = `${h}px`;
}

// Run after every DOM update caused by tag or focus-state changes
watch([tags, isActive, labelFloating], async () => {
  await nextTick();
  syncFieldHeight();
  // Re-anchor the dropdown at the new bottom after the height transition (200ms)
  if (isDropdownOpen.value) {
    syncOverlayPosition();
    setTimeout(() => { if (isDropdownOpen.value) syncOverlayPosition(); }, 210);
  }
}, { flush: 'post' });

// ── Dropdown live-tracking ────────────────────────────────────────────────
// ResizeObserver on the wrapper fires on every layout frame during the CSS
// height transition → dropdown smoothly follows the field bottom.
let _wrapperRO: ResizeObserver | null = null;

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside);
  _wrapperRO = new ResizeObserver(() => {
    if (isDropdownOpen.value) syncOverlayPosition();
  });
  if (wrapperEl.value) _wrapperRO.observe(wrapperEl.value);
  syncFieldHeight(); // initialise explicit height on mount
});
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside);
  _wrapperRO?.disconnect();
  _wrapperRO = null;
});

// ── Focus ─────────────────────────────────────────────────────────────────
function onBodyClick() {
  if (props.disabled) return;
  // The body (which contains the input) is hidden via v-show when label is not
  // floating. Calling .focus() on a display:none element does nothing in all
  // browsers. Set isFocused first so Vue removes the v-show → display:none,
  // then focus in the next tick once the input is in the layout.
  isFocused.value = true;
  nextTick(() => inputEl.value?.focus());
}

function onInputFocus() { isFocused.value = true; }
function onInputBlur()  { isFocused.value = false; }

// ── Tag operations ────────────────────────────────────────────────────────
// Enter: commit typed text as a free-text tag
function onEnter() {
  const v = inputValue.value.trim();
  if (!v) return;
  emit('update:modelValue', [...tags.value, { label: v, id: crypto.randomUUID() }]);
  inputValue.value = '';
}

// Backspace on empty cursor: remove the last tag
function onBackspace() {
  if (inputValue.value === '' && tags.value.length > 0) {
    emit('update:modelValue', tags.value.slice(0, -1));
  }
}

function removeTag(tag: BTTagItem) {
  emit('update:modelValue', tags.value.filter(t => t.id !== tag.id));
}

// Clear all tags + typed input
function clearAll() {
  emit('update:modelValue', []);
  inputValue.value = '';
  nextTick(() => inputEl.value?.focus());
}

// ── Predefined item toggled from BTDropdownList ───────────────────────────
function onItemSelect(value: string) {
  const current  = tags.value;
  const existing = current.find(t => t.id === value);
  if (existing) {
    // Deselect: remove from tag list
    emit('update:modelValue', current.filter(t => t.id !== value));
  } else {
    // Select: find item label and add as tag
    const item = (props.items ?? []).find(i => i.value === value);
    if (!item?.label) return;
    emit('update:modelValue', [...current, { label: item.label, id: value }]);
  }
}

// ── Validation ────────────────────────────────────────────────────────────
function validate(): boolean {
  if (!props.validator) return true;
  const result = props.validator(tags.value);
  errorTextInternal.value = result ?? null;
  return result === null;
}

defineExpose({ validate });
</script>

<template>
  <div ref="wrapperEl" class="bt-input-multiple-field__wrapper">

    <!-- Field container: flex-row, height controlled via JS (syncFieldHeight) -->
    <div ref="fieldContainerEl" :class="fieldClass" @click="onBodyClick">

      <!-- Content column: label + body (tags + cursor) -->
      <div class="bt-input-multiple-field__content">

        <!-- Label: inline flow, 14px resting → 12px floating -->
        <label
          v-if="label"
          :for="fieldInputId"
          class="bt-input-multiple-field__label"
          :class="{ 'bt-input-multiple-field__label--floating': labelFloating }"
        >
          {{ label }}<span v-if="required" class="bt-input-multiple-field__required">*</span>
        </label>

        <!-- Body: tags + cursor — shown when label is floating or there is no label -->
        <div v-show="labelFloating || !label" class="bt-input-multiple-field__body">
          <!-- Tags: × icon only when the field is active (focused / dropdown open).
               The @mousedown.prevent wrapper keeps the input focused when the
               user clicks the × button — without it, mousedown steals focus from
               the input before click fires, making onRemove appear to do nothing. -->
          <span
            v-for="tag in tags"
            :key="tag.id ?? tag.label"
            @mousedown.prevent
          >
            <BTTag
              :label="tag.label"
              :on-remove="isActive && !disabled ? () => removeTag(tag) : undefined"
            />
          </span>
          <!-- Inline text cursor — hidden when field is inactive so it doesn't
               leave a blank 20px row below the tags in the resting/filled state -->
          <input
            v-show="isActive"
            :id="fieldInputId"
            ref="inputEl"
            v-model="inputValue"
            class="bt-input-multiple-field__cursor"
            :disabled="disabled"
            :placeholder="!hasContent && !label ? 'Type and press Enter...' : ''"
            :aria-invalid="!!activeError || undefined"
            :aria-required="resolvedRequired || undefined"
            @focus="onInputFocus"
            @blur="onInputBlur"
            @keydown.enter.prevent="onEnter"
            @keydown.backspace="onBackspace"
            @click.stop
          />
        </div>
      </div>

      <!-- Right actions: clear-all (×) + chevron -->
      <div class="bt-input-multiple-field__actions">

        <!-- Clear-all: shown only when active AND there are tags to clear -->
        <Transition name="bt-input-clear">
          <button
            v-if="isActive && tags.length > 0"
            type="button"
            class="bt-input-multiple-field__clear-all"
            aria-label="Clear all"
            tabindex="-1"
            @mousedown.prevent="clearAll"
          >
            <!-- Material cancel icon (filled circle with ×) -->
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
          </button>
        </Transition>

        <!-- Chevron: ↓ when closed, ↑ when open (separate paths, no rotation) -->
        <button
          v-if="hasItems"
          type="button"
          class="bt-input-multiple-field__chevron"
          :disabled="disabled"
          :aria-expanded="isDropdownOpen"
          :aria-label="isDropdownOpen ? 'Close options' : 'Open options'"
          @click.stop="toggleDropdown"
        >
          <!-- keyboard_arrow_down -->
          <svg v-if="!isDropdownOpen" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
          <!-- keyboard_arrow_up -->
          <svg v-else viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Dropdown overlay — Teleported to body so it escapes stacking contexts -->
    <Teleport to="body">
      <div
        v-if="isDropdownOpen"
        :ref="(el) => { dropdownOverlayEl = el as HTMLElement | null }"
        class="bt-input-mf-overlay"
        :style="overlayStyle"
      >
        <BTDropdownList
          :items="filteredItems"
          variant="checkbox"
          :searchable="hasSearch"
          :search-query="searchQuery"
          :empty-label="emptyLabel"
          @update:search-query="searchQuery = $event"
          @select="onItemSelect"
        />
      </div>
    </Teleport>

    <!-- Helper / error text -->
    <div v-if="activeError || helperText" class="bt-input-multiple-field__helper">
      <span
        class="bt-input-multiple-field__helper-text"
        :class="{ 'bt-input-multiple-field__helper-text--error': !!activeError }"
      >
        {{ activeError || helperText }}
      </span>
    </div>

  </div>
</template>
