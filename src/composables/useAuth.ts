import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type AuthUser } from '@/stores/auth'

/** Demo credential shown on login page — any valid email/password also works. */
export const DEMO_EMAIL = 'andi.surya@btech.id'
export const DEMO_PASSWORD = 'btech2024'

const FAIL_DEMO_EMAIL = 'wrong@btech.id'

function buildUserFromEmail(email: string): AuthUser {
  const localPart = email.split('@')[0] ?? 'user'
  const name = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return {
    id: String(Date.now()),
    name: name || 'Pengguna',
    email,
    role: 'Administrator',
    avatarColor: 'blue',
  }
}

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isLoggingIn = ref(false)
  const loginError = ref<string | null>(null)

  async function login(email: string, password: string): Promise<boolean> {
    isLoggingIn.value = true
    loginError.value = null

    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (email.toLowerCase() === FAIL_DEMO_EMAIL) {
      loginError.value = 'Email atau password tidak valid. Silakan coba lagi.'
      isLoggingIn.value = false
      return false
    }

    const user = buildUserFromEmail(email)
    if (email === DEMO_EMAIL) {
      user.name = 'Andi Surya'
    }

    authStore.login(user, 'mock_token_' + Date.now())
    await router.push({ name: 'dashboard' })
    isLoggingIn.value = false
    return true
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
