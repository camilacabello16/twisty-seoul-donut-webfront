import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, GanttChartSquare, GripVertical, KanbanSquare, LayoutDashboard, List, Pencil, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Badge, DriveLink, Empty, PageHeader } from '../components/ui'
import TaskForm, { STATUS_COLS as cols } from '../components/TaskForm'
import TaskCalendar from '../components/TaskCalendar'
import ListView, { dateRange } from './tasks/ListView'
import TimelineView from './tasks/TimelineView'
import TaskDashboard from './tasks/TaskDashboard'
import { dayISO, parseISO } from '../data'

const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }
const VIEWS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'list', icon: List },
  { id: 'board', icon: KanbanSquare },
  { id: 'calendar', icon: CalendarDays },
  { id: 'timeline', icon: GanttChartSquare },
]

export default function Tasks() {
  const { t, L, tasks, projects, employees, visibleBranchIds, activeBranch, allowedBranches, actions, notify } = useApp()
  const [params, setParams] = useSearchParams()
  const project = params.get('project') || 'all'
  const view = VIEWS.some((v) => v.id === params.get('view')) ? params.get('view') : 'board'
  const update = (patch) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v == null || v === 'all' ? next.delete(k) : next.set(k, v))
    setParams(next)
  }
  const myProjects = projects.filter((p) => p.branches.some((b) => visibleBranchIds.includes(b)))
  const [form, setForm] = useState(null) // null | { task } | { defaults }
  const [cursor, setCursor] = useState(() => parseISO(dayISO(0).slice(0, 8) + '01'))

  const list = tasks.filter((x) => visibleBranchIds.includes(x.branch) && (project === 'all' || x.project === project))
  const people = employees.filter((e) => visibleBranchIds.includes(e.branch) && e.status !== 'resigned')
  const all = activeBranch === 'all'
  const branch = all ? visibleBranchIds[0] : activeBranch
  const openNew = (defaults = {}) => setForm({ defaults })
  const defaultProject = project !== 'all' ? project : undefined

  const quickAdd = (title, status) =>
    actions.addTask({
      title: { vi: title, en: title }, project: defaultProject || myProjects[0]?.id, assignee: '', priority: 'medium', status,
      start: '', due: '', drive: '', branch,
    })

  return (
    <>
      <PageHeader
        title={t('nav.tasks')}
        sub={t('tasks.sub')}
        actions={<button className="btn btn-primary" onClick={() => openNew()}><Plus size={16} aria-hidden /> {t('tasks.add')}</button>}
      />

      <div className="chips" role="group" aria-label={t('tasks.project')}>
        <button className={project === 'all' ? 'on' : ''} onClick={() => update({ project: null })}>{t('common.all')}</button>
        {myProjects.map((p) => (
          <button key={p.id} className={project === p.id ? 'on' : ''} onClick={() => update({ project: p.id })}>{L(p.name)}</button>
        ))}
      </div>

      <div className="viewtabs" role="tablist" aria-label={t('tasks.views')}>
        {VIEWS.map(({ id, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'on' : ''} onClick={() => update({ view: id === 'board' ? null : id })}>
            <Icon size={16} aria-hidden /> {t(`tasks.view.${id}`)}
          </button>
        ))}
      </div>

      {view === 'dashboard' && <TaskDashboard tasks={list} projects={myProjects} employees={people} onEdit={(task) => setForm({ task })} />}
      {view === 'list' && <ListView tasks={list} projects={myProjects} employees={employees} onEdit={(task) => setForm({ task })} onQuickAdd={quickAdd} />}
      {view === 'board' && <Board list={list} onEdit={(task) => setForm({ task })} />}
      {view === 'calendar' && (
        <TaskCalendar
          tasks={list}
          cursor={cursor}
          setCursor={setCursor}
          onCreate={(date) => openNew({ defaultDue: date })}
          onEdit={(task) => setForm({ task })}
        />
      )}
      {view === 'timeline' && <TimelineView tasks={list} projects={myProjects} employees={employees} onEdit={(task) => setForm({ task })} />}

      {form && (
        <TaskForm
          task={form.task || null}
          {...(form.defaults || {})}
          people={people}
          projects={myProjects}
          defaultProject={defaultProject}
          branch={branch}
          branchOptions={all ? allowedBranches : undefined}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form.task) actions.updateTask(form.task.id, data)
            else actions.addTask(data)
            setForm(null)
            notify(t('common.saved'))
          }}
          onDelete={form.task ? () => {
            if (window.confirm(t('tasks.deleteConfirm'))) {
              actions.deleteTask(form.task.id)
              setForm(null)
              notify(t('tasks.deleted'))
            }
          } : null}
        />
      )}
    </>
  )
}

