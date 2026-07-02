<script setup lang="ts">
import { ref, computed } from 'vue'
import BTSidebar from '@/components/ui/sidebar/BTSidebar.vue'
import BTAvatar from '@/components/ui/avatar/BTAvatar.vue'
import BTBadge from '@/components/ui/badge/BTBadge.vue'
import BTBarChart from '@/components/ui/bar-chart/BTBarChart.vue'
import BTCircleChart from '@/components/ui/circle-chart/BTCircleChart.vue'
import BTLineChart from '@/components/ui/line-chart/BTLineChart.vue'
import BTLoading from '@/components/ui/loading/BTLoading.vue'
import { toast } from '@/components/ui/toast/useToast'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'
import type { BTSidebarNavItem } from '@/components/ui/sidebar/BTSidebar.types'
import type { BTBarData } from '@/components/ui/bar-chart/BTBarChart.types'
import type { BTCircleSection } from '@/components/ui/circle-chart/BTCircleChart.types'
import type { BTLineSeries } from '@/components/ui/line-chart/BTLineChart.types'

const authStore = useAuthStore()
const { logout } = useAuth()

const sidebarOpen = ref(true)
const activeRoute = ref('dashboard')
const isRefreshing = ref(false)

// ── Sidebar nav ──────────────────────────────────────────────────────────────

const navItems = computed<BTSidebarNavItem[]>(() => [
  {
    id: 'dashboard',
    type: 'Main',
    label: 'Dashboard',
    active: activeRoute.value === 'dashboard',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>',
  },
  {
    id: 'divider-1',
    type: 'Divider',
  },
  {
    id: 'transactions',
    type: 'Main',
    label: 'Transaksi',
    active: activeRoute.value === 'transactions',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>',
  },
  {
    id: 'reports',
    type: 'Main',
    label: 'Laporan',
    active: activeRoute.value === 'reports',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>',
  },
  {
    id: 'users',
    type: 'Main',
    label: 'Pengguna',
    active: activeRoute.value === 'users',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  },
  {
    id: 'settings',
    type: 'Main',
    label: 'Pengaturan',
    active: activeRoute.value === 'settings',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>',
  },
])

function handleNavClick(item: BTSidebarNavItem) {
  if (item.type === 'Divider') return
  activeRoute.value = item.id

  if (item.id !== 'dashboard') {
    toast.info(`Navigasi ke ${item.label}`, { description: 'Halaman ini belum tersedia.' })
  }
}

// ── Stats ────────────────────────────────────────────────────────────────────

const stats = [
  {
    label: 'Total Transaksi',
    value: '12,847',
    change: '+8.2%',
    positive: true,
    sublabel: 'vs bulan lalu',
  },
  {
    label: 'Pendapatan',
    value: 'Rp 4.8M',
    change: '+12.5%',
    positive: true,
    sublabel: 'vs bulan lalu',
  },
  {
    label: 'Pengguna Aktif',
    value: '3,291',
    change: '-2.1%',
    positive: false,
    sublabel: 'vs bulan lalu',
  },
  {
    label: 'Tingkat Konversi',
    value: '68.4%',
    change: '+3.7%',
    positive: true,
    sublabel: 'vs bulan lalu',
  },
]

// ── Chart data ───────────────────────────────────────────────────────────────

const barData: BTBarData[] = [
  { value: 820, label: 'Jan' },
  { value: 1040, label: 'Feb' },
  { value: 930, label: 'Mar' },
  { value: 1200, label: 'Apr' },
  { value: 1350, label: 'Mei' },
  { value: 1100, label: 'Jun' },
  { value: 980, label: 'Jul' },
]

const circleSections: BTCircleSection[] = [
  { value: 42, color: 'var(--color-brand-primary)', label: 'Sukses' },
  { value: 28, color: 'var(--color-ext-success)', label: 'Proses' },
  { value: 18, color: 'var(--color-ext-warning)', label: 'Pending' },
  { value: 12, color: 'var(--color-ext-error)', label: 'Gagal' },
]

