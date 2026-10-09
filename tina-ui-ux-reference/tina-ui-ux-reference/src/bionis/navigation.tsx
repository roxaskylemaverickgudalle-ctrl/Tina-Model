import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'

type DashboardNavigation = {
  pathname: string
  navigate: (pathname: string) => void
}

const DashboardNavigationContext = createContext<DashboardNavigation | null>(null)

function normalizePathname(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

export function DashboardNavigationProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(() => (
    typeof window === 'undefined' ? '/' : normalizePathname(window.location.pathname)
  ))
  const navigate = useCallback((nextPath: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath)
    }
    setPathname(nextPath)
  }, [])

  useEffect(() => {
    const syncPathname = () => setPathname(normalizePathname(window.location.pathname))
    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  const value = useMemo(
    () => ({ pathname, navigate }),
    [pathname, navigate],
  )

  return (
    <DashboardNavigationContext.Provider value={value}>
      {children}
    </DashboardNavigationContext.Provider>
  )
}

export function useDashboardNavigation() {
  const context = useContext(DashboardNavigationContext)

  if (!context) {
    throw new Error('useDashboardNavigation must be used within DashboardNavigationProvider')
  }

  return context
}

export function DashboardLink({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useDashboardNavigation()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    navigate(href)
  }

  return <a href={href} onClick={handleClick} {...props} />
}
