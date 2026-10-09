import { useState } from 'react'
import { LogOutIcon, SettingsIcon } from 'lucide-react'
import {
  ArrowRightIcon,
  CloseIcon,
  QuestionIcon,
  SidebarCollapseIcon,
  ToggleIcon,
  UserIcon,
} from './icons'
import { BionisLogo } from './logo'
import { DashboardLink, useDashboardNavigation } from './navigation'
import { useTheme } from './theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { navigationGroups, type NavigationItem } from './data'
import { cn } from '@/lib/utils'
import { useWorkspace } from './workspace'

const menuButtonClassName = cn(
  'h-12 gap-2.5 rounded-xl border border-transparent px-3 text-base tracking-tight text-muted-foreground transition-colors',
  'aria-[current=page]:border-border aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-sidebar-accent-foreground aria-[current=page]:shadow-[1px_2px_12px_rgba(158,158,158,0.08)]',
  'dark:aria-[current=page]:border-transparent dark:aria-[current=page]:bg-sidebar-accent dark:aria-[current=page]:shadow-[1px_2px_12px_rgba(0,0,0,0.25)]',
  'hover:bg-sidebar-accent data-open:bg-background data-open:text-sidebar-accent-foreground dark:data-open:bg-sidebar-accent',
  '[&_svg]:size-5!',
  'group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden',
)

function NavItem({ item }: { item: NavigationItem }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { pathname } = useDashboardNavigation()
  const { requirements } = useWorkspace()
  const badge = item.href === '/requirements'
    ? requirements.filter((requirement) => requirement.status !== 'done').length
    : item.badge
  const isActive =
    item.href === '/'
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={item.name}
      className={menuButtonClassName}
    >
      <DashboardLink
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => {
          if (isMobile) setOpenMobile(false)
        }}
      >
        <item.icon />
        <span>{item.name}</span>
        {badge ? (
          <SidebarMenuBadge className="sidebar-badge-shadow static ml-auto rounded bg-background px-2 py-1.5 text-sm text-muted-foreground group-aria-[current=page]/menu-button:font-medium group-aria-[current=page]/menu-button:text-sidebar-accent-foreground">
            {badge}
          </SidebarMenuBadge>
        ) : null}
      </DashboardLink>
    </SidebarMenuButton>
  )
}

