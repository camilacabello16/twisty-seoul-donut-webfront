import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useApp } from '../../store'
import { Badge } from '../../components/ui'
import { dayISO } from '../../data'
import { STATUS_COLS } from '../../components/TaskForm'

const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }

export function dateRange(x, dateFmt) {
  if (!x.due) return '—'
  return x.start && x.start !== x.due ? `${dateFmt(x.start)} – ${dateFmt(x.due)}` : dateFmt(x.due)
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
                  const overdue = x.status !== 'done' && x.due && x.due < today
                  return (
                    <div key={x.id} className="lv-row">
                      <button
                        className={`lv-check ${x.status === 'done' ? 'on' : ''}`}
                        onClick={() => actions.updateTask(x.id, { status: x.status === 'done' ? 'todo' : 'done' })}
                        aria-label={x.status === 'done' ? t('tasks.reopen') : t('tasks.complete')}
                        aria-pressed={x.status === 'done'}
                      ><Check size={14} aria-hidden /></button>
                      <button className={`lv-name ${x.status === 'done' ? 'done' : ''}`} onClick={() => onEdit(x)}>{L(x.title)}</button>
                      <span className="lv-assignee">
                        {a ? <><span className="avatar sm" aria-hidden>{a.name.split(' ').pop()[0]}</span>{a.name}</> : <span className="muted">{t('tasks.unassigned')}</span>}
                      </span>
                      <span className={`lv-date ${overdue ? 'late' : ''}`}>{dateRange(x, dateFmt)}</span>
                      <span><Badge tone={prioTone[x.priority]}>{t(`prio.${x.priority}`)}</Badge></span>
                      <span className="muted small clip">{L(proj(x.project)?.name)}</span>
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
