<script setup lang="ts">
/**
 * BTToaster — global toast container.
 *
 * Mount once at the application root. Reads from the imperative `toast`
 * singleton store. 9 positions supported; default = `bottom-right`.
 *
 * @example
 *   <BTToaster position="bottom-right" />
 */
import { computed } from 'vue';
import { useToast } from '@/components/ui/toast/useToast';
import type { BTToastPosition } from '@/components/ui/toast/BTToast.types';
import BTToast from '@/components/ui/toast/BTToast.vue';
import '@/components/ui/toast/BTToast.css';

const props = withDefaults(
  defineProps<{ position?: BTToastPosition }>(),
  { position: 'bottom-right' },
);

const { toasts, remove } = useToast();
const containerClass = computed(() => `bt-toaster bt-toaster--${props.position}`);
</script>

<template>
  <Teleport to="body">
    <div :class="containerClass" role="region" aria-label="Notifications">
      <TransitionGroup name="bt-toast">
        <BTToast
          v-for="t in toasts"
          :key="t.id"
          :item="t"
          @close="remove(t.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
