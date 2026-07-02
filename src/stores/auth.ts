import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  avatarColor?: 'green' | 'blue' | 'orange' | 'purple' | 'teal' | 'pink'
}

const MOCK_USER: AuthUser = {
  id: '1',
  name: 'Andi Surya',
  email: 'andi.surya@btech.id',
  role: 'Administrator',
  avatarColor: 'blue',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function login(loggedUser: AuthUser, accessToken: string) {
    user.value = loggedUser
    token.value = accessToken
    sessionStorage.setItem('auth_token', accessToken)
    sessionStorage.setItem('auth_user', JSON.stringify(loggedUser))
  }

  function logout() {
    user.value = null
    token.value = null
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
  }

  function restoreSession() {
    const storedToken = sessionStorage.getItem('auth_token')
    const storedUser = sessionStorage.getItem('auth_user')
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser) as AuthUser
    }
  }

  return { user, token, isAuthenticated, login, logout, restoreSession, MOCK_USER }
})

export { MOCK_USER }