function HelpItem() {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className={menuButtonClassName}>
            <QuestionIcon />
            <span>Help</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="bionis-dashboard w-56"
        >
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground">Need help?</p>
            <p>Guides for planning and defending your capstone.</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <DashboardLink href="/panel">
                <QuestionIcon />
                Rehearse with Tina
              </DashboardLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <DashboardLink href="/notifications">
                <SettingsIcon />
                Recent activity
              </DashboardLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function DarkModeItem() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Light Mode' : 'Dark Mode'

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        className={menuButtonClassName}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        <ToggleIcon pressed={isDark} />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function ProfileItem() {
  const { user, signOut, busy } = useWorkspace()
  const { navigate } = useDashboardNavigation()
  const displayName = String(user?.user_metadata.full_name || user?.email || 'Student')

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Profile" className={menuButtonClassName}>
            <UserIcon />
            <span>Profile</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="bionis-dashboard w-56"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="leading-tight">
              <p className="text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p>{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => navigate('/settings')}>
              <SettingsIcon />
              Project settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={busy} onSelect={() => void signOut().catch(() => {})}>
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function CollapseControl({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  if (!collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex size-9.5 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
        aria-label="Collapse sidebar"
      >
        <SidebarCollapseIcon className="-rotate-90" />
      </button>
    )
  }

  return (
    <div className="relative size-11 shrink-0">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-all ease-linear group-hover:scale-75 group-hover:opacity-0">
        <BionisLogo className="size-6" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all ease-linear group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={onToggle}
          className="flex size-11 items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label="Expand sidebar"
        >
          <SidebarCollapseIcon className="rotate-90" />
        </button>
      </div>
    </div>
  )
}

function HealthCoachCard() {
  const [open, setOpen] = useState(true)
  const { navigate } = useDashboardNavigation()

  if (!open) return null

  return (
    <div
      className={cn(
        'relative flex flex-col gap-8 rounded-2xl border p-4',
        'bg-[linear-gradient(347deg,var(--promo-gradient-from)_47.58%,var(--promo-gradient-to)_306.43%)]',
        'group-data-[collapsible=icon]:hidden',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-xl bg-primary px-2.5 py-1.5 text-xs font-medium tracking-tight text-primary-foreground">
          New
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex size-6 shrink-0 items-center justify-center rounded -md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss Tina card"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-semibold tracking-tight">
            Tina AI Panelist
          </p>
          <p className="text-sm tracking-tight text-muted-foreground">
            Rehearse your defense with tough panel questions
          </p>
        </div>

        <Button
          type="button"
          className="h-11 w-full gap-1 rounded-xl pr-2 pl-3 text-sm tracking-tight"
          onClick={() => navigate('/panel')}
        >
          Start rehearsal
          <ArrowRightIcon className="size-5" />
        </Button>
      </div>
    </div>
  )
}

function ProjectPicker() {
  const { projects, project, selectProject, createProject, busy } = useWorkspace()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="px-3 group-data-[collapsible=icon]:hidden">
      <label htmlFor="sidebar-project" className="mb-2 block text-sm text-muted-foreground">Project</label>
      <select
        id="sidebar-project"
        value={project?.id ?? ''}
        onChange={(event) => selectProject(event.target.value)}
        className="h-10 w-full rounded-lg border border-sidebar-border bg-background px-2 text-sm"
      >
        <option value="" disabled>Select a project</option>
        {projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      <button
        type="button"
        onClick={() => setCreateOpen((open) => !open)}
        aria-expanded={createOpen}
        className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {createOpen ? 'Cancel' : '+ New project'}
      </button>
      {createOpen && <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        void createProject({
          title: String(form.get('title') ?? ''),
          summary: String(form.get('summary') ?? ''),
          techStack: String(form.get('stack') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
        }).then(() => setCreateOpen(false)).catch(() => {})
      }}>
        <input name="title" required maxLength={160} placeholder="Project title" aria-label="Project title" className="h-9 rounded-lg border bg-background px-2 text-xs" />
        <textarea name="summary" maxLength={4000} rows={2} placeholder="Project brief" aria-label="Project brief" className="resize-y rounded-lg border bg-background px-2 py-1.5 text-xs" />
        <input name="stack" placeholder="Tech stack (comma-separated)" aria-label="Tech stack" className="h-9 rounded-lg border bg-background px-2 text-xs" />
        <Button type="submit" disabled={busy} size="sm" className="rounded-lg">{busy ? 'Saving…' : 'Create project'}</Button>
      </form>}
    </div>
  )
}

export function DashboardSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="h-full border-none">
      <SidebarHeader
        className={cn(
          'h-16 flex-row items-center border-b border-sidebar-border transition-[padding] md:h-20',
          collapsed ? 'justify-start px-3' : 'justify-between gap-4.75 px-4',
        )}
      >
        {!collapsed && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <BionisLogo className="size-5.5 shrink-0" />
            <span className="truncate text-xl font-semibold tracking-tight">
              Tina
            </span>
          </div>
        )}
        <CollapseControl collapsed={collapsed} onToggle={toggleSidebar} />
      </SidebarHeader>

      <SidebarContent className="gap-4 overflow-x-hidden overflow-y-auto px-3 py-4 group-data-[collapsible=icon]:overflow-y-auto!">
        <ProjectPicker />
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label} className="gap-2 p-0">
            <SidebarGroupLabel className="h-auto px-3 py-1 text-base font-normal tracking-tight text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <NavItem item={item} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-6 border-t border-sidebar-border px-3 py-3">
        <HealthCoachCard />
        <SidebarMenu className="gap-2">
          <HelpItem />
          <DarkModeItem />
          <ProfileItem />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
