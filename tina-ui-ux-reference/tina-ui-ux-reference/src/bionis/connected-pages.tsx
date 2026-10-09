import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { ArrowRightIcon, CalendarIcon, CheckCircleIcon, PredictionIcon, ReportsIcon } from './icons'
import { useDashboardNavigation } from './navigation'
import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'
import { useWorkspace, type Milestone, type Requirement, type Status } from './workspace'
import { cn } from '@/lib/utils'

const statusLabel: Record<Status, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
}

const statusClass: Record<Status, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-(--chart-period-bg) text-(--chart-period)',
  done: 'bg-(--vital-good)/10 text-(--vital-good)',
}

function StatusPill({ status }: { status: Status }) {
  return <span className={cn('inline-flex rounded-xl px-2.5 py-1 text-xs font-medium', statusClass[status])}>{statusLabel[status]}</span>
}

function EmptyProject({ onCreate }: { onCreate: (event: FormEvent<HTMLFormElement>) => void }) {
  const { busy } = useWorkspace()
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-5 rounded-2xl border bg-background p-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Create your first project</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add your capstone project to start tracking its requirements, milestones, and Tina conversations.</p>
      </div>
      <ProjectForm onSubmit={onCreate} busy={busy} submitLabel="Create project" />
    </section>
  )
}

function ProjectForm({
  onSubmit,
  busy,
  submitLabel,
  initialTitle = '',
  initialSummary = '',
  initialStack = '',
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  busy: boolean
  submitLabel: string
  initialTitle?: string
  initialSummary?: string
  initialStack?: string
}) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Project title
        <input name="title" required maxLength={160} defaultValue={initialTitle} className="h-10 rounded-lg border bg-background px-3 text-sm" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Project brief
        <textarea name="summary" rows={4} defaultValue={initialSummary} className="resize-y rounded-lg border bg-background px-3 py-2 text-sm" placeholder="What are you building, and who is it for?" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Tech stack
        <input name="techStack" defaultValue={initialStack} className="h-10 rounded-lg border bg-background px-3 text-sm" placeholder="React, Supabase, PostgreSQL" />
        <span className="text-xs font-normal text-muted-foreground">Separate technologies with commas.</span>
      </label>
      <Button type="submit" disabled={busy} className="h-10 w-fit rounded-lg">{busy ? 'Saving…' : submitLabel}</Button>
    </form>
  )
}

function readProjectForm(event: FormEvent<HTMLFormElement>) {
  const form = new FormData(event.currentTarget)
  return {
    title: String(form.get('title') ?? ''),
    summary: String(form.get('summary') ?? ''),
    techStack: String(form.get('techStack') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
  }
}

function nextStatus(status: Status): Status {
  return status === 'not_started' ? 'in_progress' : status === 'in_progress' ? 'done' : 'not_started'
}

function ProjectRequired() {
  const { projects } = useWorkspace()
  const { navigate } = useDashboardNavigation()
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border p-6">
      <h1 className="text-2xl font-medium">Select a project</h1>
      <p className="text-sm text-muted-foreground">This workspace does not have a project selected yet.</p>
      {projects.length > 0 && <Button className="w-fit" onClick={() => navigate('/')}>Go to overview</Button>}
    </section>
  )
}

