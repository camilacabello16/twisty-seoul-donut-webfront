import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { useApp } from '../../store'
import { addDays, dayISO, parseISO, toISO } from '../../data'
import { diffDays, occurrences } from '../../lib/recur'
import { clearDrag, getDrag, setDrag } from '../../lib/dnd'
import { stateOf } from '../../components/TaskCalendar'

const WEEKS = 6
const DAYS = WEEKS * 7
const COL = 34
const mondayOf = (iso) => addDays(iso, -((parseISO(iso).getDay() + 6) % 7))

// Timeline (Gantt) 6 tuần. Kéo thanh để dời lịch; thả công việc từ danh sách bên cạnh vào một ngày để lên lịch.
export default function TimelineView({ tasks, projects, employees, onEdit, onDropTask }) {
  const { t, L, lang } = useApp()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const [from, setFrom] = useState(() => addDays(mondayOf(today), -7))
  const [hover, setHover] = useState(null)
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(from, i)), [from])
  const to = days[DAYS - 1]
  const todayIdx = days.indexOf(today)

  const months = useMemo(() => {
    const out = []
    days.forEach((iso) => {
      const key = iso.slice(0, 7)
      if (out.at(-1)?.key === key) out.at(-1).n++
      else out.push({ key, n: 1, label: parseISO(iso).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) })
    })
    return out
  }, [days, locale])

  const unscheduled = tasks.filter((x) => !x.due)
  const groups = [...projects.map((p) => ({ id: p.id, label: L(p.name) })), { id: '', label: t('tasks.noProject') }]
    .map((g) => ({ ...g, items: tasks.filter((x) => x.due && x.project === g.id).sort((a, b) => (a.start || a.due).localeCompare(b.start || b.due)) }))
    .filter((g) => g.items.length)
  const emp = (id) => employees.find((e) => e.id === id)
  const dragging = !!getDrag()

  const idxAt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    return Math.min(DAYS - 1, Math.max(0, Math.floor((e.clientX - r.left) / COL)))
  }
  const trackDnD = onDropTask && {
    onDragOver: (e) => { if (getDrag()) { e.preventDefault(); setHover(idxAt(e)) } },
    onDragLeave: () => setHover(null),
    onDrop: (e) => { e.preventDefault(); const p = getDrag(); const idx = idxAt(e); setHover(null); clearDrag(); if (p) onDropTask(p, addDays(from, idx)) },
  }
  const barDrag = (e, inst, firstShown) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const inBar = Math.max(0, Math.floor((e.clientX - rect.left) / COL))
    setDrag({ id: inst.id, occ: inst.occ, grab: diffDays(inst.occ, firstShown) + inBar }, e)
  }

  // Hàm (không phải component) để các dòng không bị tạo lại khi đang kéo thả
  const renderRow = (x, instances) => (
    <div key={x.id} className="tl-row">
      <div className="tl-label">
        <button className="tl-title" onClick={() => onEdit(x)}>{x.series ? <Repeat size={12} aria-hidden /> : null} {L(x.title)}</button>
        <span className="muted small">{emp(x.assignee)?.name || t('tasks.unassigned')}</span>
      </div>
      <div className="tl-track tl-grid" {...trackDnD}>
        {todayIdx >= 0 && <i className="tl-today" style={{ left: COL * todayIdx + COL / 2 }} aria-hidden />}
        {hover != null && <i className="tl-hover" style={{ left: COL * hover, width: COL }} aria-hidden />}
        {instances.map((inst) => {
          const si = Math.max(0, diffDays(from, inst.start))
          const ei = Math.min(DAYS - 1, diffDays(from, inst.due))
          const firstShown = inst.start < from ? from : inst.start
          return (
            <button
              key={inst.key}
              className={`tbar tl-bar st-${stateOf(inst)} pr-${inst.priority} ${inst.start < from ? 'cl' : ''} ${inst.due > to ? 'cr' : ''}`}
              style={{ left: COL * si, width: COL * (ei - si + 1) - 4 }}
              draggable={!!onDropTask}
              onDragStart={(e) => barDrag(e, inst, firstShown)}
              onDragEnd={() => { clearDrag(); setHover(null) }}
              onClick={() => onEdit(x)}
              title={`${L(inst.title)} (${inst.start} → ${inst.due})`}
            >{L(inst.title)}</button>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="tl-wrap" aria-label={t('tasks.view.timeline')}>
      <div className="tl-controls">
        <button className="icon-btn bordered" onClick={() => setFrom(addDays(from, -14))} aria-label={t('tl.earlier')}><ChevronLeft size={18} /></button>
        <button className="icon-btn bordered" onClick={() => setFrom(addDays(from, 14))} aria-label={t('tl.later')}><ChevronRight size={18} /></button>
        <button className="btn btn-small" onClick={() => setFrom(addDays(mondayOf(today), -7))}>{t('cal.today')}</button>
        <span className="muted small">{parseISO(from).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} – {parseISO(to).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </div>

      <div className="tl" style={{ '--col': `${COL}px` }}>
        <div className="tl-inner">
          <div className="tl-row tl-h1">
            <div className="tl-label" />
            <div className="tl-track tl-months">
              {months.map((m) => <span key={m.key} style={{ width: COL * m.n }}>{m.label}</span>)}
            </div>
          </div>
          <div className="tl-row tl-h2">
            <div className="tl-label muted small">{t('tasks.title')}</div>
            <div className="tl-track tl-days">
              {days.map((iso) => {
                const d = parseISO(iso)
                const we = d.getDay() === 0 || d.getDay() === 6
                return <span key={iso} className={`${we ? 'we' : ''} ${iso === today ? 'today' : ''}`}><i>{d.toLocaleDateString(locale, { weekday: 'narrow' })}</i>{d.getDate()}</span>
              })}
            </div>
          </div>

          {unscheduled.length > 0 && (
            <div className="tl-group">
              <div className="tl-row tl-proj">
                <div className="tl-label"><strong>{t('tasks.unscheduled')}</strong><span className="muted small">{unscheduled.length}</span></div>
                <div className="tl-track" />
              </div>
              {unscheduled.map((x) => (
                <div key={x.id} className="tl-row">
                  <div className="tl-label">
                    <button className="tl-title" onClick={() => onEdit(x)}>{L(x.title)}</button>
                    <span className="muted small">{emp(x.assignee)?.name || t('tasks.unassigned')}</span>
                  </div>
                  <div className="tl-track tl-grid tl-drop" {...trackDnD}>
                    {hover != null && <i className="tl-hover" style={{ left: COL * hover, width: COL }} aria-hidden />}
                    <button
                      className="tl-pill"
                      draggable={!!onDropTask}
                      onDragStart={(e) => setDrag({ id: x.id, occ: null, grab: 0 }, e)}
                      onDragEnd={() => { clearDrag(); setHover(null) }}
                      onClick={() => onEdit(x)}
                    >{t('tl.dragToSchedule')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {groups.length === 0 && unscheduled.length === 0 && <div className="empty">{t('common.none')}</div>}
          {groups.map((g) => {
            const done = g.items.filter((x) => x.status === 'done').length
            return (
              <div key={g.id || 'none'} className="tl-group">
                <div className="tl-row tl-proj">
                  <div className="tl-label"><strong>{g.label}</strong><span className="muted small">{done}/{g.items.length}</span></div>
                  <div className="tl-track" {...trackDnD}>{hover != null && dragging && <i className="tl-hover" style={{ left: COL * hover, width: COL }} aria-hidden />}</div>
                </div>
                {g.items.map((x) => {
                  const instances = occurrences(x, days[0], to)
                  return renderRow({ ...x, series: instances[0]?.series }, instances)
                })}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
