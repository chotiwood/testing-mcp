<script setup lang="ts">
/**
 * BTCard — flexible card organism with three visual variants.
 *
 * Figma: node 93:157 (no D/M prefix — all platforms).
 *
 * @example
 * ```vue
 * <!-- Default with footer actions -->
 * <BTCard title="Order #123" description="Placed 26 May 2026"
 *         @cancel="dismiss" @submit="confirm">
 *   <p>Order contents here.</p>
 * </BTCard>
 *
 * <!-- Small (no footer) -->
 * <BTCard variant="small" title="Label" description="Sub-label" />
 *
 * <!-- Image — pass any element via the #image slot -->
 * <BTCard variant="image" title="Title" @submit="confirm">
 *   <template #image>
 *     <img src="/photo.jpg" style="width:100%;height:100%;object-fit:cover" alt="Photo" />
 *   </template>
 * </BTCard>
 *
 * <!-- Image slot with custom widget -->
 * <BTCard variant="image" title="Title" @submit="confirm">
 *   <template #image>
 *     <video src="/promo.mp4" autoplay muted loop style="width:100%;height:100%;object-fit:cover" />
 *   </template>
 * </BTCard>
 *
 * <!-- With header-aside slot -->
 * <BTCard title="Report" @submit="save">
 *   <template #header-aside><BTButton.iconOnly … /></template>
 * </BTCard>
 * ```
 */
import { computed, useSlots } from 'vue';
import '@/components/ui/card/BTCard.css';
import type { BTCardProps } from '@/components/ui/card/BTCard.types';
import BTButton from '@/components/ui/button/BTButton.vue';

const props = withDefaults(defineProps<BTCardProps>(), {
  variant: 'default',
  hasFooter: null,
  cancelLabel: 'Cancel',
  submitLabel: 'Submit',
});

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit'): void;
}>();

const slots = useSlots();

/** Show footer unless the caller explicitly sets hasFooter, or variant is small. */
const showFooter = computed(() => {
  if (props.hasFooter !== null) return props.hasFooter!;
  return props.variant !== 'small';
});

const containerClass = computed(() => `bt-card bt-card--${props.variant}`);
</script>

<template>
  <div :class="containerClass">

    <!-- ── Image variant ─────────────────────────────────────────────── -->
    <template v-if="variant === 'image'">
      <!-- #image slot — pass any element: <img>, <video>, custom widget, etc. -->
      <div v-if="slots['image']" class="bt-card__image-slot">
        <slot name="image" />
      </div>
      <div class="bt-card__image-content">
        <!-- Header row — only rendered when at least one header element exists -->
        <div
          v-if="title || description || slots['title-action'] || slots['header-aside']"
          class="bt-card__header-row"
        >
          <div class="bt-card__header">
            <div v-if="title || slots['title-action']" class="bt-card__title-row">
              <p v-if="title" class="bt-card__title">{{ title }}</p>
              <div v-if="slots['title-action']" class="bt-card__title-action">
                <slot name="title-action" />
              </div>
            </div>
            <p v-if="description" class="bt-card__description">{{ description }}</p>
          </div>
          <div v-if="slots['header-aside']" class="bt-card__header-aside">
            <slot name="header-aside" />
          </div>
        </div>
        <!-- Body -->
        <div v-if="slots.default" class="bt-card__body">
          <slot />
        </div>
        <!-- Footer -->
        <template v-if="showFooter">
          <slot v-if="slots.footer" name="footer" />
          <div v-else class="bt-card__footer">
            <BTButton :label="cancelLabel" variant="secondary-light" size="small" @click="$emit('cancel')" />
            <BTButton :label="submitLabel" variant="primary" size="small" @click="$emit('submit')" />
          </div>
        </template>
      </div>
    </template>

    <!-- ── Default / Small variants ─────────────────────────────────── -->
    <template v-else>
      <!-- Header row — only rendered when at least one header element exists -->
      <div
        v-if="title || description || slots['title-action'] || (slots['header-aside'] && variant !== 'small')"
        class="bt-card__header-row"
      >
        <div class="bt-card__header">
          <div v-if="title || slots['title-action']" class="bt-card__title-row">
            <p v-if="title" class="bt-card__title">{{ title }}</p>
            <div v-if="slots['title-action']" class="bt-card__title-action">
              <slot name="title-action" />
            </div>
          </div>
          <p v-if="description" class="bt-card__description">{{ description }}</p>
        </div>
        <div v-if="slots['header-aside'] && variant !== 'small'" class="bt-card__header-aside">
          <slot name="header-aside" />
        </div>
      </div>
      <!-- Body -->
      <div v-if="slots.default" class="bt-card__body">
        <slot />
      </div>
      <!-- Footer -->
      <template v-if="showFooter">
        <slot v-if="slots.footer" name="footer" />
        <div v-else class="bt-card__footer">
          <BTButton :label="cancelLabel" variant="secondary-light" size="small" @click="$emit('cancel')" />
          <BTButton :label="submitLabel" variant="primary" size="small" @click="$emit('submit')" />
        </div>
      </template>
    </template>

  </div>
</template>
