import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Filter, GanttChartSquare, GripVertical, KanbanSquare, LayoutDashboard, List, Pencil, Plus, Repeat, Search, X } from 'lucide-react'
import { useApp } from '../store'
import { Badge, DriveLink, Empty, PageHeader } from '../components/ui'
import TaskForm, { STATUS_COLS as cols } from '../components/TaskForm'
import TaskCalendar from '../components/TaskCalendar'
import DayGrid from '../components/DayGrid'
import ListView, { dateRange } from './tasks/ListView'
import TimelineView from './tasks/TimelineView'
import TaskDashboard from './tasks/TaskDashboard'
import TaskPanel from './tasks/TaskPanel'
import { dayISO, parseISO, TASK_CATEGORIES } from '../data'
import { isRecurring, taskStart } from '../lib/recur'
import { computeSchedule, computeTimed } from '../lib/schedule'

const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }
const VIEWS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'list', icon: List },
  { id: 'board', icon: KanbanSquare },
  { id: 'calendar', icon: CalendarDays },
  { id: 'timeline', icon: GanttChartSquare },
]
const NO_FILTER = { q: '', assignee: '', status: '', priority: '', category: '', department: '', sFrom: '', sTo: '', dFrom: '', dTo: '' }

export function applyFilters(list, f, L) {
  const q = f.q.trim().toLowerCase()
  return list.filter((x) => {
    if (q && !`${L(x.title)} ${x.description || ''} ${x.note || ''}`.toLowerCase().includes(q)) return false
    if (f.assignee && (f.assignee === 'none' ? x.assignee : x.assignee !== f.assignee)) return false
    if (f.status && x.status !== f.status) return false
    if (f.priority && x.priority !== f.priority) return false
    if (f.category && x.category !== f.category) return false
    if (f.department && (f.department === 'none' ? x.department : x.department !== f.department)) return false
    const s = x.due ? taskStart(x) : ''
    if (f.sFrom && !(s && s >= f.sFrom)) return false
    if (f.sTo && !(s && s <= f.sTo)) return false
    if (f.dFrom && !(x.due && x.due >= f.dFrom)) return false
    if (f.dTo && !(x.due && x.due <= f.dTo)) return false
    return true
  })
}

