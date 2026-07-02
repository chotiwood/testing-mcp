<script setup lang="ts">
defineProps<{
  label: string;
  required?: boolean;
  fieldId?: string;
}>();
</script>

<template>
  <label class="bt-input__label" :for="fieldId">
    {{ label }}<span v-if="required" class="bt-input__label-required">*</span>
  </label>
</template>
