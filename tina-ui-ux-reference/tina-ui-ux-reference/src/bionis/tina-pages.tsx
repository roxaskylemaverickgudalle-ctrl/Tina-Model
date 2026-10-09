import { useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { CalendarIcon, CheckCircleIcon, PredictionIcon, ReportsIcon, ArrowRightIcon } from './icons'
import { Button } from '@/components/ui/button'
import { useDashboardNavigation } from './navigation'
import { milestones, requirements, panelQuestions, currentUser, type Status } from './data'
import { cn } from '@/lib/utils'

const statusLabel: Record<Status, string> = { not_started: 'Not started', in_progress: 'In progress', done: 'Done' }
const statusClass: Record<Status, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-(--chart-period-bg) text-(--chart-period)',
  done: 'bg-(--vital-good)/10 text-(--vital-good)',
}

function StatusPill({ status }: { status: Status }) {
  return <span className={cn('inline-flex rounded-xl px-2.5 py-1 text-xs font-medium', statusClass[status])}>{statusLabel[status]}</span>
}

function Card({ title, icon: Icon, color, tint, children, className }: {
  title: string; icon: ComponentType<SVGProps<SVGSVGElement>>; color: string; tint?: string; children: React.ReactNode; className?: string
}) {
  return (
    <article className={cn('flex flex-col gap-5 rounded-2xl border bg-background p-4', className)}
      style={tint ? { backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${tint} 8%, transparent) 0%, transparent 42%)` } : undefined}>
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md text-white" style={{ backgroundColor: color }}><Icon className="size-4" /></span>
        <h3 className="font-medium tracking-tight">{title}</h3>
      </div>
      {children}
    </article>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening'
}

export function OverviewPage() {
  const { navigate } = useDashboardNavigation()
  const done = milestones.filter((m) => m.status === 'done').length
  const pct = Math.round((done / milestones.length) * 100)
  const next = milestones.find((m) => m.status !== 'done')
  const stats = [
    { label: 'Milestones done', value: `${done}/${milestones.length}`, color: 'var(--metric-steps)', icon: CalendarIcon },
    { label: 'Requirements met', value: `${requirements.filter((r) => r.status === 'done').length}/${requirements.length}`, color: 'var(--metric-recovery)', icon: CheckCircleIcon },
    { label: 'Panel questions', value: '24', color: 'var(--metric-sleep)', icon: PredictionIcon },
    { label: 'Readiness', value: '72%', color: 'var(--metric-heart)', icon: ReportsIcon },
  ]
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex rounded-xl bg-(--live)/10 px-3 py-1 text-sm font-medium text-(--live)">{currentUser.planStatus}</span>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">{greeting()} {currentUser.name.split(' ')[0]}</h1>
          <p className="mt-1 text-muted-foreground">Build it. Understand it. Defend it.</p>
        </div>
        <Button className="h-10 rounded-lg" onClick={() => navigate('/panel')}>Rehearse with Tina <ArrowRightIcon className="size-4" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex min-h-36 flex-col justify-between rounded-2xl border p-4">
            <span className="flex size-7 items-center justify-center rounded-md text-white" style={{ backgroundColor: s.color }}><s.icon className="size-4" /></span>
            <div><p className="text-3xl font-medium tabular-nums">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Project progress" icon={CalendarIcon} color="var(--insight-prediction)" tint="var(--insight-prediction)">
          <p className="text-5xl font-medium tabular-nums">{pct}%</p>
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-(--bionis-blue)" style={{ width: `${pct}%` }} /></div>
          <p className="text-sm text-muted-foreground">Next up: <span className="font-medium text-foreground">{next?.title}</span> · due {next?.due}</p>
        </Card>
        <Card title="Requirements" icon={CheckCircleIcon} color="var(--insight-actions)" tint="var(--insight-actions)">
          <ul className="flex flex-col gap-2">
            {requirements.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-sm">{r.description}<StatusPill status={r.status} /></li>
            ))}
          </ul>
        </Card>
        <Card title="Tina's latest questions" icon={PredictionIcon} color="var(--insight-vitals)" tint="var(--insight-vitals)">
          <ul className="flex flex-col gap-2">
            {panelQuestions.map((q) => <li key={q} className="rounded-xl bg-muted px-3 py-2 text-sm">{q}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  )
}

const DAY = 86400000
export function TimelinePage() {
  const { start, days } = useMemo(() => {
    const s = Math.min(...milestones.map((m) => +new Date(m.start)))
    const e = Math.max(...milestones.map((m) => +new Date(m.due)))
    return { start: s, days: Math.round((e - s) / DAY) + 1 }
  }, [])
  const months = useMemo(() => {
    const out: { label: string; left: number }[] = []
    const d = new Date(start); d.setDate(1)
    while (+d <= start + days * DAY) {
      out.push({ label: d.toLocaleString('en', { month: 'short' }), left: Math.max(0, ((+d - start) / DAY / days) * 100) })
      d.setMonth(d.getMonth() + 1)
    }
    return out
  }, [start, days])
  const barColor: Record<Status, string> = { done: 'var(--vital-good)', in_progress: 'var(--bionis-blue)', not_started: 'var(--muted-foreground)' }
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div><h1 className="text-3xl font-medium tracking-tight">Build plan</h1><p className="mt-1 text-muted-foreground">Your capstone timeline from proposal to defense.</p></div>
      <article className="overflow-x-auto rounded-2xl border p-4">
        <div className="min-w-[720px]">
          <div className="relative ml-56 h-6 border-b text-xs text-muted-foreground">
            {months.map((m) => <span key={m.label + m.left} className="absolute" style={{ left: `${m.left}%` }}>{m.label}</span>)}
          </div>
          {milestones.map((m) => {
            const left = ((+new Date(m.start) - start) / DAY / days) * 100
            const width = ((+new Date(m.due) - +new Date(m.start)) / DAY / days) * 100 + 100 / days
            return (
              <div key={m.id} className="flex items-center border-b border-border/60 py-3 last:border-0">
                <div className="flex w-56 shrink-0 flex-col gap-1 pr-4">
                  <span className="truncate text-sm font-medium">{m.title}</span>
                  <span><StatusPill status={m.status} /></span>
                </div>
                <div className="relative h-8 flex-1 rounded-lg bg-muted/50">
                  <div className="absolute top-1 h-6 rounded-md" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: barColor[m.status] }} title={`${m.start} → ${m.due}`} />
                </div>
              </div>
            )
          })}
        </div>
      </article>
    </div>
  )
}

export function RequirementsPage() {
  const [items, setItems] = useState(requirements)
  const cycle = (id: string) => setItems((xs) => xs.map((x) => x.id === id ? { ...x, status: x.status === 'not_started' ? 'in_progress' : x.status === 'in_progress' ? 'done' : 'not_started' } : x))
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div><h1 className="text-3xl font-medium tracking-tight">Requirements</h1><p className="mt-1 text-muted-foreground">Tap a status to move it forward.</p></div>
      <ul className="flex flex-col gap-2 rounded-2xl border p-3">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
            <span className="text-sm">{r.description}</span>
            <button type="button" onClick={() => cycle(r.id)}><StatusPill status={r.status} /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}

type Msg = { role: 'user' | 'tina'; text: string }
export function PanelPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: 'tina', text: `Good day. I'm Tina, your panelist. ${panelQuestions[0]}` }])
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    const n = msgs.filter((m) => m.role === 'user').length + 1
    setMsgs((m) => [...m, { role: 'user', text: draft }, { role: 'tina', text: `Noted. Follow-up: ${panelQuestions[n % panelQuestions.length]}` }])
    setDraft('')
  }
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <div><h1 className="text-3xl font-medium tracking-tight">Tina Panel</h1><p className="mt-1 text-muted-foreground">Practice answering tough defense questions.</p></div>
      <div className="flex min-h-80 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border p-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' && 'justify-end')}>
            <p className={cn('max-w-[80%] text-sm leading-relaxed', m.role === 'user' ? 'rounded-2xl bg-primary px-4 py-2 text-primary-foreground' : 'text-foreground')}>
              {m.role === 'tina' && <span className="mb-1 block text-xs font-medium text-(--bionis-blue)">Tina</span>}{m.text}
            </p>
          </div>
        ))}
      </div>
      <form className="flex gap-2 rounded-2xl border p-2" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your answer…" className="flex-1 bg-transparent px-2 text-sm outline-none" />
        <Button type="submit" className="rounded-xl">Send</Button>
      </form>
    </div>
  )
}

export function PlaceholderPage({ title }: { title: string }) {
  return <div className="mx-auto max-w-4xl rounded-2xl border p-8 text-muted-foreground"><h1 className="mb-2 text-2xl font-medium text-foreground">{title}</h1>Coming soon — we'll plug your system in here.</div>
}
