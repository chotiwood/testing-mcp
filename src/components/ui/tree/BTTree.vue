<script setup lang="ts">
/**
 * BTTree — recursive data-driven tree component.
 * Figma: node 2481:7383 · Category: Molecules
 *
 * @example
 * ```vue
 * <BTTree :nodes="[
 *   {
 *     label: 'Documents',
 *     initiallyExpanded: true,
 *     children: [
 *       { label: 'Reports', children: [
 *         { label: 'Q1 2026.pdf', checkState: 'checked' },
 *       ]},
 *       { label: 'Invoices', selected: true },
 *     ],
 *   },
 *   { label: 'Settings' },
 * ]" />
 * ```
 */
import '@/components/ui/tree/BTTree.css';
import BTTreeNode from '@/components/ui/tree/internal/BTTreeNode.vue';
import type { BTTreeProps } from '@/components/ui/tree/BTTree.types';

defineProps<BTTreeProps>();
</script>

<template>
  <div class="bt-tree" role="tree">
    <BTTreeNode
      v-for="node in nodes"
      :key="node.key ?? node.label"
      :node="node"
      :level="1"
    />
  </div>
</template>
