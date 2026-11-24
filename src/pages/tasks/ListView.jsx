import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Plus, Repeat } from 'lucide-react'
import { useApp } from '../../store'
import { Badge } from '../../components/ui'
import { addDays, dayISO } from '../../data'
import { isRecurring, occurrences, repeatLabel } from '../../lib/recur'
import { hasTimes, timeLabel } from '../../lib/time'
import { STATUS_COLS } from '../../components/TaskForm'

const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }

export function dateRange(x, dateFmt) {
  if (!x.due) return '—'
  if (x.start && x.start !== x.due) return `${dateFmt(x.start)} – ${dateFmt(x.due)}`
  return hasTimes(x) ? `${dateFmt(x.due)} ${timeLabel(x)}` : dateFmt(x.due)
}

export default function ListView({ tasks, projects, employees, onEdit, onQuickAdd }) {
  const { t, L, dateFmt, actions } = useApp()
  const today = dayISO(0)
  const [collapsed, setCollapsed] = useState({})
  const [adding, setAdding] = useState(null)
  const [title, setTitle] = useState('')
  const proj = (id) => projects.find((p) => p.id === id)
  const emp = (id) => employees.find((e) => e.id === id)

  const submit = (status) => {
    if (title.trim()) onQuickAdd(title.trim(), status)
    setTitle('')
    setAdding(null)
  }

  return (
    <div className="lv">
      <div className="lv-row lv-head" role="row">
        <span />
        <span>{t('tasks.title')}</span>
        <span>{t('tasks.assignee')}</span>
        <span>{t('tasks.dates')}</span>
        <span>{t('tasks.priority')}</span>
        <span>{t('tasks.project')}</span>
      </div>
      {STATUS_COLS.map((s) => {
        const items = tasks.filter((x) => x.status === s)
        const closed = collapsed[s]
        return (
          <section key={s} className="lv-group" aria-label={t(`status.${s}`)}>
            <button className="lv-group-head" onClick={() => setCollapsed({ ...collapsed, [s]: !closed })} aria-expanded={!closed}>
              {closed ? <ChevronRight size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
              <strong>{t(`status.${s}`)}</strong>
              <span className="tab-count">{items.length}</span>
            </button>
            {!closed && (
              <>
                {items.map((x) => {
                  const a = emp(x.assignee)
                  const rec = isRecurring(x)
                  // Công việc lặp lại: ô tick áp dụng cho lần lặp gần nhất chưa hoàn thành
                  const next = rec ? occurrences(x, today, addDays(today, 400)).find((o) => !o.done) : null
                  const shown = next || x
                  const isDone = rec ? !next : x.status === 'done'
                  const overdue = !rec && x.status !== 'done' && x.due && x.due < today
                  return (
                    <div key={x.id} className="lv-row">
                      <button
                        className={`lv-check ${isDone ? 'on' : ''}`}
                        onClick={() => (rec ? next && actions.toggleOccurrence(x.id, next.occ) : actions.updateTask(x.id, { status: x.status === 'done' ? 'todo' : 'done' }))}
                        aria-label={isDone ? t('tasks.reopen') : t('tasks.complete')}
                        aria-pressed={isDone}
                      ><Check size={14} aria-hidden /></button>
                      <button className={`lv-name ${isDone ? 'done' : ''}`} onClick={() => onEdit(x)}>
                        {rec && <Repeat size={12} aria-hidden className="rep-ico" />}{L(x.title)}
                        {rec && <span className="muted small"> · {repeatLabel(x.repeat, t)}</span>}
                      </button>
                      <span className="lv-assignee">
                        {a ? <><span className="avatar sm" aria-hidden>{a.name.split(' ').pop()[0]}</span>{a.name}</> : <span className="muted">{t('tasks.unassigned')}</span>}
                      </span>
                      <span className={`lv-date ${overdue ? 'late' : ''}`}>{dateRange(shown, dateFmt)}</span>
                      <span><Badge tone={prioTone[x.priority]}>{t(`prio.${x.priority}`)}</Badge></span>
                      <span className="muted small clip">{proj(x.project) ? L(proj(x.project).name) : t('tasks.noProject')}</span>
                    </div>
                  )
                })}
                {adding === s ? (
                  <div className="lv-row lv-add">
                    <span />
                    <input
                      autoFocus value={title} placeholder={t('tasks.quickPh')} aria-label={t('tasks.title')}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submit(s); if (e.key === 'Escape') { setTitle(''); setAdding(null) } }}
                      onBlur={() => submit(s)}
                    />
                  </div>
                ) : (
                  <button className="lv-add-btn" onClick={() => { setAdding(s); setTitle('') }}><Plus size={14} aria-hidden /> {t('tasks.add')}</button>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
