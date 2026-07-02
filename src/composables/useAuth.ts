import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, MOCK_USER } from '@/stores/auth'

const MOCK_EMAIL = 'andi.surya@btech.id'
const MOCK_PASSWORD = 'btech2024'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isLoggingIn = ref(false)
  const loginError = ref<string | null>(null)

  async function login(email: string, password: string): Promise<boolean> {
    isLoggingIn.value = true
    loginError.value = null

    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      authStore.login(MOCK_USER, 'mock_token_' + Date.now())
      await router.push({ name: 'dashboard' })
      isLoggingIn.value = false
      return true
    } else {
      loginError.value = 'Email atau password tidak valid. Silakan coba lagi.'
      isLoggingIn.value = false
      return false
    }
  }

  async function logout() {
    authStore.logout()
    await router.push({ name: 'login' })
  }

  return {
    isLoggingIn,
    loginError,
    login,
    logout,
  }
}

export function useFormValidation() {
  function validateEmail(value: string): string | null {
    if (!value) return 'Email wajib diisi'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(value)) return 'Format email tidak valid'
    return null
  }

  function validatePassword(value: string): string | null {
    if (!value) return 'Password wajib diisi'
    if (value.length < 6) return 'Password minimal 6 karakter'
    return null
  }

  function validateRequired(value: string, label = 'Field'): string | null {
    if (!value || !value.trim()) return `${label} wajib diisi`
    return null
  }

  return { validateEmail, validatePassword, validateRequired }
}
