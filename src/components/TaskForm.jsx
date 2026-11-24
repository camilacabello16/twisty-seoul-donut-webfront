import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useApp } from '../store'
import { DriveField, Modal } from './ui'
import { TASK_CATEGORIES } from '../data'

export const STATUS_COLS = ['todo', 'doing', 'done']
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] // thứ 2 → chủ nhật

export default function TaskForm({ task, people, projects, defaultProject, defaultStatus, defaultStart = '', defaultDue = '', defaultStartTime = '', defaultEndTime = '', branch, branchOptions, onClose, onSave, onDelete }) {
  const { t, L, departments, lang } = useApp()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const [f, setF] = useState(() => ({
    title: task ? L(task.title) : '',
    project: task ? task.project : defaultProject ?? '',
    assignee: task ? task.assignee : '',
    department: task?.department || '',
    category: task?.category || 'operations',
    priority: task?.priority || 'medium',
    status: task?.status || defaultStatus || 'todo',
    start: task ? task.start || task.due || '' : defaultStart || defaultDue,
    due: task?.due || defaultDue,
    startTime: task ? task.startTime || '' : defaultStartTime,
    endTime: task ? task.endTime || '' : defaultEndTime,
    estimate: task?.estimate || '',
    repeat: task?.repeat || { freq: 'none', interval: 1, weekdays: [], until: '' },
    description: task?.description || '',
    note: task?.note || '',
    drive: task?.drive || '',
    branch: task?.branch || branch,
  }))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setStart = (e) => {
    const start = e.target.value
    setF({ ...f, start, due: f.due && start && f.due < start ? start : f.due })
  }
  const setBranch = (e) => setF({ ...f, branch: e.target.value, assignee: '', department: '' })
  const setRepeat = (patch) => setF({ ...f, repeat: { ...f.repeat, ...patch } })
  const toggleDay = (d) => setRepeat({ weekdays: f.repeat.weekdays.includes(d) ? f.repeat.weekdays.filter((x) => x !== d) : [...f.repeat.weekdays, d] })

  const branchPeople = people.filter((p) => p.branch === f.branch)
  const branchDepts = departments.filter((d) => d.branch === f.branch)
  const recurring = f.repeat.freq !== 'none'
  const sameDay = !!f.due && (!f.start || f.start === f.due)
  const badTime = sameDay && f.startTime && f.endTime && f.endTime <= f.startTime && f.endTime !== '23:59'
  const invalid = !f.title.trim() || (f.start && f.due && f.due < f.start) || (recurring && !f.due) || badTime

  const save = () => {
    const due = f.due
    const start = f.start || due
    onSave({
      ...f,
      start,
      due,
      estimate: Number(f.estimate) || 0,
      startTime: sameDay ? f.startTime : '',
      endTime: sameDay ? f.endTime : '',
      title: { vi: f.title.trim(), en: f.title.trim() },
      repeat: recurring ? { ...f.repeat, interval: Math.max(1, Number(f.repeat.interval) || 1) } : { freq: 'none', interval: 1, weekdays: [], until: '' },
    })
  }

  return (
    <Modal
      wide
      title={task ? t('tasks.edit') : t('tasks.add')}
      onClose={onClose}
      footer={<>
        {onDelete && <button className="btn btn-danger btn-left" onClick={onDelete}><Trash2 size={15} aria-hidden /> {t('tasks.delete')}</button>}
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" disabled={invalid} onClick={save}>{t('common.save')}</button>
      </>}
    >
      <label className="field"><span>{t('tasks.title')}</span><input value={f.title} onChange={set('title')} /></label>

      <div className="row2">
        <label className="field"><span>{t('tasks.project')}</span>
          <select value={f.project} onChange={set('project')}>
            <option value="">{t('tasks.noProject')}</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t('tasks.category')}</span>
          <select value={f.category} onChange={set('category')}>{TASK_CATEGORIES.map((c) => <option key={c} value={c}>{t(`tcat.${c}`)}</option>)}</select>
        </label>
      </div>

      {branchOptions && !task && (
        <label className="field"><span>{t('branch.label')}</span>
          <select value={f.branch} onChange={setBranch}>{branchOptions.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}</select>
        </label>
      )}

      <div className="row2">
        <label className="field"><span>{t('tasks.assignee')}</span>
          <select value={f.assignee} onChange={set('assignee')}>
            <option value="">{t('tasks.unassigned')}</option>
            {branchPeople.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="field"><span>{t('tasks.department')}</span>
          <select value={f.department} onChange={set('department')}>
            <option value="">{t('tasks.noDept')}</option>
            {branchDepts.map((d) => <option key={d.id} value={d.id}>{L(d.name)}</option>)}
          </select>
        </label>
      </div>

      <div className="row3">
        <label className="field"><span>{t('tasks.priority')}</span>
          <select value={f.priority} onChange={set('priority')}>{['high', 'medium', 'low'].map((p) => <option key={p} value={p}>{t(`prio.${p}`)}</option>)}</select>
        </label>
        <label className="field"><span>{t('tasks.status')}</span>
          <select value={f.status} onChange={set('status')}>{STATUS_COLS.map((c) => <option key={c} value={c}>{t(`status.${c}`)}</option>)}</select>
        </label>
        <label className="field"><span>{t('tasks.estimate')}</span>
          <input type="number" min="0" step="0.5" value={f.estimate} onChange={set('estimate')} placeholder="0" />
        </label>
      </div>

      <div className="row2">
        <label className="field"><span>{t('tasks.start')}</span><input type="date" value={f.start} onChange={setStart} /></label>
        <label className="field"><span>{t('tasks.due')}</span><input type="date" min={f.start || undefined} value={f.due} onChange={set('due')} /></label>
      </div>

      {sameDay && (
        <div className="row2">
          <label className="field"><span>{t('tasks.startTime')}</span><input type="time" step="900" value={f.startTime} onChange={set('startTime')} /></label>
          <label className="field"><span>{t('tasks.endTime')}</span><input type="time" step="900" value={f.endTime} onChange={set('endTime')} /></label>
        </div>
      )}

      <fieldset className="repeat-box">
        <legend>{t('rep.title')}</legend>
        <div className="row2">
          <label className="field"><span className="sr-only">{t('rep.title')}</span>
            <select value={f.repeat.freq} onChange={(e) => setRepeat({ freq: e.target.value })} aria-label={t('rep.title')}>
              {['none', 'daily', 'weekly', 'monthly'].map((k) => <option key={k} value={k}>{t(`rep.${k}`)}</option>)}
            </select>
          </label>
          {recurring && (
            <label className="field inline-n"><span className="sr-only">{t('rep.interval')}</span>
              <span className="n-wrap">{t('rep.every')} <input type="number" min="1" max="99" value={f.repeat.interval} onChange={(e) => setRepeat({ interval: e.target.value })} aria-label={t('rep.interval')} /> {t(`rep.unit.${f.repeat.freq}`)}</span>
            </label>
          )}
        </div>
        {f.repeat.freq === 'weekly' && (
          <div className="chips" role="group" aria-label={t('rep.weekdays')}>
            {WEEKDAYS.map((d) => (
              <button type="button" key={d} className={f.repeat.weekdays.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)} aria-pressed={f.repeat.weekdays.includes(d)}>
                {new Date(2024, 0, 7 + d).toLocaleDateString(locale, { weekday: 'short' })}
              </button>
            ))}
          </div>
        )}
        {recurring && (
          <label className="field"><span>{t('rep.until')}</span><input type="date" min={f.due || undefined} value={f.repeat.until} onChange={(e) => setRepeat({ until: e.target.value })} /></label>
        )}
        {recurring && !f.due && <p className="muted small">{t('rep.needDate')}</p>}
      </fieldset>

      <label className="field"><span>{t('tasks.description')}</span><textarea rows={3} value={f.description} onChange={set('description')} /></label>
      <label className="field"><span>{t('tasks.note')}</span><textarea rows={2} value={f.note} onChange={set('note')} /></label>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
