<script setup lang="ts">
/**
 * BTToast — single toast card.
 *
 * Figma source: node 95:101 (file WANr9drWYNYbMPuT2sMeHi).
 *
 * Renders one toast row. The container/animation/positioning is owned
 * by `<BTToaster>` — this component only renders the card body.
 *
 * @example
 *   <BTToast :item="item" @close="onClose" />
 */
import { computed } from 'vue';
import type { BTToastItem } from '@/components/ui/toast/BTToast.types';
import '@/components/ui/toast/BTToast.css';

const props = defineProps<{ item: BTToastItem }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const isDefault = computed(() => props.item.type === 'default');
const isDescription = computed(() => props.item.type === 'description');
const hasIcon = computed(
  () => !isDefault.value && !isDescription.value,
);

const iconClass = computed(() => `bt-toast__icon bt-toast__icon--${props.item.type}`);
const rootClass = computed(() => `bt-toast bt-toast--${props.item.type}`);

// Auto-detect direction from text content — the toast is teleported to
// <body> so ancestor dir="rtl" doesn't reach it. Any Arabic/Hebrew glyph
// in the title or description flips the toast to RTL.
const RTL_GLYPH = /[֐-ۿݐ-ݿࢠ-ࣿיִ-﷿ﹰ-﻿]/;
const toastDir = computed<'ltr' | 'rtl'>(() => {
  const haystack = `${props.item.title ?? ''} ${(props.item as { description?: string }).description ?? ''}`;
  return RTL_GLYPH.test(haystack) ? 'rtl' : 'ltr';
});

function onAction(): void {
  props.item.onAction?.();
}
</script>

<template>
  <div :class="rootClass" :dir="toastDir" role="status" aria-live="polite">
    <!-- Status icon (success/error/warning/info) -->
    <span v-if="hasIcon" :class="iconClass" aria-hidden="true">
      <svg v-if="item.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M7 12 L10 15 L17 8" />
      </svg>
      <svg v-else-if="item.type === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7 L12 13" />
        <path d="M12 16 L12 17" />
      </svg>
      <svg v-else-if="item.type === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86 L1.82 18 A2 2 0 0 0 3.64 21 L20.36 21 A2 2 0 0 0 22.18 18 L13.71 3.86 A2 2 0 0 0 10.29 3.86 Z" />
        <path d="M12 9 L12 13" />
        <path d="M12 16 L12 17" />
      </svg>
      <svg v-else-if="item.type === 'info'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16 L12 12" />
        <path d="M12 8 L12 9" />
      </svg>
    </span>

    <!-- Body -->
    <div class="bt-toast__body">
      <!-- default: row layout, title + close on the right -->
      <template v-if="isDefault">
        <p class="bt-toast__title">{{ item.title }}</p>
        <button type="button" class="bt-toast__close" aria-label="Close" @click="emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 L6 18" />
            <path d="M6 6 L18 18" />
          </svg>
        </button>
      </template>

      <!-- description: title + description + optional action -->
      <template v-else-if="isDescription">
        <div class="bt-toast__row">
          <p class="bt-toast__title">{{ item.title }}</p>
          <button type="button" class="bt-toast__close" aria-label="Close" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 L6 18" />
              <path d="M6 6 L18 18" />
            </svg>
          </button>
        </div>
        <p v-if="item.description" class="bt-toast__description">{{ item.description }}</p>
        <button v-if="item.actionLabel" type="button" class="bt-toast__action" @click="onAction">{{ item.actionLabel }}</button>
      </template>

      <!-- typed (success/error/warning/info): title + close on the right -->
      <template v-else>
        <div class="bt-toast__row">
          <p class="bt-toast__title">{{ item.title }}</p>
          <button type="button" class="bt-toast__close" aria-label="Close" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 L6 18" />
              <path d="M6 6 L18 18" />
            </svg>
          </button>
        </div>
        <p v-if="item.description" class="bt-toast__description">{{ item.description }}</p>
      </template>
    </div>
  </div>
</template>
