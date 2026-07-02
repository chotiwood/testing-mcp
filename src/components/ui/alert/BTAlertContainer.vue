<script setup lang="ts">
/**
 * BTAlertContainer — renders the programmatic alert queue from useAlert().
 *
 * Mount once at the app root (outside router-view):
 * ```vue
 * <template>
 *   <RouterView />
 *   <BTAlertContainer />
 * </template>
 * ```
 */
import '@/components/ui/alert/BTAlert.css';
import '@/components/ui/alert/BTAlertContainer.css';
import { useAlert } from '@/components/ui/alert/useAlert';
import BTAlert from '@/components/ui/alert/BTAlert.vue';

const { alerts, dismiss } = useAlert();
</script>

<template>
  <Teleport to="body">
    <div class="bt-alert-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="bt-alert-slide" tag="div" class="bt-alert-container__inner">
        <BTAlert
          v-for="alert in alerts"
          :key="alert.id"
          :variant="alert.variant"
          :label="alert.label"
          :description="alert.description"
          :link-label="alert.linkLabel"
          :action-label="alert.actionLabel"
          :dismissible="alert.dismissible ?? true"
          @action="alert.onAction?.()"
          @link="alert.onLink?.()"
          @dismiss="dismiss(alert.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
