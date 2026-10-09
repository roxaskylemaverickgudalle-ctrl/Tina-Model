import { createFileRoute } from '@tanstack/react-router'
import DashboardLayout from '@/bionis/dashboard-layout'
import { DashboardNavigationProvider, useDashboardNavigation } from '@/bionis/navigation'
import { ThemeProvider } from '@/bionis/theme-provider'
import { OverviewPage, TimelinePage, RequirementsPage, PanelPage, PlaceholderPage } from '@/bionis/tina-pages'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Tina — Capstone Planner & AI Panelist' },
      { name: 'description', content: 'Plan your capstone on a Gantt timeline and rehearse your defense with Tina, an AI panelist.' },
      { property: 'og:title', content: 'Tina — Capstone Planner & AI Panelist' },
      { property: 'og:description', content: 'Plan your capstone and rehearse your defense with an AI panelist.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap' }],
  }),
  component: Index,
})

function Screen() {
  const { pathname } = useDashboardNavigation()
  switch (pathname) {
    case '/timeline': return <TimelinePage />
    case '/requirements': return <RequirementsPage />
    case '/panel': return <PanelPage />
    case '/reports': return <PlaceholderPage title="Reports" />
    case '/settings': return <PlaceholderPage title="Settings" />
    case '/notifications': return <PlaceholderPage title="Notifications" />
    default: return <OverviewPage />
  }
}

function Index() {
  return (
    <ThemeProvider>
      <DashboardNavigationProvider>
        <DashboardLayout><Screen /></DashboardLayout>
      </DashboardNavigationProvider>
    </ThemeProvider>
  )
}
