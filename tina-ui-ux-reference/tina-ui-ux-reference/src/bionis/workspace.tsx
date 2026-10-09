import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { askTina } from './tina-ai'
import { supabase } from './supabase'

export type Status = 'not_started' | 'in_progress' | 'done'

export type Project = {
  id: string
  owner_id: string
  title: string
  summary: string
  tech_stack: string[]
  created_at: string
  updated_at: string
}

export type Requirement = {
  id: string
  project_id: string
  description: string
  status: Status
  evidence: string
  created_at: string
  updated_at: string
}

export type Milestone = {
  id: string
  project_id: string
  title: string
  details: string
  start_date: string | null
  due_date: string | null
  status: Status
  progress: number
  depends_on_id: string | null
  linked_requirement_ids: string[]
  position: number
  created_at: string
  updated_at: string
}

export type ProjectMessage = {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

type Workspace = {
  configured: boolean
  user: User | null
  projects: Project[]
  project: Project | null
  requirements: Requirement[]
  milestones: Milestone[]
  messages: ProjectMessage[]
  loading: boolean
  busy: boolean
  error: string
  clearError: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  resendSignupConfirmation: (email: string) => Promise<void>
  signOut: () => Promise<void>
  selectProject: (id: string) => void
  createProject: (input: { title: string; summary: string; techStack: string[] }) => Promise<void>
  updateProject: (input: { title: string; summary: string; techStack: string[] }) => Promise<void>
  addRequirement: (description: string) => Promise<void>
  updateRequirement: (id: string, patch: Partial<Pick<Requirement, 'status' | 'evidence'>>) => Promise<void>
  addMilestone: (input: { title: string; startDate: string; dueDate: string }) => Promise<void>
  updateMilestone: (id: string, patch: Partial<Pick<Milestone, 'status' | 'progress' | 'start_date' | 'due_date'>>) => Promise<void>
  sendMessage: (content: string) => Promise<void>
}

const WorkspaceContext = createContext<Workspace | null>(null)
const SELECTED_PROJECT_KEY = 'tina-selected-project'

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState(
    () => localStorage.getItem(SELECTED_PROJECT_KEY) ?? '',
  )
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [messages, setMessages] = useState<ProjectMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      setError('')
    })
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError(sessionError.message)
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    }).catch((cause: unknown) => {
      if (!active) return
      setError(cause instanceof Error ? cause.message : 'Could not connect to Supabase.')
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !user) {
      setProjects([])
      setRequirements([])
      setMilestones([])
      setMessages([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    void (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('student_projects')
          .select('*')
          .order('updated_at', { ascending: false })
        if (!active) return
        if (queryError) {
          setError(queryError.message)
          setProjects([])
          return
        }
        const rows = (data ?? []) as Project[]
        setProjects(rows)
        if (!rows.some((item) => item.id === projectId)) {
          const nextId = rows[0]?.id ?? ''
          setProjectId(nextId)
          if (nextId) localStorage.setItem(SELECTED_PROJECT_KEY, nextId)
          else localStorage.removeItem(SELECTED_PROJECT_KEY)
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load projects.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [user, projectId])

  const project = projects.find((item) => item.id === projectId) ?? null

  useEffect(() => {
    if (!supabase || !project) {
      setRequirements([])
      setMilestones([])
      setMessages([])
      return
    }

    let active = true
    setRequirements([])
    setMilestones([])
    setMessages([])
    setLoading(true)
    void (async () => {
      try {
        const [requirementResult, milestoneResult, messageResult] = await Promise.all([
          supabase.from('project_requirements').select('*').eq('project_id', project.id).order('created_at'),
          supabase.from('project_milestones').select('*').eq('project_id', project.id).order('position'),
          supabase.from('project_messages').select('*').eq('project_id', project.id).order('created_at'),
        ])
        if (!active) return
        const failed = requirementResult.error ?? milestoneResult.error ?? messageResult.error
        if (failed) {
          setError(failed.message)
          return
        }
        setRequirements((requirementResult.data ?? []) as Requirement[])
        setMilestones((milestoneResult.data ?? []) as Milestone[])
        setMessages((messageResult.data ?? []) as ProjectMessage[])
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load project data.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [project?.id])

  const withBusy = useCallback(async (operation: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await operation()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The request failed.'
      setError(message)
      throw cause instanceof Error ? cause : new Error(message)
    } finally {
      setBusy(false)
    }
  }, [])

  const signIn = useCallback((email: string, password: string) => withBusy(async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    throwIfError(authError)
  }), [withBusy])

  const signUp = useCallback((name: string, email: string, password: string) => withBusy(async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    throwIfError(authError)
  }), [withBusy])

  const resendSignupConfirmation = useCallback((email: string) => withBusy(async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    })
    throwIfError(resendError)
  }), [withBusy])

  const signOut = useCallback(() => withBusy(async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error: authError } = await supabase.auth.signOut()
    throwIfError(authError)
  }), [withBusy])

  const selectProject = useCallback((id: string) => {
    setProjectId(id)
    if (id) localStorage.setItem(SELECTED_PROJECT_KEY, id)
    else localStorage.removeItem(SELECTED_PROJECT_KEY)
  }, [])

  const createProject = useCallback((input: { title: string; summary: string; techStack: string[] }) => withBusy(async () => {
    if (!supabase || !user) throw new Error('Sign in before creating a project.')
    const { data, error: insertError } = await supabase
      .from('student_projects')
      .insert({
        owner_id: user.id,
        title: input.title.trim(),
        summary: input.summary.trim(),
        tech_stack: input.techStack,
      })
      .select('*')
      .single()
    throwIfError(insertError)
    const created = data as Project
    setProjects((items) => [created, ...items])
    selectProject(created.id)
  }), [selectProject, user, withBusy])

  const updateProject = useCallback((input: { title: string; summary: string; techStack: string[] }) => withBusy(async () => {
    if (!supabase || !project) throw new Error('Select a project before editing it.')
    const { data, error: updateError } = await supabase
      .from('student_projects')
      .update({ title: input.title.trim(), summary: input.summary.trim(), tech_stack: input.techStack })
      .eq('id', project.id)
      .select('*')
      .single()
    throwIfError(updateError)
    setProjects((items) => items.map((item) => item.id === project.id ? data as Project : item))
  }), [project, withBusy])

  const addRequirement = useCallback((description: string) => withBusy(async () => {
    if (!supabase || !project) throw new Error('Create a project before adding requirements.')
    const { data, error: insertError } = await supabase
      .from('project_requirements')
      .insert({ project_id: project.id, description: description.trim() })
      .select('*')
      .single()
    throwIfError(insertError)
    setRequirements((items) => [...items, data as Requirement])
  }), [project, withBusy])

  const updateRequirement = useCallback((id: string, patch: Partial<Pick<Requirement, 'status' | 'evidence'>>) => withBusy(async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error: updateError } = await supabase
      .from('project_requirements')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    throwIfError(updateError)
    setRequirements((items) => items.map((item) => item.id === id ? data as Requirement : item))
  }), [withBusy])

  const addMilestone = useCallback((input: { title: string; startDate: string; dueDate: string }) => withBusy(async () => {
    if (!supabase || !project) throw new Error('Create a project before adding milestones.')
    const { data, error: insertError } = await supabase
      .from('project_milestones')
      .insert({
        project_id: project.id,
        title: input.title.trim(),
        start_date: input.startDate || null,
        due_date: input.dueDate || null,
        position: milestones.length,
      })
      .select('*')
      .single()
    throwIfError(insertError)
    setMilestones((items) => [...items, data as Milestone])
  }), [milestones.length, project, withBusy])

  const updateMilestone = useCallback((id: string, patch: Partial<Pick<Milestone, 'status' | 'progress' | 'start_date' | 'due_date'>>) => withBusy(async () => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error: updateError } = await supabase
      .from('project_milestones')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    throwIfError(updateError)
    setMilestones((items) => items.map((item) => item.id === id ? data as Milestone : item))
  }), [withBusy])

  const sendMessage = useCallback((content: string) => withBusy(async () => {
    if (!supabase || !project) throw new Error('Create or select a project before chatting with Tina.')
    const { data: userMessage, error: userInsertError } = await supabase
      .from('project_messages')
      .insert({ project_id: project.id, role: 'user', content: content.trim() })
      .select('*')
      .single()
    throwIfError(userInsertError)
    const nextMessages = [...messages, userMessage as ProjectMessage]
    setMessages(nextMessages)
    const response = await askTina({ project, requirements, milestones, messages, prompt: content.trim() })
    const { data: tinaMessage, error: tinaInsertError } = await supabase
      .from('project_messages')
      .insert({ project_id: project.id, role: 'assistant', content: response })
      .select('*')
      .single()
    throwIfError(tinaInsertError)
    setMessages((items) => [...items, tinaMessage as ProjectMessage])
  }), [messages, milestones, project, requirements, withBusy])

  const value = useMemo<Workspace>(() => ({
    configured: Boolean(supabase),
    user,
    projects,
    project,
    requirements,
    milestones,
    messages,
    loading: authLoading || loading,
    busy,
    error,
    clearError: () => setError(''),
    signIn,
    signUp,
    resendSignupConfirmation,
    signOut,
    selectProject,
    createProject,
    updateProject,
    addRequirement,
    updateRequirement,
    addMilestone,
    updateMilestone,
    sendMessage,
  }), [user, projects, project, requirements, milestones, messages, authLoading, loading, busy, error, signIn, signUp, resendSignupConfirmation, signOut, selectProject, createProject, updateProject, addRequirement, updateRequirement, addMilestone, updateMilestone, sendMessage])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return value
}
