import { useState, type FormEvent } from 'react'
import DashboardLayout from './dashboard-layout'
import { DashboardNavigationProvider, useDashboardNavigation } from './navigation'
import { OverviewPage, TimelinePage, RequirementsPage, PanelPage, ReportsPage, SettingsPage, NotificationsPage } from './connected-pages'
import { useWorkspace, WorkspaceProvider } from './workspace'
import { ThemeProvider } from './theme-provider'
import { Button } from '@/components/ui/button'

function AuthScreen() {
  const { signIn, signUp, resendSignupConfirmation, busy, error, clearError } = useWorkspace()
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setNotice('')
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '')
    const submittedEmail = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    if (mode === 'sign_in') {
      void signIn(submittedEmail, password).catch(() => {})
    } else {
      void signUp(name, submittedEmail, password)
        .then(() => setNotice('Account created. If email confirmation is enabled, check your inbox and spam folder. If it does not arrive, switch to sign in and use Resend confirmation email.'))
        .catch(() => {})
    }
  }

  const resendConfirmation = () => {
    clearError()
    setNotice('')
    void resendSignupConfirmation(email)
      .then(() => setNotice('If this account still needs confirmation, Supabase has sent a new email. Check your inbox and spam folder.'))
      .catch(() => {})
  }

  return (
    <main className="grid min-h-svh place-items-center p-4">
      <section className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">T</span><div><p className="text-xl font-semibold">Tina</p><p className="text-sm text-muted-foreground">Capstone planner and AI panelist</p></div></div>
        <h1 className="text-2xl font-medium">{mode === 'sign_in' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{mode === 'sign_in' ? 'Sign in to load your saved projects.' : 'Your projects and conversations are private to your account.'}</p>
        {error && <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg border border-(--vital-good)/30 bg-(--vital-good)/5 p-3 text-sm">{notice}</p>}
        <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
          {mode === 'sign_up' && <label className="flex flex-col gap-1.5 text-sm font-medium">Name<input name="name" autoComplete="name" required maxLength={120} className="h-10 rounded-lg border bg-background px-3" /></label>}
          <label className="flex flex-col gap-1.5 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-10 rounded-lg border bg-background px-3" /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">Password<input name="password" type="password" autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'} minLength={6} required className="h-10 rounded-lg border bg-background px-3" /></label>
          <Button type="submit" disabled={busy} className="h-10 rounded-lg">{busy ? 'Please wait…' : mode === 'sign_in' ? 'Sign in' : 'Create account'}</Button>
        </form>
        {mode === 'sign_in' && <div className="mt-4 text-center">
          <Button type="button" variant="ghost" disabled={busy || !email.trim()} onClick={resendConfirmation} className="h-auto whitespace-normal text-sm">
            {busy ? 'Please wait…' : 'Resend confirmation email'}
          </Button>
          {!email.trim() && <p className="mt-1 text-xs text-muted-foreground">Enter your email above to resend the verification link.</p>}
        </div>}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === 'sign_in' ? 'New to Tina? ' : 'Already have an account? '}
          <button type="button" onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setNotice(''); clearError() }} className="font-medium text-primary underline-offset-4 hover:underline">{mode === 'sign_in' ? 'Create an account' : 'Sign in'}</button>
        </p>
      </section>
    </main>
  )
}

function SetupScreen() {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <section className="w-full max-w-xl rounded-2xl border bg-background p-6">
        <h1 className="text-2xl font-medium">Connect Tina to Supabase</h1>
        <p className="mt-2 text-sm text-muted-foreground">The frontend is ready, but this environment has no Supabase configuration. Add the following to <code>.env.local</code> in the Tina frontend folder, then restart Vite.</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-xs"><code>VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}VITE_SUPABASE_ANON_KEY=your-publishable-key</code></pre>
        <p className="mt-4 text-sm text-muted-foreground">Apply <code>../../supabase/schema.sql</code> from this frontend folder to create the project, requirements, milestones, and messages tables.</p>
      </section>
    </main>
  )
}

function CurrentScreen() {
  const { pathname } = useDashboardNavigation()
  switch (pathname) {
    case '/timeline': return <TimelinePage />
    case '/requirements': return <RequirementsPage />
    case '/panel': return <PanelPage />
    case '/reports': return <ReportsPage />
    case '/settings': return <SettingsPage />
    case '/notifications': return <NotificationsPage />
    default: return <OverviewPage />
  }
}

function WorkspaceNotice() {
  const { error, clearError } = useWorkspace()
  if (!error) return null
  return (
    <div role="alert" className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive md:mx-8">
      <span>{error}</span>
      <button type="button" onClick={clearError} aria-label="Dismiss error" className="shrink-0 font-medium">Dismiss</button>
    </div>
  )
}

function AuthenticatedApp() {
  const { configured, user, loading } = useWorkspace()
  if (!configured) return <SetupScreen />
  if (loading && !user) return <main className="grid min-h-svh place-items-center text-sm text-muted-foreground" role="status">Connecting to your workspace…</main>
  if (!user) return <AuthScreen />
  return <DashboardLayout><WorkspaceNotice /><CurrentScreen /></DashboardLayout>
}

function WorkspaceApp() {
  return (
    <ThemeProvider defaultTheme="dark">
      <WorkspaceProvider>
        <DashboardNavigationProvider>
          <AuthenticatedApp />
        </DashboardNavigationProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  )
}

export default WorkspaceApp