const lineSeries: BTLineSeries[] = [
  {
    label: 'Pendapatan',
    color: 'var(--color-brand-primary)',
    spots: [
      { x: 1, y: 4.2 },
      { x: 2, y: 4.8 },
      { x: 3, y: 4.5 },
      { x: 4, y: 5.1 },
      { x: 5, y: 5.6 },
      { x: 6, y: 5.2 },
      { x: 7, y: 4.8 },
    ],
  },
  {
    label: 'Target',
    color: 'var(--color-ext-success)',
    spots: [
      { x: 1, y: 4.0 },
      { x: 2, y: 4.5 },
      { x: 3, y: 5.0 },
      { x: 4, y: 5.0 },
      { x: 5, y: 5.5 },
      { x: 6, y: 5.5 },
      { x: 7, y: 5.0 },
    ],
  },
]

// ── Recent activity ──────────────────────────────────────────────────────────

const recentActivity = [
  {
    id: 'TRX-001',
    user: 'Budi Santoso',
    action: 'Transfer Dana',
    amount: 'Rp 2.500.000',
    status: 'success' as const,
    statusLabel: 'Berhasil',
    time: '2 menit lalu',
  },
  {
    id: 'TRX-002',
    user: 'Sari Dewi',
    action: 'Pembayaran Tagihan',
    amount: 'Rp 450.000',
    status: 'waiting' as const,
    statusLabel: 'Diproses',
    time: '15 menit lalu',
  },
  {
    id: 'TRX-003',
    user: 'Ahmad Fauzi',
    action: 'Top Up Saldo',
    amount: 'Rp 1.000.000',
    status: 'success' as const,
    statusLabel: 'Berhasil',
    time: '32 menit lalu',
  },
  {
    id: 'TRX-004',
    user: 'Rina Kusuma',
    action: 'Penarikan Tunai',
    amount: 'Rp 500.000',
    status: 'reject' as const,
    statusLabel: 'Ditolak',
    time: '1 jam lalu',
  },
  {
    id: 'TRX-005',
    user: 'Dani Prasetyawan',
    action: 'Transfer Dana',
    amount: 'Rp 750.000',
    status: 'success' as const,
    statusLabel: 'Berhasil',
    time: '2 jam lalu',
  },
]

// ── Actions ──────────────────────────────────────────────────────────────────

async function handleRefresh() {
  isRefreshing.value = true
  await new Promise((resolve) => setTimeout(resolve, 1200))
  isRefreshing.value = false
  toast.success('Data diperbarui', { description: 'Dashboard menampilkan data terbaru.' })
}

async function handleLogout() {
  toast('Sampai jumpa, ' + (authStore.user?.name ?? 'Pengguna') + '!')
  await new Promise((resolve) => setTimeout(resolve, 800))
  await logout()
}

</script>