export function OverviewPage() {
  const { navigate } = useDashboardNavigation()
  const { user, project, projects, requirements, milestones, messages, createProject, busy, loading } = useWorkspace()
  if (!loading && !projects.length) {
    return <EmptyProject onCreate={(event) => {
      event.preventDefault()
      void createProject(readProjectForm(event)).catch(() => {})
    }} />
  }

  const completeMilestones = milestones.filter((item) => item.status === 'done').length
  const completeRequirements = requirements.filter((item) => item.status === 'done').length
  const totalWork = milestones.length + requirements.length
  const doneWork = completeMilestones + completeRequirements
  const progress = totalWork ? Math.round((doneWork / totalWork) * 100) : 0
  const nextMilestone = milestones.find((item) => item.status !== 'done')
  const latestQuestions = messages.filter((item) => item.role === 'assistant').slice(-3).reverse()
  const stats = [
    { label: 'Tasks done', value: `${completeMilestones}/${milestones.length}`, color: 'var(--metric-steps)', icon: CalendarIcon },
    { label: 'Requirements met', value: `${completeRequirements}/${requirements.length}`, color: 'var(--metric-recovery)', icon: CheckCircleIcon },
    { label: 'Tina conversations', value: String(messages.filter((item) => item.role === 'user').length), color: 'var(--metric-sleep)', icon: PredictionIcon },
    { label: 'Project progress', value: `${progress}%`, color: 'var(--metric-heart)', icon: ReportsIcon },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex rounded-xl bg-(--live)/10 px-3 py-1 text-sm font-medium text-(--live)">{user?.user_metadata.full_name || user?.email || 'Student workspace'}</span>
          <h1 className="mt-3 truncate text-3xl font-medium tracking-tight">{project?.title ?? 'Your projects'}</h1>
          <p className="mt-1 text-muted-foreground">Build it. Understand it. Defend it.</p>
        </div>
        <Button className="h-10 rounded-lg" onClick={() => navigate('/panel')}>Rehearse with Tina <ArrowRightIcon className="size-4" /></Button>
      </div>
      {loading && <p role="status" className="text-sm text-muted-foreground">Loading project data…</p>}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex min-h-36 flex-col justify-between rounded-2xl border p-4">
            <span className="flex size-7 items-center justify-center rounded-md text-white" style={{ backgroundColor: stat.color }}><stat.icon className="size-4" /></span>
            <div><p className="text-3xl font-medium tabular-nums">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="flex flex-col gap-5 rounded-2xl border bg-background p-4">
          <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-(--insight-prediction) text-white"><CalendarIcon className="size-4" /></span><h2 className="font-medium">Project progress</h2></div>
          <p className="text-5xl font-medium tabular-nums">{progress}%</p>
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-(--bionis-blue)" style={{ width: `${progress}%` }} /></div>
          <p className="text-sm text-muted-foreground">{nextMilestone ? <>Next up: <span className="font-medium text-foreground">{nextMilestone.title}</span>{nextMilestone.due_date ? ` · due ${nextMilestone.due_date}` : ''}</> : 'Add tasks to plan your next steps.'}</p>
        </article>
        <article className="flex flex-col gap-5 rounded-2xl border bg-background p-4">
          <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-(--insight-actions) text-white"><CheckCircleIcon className="size-4" /></span><h2 className="font-medium">Requirements</h2></div>
          {requirements.length ? <ul className="flex flex-col gap-2">{requirements.slice(0, 4).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-sm"><span className="line-clamp-2">{item.description}</span><StatusPill status={item.status} /></li>)}</ul> : <p className="text-sm text-muted-foreground">Add your first project requirement.</p>}
        </article>
        <article className="flex flex-col gap-5 rounded-2xl border bg-background p-4">
          <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-(--insight-vitals) text-white"><PredictionIcon className="size-4" /></span><h2 className="font-medium">Tina's latest responses</h2></div>
          {latestQuestions.length ? <ul className="flex flex-col gap-2">{latestQuestions.map((item) => <li key={item.id} className="line-clamp-3 rounded-xl bg-muted px-3 py-2 text-sm">{item.content}</li>)}</ul> : <p className="text-sm text-muted-foreground">Your real project conversations with Tina will appear here.</p>}
        </article>
      </div>
      {!project && projects.length > 0 && <ProjectRequired />}
      {busy && <p role="status" className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  )
}

const GANTT_DAY_WIDTH = 28
const GANTT_DAY_MS = 86400000

const ganttTemplates = [
  { name: 'Meadow', tag: 'Popular', description: 'A roomy, calm layout with soft green bars.', surface: '#f6f8ec', track: '#e6eddc', grid: '#ccd9c0', ink: '#263d2a', accent: '#236b39', style: 'rounded' },
  { name: 'Sky', tag: 'Compact', description: 'A clean, date-led schedule for busy plans.', surface: '#eef7fa', track: '#dcebf0', grid: '#b9d4dd', ink: '#193b4a', accent: '#177a9a', style: 'square' },
  { name: 'Orchard', tag: 'Roadmap', description: 'A spacious, editorial look for project phases.', surface: '#f5f1df', track: '#e9e1c9', grid: '#d2c5a3', ink: '#483e26', accent: '#8b7134', style: 'outlined' },
  { name: 'Cyberpunk', tag: 'Dark mode', description: 'High-contrast striped bars for sprint planning.', surface: '#172126', track: '#28383e', grid: '#52676d', ink: '#f1f6f2', accent: '#b8f34a', style: 'striped' },
  { name: 'Minimalist', tag: 'Wireframe', description: 'A crisp, quiet schedule with outlined task bars.', surface: '#ffffff', track: '#f0f2f4', grid: '#aab2b8', ink: '#19252d', accent: '#075d78', style: 'wireframe' },
] as const

function GanttTemplateCard({ template }: { template: (typeof ganttTemplates)[number] }) {
  const barStyle = (width: string, left: string) => ({
    width,
    left,
    backgroundColor: template.style === 'outlined' || template.style === 'wireframe' ? 'transparent' : template.accent,
    backgroundImage: template.style === 'striped' ? 'repeating-linear-gradient(135deg, transparent 0 4px, rgb(255 255 255 / 42%) 4px 6px)' : undefined,
    border: template.style === 'outlined' || template.style === 'wireframe' ? `1px solid ${template.accent}` : undefined,
    borderRadius: template.style === 'rounded' ? '9999px' : template.style === 'square' ? '2px' : '4px',
  })

  return (
    <article className="overflow-hidden rounded-2xl border bg-background p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{template.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">{template.tag}</span>
      </div>
      <div className="mt-4 space-y-2 rounded-xl border p-3" style={{ backgroundColor: template.surface, borderColor: template.grid }}>
        {[['42%', '9%'], ['61%', '28%'], ['34%', '54%']].map(([width, offset], index) => (
          <div key={index} className="flex h-5 items-center gap-2">
            <span className="h-1 w-10 shrink-0 rounded-full opacity-50" style={{ backgroundColor: template.ink }} />
            <div className="relative h-3 flex-1 rounded-sm" style={{
              backgroundColor: template.track,
              backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(25% - 1px), ${template.grid} calc(25% - 1px), ${template.grid} 25%)`,
            }}>
              <span className="absolute inset-y-0 block" style={barStyle(width, offset)} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">Template preview</p>
    </article>
  )
}

function dateToDay(date: string) {
  return Date.parse(`${date}T00:00:00Z`)
}

function dayToDate(day: number) {
  return new Date(day).toISOString().slice(0, 10)
}

export function TimelinePage() {
  const { milestones, projects, project, addMilestone, updateMilestone, busy } = useWorkspace()
  const scheduled = milestones.filter((item) => item.start_date && item.due_date && item.start_date <= item.due_date)
  const range = useMemo(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const first = scheduled.length
      ? Math.min(...scheduled.map((item) => dateToDay(item.start_date!)))
      : today.getTime()
    const last = scheduled.length
      ? Math.max(...scheduled.map((item) => dateToDay(item.due_date!)))
      : first + 27 * GANTT_DAY_MS
    const start = first - 7 * GANTT_DAY_MS
    const days = Math.max(28, Math.round((last - first) / GANTT_DAY_MS) + 15)
    return { start, days, width: days * GANTT_DAY_WIDTH }
  }, [milestones])
  const ticks = useMemo(
    () => Array.from({ length: Math.ceil(range.days / 7) }, (_, index) => {
      const day = range.start + index * 7 * GANTT_DAY_MS
      return { day, left: index * 7 * GANTT_DAY_WIDTH }
    }),
    [range],
  )

  if (!project && projects.length === 0) return <ProjectRequired />

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Gantt chart editor</h1>
        <p className="mt-1 text-muted-foreground">Plan and reschedule project tasks. Drag a bar to move it, or drag either end to resize it.</p>
      </div>
      <section aria-labelledby="gantt-templates-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="gantt-templates-heading" className="text-lg font-medium">Chart templates</h2>
            <p className="mt-1 text-sm text-muted-foreground">Explore different Gantt chart looks. Template selection is coming soon.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ganttTemplates.map((template) => <GanttTemplateCard key={template.name} template={template} />)}
        </div>
      </section>
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border p-4" onSubmit={(event) => {
        event.preventDefault()
        const element = event.currentTarget
        const form = new FormData(element)
        void addMilestone({ title: String(form.get('title') ?? ''), startDate: String(form.get('start') ?? ''), dueDate: String(form.get('due') ?? '') })
          .then(() => element.reset())
          .catch(() => {})
      }}>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">Task<input name="title" required maxLength={200} className="h-10 rounded-lg border bg-background px-3" /></label>
        <label className="flex flex-col gap-1 text-sm">Start date<input name="start" type="date" className="h-10 rounded-lg border bg-background px-3" /></label>
        <label className="flex flex-col gap-1 text-sm">Due date<input name="due" type="date" className="h-10 rounded-lg border bg-background px-3" /></label>
        <Button disabled={busy} type="submit" className="h-10 rounded-lg">Add task</Button>
      </form>
      {milestones.length === 0 ? <p className="rounded-2xl border p-6 text-sm text-muted-foreground">No tasks yet. Add one above to start planning.</p> : (
        <>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-(--bionis-blue)" />In progress</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-(--vital-good)" />Done</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-muted-foreground" />Not started</span>
            <span>Drag bars to move dates · drag the ends to resize</span>
          </div>
          <article className="overflow-x-auto rounded-2xl border bg-background p-4">
            <div className="min-w-[960px]">
              <div className="grid grid-cols-[15rem_minmax(0,1fr)] gap-4 border-b pb-2">
                <div className="flex items-end text-xs font-medium text-muted-foreground">Task</div>
                <div className="relative h-10" style={{ width: range.width }}>
                  {ticks.map((tick) => <span key={tick.day} className="absolute bottom-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted-foreground" style={{ left: tick.left }}>{new Date(tick.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>)}
                </div>
              </div>
              {milestones.map((item) => <GanttMilestoneRow key={item.id} milestone={item} range={range} onUpdate={updateMilestone} />)}
            </div>
          </article>
        </>
      )}
    </div>
  )
}

function GanttMilestoneRow({ milestone, range, onUpdate }: {
  milestone: Milestone
  range: { start: number; days: number; width: number }
  onUpdate: (id: string, patch: Partial<Pick<Milestone, 'status' | 'progress' | 'start_date' | 'due_date'>>) => Promise<void>
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ mode: 'move' | 'start' | 'end'; pointerX: number; start: number; end: number } | null>(null)
  const [preview, setPreview] = useState<{ start: string; end: string } | null>(null)
  const startDate = preview?.start ?? milestone.start_date
  const dueDate = preview?.end ?? milestone.due_date
  const startDay = startDate ? dateToDay(startDate) : null
  const dueDay = dueDate ? dateToDay(dueDate) : null
  const left = startDay === null ? 0 : ((startDay - range.start) / GANTT_DAY_MS) * GANTT_DAY_WIDTH
  const width = startDay === null || dueDay === null ? 0 : ((dueDay - startDay) / GANTT_DAY_MS + 1) * GANTT_DAY_WIDTH
  const barColor = milestone.status === 'done' ? 'var(--vital-good)' : milestone.status === 'in_progress' ? 'var(--bionis-blue)' : 'var(--muted-foreground)'

  const beginDrag = (event: PointerEvent<HTMLElement>, mode: 'move' | 'start' | 'end') => {
    if (!milestone.start_date || !milestone.due_date) return
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      mode,
      pointerX: event.clientX,
      start: dateToDay(milestone.start_date),
      end: dateToDay(milestone.due_date),
    }
    barRef.current?.setPointerCapture(event.pointerId)
  }

  const datesAtPointer = (pointerX: number) => {
    const drag = dragRef.current
    if (!drag) return null
    const change = Math.round((pointerX - drag.pointerX) / GANTT_DAY_WIDTH) * GANTT_DAY_MS
    if (drag.mode === 'move') {
      return { start: dayToDate(drag.start + change), end: dayToDate(drag.end + change) }
    }
    if (drag.mode === 'start') {
      return { start: dayToDate(Math.min(drag.start + change, drag.end)), end: dayToDate(drag.end) }
    }
    return { start: dayToDate(drag.start), end: dayToDate(Math.max(drag.end + change, drag.start)) }
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dates = datesAtPointer(event.clientX)
    dragRef.current = null
    setPreview(null)
    if (!dates || (dates.start === milestone.start_date && dates.end === milestone.due_date)) return
    void onUpdate(milestone.id, { start_date: dates.start, due_date: dates.end }).catch(() => {})
  }

  return (
    <form className="grid grid-cols-[15rem_minmax(0,1fr)] items-center gap-4 border-b border-border/60 py-3 last:border-0" onSubmit={(event) => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      void onUpdate(milestone.id, {
        start_date: String(form.get('start') || '') || null,
        due_date: String(form.get('due') || '') || null,
        progress: Math.min(100, Math.max(0, Number(form.get('progress') ?? milestone.progress))),
      }).catch(() => {})
    }}>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="truncate text-sm font-medium" title={milestone.title}>{milestone.title}</span>
        <div className="flex items-center gap-2">
          <select aria-label={`Status for ${milestone.title}`} value={milestone.status} onChange={(event) => {
            const status = event.target.value as Status
            void onUpdate(milestone.id, { status, progress: status === 'done' ? 100 : status === 'not_started' ? 0 : Math.max(1, milestone.progress) }).catch(() => {})
          }} className="h-7 min-w-0 rounded-lg border bg-background px-2 text-xs">
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <span className="truncate text-[11px] text-muted-foreground">{startDate && dueDate ? `${startDate} → ${dueDate}` : 'Dates not set'}</span>
        </div>
      </div>
      <div className="relative h-11" style={{
        width: range.width,
        backgroundImage: 'repeating-linear-gradient(to right, transparent 0, transparent 27px, var(--border) 27px, var(--border) 28px)',
      }}>
        {width > 0 ? <div
          ref={barRef}
          role="group"
          aria-label={`${milestone.title}, ${startDate} to ${dueDate}. Drag to reschedule; use the handles to resize.`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            if (!milestone.start_date || !milestone.due_date) return
            event.preventDefault()
            const shift = (event.key === 'ArrowRight' ? 1 : -1) * GANTT_DAY_MS
            void onUpdate(milestone.id, {
              start_date: dayToDate(dateToDay(milestone.start_date) + shift),
              due_date: dayToDate(dateToDay(milestone.due_date) + shift),
            }).catch(() => {})
          }}
          onPointerMove={(event) => {
            if (dragRef.current) setPreview(datesAtPointer(event.clientX))
          }}
          onPointerUp={finishDrag}
          onPointerCancel={() => { dragRef.current = null; setPreview(null) }}
          onPointerDown={(event) => beginDrag(event, 'move')}
          className="absolute top-2 h-7 cursor-grab touch-none rounded-lg text-white shadow-sm outline-none hover:brightness-110 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring"
          style={{ left, width, backgroundColor: barColor }}
          title={`${milestone.title} · ${startDate} to ${dueDate} · ${milestone.progress}% complete`}
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-white/25" style={{ width: `${milestone.progress}%` }} />
          <span className="pointer-events-none relative block truncate px-3 text-left text-xs font-medium leading-7">{milestone.title}</span>
          <button type="button" aria-label={`Resize start date for ${milestone.title}`} onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            if (!milestone.start_date || !milestone.due_date) return
            event.preventDefault()
            const shift = (event.key === 'ArrowRight' ? 1 : -1) * GANTT_DAY_MS
            void onUpdate(milestone.id, { start_date: dayToDate(Math.min(dateToDay(milestone.start_date) + shift, dateToDay(milestone.due_date))) }).catch(() => {})
          }} onPointerDown={(event) => beginDrag(event, 'start')} className="absolute inset-y-0 left-0 w-3 cursor-ew-resize rounded-l-lg bg-white/20" />
          <button type="button" aria-label={`Resize due date for ${milestone.title}`} onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
            if (!milestone.start_date || !milestone.due_date) return
            event.preventDefault()
            const shift = (event.key === 'ArrowRight' ? 1 : -1) * GANTT_DAY_MS
            void onUpdate(milestone.id, { due_date: dayToDate(Math.max(dateToDay(milestone.due_date) + shift, dateToDay(milestone.start_date))) }).catch(() => {})
          }} onPointerDown={(event) => beginDrag(event, 'end')} className="absolute inset-y-0 right-0 w-3 cursor-ew-resize rounded-r-lg bg-white/20" />
        </div> : <span className="absolute top-3 text-xs text-muted-foreground" style={{ left: Math.max(0, range.width / 2 - 64) }}>Set start and due dates to schedule</span>}
      </div>
      <details className="col-span-2 -mt-2 pb-1 pl-1">
        <summary className="w-fit cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline">Edit dates and progress</summary>
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-muted/50 p-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Start<input name="start" type="date" defaultValue={milestone.start_date ?? ''} className="h-9 rounded border bg-background px-2" /></label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Due<input name="due" type="date" defaultValue={milestone.due_date ?? ''} className="h-9 rounded border bg-background px-2" /></label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Progress (%)<input name="progress" type="number" min={0} max={100} defaultValue={milestone.progress} className="h-9 w-24 rounded border bg-background px-2" /></label>
          <Button type="submit" size="sm" className="rounded-lg">Save changes</Button>
        </div>
      </details>
    </form>
  )
}

export function RequirementsPage() {
  const { requirements, projects, project, addRequirement, updateRequirement, busy } = useWorkspace()
  const [evidence, setEvidence] = useState<Record<string, string>>({})
  if (!project && projects.length === 0) return <ProjectRequired />

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div><h1 className="text-3xl font-medium tracking-tight">Requirements</h1><p className="mt-1 text-muted-foreground">Track the status and supporting evidence for each requirement.</p></div>
      <form className="flex gap-2 rounded-2xl border p-3" onSubmit={(event) => {
        event.preventDefault()
        const element = event.currentTarget
        const data = new FormData(element)
        void addRequirement(String(data.get('description') ?? '')).then(() => element.reset()).catch(() => {})
      }}>
        <input name="description" required maxLength={4000} placeholder="Add a project requirement…" className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm" />
        <Button type="submit" disabled={busy} className="rounded-lg">Add</Button>
      </form>
      {requirements.length ? <ul className="flex flex-col gap-3 rounded-2xl border p-3">{requirements.map((item) => (
        <RequirementRow key={item.id} item={item} evidence={evidence[item.id] ?? item.evidence} onEvidenceChange={(value) => setEvidence((current) => ({ ...current, [item.id]: value }))} onUpdate={updateRequirement} />
      ))}</ul> : <p className="rounded-2xl border p-6 text-sm text-muted-foreground">No requirements added yet.</p>}
    </div>
  )
}

function RequirementRow({ item, evidence, onEvidenceChange, onUpdate }: {
  item: Requirement
  evidence: string
  onEvidenceChange: (value: string) => void
  onUpdate: (id: string, patch: Partial<Pick<Requirement, 'status' | 'evidence'>>) => Promise<void>
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-muted px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">{item.description}</span>
        <button type="button" aria-label={`Change status for ${item.description}`} onClick={() => void onUpdate(item.id, { status: nextStatus(item.status) }).catch(() => {})}><StatusPill status={item.status} /></button>
      </div>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => {
        event.preventDefault()
        void onUpdate(item.id, { evidence }).catch(() => {})
      }}>
        <input value={evidence} onChange={(event) => onEvidenceChange(event.target.value)} maxLength={4000} aria-label={`Evidence for ${item.description}`} placeholder="Evidence, link, or note…" className="h-9 min-w-48 flex-1 rounded-lg border bg-background px-3 text-xs" />
        <button type="submit" className="text-xs font-medium text-primary underline-offset-4 hover:underline">Save evidence</button>
      </form>
    </li>
  )
}

export function PanelPage() {
  const { messages, project, projects, sendMessage, busy } = useWorkspace()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  if (!project && projects.length === 0) return <ProjectRequired />

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || busy) return
    void sendMessage(content).then(() => setDraft('')).catch(() => {})
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <div><h1 className="text-3xl font-medium tracking-tight">Tina Panel</h1><p className="mt-1 text-muted-foreground">{project ? `Project: ${project.title}` : 'Choose a project to start a conversation.'} Tina uses your saved brief, milestones, and requirements.</p></div>
      <div className="flex min-h-80 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border p-4">
        {messages.length === 0 && <div className="m-auto max-w-md text-center"><p className="text-sm font-medium">Start a real project defense rehearsal</p><p className="mt-2 text-sm text-muted-foreground">Tina's replies are generated by your local ONNX model and saved to this project.</p></div>}
        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.role === 'user' && 'justify-end')}>
            <div className={cn('max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
              <span className="mb-1 block text-xs font-medium opacity-70">{message.role === 'user' ? 'You' : 'Tina'}</span>{message.content}
            </div>
          </div>
        ))}
        {busy && <p role="status" className="text-sm text-muted-foreground">Tina is thinking…</p>}
        <div ref={endRef} />
      </div>
      <form className="flex gap-2 rounded-2xl border p-2" onSubmit={send}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!project || busy} placeholder="Ask Tina about your project…" className="flex-1 bg-transparent px-2 text-sm outline-none disabled:opacity-50" />
        <Button type="submit" disabled={!project || busy || !draft.trim()} className="rounded-xl">Send</Button>
      </form>
    </div>
  )
}

export function ReportsPage() {
  const { project, projects, requirements, milestones, messages } = useWorkspace()
  if (!project && projects.length === 0) return <ProjectRequired />
  const report = { project, requirements, milestones, messages }
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(project?.title || 'tina-project').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-report.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div><h1 className="text-3xl font-medium tracking-tight">Project report</h1><p className="mt-1 text-muted-foreground">Export the latest saved project, requirement, milestone, and Tina conversation data.</p></div>
      <article className="rounded-2xl border p-5"><h2 className="font-medium">{project?.title}</h2><p className="mt-2 text-sm text-muted-foreground">{requirements.length} requirements · {milestones.length} milestones · {messages.length} conversation messages</p><Button className="mt-5 rounded-lg" onClick={download}>Download JSON report</Button></article>
    </div>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, project, projects, updateProject, signOut, busy } = useWorkspace()
  if (!project && projects.length === 0) return <ProjectRequired />
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div><h1 className="text-3xl font-medium tracking-tight">Settings</h1><p className="mt-1 text-muted-foreground">Manage your project, appearance, and account.</p></div>
      <section className="rounded-2xl border p-5"><h2 className="mb-4 font-medium">Project details</h2><ProjectForm key={project?.id} busy={busy} submitLabel="Save project" initialTitle={project?.title} initialSummary={project?.summary} initialStack={project?.tech_stack.join(', ')} onSubmit={(event) => {
        event.preventDefault()
        void updateProject(readProjectForm(event)).catch(() => {})
      }} /></section>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"><div><h2 className="font-medium">Appearance</h2><p className="mt-1 text-sm text-muted-foreground">Current theme: {theme}</p></div><select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} className="h-10 rounded-lg border bg-background px-3"><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></section>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5"><div><h2 className="font-medium">Account</h2><p className="mt-1 text-sm text-muted-foreground">{user?.email}</p></div><Button variant="outline" disabled={busy} onClick={() => void signOut().catch(() => {})}>Sign out</Button></section>
    </div>
  )
}

export function NotificationsPage() {
  const { milestones, requirements, messages, projects, project } = useWorkspace()
  if (!project && projects.length === 0) return <ProjectRequired />
  const dueSoon = milestones.filter((item) => item.due_date && item.status !== 'done').sort((a, b) => a.due_date!.localeCompare(b.due_date!))
  const activity = [
    ...dueSoon.map((item) => ({ id: item.id, title: `Upcoming milestone: ${item.title}`, detail: `Due ${item.due_date}`, date: item.due_date ?? '' })),
    ...requirements.filter((item) => item.status !== 'done').map((item) => ({ id: item.id, title: `Requirement in progress: ${item.description}`, detail: statusLabel[item.status], date: item.updated_at })),
    ...messages.slice(-3).reverse().map((item) => ({ id: item.id, title: item.role === 'assistant' ? 'Tina replied' : 'You messaged Tina', detail: item.content, date: item.created_at })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div><h1 className="text-3xl font-medium tracking-tight">Notifications</h1><p className="mt-1 text-muted-foreground">Recent activity from your selected project.</p></div>
      {activity.length ? <ul className="flex flex-col gap-2">{activity.map((item) => <li key={item.id} className="rounded-2xl border p-4"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.detail}</p></li>)}</ul> : <p className="rounded-2xl border p-6 text-sm text-muted-foreground">Nothing new to report.</p>}
    </div>
  )
}
