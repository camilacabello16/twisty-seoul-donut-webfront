import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../../store'
import { addDays, dayISO, parseISO, toISO } from '../../data'

const WEEKS = 6
const DAYS = WEEKS * 7
const diff = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000)
const mondayOf = (iso) => {
  const d = parseISO(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISO(d)
}

export default function TimelineView({ tasks, projects, employees, onEdit }) {
  const { t, L, lang } = useApp()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const [from, setFrom] = useState(() => addDays(mondayOf(today), -7))
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(from, i)), [from])
  const to = days[DAYS - 1]
  const todayIdx = days.indexOf(today)

  // Các tháng trong khoảng hiển thị, dùng cho hàng tiêu đề trên cùng
  const months = useMemo(() => {
    const out = []
    days.forEach((iso) => {
      const key = iso.slice(0, 7)
      if (out.at(-1)?.key === key) out.at(-1).n++
      else out.push({ key, n: 1, label: parseISO(iso).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) })
    })
    return out
  }, [days, locale])

  const scheduled = tasks.filter((x) => x.due)
  const unscheduled = tasks.length - scheduled.length
  const groups = projects
    .map((p) => ({ p, items: scheduled.filter((x) => x.project === p.id).sort((a, b) => (a.start || a.due).localeCompare(b.start || b.due)) }))
    .filter((g) => g.items.length)
  const emp = (id) => employees.find((e) => e.id === id)

  return (
    <section className="tl-wrap" aria-label={t('tasks.view.timeline')}>
      <div className="tl-controls">
        <button className="icon-btn bordered" onClick={() => setFrom(addDays(from, -14))} aria-label={t('tl.earlier')}><ChevronLeft size={18} /></button>
        <button className="icon-btn bordered" onClick={() => setFrom(addDays(from, 14))} aria-label={t('tl.later')}><ChevronRight size={18} /></button>
        <button className="btn btn-small" onClick={() => setFrom(addDays(mondayOf(today), -7))}>{t('cal.today')}</button>
        <span className="muted small">{parseISO(from).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} – {parseISO(to).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        {unscheduled > 0 && <span className="muted small tl-note">{t('tl.unscheduled', { n: unscheduled })}</span>}
      </div>

      <div className="tl">
        <div className="tl-inner">
          <div className="tl-row tl-h1">
            <div className="tl-label" />
            <div className="tl-track tl-months">
              {months.map((m) => <span key={m.key} style={{ width: `calc(var(--col) * ${m.n})` }}>{m.label}</span>)}
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

          {groups.length === 0 && <div className="empty">{t('common.none')}</div>}
          {groups.map(({ p, items }) => {
            const done = items.filter((x) => x.status === 'done').length
            return (
              <div key={p.id} className="tl-group">
                <div className="tl-row tl-proj">
                  <div className="tl-label"><strong>{L(p.name)}</strong><span className="muted small">{done}/{items.length}</span></div>
                  <div className="tl-track" />
                </div>
                {items.map((x) => {
                  const s = x.start && x.start <= x.due ? x.start : x.due
                  const visible = s <= to && x.due >= days[0]
                  const si = Math.max(0, diff(from, s))
                  const ei = Math.min(DAYS - 1, diff(from, x.due))
                  return (
                    <div key={x.id} className="tl-row">
                      <div className="tl-label">
                        <button className="tl-title" onClick={() => onEdit(x)}>{L(x.title)}</button>
                        <span className="muted small">{emp(x.assignee)?.name || t('tasks.unassigned')}</span>
                      </div>
                      <div className="tl-track tl-grid">
                        {todayIdx >= 0 && <i className="tl-today" style={{ left: `calc(var(--col) * ${todayIdx} + var(--col) / 2)` }} aria-hidden />}
                        {visible && (
                          <button
                            className={`tbar tl-bar st-${x.status} pr-${x.priority} ${s < days[0] ? 'cl' : ''} ${x.due > to ? 'cr' : ''}`}
                            style={{ left: `calc(var(--col) * ${si})`, width: `calc(var(--col) * ${ei - si + 1} - 4px)` }}
                            onClick={() => onEdit(x)}
                            title={`${L(x.title)} (${s} → ${x.due})`}
                          >{L(x.title)}</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
