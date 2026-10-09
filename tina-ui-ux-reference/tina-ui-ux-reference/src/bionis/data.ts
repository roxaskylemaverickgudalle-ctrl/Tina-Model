import type { ComponentType, SVGProps } from 'react'
import {
  CalendarIcon,
  HomeIcon,
  ReportsIcon,
  PredictionIcon,
  CheckCircleIcon,
  GearIcon,
} from './icons'

// Temporary sample data — swap for your real Tina data later.

export type NavigationItem = {
  name: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  badge?: string | number
}

export const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '/', icon: HomeIcon },
      { name: 'Gantt chart editor', href: '/timeline', icon: CalendarIcon },
      { name: 'Requirements', href: '/requirements', icon: CheckCircleIcon, badge: 3 },
      { name: 'Tina Panel', href: '/panel', icon: PredictionIcon },
    ],
  },
  {
    label: 'More',
    items: [
      { name: 'Reports', href: '/reports', icon: ReportsIcon },
      { name: 'Settings', href: '/settings', icon: GearIcon },
    ],
  },
]

export const currentUser = {
  name: 'Kyle Roxas',
  email: 'kyle@school.edu',
  age: 'BSIT 4-A',
  planStatus: 'On track',
  avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Kyle',
}

export type KeyMetricIcon = 'heart' | 'walk' | 'moon' | 'battery' | 'heartbeat' | 'nurse'

export const keyMetricsByTimeline: Record<
  '7d',
  { id: string; icon: KeyMetricIcon; value: string; unit: string }[]
> = {
  '7d': [
    { id: 'm1', icon: 'walk', value: '8', unit: '/14 tasks' },
    { id: 'm2', icon: 'moon', value: '12', unit: 'days left' },
    { id: 'm3', icon: 'battery', value: '5', unit: '/8 reqs' },
    { id: 'm4', icon: 'heart', value: '24', unit: 'Q&A' },
  ],
}

export const profileHealthSummary = {
  wellnessScore: 72,
  condition: 'Defense-ready soon',
  summary: {
    before: 'Your system is ',
    highlight: '72% ready',
    after: ' for the final defense. Finish testing and documentation.',
  },
  vitals: [
    { label: 'Build', value: '80%', tone: 'good' as const },
    { label: 'Docs', value: '55%', tone: 'warn' as const },
    { label: 'Tests', value: '60%', tone: 'warn' as const },
  ],
}

export type NotificationIcon = 'moon' | 'check' | 'heart' | 'alert' | 'activity' | 'battery'
export type NotificationTone = 'warning' | 'success' | 'info' | 'danger'

export const notifications: {
  id: string
  icon: NotificationIcon
  tone: NotificationTone
  title: string
  description: string
  time: string
  unread: boolean
}[] = [
  { id: 'n1', icon: 'alert', tone: 'warning', title: 'Chapter 3 due soon', description: 'Methodology is due in 2 days.', time: '1h ago', unread: true },
  { id: 'n2', icon: 'check', tone: 'success', title: 'Milestone done', description: 'Database design marked complete.', time: '5h ago', unread: true },
  { id: 'n3', icon: 'activity', tone: 'info', title: 'Tina asked a new question', description: 'How does your system handle offline use?', time: 'Yesterday', unread: false },
]

export type Status = 'not_started' | 'in_progress' | 'done'

export type Milestone = {
  id: string
  title: string
  start: string // ISO date
  due: string
  status: Status
}

export const milestones: Milestone[] = [
  { id: 'g1', title: 'Proposal & title defense', start: '2026-09-01', due: '2026-09-14', status: 'done' },
  { id: 'g2', title: 'Requirements gathering', start: '2026-09-10', due: '2026-09-28', status: 'done' },
  { id: 'g3', title: 'Database design', start: '2026-09-22', due: '2026-10-06', status: 'done' },
  { id: 'g4', title: 'Core features build', start: '2026-10-01', due: '2026-10-30', status: 'in_progress' },
  { id: 'g5', title: 'AI panelist integration', start: '2026-10-12', due: '2026-11-06', status: 'in_progress' },
  { id: 'g6', title: 'Testing & fixes', start: '2026-11-02', due: '2026-11-20', status: 'not_started' },
  { id: 'g7', title: 'Final defense', start: '2026-11-23', due: '2026-11-27', status: 'not_started' },
]

export const requirements: { id: string; description: string; status: Status }[] = [
  { id: 'r1', description: 'Users can sign up and sign in', status: 'done' },
  { id: 'r2', description: 'Create and edit capstone projects', status: 'done' },
  { id: 'r3', description: 'Drag-to-edit Gantt timeline', status: 'in_progress' },
  { id: 'r4', description: 'AI panelist asks defense questions', status: 'in_progress' },
  { id: 'r5', description: 'Track requirement evidence', status: 'not_started' },
  { id: 'r6', description: 'Export progress report', status: 'not_started' },
]

export const panelQuestions = [
  'Why did you choose this tech stack over alternatives?',
  'How does your system protect user data?',
  'What happens if the AI gives a wrong answer?',
]