function Board({ list, onEdit }) {
  const { t, L, dateFmt, projects, employees, tasks, actions, notify } = useApp()
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const [overTask, setOverTask] = useState(null)
  const emp = (id) => employees.find((e) => e.id === id)

  const endDrag = () => { setDragId(null); setOverCol(null); setOverTask(null) }
  const drop = (col, beforeId) => {
    if (!dragId) return
    const task = tasks.find((x) => x.id === dragId)
    actions.moveTask(dragId, col, beforeId)
    if (task && task.status !== col) notify(t('tasks.moved', { col: t(`status.${col}`) }))
    endDrag()
  }

  return (
    <>
      <p className="muted small">{t('tasks.hint')}</p>
      <div className="kanban">
        {cols.map((c) => {
          const items = list.filter((x) => x.status === c)
          return (
            <section
              key={c}
              className={`kcol ${dragId && overCol === c ? 'drop-target' : ''}`}
              aria-label={t(`status.${c}`)}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverCol(c) } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setOverCol(null); setOverTask(null) } }}
              onDrop={(e) => { e.preventDefault(); drop(c, overTask) }}
            >
              <h2>{t(`status.${c}`)} <span className="tab-count">{items.length}</span></h2>
              {items.length === 0 && <Empty>{dragId ? t('tasks.drop') : t('common.none')}</Empty>}
              {items.map((x) => (
                <article
                  key={x.id}
                  className={`task ${dragId === x.id ? 'dragging' : ''} ${dragId && overTask === x.id && dragId !== x.id ? 'insert-before' : ''}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', x.id); setDragId(x.id) }}
                  onDragEnd={endDrag}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); e.stopPropagation(); setOverCol(c); setOverTask(x.id) } }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); drop(c, x.id) }}
                >
                  <div className="task-top">
                    <span className="grip" aria-hidden><GripVertical size={16} /></span>
                    <Badge tone={prioTone[x.priority]}>{t(`prio.${x.priority}`)}</Badge>
                    <span className="muted small task-project">{L(projects.find((p) => p.id === x.project)?.name)}</span>
                    <button className="icon-btn" onClick={() => onEdit(x)} aria-label={`${t('tasks.edit')}: ${L(x.title)}`}><Pencil size={15} /></button>
                  </div>
                  <h3>{L(x.title)}</h3>
                  <div className="task-meta">
                    <span><CalendarDays size={14} aria-hidden /> {dateRange(x, dateFmt)}</span>
                    <span>{emp(x.assignee)?.name}</span>
                  </div>
                  {x.drive && <DriveLink href={x.drive} />}
                  <div className="task-move">
                    <button className="icon-btn" disabled={c === 'todo'} onClick={() => actions.moveTask(x.id, cols[cols.indexOf(c) - 1])} aria-label={t('tasks.back')}><ArrowLeft size={16} /></button>
                    <button className="icon-btn" disabled={c === 'done'} onClick={() => actions.moveTask(x.id, cols[cols.indexOf(c) + 1])} aria-label={t('tasks.forward')}><ArrowRight size={16} /></button>
                  </div>
                </article>
              ))}
            </section>
          )
        })}
      </div>
    </>
  )
}
