import type { BTBarData } from '@/components/ui/bar-chart';
import type { BTLineSeries } from '@/components/ui/line-chart';
import type { BTCircleSection } from '@/components/ui/circle-chart';
import type { BTAvatarItem } from '@/components/ui/avatar';

export interface StatSummary {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendVariant: 'success' | 'waiting' | 'reject';
}

export const statSummaries: StatSummary[] = [
  { id: 'users', label: 'Active users', value: '4,218', trend: '+12.4%', trendVariant: 'success' },
  { id: 'revenue', label: 'Revenue', value: '$28,940', trend: '+8.1%', trendVariant: 'success' },
  { id: 'sessions', label: 'Sessions', value: '9,732', trend: '-2.3%', trendVariant: 'reject' },
  { id: 'tickets', label: 'Open tickets', value: '37', trend: '5 pending', trendVariant: 'waiting' },
];

export const weeklySessionsData: BTBarData[] = [
  { label: 'Mon', value: 320 },
  { label: 'Tue', value: 480 },
  { label: 'Wed', value: 410 },
  { label: 'Thu', value: 560 },
  { label: 'Fri', value: 610 },
  { label: 'Sat', value: 390 },
  { label: 'Sun', value: 275 },
];

export const revenueTrendSeries: BTLineSeries[] = [
  {
    label: 'This month',
    color: 'var(--color-blue-500)',
    spots: [
      { x: 1, y: 12 },
      { x: 2, y: 18 },
      { x: 3, y: 15 },
      { x: 4, y: 24 },
      { x: 5, y: 22 },
      { x: 6, y: 29 },
    ],
  },
  {
    label: 'Last month',
    color: 'var(--color-neutral-300)',
    spots: [
      { x: 1, y: 10 },
      { x: 2, y: 13 },
      { x: 3, y: 12 },
      { x: 4, y: 17 },
      { x: 5, y: 16 },
      { x: 6, y: 20 },
    ],
  },
];

export const trafficSourceSections: BTCircleSection[] = [
  { label: 'Organic', value: 45, color: 'var(--color-blue-500)' },
  { label: 'Referral', value: 25, color: 'var(--color-teal-400)' },
  { label: 'Social', value: 18, color: 'var(--color-orange-400)' },
  { label: 'Direct', value: 12, color: 'var(--color-purple-400)' },
];

export interface RecentActivityEntry {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  avatar: BTAvatarItem;
}

export const recentActivity: RecentActivityEntry[] = [
  {
    id: '1',
    title: 'Nadia Putri',
    description: 'Approved invoice #A-1042',
    timeLabel: '2m ago',
    avatar: { name: 'Nadia Putri', color: 'blue' },
  },
  {
    id: '2',
    title: 'Rangga Saputra',
    description: 'Created a new project "Nebula"',
    timeLabel: '18m ago',
    avatar: { name: 'Rangga Saputra', color: 'green' },
  },
  {
    id: '3',
    title: 'Wulan Sari',
    description: 'Commented on ticket #TCK-882',
    timeLabel: '1h ago',
    avatar: { name: 'Wulan Sari', color: 'purple' },
  },
  {
    id: '4',
    title: 'Farhan Hakim',
    description: 'Closed 3 open tickets',
    timeLabel: '3h ago',
    avatar: { name: 'Farhan Hakim', color: 'orange' },
  },
  {
    id: '5',
    title: 'Sinta Dewi',
    description: 'Updated billing information',
    timeLabel: 'Yesterday',
    avatar: { name: 'Sinta Dewi', color: 'teal' },
  },
];
