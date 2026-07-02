<script setup lang="ts">
import { ref } from 'vue'
import BTModal from '@/components/ui/modal/BTModal.vue'
import BTInput from '@/components/ui/input/BTInput.vue'
import BTAlert from '@/components/ui/alert/BTAlert.vue'
import { useFormValidation } from '@/composables/useAuth'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { validateEmail } = useFormValidation()

const email = ref('')
const emailError = ref<string | null>(null)
const isSubmitting = ref(false)
const isSuccess = ref(false)

function resetState() {
  email.value = ''
  emailError.value = null
  isSuccess.value = false
  isSubmitting.value = false
}

function handleUpdateOpen(value: boolean) {
  if (!value) {
    setTimeout(resetState, 300)
  }
  emit('update:open', value)
}

async function handleSubmit() {
  emailError.value = validateEmail(email.value)
  if (emailError.value) return

  isSubmitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 1500))
  isSuccess.value = true
  isSubmitting.value = false

  setTimeout(() => emit('update:open', false), 2500)
  setTimeout(resetState, 2800)
}
</script>

<template>
  <BTModal
    :open="props.open"
    title="Lupa Password"
    subtext="Masukkan email Anda. Kami akan mengirimkan tautan untuk mereset password."
    size="sm"
    :has-close="true"
    :has-footer="!isSuccess"
    :primary-label="isSubmitting ? 'Mengirim...' : 'Kirim Reset Link'"
    secondary-label="Batal"
    :has-secondary-button="true"
    :dismissable="!isSubmitting"
    @update:open="handleUpdateOpen"
    @primary="handleSubmit"
    @secondary="handleUpdateOpen(false)"
  >
    <div class="forgot-modal__body">
      <BTAlert
        v-if="isSuccess"
        variant="success"
        label="Email terkirim!"
        description="Silakan periksa kotak masuk Anda dan ikuti instruksi untuk mereset password."
      />

      <template v-else>
        <BTInput
          v-model="email"
          type="email"
          label="Alamat Email"
          placeholder="email@perusahaan.com"
          :required="true"
          :error-text="emailError ?? undefined"
          :disabled="isSubmitting"
          :validator="validateEmail"
          clearable
        />
        <p class="forgot-modal__hint">
          Link reset password berlaku selama 30 menit.
        </p>
      </template>
    </div>
  </BTModal>
</template>

<style scoped>
.forgot-modal__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-xl) 0;
}

.forgot-modal__hint {
  font-size: var(--typography-font-size-xs);
  color: var(--text-secondary);
  line-height: var(--typography-line-height-xs);
}
</style>
