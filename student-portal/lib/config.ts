import type { NavItem } from '@/components/Shell'

export const PORTAL = 'student'
export const APP_NAME = 'EduNest Student'
export const TAGLINE = 'Student Portal'
export const LOGIN_TAGLINE = 'Student Portal · attendance, notes and report cards'
export const ALLOWED_ROLES = ['student']
export const OTHER_PORTAL_MESSAGE = 'This login is for teachers and office staff. Please use the School Portal website.'
export const ACCENT = '#0f766e'
export const ACCENT_SOFT = '#e2f5f2'

export const NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/attendance', label: 'My attendance' },
  { href: '/missed-notes', label: 'Missed classes' },
  { href: '/notes', label: 'Notes library' },
  { href: '/timetable', label: 'Timetable' },
  { href: '/report-cards', label: 'Report cards' },
  { href: '/messages', label: 'Messages', badge: 'messages' },
  { href: '/notices', label: 'Official notices', badge: 'notices' },
  { href: '/profile', label: 'Profile' },
]
