import { useState } from 'react';
import { BTSidebar } from '@/components/ui/sidebar';
import type { BTSidebarNavItem } from '@/components/ui/sidebar';
import { BTAvatar } from '@/components/ui/avatar';
import { BTBadge } from '@/components/ui/badge';
import { BTChartCard } from '@/components/ui/chart-card';
import { BTBarChart } from '@/components/ui/bar-chart';
import { BTLineChart } from '@/components/ui/line-chart';
import { BTCircleChart } from '@/components/ui/circle-chart';
import { BTItem } from '@/components/ui/item';
import { BTButton } from '@/components/ui/button';
import { BTSeparator } from '@/components/ui/separator';
import { useAuth } from '../auth/AuthContext';
import {
  statSummaries,
  weeklySessionsData,
  revenueTrendSeries,
  trafficSourceSections,
  recentActivity,
} from './mockData';
import './DashboardPage.css';

const NAV_ITEMS: BTSidebarNavItem[] = [
  { id: 'dashboard', type: 'Main', label: 'Dashboard', active: true, icon: <NavDotIcon /> },
  { id: 'analytics', type: 'Main', label: 'Analytics', icon: <NavDotIcon /> },
  { id: 'activity', type: 'Main', label: 'Activity', icon: <NavDotIcon /> },
  { id: 'settings', type: 'Main', label: 'Settings', icon: <NavDotIcon /> },
];

function NavDotIcon() {
  return <span className="dashboard-nav-icon" aria-hidden="true" />;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard-layout">
      <BTSidebar
        open={sidebarOpen}
        header={{ title: 'BTECH', description: 'Workspace' }}
        items={NAV_ITEMS}
        onToggle={() => setSidebarOpen((v) => !v)}
        footer={
          <div className="dashboard-sidebar-footer">
            <BTAvatar item={{ name: user?.name ?? 'Guest', color: 'blue' }} size="sm" />
            {sidebarOpen && (
              <div className="dashboard-sidebar-footer__text">
                <span className="dashboard-sidebar-footer__name">{user?.name ?? 'Guest'}</span>
                <span className="dashboard-sidebar-footer__email">{user?.email ?? ''}</span>
              </div>
            )}
          </div>
        }
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-header__title">Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋</h1>
            <p className="dashboard-header__subtitle">Here's what's happening with your workspace today.</p>
          </div>
          <BTButton variant="secondary-light" label="Log out" onClick={logout} />
        </header>

        <section className="dashboard-stats">
          {statSummaries.map((stat) => (
            <div key={stat.id} className="dashboard-stat-card">
              <span className="dashboard-stat-card__label">{stat.label}</span>
              <div className="dashboard-stat-card__value-row">
                <span className="dashboard-stat-card__value">{stat.value}</span>
                <BTBadge label={stat.trend} variant={stat.trendVariant} />
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-charts">
          <BTChartCard
            title="Weekly sessions"
            subtext="Last 7 days"
            summary={[{ label: 'Total', value: '3,046', unit: 'sessions' }]}
          >
            <BTBarChart data={weeklySessionsData} height={220} />
          </BTChartCard>

          <BTChartCard
            title="Revenue trend"
            subtext="Last 6 weeks"
            legend={revenueTrendSeries.map((s) => ({ label: s.label ?? '', color: s.color }))}
          >
            <BTLineChart series={revenueTrendSeries} area height={220} />
          </BTChartCard>

          <BTChartCard
            title="Traffic sources"
            subtext="This month"
            legend={trafficSourceSections.map((s) => ({ label: s.label ?? '', color: s.color }))}
          >
            <div className="dashboard-circle-chart-wrapper">
              <BTCircleChart sections={trafficSourceSections} variant="donut" size={180} />
            </div>
          </BTChartCard>
        </section>

        <section className="dashboard-bottom">
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-panel__title">Recent activity</h2>
              <BTButton variant="ghost" size="small" label="View all" />
            </div>
            <BTSeparator />
            <div className="dashboard-activity-list">
              {recentActivity.map((entry) => (
                <BTItem
                  key={entry.id}
                  title={entry.title}
                  description={entry.description}
                  leftAvatar={entry.avatar}
                  rightLabel={entry.timeLabel}
                />
              ))}
            </div>
          </div>

          <div className="dashboard-panel dashboard-panel--secondary">
            <div className="dashboard-panel__header">
              <h2 className="dashboard-panel__title">Quick actions</h2>
            </div>
            <BTSeparator />
            <div className="dashboard-quick-actions">
              <BTButton variant="outline" label="Invite teammate" />
              <BTButton variant="outline" label="Create project" />
              <BTButton variant="outline" label="View reports" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
