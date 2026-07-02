<script setup lang="ts">
import BTToaster from '@/components/ui/toast/BTToaster.vue'
</script>

<template>
  <RouterView />
  <BTToaster position="bottom-right" />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  height: 100%;
  font-family: var(--typography-font-family-sans, 'Inter', sans-serif);
  background-color: var(--bg-subtlest);
  color: var(--text-primary);
}
</style>