<template>
  <div class="dashboard">
    <!-- Sidebar -->
    <BTSidebar
      :open="sidebarOpen"
      :items="navItems"
      :header="{ title: 'BTECH Portal', description: 'Admin Panel' }"
      @toggle="sidebarOpen = !sidebarOpen"
      @item-click="handleNavClick"
    >
      <template #footer>
        <div class="dashboard__sidebar-footer">
          <BTAvatar
            :item="{
              name: authStore.user?.name ?? 'User',
              color: authStore.user?.avatarColor ?? 'blue',
            }"
            size="sm"
          />
          <div v-if="sidebarOpen" class="dashboard__sidebar-user">
            <span class="dashboard__sidebar-name">{{ authStore.user?.name }}</span>
            <span class="dashboard__sidebar-role">{{ authStore.user?.role }}</span>
          </div>
          <button
            v-if="sidebarOpen"
            class="dashboard__logout-btn"
            title="Keluar"
            @click="handleLogout"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </template>
    </BTSidebar>

    <!-- Main content -->
    <main class="dashboard__main">
      <!-- Top bar -->
      <header class="dashboard__topbar">
        <div class="dashboard__topbar-left">
          <h1 class="dashboard__page-title">Dashboard</h1>
          <p class="dashboard__page-subtitle">
            Selamat datang kembali, <strong>{{ authStore.user?.name }}</strong>
          </p>
        </div>
        <div class="dashboard__topbar-right">
          <button
            class="dashboard__refresh-btn"
            :disabled="isRefreshing"
            @click="handleRefresh"
          >
            <BTLoading v-if="isRefreshing" type="spinner" :size="16" />
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            {{ isRefreshing ? 'Memperbarui...' : 'Perbarui' }}
          </button>
        </div>
      </header>

      <div class="dashboard__content">
        <!-- Stats row -->
        <div class="dashboard__stats">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="dashboard__stat-card"
          >
            <p class="dashboard__stat-label">{{ stat.label }}</p>
            <p class="dashboard__stat-value">{{ stat.value }}</p>
            <div class="dashboard__stat-footer">
              <span
                class="dashboard__stat-change"
                :class="stat.positive ? 'dashboard__stat-change--up' : 'dashboard__stat-change--down'"
              >
                {{ stat.change }}
              </span>
              <span class="dashboard__stat-sublabel">{{ stat.sublabel }}</span>
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="dashboard__charts">
          <!-- Bar chart -->
          <div class="dashboard__chart-card">
            <div class="dashboard__chart-header">
              <h2 class="dashboard__chart-title">Volume Transaksi</h2>
              <p class="dashboard__chart-subtitle">7 bulan terakhir</p>
            </div>
            <BTBarChart
              :data="barData"
              :bar-color="'var(--color-brand-primary)'"
              :height="220"
            />
          </div>

          <!-- Circle chart -->
          <div class="dashboard__chart-card dashboard__chart-card--sm">
            <div class="dashboard__chart-header">
              <h2 class="dashboard__chart-title">Status Transaksi</h2>
              <p class="dashboard__chart-subtitle">Distribusi bulan ini</p>
            </div>
            <div class="dashboard__circle-chart">
              <BTCircleChart
                :sections="circleSections"
                variant="donut"
                :size="180"
              />
              <div class="dashboard__circle-legend">
                <div
                  v-for="s in circleSections"
                  :key="s.label"
                  class="dashboard__circle-legend-item"
                >
                  <span
                    class="dashboard__circle-legend-dot"
                    :style="{ backgroundColor: s.color }"
                  />
                  <span class="dashboard__circle-legend-label">{{ s.label }}</span>
                  <span class="dashboard__circle-legend-value">{{ s.value }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Line chart -->
        <div class="dashboard__chart-card">
          <div class="dashboard__chart-header">
            <h2 class="dashboard__chart-title">Tren Pendapatan vs Target</h2>
            <p class="dashboard__chart-subtitle">dalam miliar rupiah</p>
          </div>
          <BTLineChart
            :series="lineSeries"
            :height="200"
          />
        </div>

        <!-- Recent activity -->
        <div class="dashboard__activity">
          <div class="dashboard__chart-header">
            <h2 class="dashboard__chart-title">Aktivitas Terbaru</h2>
            <p class="dashboard__chart-subtitle">10 transaksi terakhir</p>
          </div>

          <div class="dashboard__activity-table">
            <div class="dashboard__activity-head">
              <span>ID</span>
              <span>Pengguna</span>
              <span>Aktivitas</span>
              <span>Jumlah</span>
              <span>Status</span>
              <span>Waktu</span>
            </div>
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="dashboard__activity-row"
            >
              <span class="dashboard__activity-id">{{ activity.id }}</span>
              <div class="dashboard__activity-user">
                <BTAvatar
                  :item="{ name: activity.user }"
                  size="xs"
                />
                <span>{{ activity.user }}</span>
              </div>
              <span>{{ activity.action }}</span>
              <span class="dashboard__activity-amount">{{ activity.amount }}</span>
              <BTBadge
                :label="activity.statusLabel"
                :variant="activity.status"
              />
              <span class="dashboard__activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────────── */
.dashboard {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-subtlest);
}

.dashboard__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Top bar ─────────────────────────────────────────────────────────────────── */
.dashboard__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-s2xl);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  flex-shrink: 0;
}

.dashboard__page-title {
  font-size: var(--typography-font-size-s2xl);
  font-weight: var(--typography-font-weight-bold);
  color: var(--text-primary);
}

.dashboard__page-subtitle {
  font-size: var(--typography-font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--space-s2xs);
}

