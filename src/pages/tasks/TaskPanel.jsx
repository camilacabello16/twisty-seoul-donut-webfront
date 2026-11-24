import { useState } from 'react'
import { Clock, GripVertical, Pencil, Plus, Repeat } from 'lucide-react'
import { useApp } from '../../store'
import { Badge } from '../../components/ui'
import { dateRange } from './ListView'
import { isRecurring, taskStart } from '../../lib/recur'
import { clearDrag, setDrag } from '../../lib/dnd'

const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }

// Bảng công việc bên phải (giống Google Tasks): thêm nhanh và kéo thả vào lịch hoặc timeline để lên lịch.
export default function TaskPanel({ tasks, projects, onEdit, onQuickAdd, onNew }) {
  const { t, L, dateFmt } = useApp()
  const [tab, setTab] = useState('unscheduled')
  const [title, setTitle] = useState('')
  const open = tasks.filter((x) => x.status !== 'done')
  const unscheduled = open.filter((x) => !x.due)
  const items = tab === 'unscheduled' ? unscheduled : open
  const proj = (id) => projects.find((p) => p.id === id)

  const submit = () => {
    if (title.trim()) onQuickAdd(title.trim())
    setTitle('')
  }

  return (
    <aside className="tpanel" aria-label={t('tp.title')}>
      <header>
        <h2>{t('tp.title')}</h2>
        <button className="btn btn-small" onClick={onNew}>{t('tp.detail')}</button>
      </header>

      <div className="tp-add">
        <Plus size={16} aria-hidden />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('tp.addPh')} aria-label={t('tp.addPh')}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>

      <div className="seg" role="group" aria-label={t('tp.title')}>
        <button className={tab === 'unscheduled' ? 'on' : ''} onClick={() => setTab('unscheduled')}>{t('tasks.unscheduled')} ({unscheduled.length})</button>
        <button className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>{t('tp.open')} ({open.length})</button>
      </div>
      <p className="muted small">{t('tp.hint')}</p>

      {items.length === 0 ? <p className="muted small tp-empty">{t('common.none')}</p> : (
        <ul className="tp-list">
          {items.map((x) => (
            <li
              key={x.id}
              className="tp-item"
              draggable
              onDragStart={(e) => setDrag({ id: x.id, occ: x.due ? taskStart(x) : null, grab: 0 }, e)}
              onDragEnd={clearDrag}
            >
              <GripVertical size={16} className="grip" aria-hidden />
              <div className="tp-body">
                <strong>{L(x.title)}</strong>
                <span className="tp-meta">
                  <Badge tone={prioTone[x.priority]}>{t(`prio.${x.priority}`)}</Badge>
                  {x.due && <span className="muted small">{dateRange(x, dateFmt)}</span>}
                  {x.estimate > 0 && <span className="muted small"><Clock size={12} aria-hidden /> {x.estimate}h</span>}
                  {isRecurring(x) && <span className="muted small"><Repeat size={12} aria-hidden /></span>}
                  <span className="muted small clip">{L(proj(x.project)?.name)}</span>
                </span>
              </div>
              <button className="icon-btn" onClick={() => onEdit(x)} aria-label={`${t('tasks.edit')}: ${L(x.title)}`}><Pencil size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
