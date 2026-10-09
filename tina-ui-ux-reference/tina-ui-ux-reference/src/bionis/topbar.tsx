import { useMemo, useRef, useState } from 'react'
import { ActivityIcon, BellIcon, CalendarIcon, CloseIcon, SearchIcon, UserIcon } from './icons'
import { DashboardLink, useDashboardNavigation } from './navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { navigationGroups } from './data'
import { useWorkspace } from './workspace'

function useCurrentNavItem() {
  const { pathname } = useDashboardNavigation()
  return navigationGroups.flatMap((group) => group.items).find((item) => item.href === pathname)
    ?? navigationGroups[0]!.items[0]!
}

export function DashboardTopbar() {
  const currentNavItem = useCurrentNavItem()
  const PageIcon = currentNavItem.icon
  const { navigate } = useDashboardNavigation()
  const { user, project, requirements, milestones, messages, signOut, busy } = useWorkspace()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const displayName = String(user?.user_metadata.full_name || user?.email || 'Student')

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    if (!query) return []
    return [
      ...milestones.filter((item) => item.title.toLocaleLowerCase().includes(query)).map((item) => ({ id: item.id, title: item.title, section: 'Gantt chart editor', path: '/timeline' })),
      ...requirements.filter((item) => item.description.toLocaleLowerCase().includes(query)).map((item) => ({ id: item.id, title: item.description, section: 'Requirements', path: '/requirements' })),
      ...messages.filter((item) => item.content.toLocaleLowerCase().includes(query)).map((item) => ({ id: item.id, title: item.content, section: 'Tina Panel', path: '/panel' })),
    ].slice(0, 6)
  }, [milestones, requirements, messages, searchQuery])

  const notifications = [
    ...milestones.filter((item) => item.status !== 'done' && item.due_date).slice(0, 3).map((item) => ({
      id: item.id,
      title: `Task due: ${item.title}`,
      description: `Due ${item.due_date}`,
      icon: CalendarIcon,
    })),
    ...messages.slice(-2).reverse().map((item) => ({
      id: item.id,
      title: item.role === 'assistant' ? 'Tina replied' : 'New project conversation',
      description: item.content,
      icon: ActivityIcon,
    })),
  ].slice(0, 5)

  const focusMobileSearch = () => {
    setIsMobileSearchOpen(true)
    requestAnimationFrame(() => mobileSearchInputRef.current?.focus())
  }

  const selectSearchResult = (path: string) => {
    navigate(path)
    setSearchQuery('')
    setIsMobileSearchOpen(false)
  }

  const searchInput = (ref: typeof searchInputRef | typeof mobileSearchInputRef) => (
    <div className="relative min-w-0 flex-1">
      <InputGroup className="h-11 border-none bg-secondary py-1 pr-2 pl-3">
        <InputGroupAddon className="pl-0 text-muted-foreground"><SearchIcon /></InputGroupAddon>
        <InputGroupInput
          ref={ref}
          className="h-full px-1.5! text-sm tracking-tight placeholder:text-muted-foreground"
          aria-label="Search project data"
          placeholder="Search milestones, requirements, conversations…"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && searchResults[0]) {
              event.preventDefault()
              selectSearchResult(searchResults[0].path)
            }
            if (event.key === 'Escape') setSearchQuery('')
          }}
        />
      </InputGroup>
      {searchResults.length > 0 && <ul className="absolute top-full z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
        {searchResults.map((result) => <li key={`${result.section}-${result.id}`}><button type="button" onClick={() => selectSearchResult(result.path)} className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-muted"><span className="line-clamp-1 text-sm">{result.title}</span><span className="text-xs text-muted-foreground">{result.section}</span></button></li>)}
      </ul>}
    </div>
  )

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 py-3 md:h-20 md:pr-8 md:pl-6">
      {isMobileSearchOpen ? (
        <div className="flex w-full items-center gap-2 md:hidden">
          {searchInput(mobileSearchInputRef)}
          <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" aria-label="Close search" onClick={() => setIsMobileSearchOpen(false)}><CloseIcon /></Button>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <SidebarTrigger className="size-11 shrink-0 md:hidden [&_svg]:size-5!" />
            <div className="flex items-center gap-3"><PageIcon className="hidden size-5 shrink-0 md:block" /><p className="truncate text-lg font-medium">{currentNavItem.name}</p>{project && <span className="hidden truncate text-sm text-muted-foreground lg:block">/ {project.title}</span>}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden w-72 md:block">{searchInput(searchInputRef)}</div>
            <Button type="button" variant="outline" size="icon" className="size-11 rounded-lg md:hidden" aria-label="Open search" onClick={focusMobileSearch}><SearchIcon className="size-4" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" className="relative size-11" aria-label="Notifications"><BellIcon className="size-6!" />{notifications.length > 0 && <span aria-label="Notifications available" className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />}</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bionis-dashboard w-80 p-0">
                <div className="border-b px-3.5 py-3"><p className="text-sm font-medium">Project activity</p><p className="text-xs text-muted-foreground">{notifications.length} recent items</p></div>
                {notifications.length ? notifications.map((notification) => <DropdownMenuItem key={notification.id} className="items-start gap-3 px-3 py-2.5"><span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted"><notification.icon className="size-4" /></span><span className="min-w-0"><span className="block text-sm font-medium">{notification.title}</span><span className="line-clamp-2 text-xs text-muted-foreground">{notification.description}</span></span></DropdownMenuItem>) : <p className="p-4 text-sm text-muted-foreground">No recent project activity.</p>}
                <DropdownMenuSeparator />
                <div className="px-3.5 py-2.5 text-center"><DashboardLink href="/notifications" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">View all activity</DashboardLink></div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button type="button" variant="ghost" className="h-auto gap-2 px-0 aria-expanded:bg-transparent hover:bg-transparent" aria-label="Account menu"><span className="grid size-10 place-items-center rounded-lg bg-muted text-sm font-semibold">{displayName.trim().slice(0, 1).toUpperCase()}</span><span className="hidden max-w-48 flex-col items-start gap-1 text-left md:flex"><span className="max-w-full truncate text-sm font-medium leading-none">{displayName}</span><span className="max-w-full truncate text-xs leading-none text-muted-foreground">{user?.email}</span></span></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bionis-dashboard w-64">
                <div className="px-2 py-1.5"><p className="truncate text-sm font-medium">{displayName}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/settings')}><UserIcon />Project settings</DropdownMenuItem>
                <DropdownMenuItem disabled={busy} onSelect={() => void signOut().catch(() => {})}><CloseIcon />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </header>
  )
}