.dashboard__refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--typography-font-size-sm);
  color: var(--text-primary);
  font-weight: var(--typography-font-weight-medium);
  transition: background 0.15s;
}

.dashboard__refresh-btn:hover:not(:disabled) {
  background: var(--bg-subtle);
}

.dashboard__refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Content ─────────────────────────────────────────────────────────────────── */
.dashboard__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-s2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-s2xl);
}

/* ── Stats ─────────────────────────────────────────────────────────────────── */
.dashboard__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
}

.dashboard__stat-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  box-shadow: var(--shadow-elevation-xs);
}

.dashboard__stat-label {
  font-size: var(--typography-font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--typography-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-sm);
}

.dashboard__stat-value {
  font-size: var(--typography-font-size-s3xl);
  font-weight: var(--typography-font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.dashboard__stat-footer {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.dashboard__stat-change {
  font-size: var(--typography-font-size-xs);
  font-weight: var(--typography-font-weight-semibold);
}

.dashboard__stat-change--up {
  color: var(--color-ext-success);
}

.dashboard__stat-change--down {
  color: var(--color-ext-error);
}

.dashboard__stat-sublabel {
  font-size: var(--typography-font-size-xs);
  color: var(--text-tertiary);
}

/* ── Charts ─────────────────────────────────────────────────────────────────── */
.dashboard__charts {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-lg);
}

.dashboard__chart-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  box-shadow: var(--shadow-elevation-xs);
}

.dashboard__chart-card--sm {
  min-width: 280px;
}

.dashboard__chart-header {
  margin-bottom: var(--space-lg);
}

.dashboard__chart-title {
  font-size: var(--typography-font-size-md);
  font-weight: var(--typography-font-weight-semibold);
  color: var(--text-primary);
}

.dashboard__chart-subtitle {
  font-size: var(--typography-font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--space-s2xs);
}

.dashboard__circle-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.dashboard__circle-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.dashboard__circle-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.dashboard__circle-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-rd);
  flex-shrink: 0;
}

.dashboard__circle-legend-label {
  flex: 1;
  font-size: var(--typography-font-size-xs);
  color: var(--text-secondary);
}

.dashboard__circle-legend-value {
  font-size: var(--typography-font-size-xs);
  font-weight: var(--typography-font-weight-semibold);
  color: var(--text-primary);
}

/* ── Activity ─────────────────────────────────────────────────────────────────── */
.dashboard__activity {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  box-shadow: var(--shadow-elevation-xs);
}

.dashboard__activity-table {
  width: 100%;
  margin-top: var(--space-lg);
}

.dashboard__activity-head,
.dashboard__activity-row {
  display: grid;
  grid-template-columns: 100px 1fr 1fr 120px 100px 100px;
  gap: var(--space-lg);
  align-items: center;
  padding: var(--space-sm) var(--space-md);
}

.dashboard__activity-head {
  font-size: var(--typography-font-size-xs);
  font-weight: var(--typography-font-weight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.dashboard__activity-row {
  font-size: var(--typography-font-size-sm);
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  transition: background 0.1s;
}

.dashboard__activity-row:hover {
  background: var(--bg-subtle);
}

.dashboard__activity-id {
  font-family: var(--typography-font-family-mono);
  font-size: var(--typography-font-size-xs);
  color: var(--text-secondary);
}

.dashboard__activity-user {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.dashboard__activity-amount {
  font-weight: var(--typography-font-weight-medium);
}

.dashboard__activity-time {
  font-size: var(--typography-font-size-xs);
  color: var(--text-tertiary);
}

/* ── Sidebar footer ─────────────────────────────────────────────────────────── */
.dashboard__sidebar-footer {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
}

.dashboard__sidebar-user {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dashboard__sidebar-name {
  font-size: var(--typography-font-size-sm);
  font-weight: var(--typography-font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard__sidebar-role {
  font-size: var(--typography-font-size-xs);
  color: var(--text-secondary);
}

.dashboard__logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: var(--space-xs);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.dashboard__logout-btn:hover {
  color: var(--color-ext-error);
  background: var(--color-ext-error-subtler);
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .dashboard__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .dashboard__charts {
    grid-template-columns: 1fr;
  }
}
</style>
