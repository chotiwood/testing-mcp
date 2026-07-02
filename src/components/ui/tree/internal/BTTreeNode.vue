<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import BTCheckbox from '@/components/ui/checkbox/BTCheckbox.vue';
import type { BTTreeNode as BTTreeNodeType } from '@/components/ui/tree/BTTree.types';

// Async self-import breaks the circular-import cycle for Vue 3 + Vite.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BTTreeNodeSelf = defineAsyncComponent(() => import('./BTTreeNode.vue') as any);

const props = defineProps<{
  node: BTTreeNodeType;
  level: number;
}>();

const isOpen = ref(props.node.initiallyExpanded ?? false);
const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0);
const clampedLevel = computed(() => Math.min(8, Math.max(1, props.level)));
const paddingInlineStart = computed(() => `${4 + (clampedLevel.value - 1) * 24}px`);

const showCheckbox = computed(() => props.node.checkState !== undefined);
const checkboxValue = computed(() => props.node.checkState === 'checked');
const isIndeterminate = computed(() => props.node.checkState === 'indeterminate');

function handleRowClick() {
  if (props.node.disabled) return;
  // Clicking anywhere on the row toggles expand/collapse when children exist.
  if (hasChildren.value) {
    isOpen.value = !isOpen.value;
    props.node.onToggle?.(isOpen.value);
  }
  props.node.onPress?.();
}

function handleArrowClick(e: MouseEvent) {
  e.stopPropagation();
  if (!props.node.disabled) {
    isOpen.value = !isOpen.value;
    props.node.onToggle?.(isOpen.value);
  }
}

function handleCheckChange(_newVal: boolean) {
  if (props.node.disabled) return;
  // Ignore BTCheckbox's emitted boolean — control the transition here.
  // Standard tree behavior: unchecked → checked; checked | indeterminate → unchecked.
  const next = props.node.checkState === 'unchecked' ? 'checked' : 'unchecked';
  props.node.onCheck?.(next);
}
</script>

<template>
  <div class="bt-tree-node">
    <!-- Row -->
    <div
      class="bt-tree-item"
      :class="[
        `bt-tree-item--level-${clampedLevel}`,
        node.selected && 'bt-tree-item--selected',
        node.checkState === 'checked' && 'bt-tree-item--checked',
        node.disabled && 'bt-tree-item--disabled',
      ]"
      :style="{ paddingInlineStart }"
      role="treeitem"
      :aria-expanded="hasChildren ? isOpen : undefined"
      :aria-selected="node.selected ?? false"
      @click="handleRowClick"
    >
      <!-- Expand / collapse arrow -->
      <button
        v-if="hasChildren"
        type="button"
        class="bt-tree-item__arrow"
        :class="{ 'bt-tree-item__arrow--expanded': isOpen }"
        :aria-label="isOpen ? 'Collapse' : 'Expand'"
        @click="handleArrowClick"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>
      <span v-else class="bt-tree-item__arrow-spacer" aria-hidden="true" />

      <!-- Checkbox -->
      <span v-if="showCheckbox" class="bt-tree-item__checkbox" @click.stop>
        <BTCheckbox
          :model-value="checkboxValue"
          :indeterminate="isIndeterminate"
          :disabled="node.disabled"
          @update:model-value="handleCheckChange"
        />
      </span>

      <!-- Icon -->
      <span v-if="node.icon" class="bt-tree-item__icon" aria-hidden="true">
        <component :is="node.icon" />
      </span>

      <!-- Body (custom content) — fills remaining row space -->
      <div v-if="node.body" class="bt-tree-item__body">
        <component :is="node.body" />
      </div>

      <!-- Label (default text content) — only shown when no body -->
      <span v-else class="bt-tree-item__label">{{ node.label }}</span>
    </div>

    <!-- Children (animated via grid-template-rows) -->
    <div
      v-if="hasChildren"
      class="bt-tree-node__children"
      :class="{ 'bt-tree-node__children--open': isOpen }"
      role="group"
    >
      <div class="bt-tree-node__children-inner">
        <BTTreeNodeSelf
          v-for="child in node.children"
          :key="child.key ?? child.label"
          :node="child"
          :level="level + 1"
        />
      </div>
    </div>
  </div>
</template>
