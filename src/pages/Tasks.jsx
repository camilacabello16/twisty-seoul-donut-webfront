import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store'
import { Badge, DriveField, DriveLink, Empty, Modal, PageHeader } from '../components/ui'

const cols = ['todo', 'doing', 'done']
const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }

export default function Tasks() {
  const { t, L, dateFmt, tasks, projects, employees, visibleBranchIds, activeBranch, actions, notify } = useApp()
  const [params, setParams] = useSearchParams()
  const project = params.get('project') || 'all'
  const setProject = (id) => setParams(id === 'all' ? {} : { project: id })
  const myProjects = projects.filter((p) => p.branches.some((b) => visibleBranchIds.includes(b)))
  const [form, setForm] = useState(null) // null | 'new' | task
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const [overTask, setOverTask] = useState(null)

  const list = tasks.filter((x) => visibleBranchIds.includes(x.branch) && (project === 'all' || x.project === project))
  const emp = (id) => employees.find((e) => e.id === id)
  const people = employees.filter((e) => visibleBranchIds.includes(e.branch) && e.status !== 'resigned')

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
      <PageHeader
        title={t('nav.tasks')}
        sub={t('tasks.sub')}
        actions={<button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} aria-hidden /> {t('tasks.add')}</button>}
      />
      <div className="chips" role="group" aria-label={t('tasks.project')}>
        <button className={project === 'all' ? 'on' : ''} onClick={() => setProject('all')}>{t('common.all')}</button>
        {myProjects.map((p) => (
          <button key={p.id} className={project === p.id ? 'on' : ''} onClick={() => setProject(p.id)}>{L(p.name)}</button>
        ))}
      </div>
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
                    <button className="icon-btn" onClick={() => setForm(x)} aria-label={`${t('tasks.edit')}: ${L(x.title)}`}><Pencil size={15} /></button>
                  </div>
                  <h3>{L(x.title)}</h3>
                  <div className="task-meta">
                    <span><CalendarDays size={14} aria-hidden /> {dateFmt(x.due)}</span>
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

      {form && (
        <TaskForm
          task={form === 'new' ? null : form}
          people={people}
          projects={myProjects}
          defaultProject={project !== 'all' ? project : undefined}
          branch={activeBranch === 'all' ? visibleBranchIds[0] : activeBranch}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form === 'new') actions.addTask(data)
            else actions.updateTask(form.id, data)
            setForm(null)
            notify(t('common.saved'))
          }}
          onDelete={form === 'new' ? null : () => {
            if (window.confirm(t('tasks.deleteConfirm'))) {
              actions.deleteTask(form.id)
              setForm(null)
              notify(t('tasks.deleted'))
            }
          }}
        />
      )}
    </>
  )
}

export function TaskForm({ task, people, projects, defaultProject, defaultDue = '', branch, branchOptions, onClose, onSave, onDelete }) {
  const { t, L } = useApp()
  const [f, setF] = useState(() => ({
    title: task ? L(task.title) : '',
    project: task?.project || defaultProject || projects[0]?.id,
    assignee: task?.assignee || people[0]?.id,
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due: task?.due || defaultDue,
    drive: task?.drive || '',
    branch: task?.branch || branch,
  }))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <Modal
      title={task ? t('tasks.edit') : t('tasks.add')}
      onClose={onClose}
      footer={<>
        {onDelete && <button className="btn btn-danger btn-left" onClick={onDelete}><Trash2 size={15} aria-hidden /> {t('tasks.delete')}</button>}
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          disabled={!f.title.trim()}
          onClick={() => onSave({ ...f, title: { vi: f.title, en: f.title } })}
        >{t('common.save')}</button>
      </>}
    >
      <label className="field"><span>{t('tasks.title')}</span><input value={f.title} onChange={set('title')} /></label>
      {branchOptions && !task && (
        <label className="field"><span>{t('branch.label')}</span>
          <select value={f.branch} onChange={set('branch')}>{branchOptions.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}</select>
        </label>
      )}
      <div className="row2">
        <label className="field"><span>{t('tasks.project')}</span>
          <select value={f.project} onChange={set('project')}>{projects.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}</select>
        </label>
        <label className="field"><span>{t('tasks.assignee')}</span>
          <select value={f.assignee} onChange={set('assignee')}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('tasks.priority')}</span>
          <select value={f.priority} onChange={set('priority')}>{['high', 'medium', 'low'].map((p) => <option key={p} value={p}>{t(`prio.${p}`)}</option>)}</select>
        </label>
        <label className="field"><span>{t('tasks.status')}</span>
          <select value={f.status} onChange={set('status')}>{cols.map((c) => <option key={c} value={c}>{t(`status.${c}`)}</option>)}</select>
        </label>
      </div>
      <label className="field"><span>{t('tasks.due')}</span><input type="date" value={f.due} onChange={set('due')} /></label>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
