<script setup lang="ts">
import { ref } from 'vue'
import { Vue3Lottie } from 'vue3-lottie'
import btechAnim from '@btech/assets/anim/load-btech-anim.json'
import BTInput from '@/components/ui/input/BTInput.vue'
import BTButton from '@/components/ui/button/BTButton.vue'
import BTButtonLink from '@/components/ui/button-link/BTButtonLink.vue'
import BTLoading from '@/components/ui/loading/BTLoading.vue'
import BTAlert from '@/components/ui/alert/BTAlert.vue'
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal.vue'
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth, useFormValidation } from '@/composables/useAuth'

const { isLoggingIn, loginError, login } = useAuth()
const { validateEmail, validatePassword } = useFormValidation()

const email = ref('')
const password = ref('')
const emailError = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const isForgotOpen = ref(false)

function validateForm(): boolean {
  emailError.value = validateEmail(email.value)
  passwordError.value = validatePassword(password.value)
  return !emailError.value && !passwordError.value
}

async function handleLogin() {
  if (!validateForm()) return
  await login(email.value, password.value)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') handleLogin()
}
</script>

<template>
  <div class="login-page">
    <!-- Left branding panel -->
    <div class="login-page__brand">
      <div class="login-page__brand-inner">
        <div class="login-page__logo">
          <Vue3Lottie
            :animation-data="btechAnim"
            :height="180"
            :width="180"
            :loop="true"
            :auto-play="true"
          />
        </div>
        <h1 class="login-page__brand-title">BTECH Portal</h1>
        <p class="login-page__brand-subtitle">
          Sistem Manajemen Terpadu untuk Operasional Bisnis Anda
        </p>
      </div>
    </div>

    <!-- Right login form -->
    <div class="login-page__form-side">
      <div class="login-page__form-card">
        <!-- Header -->
        <div class="login-page__form-header">
          <h2 class="login-page__form-title">Selamat Datang</h2>
          <p class="login-page__form-subtitle">Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        <!-- Error alert -->
        <BTAlert
          v-if="loginError && !isLoggingIn"
          variant="error"
          :label="loginError"
          :dismissible="true"
          class="login-page__error"
        />

        <!-- Credentials hint -->
        <BTAlert
          variant="info"
          label="Demo Credentials"
          :description="`Email: ${DEMO_EMAIL}  |  Password: ${DEMO_PASSWORD}  |  Gunakan wrong@btech.id untuk uji error`"
          class="login-page__hint"
        />

        <!-- Form -->
        <form class="login-page__inputs" @submit.prevent="handleLogin">
          <BTInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="email@perusahaan.com"
            :required="true"
            :error-text="emailError ?? undefined"
            :disabled="isLoggingIn"
            :validator="validateEmail"
            clearable
            @keydown="handleKeydown"
          />

          <BTInput
            v-model="password"
            type="password"
            label="Password"
            placeholder="Masukkan password"
            :required="true"
            :error-text="passwordError ?? undefined"
            :disabled="isLoggingIn"
            :show-password-toggle="true"
            @keydown="handleKeydown"
          />

          <div class="login-page__forgot">
            <BTButtonLink
              label="Lupa password?"
              variant="primary"
              :disabled="isLoggingIn"
              @click="isForgotOpen = true"
            />
          </div>

          <BTButton
            type="submit"
            variant="primary"
            :label="isLoggingIn ? 'Memproses...' : 'Masuk'"
            :disabled="isLoggingIn"
            class="login-page__submit"
          />
        </form>

        <!-- Loading overlay -->
        <Transition name="fade">
          <div v-if="isLoggingIn" class="login-page__loading">
            <BTLoading type="spinner" :size="48" />
            <p class="login-page__loading-text">Memverifikasi kredensial...</p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <ForgotPasswordModal v-model:open="isForgotOpen" />
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-subtlest);
}

/* ── Left brand panel ──────────────────────────────────────────────────────── */
.login-page__brand {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    var(--color-brand-primary) 0%,
    var(--color-brand-primary-bold) 100%
  );
  padding: var(--space-s3xl);
}

.login-page__brand-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  text-align: center;
  max-width: 400px;
}

.login-page__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: color-mix(in srgb, var(--text-inverse) 15%, transparent);
  border-radius: var(--radius-rd);
  backdrop-filter: blur(8px);
}

.login-page__brand-title {
  font-size: var(--typography-font-size-s4xl);
  font-weight: var(--typography-font-weight-bold);
  color: var(--text-inverse);
}

.login-page__brand-subtitle {
  font-size: var(--typography-font-size-md);
  color: color-mix(in srgb, var(--text-inverse) 80%, transparent);
  line-height: var(--typography-line-height-lg);
}

/* ── Right form side ───────────────────────────────────────────────────────── */
.login-page__form-side {
  flex: 0 0 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-s3xl) var(--space-s2xl);
  background-color: var(--bg-primary);
}

.login-page__form-card {
  width: 100%;
  max-width: 400px;
  position: relative;
}

.login-page__form-header {
  margin-bottom: var(--space-s2xl);
}

.login-page__form-title {
  font-size: var(--typography-font-size-s3xl);
  font-weight: var(--typography-font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.login-page__form-subtitle {
  font-size: var(--typography-font-size-sm);
  color: var(--text-secondary);
  line-height: var(--typography-line-height-sm);
}

.login-page__error {
  margin-bottom: var(--space-lg);
}

.login-page__hint {
  margin-bottom: var(--space-lg);
}

.login-page__inputs {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.login-page__forgot {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(var(--space-xs) * -1);
}

.login-page__submit {
  width: 100%;
}

/* ── Loading overlay ───────────────────────────────────────────────────────── */
.login-page__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  background: color-mix(in srgb, var(--bg-primary) 90%, transparent);
  border-radius: var(--radius-md);
  backdrop-filter: blur(2px);
}

.login-page__loading-text {
  font-size: var(--typography-font-size-sm);
  color: var(--text-secondary);
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .login-page {
    flex-direction: column;
  }

  .login-page__brand {
    flex: none;
    padding: var(--space-s2xl) var(--space-xl);
    min-height: 280px;
  }

  .login-page__logo {
    width: 100px;
    height: 100px;
  }

  .login-page__brand-title {
    font-size: var(--typography-font-size-s2xl);
  }

  .login-page__brand-subtitle {
    font-size: var(--typography-font-size-sm);
  }

  .login-page__form-side {
    flex: 1;
    flex-basis: auto;
  }
}

/* ── Transition ────────────────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
