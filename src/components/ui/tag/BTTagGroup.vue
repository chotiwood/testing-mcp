<!-- BTTagGroup — layout wrapper for BTTag items.
     Figma source: node 3050-6644.
-->
<script setup lang="ts">
import { computed } from 'vue';
import BTTag from '@/components/ui/tag/BTTag.vue';
import type { BTTagGroupProps } from '@/components/ui/tag/BTTag.types';

const props = withDefaults(defineProps<BTTagGroupProps>(), {
  variant: 'default',
  spacing: 'default',
  type: 'scroll',
});

const groupClass = computed(() =>
  [
    'bt-tag-group',
    `bt-tag-group--${props.type}`,
    `bt-tag-group--gap-${props.spacing}`,
  ].join(' '),
);
</script>

<template>
  <div :class="groupClass" data-testid="bt-tag-group">
    <BTTag
      v-for="(item, index) in items"
      :key="item.id ?? item.label"
      :label="item.label"
      :variant="variant"
      :on-remove="onRemove ? () => onRemove!(item, index) : undefined"
    />
  </div>
</template>
