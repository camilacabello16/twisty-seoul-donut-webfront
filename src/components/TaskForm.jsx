import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useApp } from '../store'
import { DriveField, Modal } from './ui'

export const STATUS_COLS = ['todo', 'doing', 'done']

export default function TaskForm({ task, people, projects, defaultProject, defaultStatus, defaultStart = '', defaultDue = '', branch, branchOptions, onClose, onSave, onDelete }) {
  const { t, L } = useApp()
  const [f, setF] = useState(() => ({
    title: task ? L(task.title) : '',
    project: task?.project || defaultProject || projects[0]?.id,
    assignee: task ? task.assignee : people[0]?.id || '',
    priority: task?.priority || 'medium',
    status: task?.status || defaultStatus || 'todo',
    start: task ? task.start || task.due || '' : defaultStart || defaultDue,
    due: task?.due || defaultDue,
    drive: task?.drive || '',
    branch: task?.branch || branch,
  }))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setStart = (e) => {
    const start = e.target.value
    setF({ ...f, start, due: f.due && start && f.due < start ? start : f.due })
  }
  const invalid = !f.title.trim() || (f.start && f.due && f.due < f.start)

  return (
    <Modal
      title={task ? t('tasks.edit') : t('tasks.add')}
      onClose={onClose}
      footer={<>
        {onDelete && <button className="btn btn-danger btn-left" onClick={onDelete}><Trash2 size={15} aria-hidden /> {t('tasks.delete')}</button>}
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          disabled={invalid}
          onClick={() => onSave({ ...f, start: f.start || f.due, title: { vi: f.title, en: f.title } })}
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
          <select value={f.assignee} onChange={set('assignee')}>
            <option value="">{t('tasks.unassigned')}</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('tasks.priority')}</span>
          <select value={f.priority} onChange={set('priority')}>{['high', 'medium', 'low'].map((p) => <option key={p} value={p}>{t(`prio.${p}`)}</option>)}</select>
        </label>
        <label className="field"><span>{t('tasks.status')}</span>
          <select value={f.status} onChange={set('status')}>{STATUS_COLS.map((c) => <option key={c} value={c}>{t(`status.${c}`)}</option>)}</select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('tasks.start')}</span><input type="date" value={f.start} onChange={setStart} /></label>
        <label className="field"><span>{t('tasks.due')}</span><input type="date" min={f.start || undefined} value={f.due} onChange={set('due')} /></label>
      </div>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