export default function Tasks() {
  const { t, L, tasks, projects, employees, departments, visibleBranchIds, activeBranch, allowedBranches, actions, notify } = useApp()
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
  const [day, setDay] = useState(() => dayISO(0))
  const calMode = params.get('cal') === 'month' ? 'month' : 'day'
  const [filters, setFilters] = useState(NO_FILTER)
  const [showFilters, setShowFilters] = useState(false)

  const people = employees.filter((e) => visibleBranchIds.includes(e.branch) && e.status !== 'resigned')
  const myDepts = departments.filter((d) => visibleBranchIds.includes(d.branch))
  const byProject = tasks.filter((x) => visibleBranchIds.includes(x.branch) && (project === 'all' || (project === 'none' ? !x.project : x.project === project)))
  const list = useMemo(() => applyFilters(byProject, filters, L), [byProject, filters, L])
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'q' && v).length
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })

  const all = activeBranch === 'all'
  const branch = all ? visibleBranchIds[0] : activeBranch
  const openNew = (defaults = {}) => setForm({ defaults })
  const defaultProject = project !== 'all' && project !== 'none' ? project : ''

  const quickAdd = (title, status = 'todo') =>
    actions.addTask({ title: { vi: title, en: title }, project: defaultProject, assignee: '', priority: 'medium', status, branch })

  // Lên lịch / dời lịch bằng kéo thả (lịch và timeline)
  const schedule = (payload, dropIso) => {
    const task = tasks.find((x) => x.id === payload.id)
    if (!task) return
    actions.updateTask(task.id, computeSchedule(task, payload, dropIso))
    notify(t('tasks.scheduled', { date: parseISO(dropIso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }))
  }

  // Thả công việc vào một giờ cụ thể của ngày (startMin = null: cả ngày, không có giờ)
  const scheduleTimed = (payload, date, startMin) => {
    const task = tasks.find((x) => x.id === payload.id)
    if (!task) return
    actions.updateTask(task.id, computeTimed(task, payload, date, startMin))
    notify(t('tasks.scheduled', { date: parseISO(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }))
  }

  const withPanel = (main) => (
    <div className="with-panel">
      <div className="main-col">{main}</div>
      <TaskPanel tasks={list} projects={myProjects} onEdit={(task) => setForm({ task })} onQuickAdd={quickAdd} onNew={() => openNew()} />
    </div>
  )

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
        <button className={project === 'none' ? 'on' : ''} onClick={() => update({ project: 'none' })}>{t('tasks.noProject')}</button>
      </div>

      <div className="filterbar">
        <div className="tp-add grow">
          <Search size={16} aria-hidden />
          <input value={filters.q} onChange={setF('q')} placeholder={t('flt.search')} aria-label={t('flt.search')} />
        </div>
        <button className={`btn ${activeCount ? 'btn-primary' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
          <Filter size={16} aria-hidden /> {t('flt.title')}{activeCount > 0 && <span className="tab-count">{activeCount}</span>}
        </button>
        {(activeCount > 0 || filters.q) && <button className="btn btn-ghost" onClick={() => setFilters(NO_FILTER)}><X size={16} aria-hidden /> {t('flt.clear')}</button>}
        <span className="muted small">{t('flt.result', { n: list.length, total: byProject.length })}</span>
      </div>

      {showFilters && (
        <section className="filters panel" aria-label={t('flt.title')}>
          <label className="field"><span>{t('tasks.assignee')}</span>
            <select value={filters.assignee} onChange={setF('assignee')}>
              <option value="">{t('common.all')}</option>
              <option value="none">{t('tasks.unassigned')}</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('tasks.status')}</span>
            <select value={filters.status} onChange={setF('status')}>
              <option value="">{t('common.all')}</option>
              {cols.map((c) => <option key={c} value={c}>{t(`status.${c}`)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('tasks.priority')}</span>
            <select value={filters.priority} onChange={setF('priority')}>
              <option value="">{t('common.all')}</option>
              {['high', 'medium', 'low'].map((p) => <option key={p} value={p}>{t(`prio.${p}`)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('tasks.category')}</span>
            <select value={filters.category} onChange={setF('category')}>
              <option value="">{t('common.all')}</option>
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{t(`tcat.${c}`)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('tasks.department')}</span>
            <select value={filters.department} onChange={setF('department')}>
              <option value="">{t('common.all')}</option>
              <option value="none">{t('tasks.noDept')}</option>
              {myDepts.map((d) => <option key={d.id} value={d.id}>{L(d.name)}{all ? ` · ${L(allowedBranches.find((b) => b.id === d.branch)?.name)}` : ''}</option>)}
            </select>
          </label>
          <span />
          <label className="field"><span>{t('flt.startFrom')}</span><input type="date" value={filters.sFrom} onChange={setF('sFrom')} /></label>
          <label className="field"><span>{t('flt.startTo')}</span><input type="date" min={filters.sFrom || undefined} value={filters.sTo} onChange={setF('sTo')} /></label>
          <label className="field"><span>{t('flt.dueFrom')}</span><input type="date" value={filters.dFrom} onChange={setF('dFrom')} /></label>
          <label className="field"><span>{t('flt.dueTo')}</span><input type="date" min={filters.dFrom || undefined} value={filters.dTo} onChange={setF('dTo')} /></label>
        </section>
      )}

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
      {view === 'calendar' && withPanel(
        <>
          <div className="cal-mode-row">
            <div className="seg" role="group" aria-label={t('cal.mode')}>
              <button className={calMode === 'day' ? 'on' : ''} onClick={() => update({ cal: null })}>{t('cal.day')}</button>
              <button className={calMode === 'month' ? 'on' : ''} onClick={() => update({ cal: 'month' })}>{t('cal.month')}</button>
            </div>
          </div>
          {calMode === 'day' ? (
            <DayGrid
              tasks={list}
              day={day}
              setDay={setDay}
              onEdit={(task) => setForm({ task })}
              onCreate={({ date, startTime, endTime }) => openNew({ defaultDue: date, defaultStartTime: startTime, defaultEndTime: endTime })}
              onUpdate={(id, patch) => actions.updateTask(id, patch)}
              onDropTask={scheduleTimed}
            />
          ) : (
            <TaskCalendar
              tasks={list}
              cursor={cursor}
              setCursor={setCursor}
              selected={day}
              onSelect={setDay}
              onCreate={(date) => openNew({ defaultDue: date })}
              onEdit={(task) => setForm({ task })}
              onDropTask={schedule}
              onOpenDay={(iso) => { setDay(iso); update({ cal: null }) }}
            />
          )}
        </>,
      )}
      {view === 'timeline' && withPanel(<TimelineView tasks={list} projects={myProjects} employees={employees} onEdit={(task) => setForm({ task })} onDropTask={schedule} />)}

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
                    <span className="muted small task-project">{projects.find((p) => p.id === x.project) ? L(projects.find((p) => p.id === x.project).name) : t('tasks.noProject')}</span>
                    <button className="icon-btn" onClick={() => onEdit(x)} aria-label={`${t('tasks.edit')}: ${L(x.title)}`}><Pencil size={15} /></button>
                  </div>
                  <h3>{isRecurring(x) && <Repeat size={13} aria-hidden className="rep-ico" />}{L(x.title)}</h3>
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
