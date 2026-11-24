import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, Repeat } from 'lucide-react'
import { useApp } from '../store'
import { ContextMenu } from './ui'
import { dayISO, parseISO, toISO } from '../data'
import { diffDays, occurrences } from '../lib/recur'
import { clearDrag, getDrag, setDrag } from '../lib/dnd'

const MAX_LANES = 3
const prioRank = { high: 0, medium: 1, low: 2 }
export const stateOf = (inst) => (inst.done ? 'done' : inst.status === 'done' ? 'todo' : inst.status)

// Lịch tháng: công việc nhiều ngày vắt thành một thanh liền qua các ngày (và qua các tuần).
// Kéo thanh sang ngày khác để dời lịch; thả công việc từ danh sách bên cạnh vào ô ngày để lên lịch.
export default function TaskCalendar({ tasks, cursor, setCursor, selected, onSelect, onCreate, onEdit, onDropTask, onOpenDay }) {
  const { t, L, lang } = useApp()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const monthKey = toISO(cursor).slice(0, 7)
  const [menu, setMenu] = useState(null)
  const [over, setOver] = useState(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const goMonth = (delta) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
  const pickMonth = (value) => {
    if (!value) return
    const [y, m] = value.split('-').map(Number)
    setCursor(new Date(y, m - 1, 1))
  }
  const goToday = () => { setCursor(parseISO(today.slice(0, 8) + '01')); onSelect?.(today) }
  const pickDay = (iso) => {
    onSelect?.(iso)
    if (iso.slice(0, 7) !== monthKey) setCursor(parseISO(iso.slice(0, 8) + '01'))
  }

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7 // tuần bắt đầu từ thứ 2
    const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const total = Math.ceil((lead + daysIn) / 7) * 7
    const days = Array.from({ length: total }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), 1 - lead + i))
    return Array.from({ length: total / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7))
  }, [cursor])

  const instances = useMemo(() => {
    const from = toISO(weeks[0][0])
    const to = toISO(weeks.at(-1)[6])
    return tasks.flatMap((x) => occurrences(x, from, to))
  }, [tasks, weeks])
  const layouts = useMemo(() => weeks.map((week) => layoutWeek(week, instances)), [weeks, instances])
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }))
  const monthLabel = cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const original = (id) => tasks.find((x) => x.id === id)

  const startDrag = (e, s, week) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const colW = e.currentTarget.parentElement.getBoundingClientRect().width / 7
    const inSeg = Math.max(0, Math.floor((e.clientX - rect.left) / colW))
    const segFirst = toISO(week[s.start])
    setDrag({ id: s.task.id, occ: s.task.occ, grab: diffDays(s.task.occ, segFirst) + inSeg }, e)
  }

  return (
    <>
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn bordered" onClick={() => goMonth(-1)} aria-label={t('cal.prev')}><ChevronLeft size={18} /></button>
          <h2 aria-live="polite">{monthLabel}</h2>
          <button className="icon-btn bordered" onClick={() => goMonth(1)} aria-label={t('cal.next')}><ChevronRight size={18} /></button>
        </div>
        <div className="cal-tools">
          <label className="field inline">
            <span className="sr-only">{t('cal.pickMonth')}</span>
            <input type="month" value={monthKey} onChange={(e) => pickMonth(e.target.value)} aria-label={t('cal.pickMonth')} />
          </label>
          <button className="btn" onClick={goToday}>{t('cal.today')}</button>
        </div>
      </div>

      <section className="cal" aria-label={monthLabel}>
        <div className="cal-head" aria-hidden>
          {weekdays.map((w, i) => <span key={w} className={i >= 5 ? 'we' : ''}>{w}</span>)}
        </div>
        {weeks.map((week, wi) => {
          const { segments, hidden } = layouts[wi]
          return (
            <div className="cal-week" key={toISO(week[0])}>
              <div className="cal-week-days">
                {week.map((d) => {
                  const iso = toISO(d)
                  return (
                    <button
                      key={iso}
                      className={`cal-day ${iso.slice(0, 7) === monthKey ? '' : 'out'} ${iso === today ? 'today' : ''} ${iso === selected ? 'sel' : ''} ${over === iso ? 'drop-hover' : ''}`}
                      onClick={() => pickDay(iso)}
                      onDoubleClick={() => { pickDay(iso); onCreate?.(iso) }}
                      onContextMenu={(e) => { e.preventDefault(); pickDay(iso); setMenu({ x: e.clientX, y: e.clientY, iso }) }}
                      onDragOver={(e) => { if (getDrag() && onDropTask) { e.preventDefault(); setOver(iso) } }}
                      onDragLeave={() => setOver((v) => (v === iso ? null : v))}
                      onDrop={(e) => { e.preventDefault(); const p = getDrag(); setOver(null); clearDrag(); if (p) { onDropTask?.(p, iso); onSelect?.(iso) } }}
                      aria-pressed={selected ? iso === selected : undefined}
                      aria-label={d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    >
                      <span className="cal-num">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
              <div className="cal-bars">
                {segments.map((s) => (
                  <button
                    key={`${s.task.key}-${wi}`}
                    className={`tbar st-${stateOf(s.task)} pr-${s.task.priority} ${s.cl ? 'cl' : ''} ${s.cr ? 'cr' : ''}`}
                    style={{ gridColumn: `${s.start + 1} / ${s.end + 2}`, gridRow: s.lane + 1 }}
                    draggable={!!onDropTask}
                    onDragStart={(e) => startDrag(e, s, week)}
                    onDragEnd={() => { clearDrag(); setOver(null) }}
                    onDragOver={(e) => { if (getDrag() && onDropTask) { e.preventDefault(); setOver(isoAt(e, week)) } }}
                    onDrop={(e) => { e.preventDefault(); const p = getDrag(); const iso = isoAt(e, week); setOver(null); clearDrag(); if (p) { onDropTask?.(p, iso); onSelect?.(iso) } }}
                    onClick={() => onEdit?.(original(s.task.id))}
                    title={`${L(s.task.title)} (${s.task.start} → ${s.task.due})`}
                  >
                    {s.task.series && <Repeat size={11} aria-hidden className="rep-ico" />}
                    {L(s.task.title)}
                  </button>
                ))}
                {hidden.map((n, col) => n > 0 && (
                  <span key={`m${col}`} className="chip-more" style={{ gridColumn: col + 1, gridRow: MAX_LANES + 1 }}>{t('cal.more', { n })}</span>
                ))}
              </div>
            </div>
          )
        })}
      </section>

      {menu && onCreate && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          title={parseISO(menu.iso).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          onClose={closeMenu}
          items={[
            { key: 'add', label: t('tasks.add'), icon: Plus, onSelect: () => onCreate(menu.iso) },
            ...(onOpenDay ? [{ key: 'day', label: t('cal.openDay'), icon: Clock, onSelect: () => onOpenDay(menu.iso) }] : []),
          ]}
        />
      )}
    </>
  )
}

// Ngày tương ứng với vị trí con trỏ khi thả lên một thanh công việc
function isoAt(e, week) {
  const r = e.currentTarget.parentElement.getBoundingClientRect()
  const idx = Math.min(6, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 7)))
  return toISO(week[idx])
}

// Xếp các lần xuất hiện của một tuần vào các "làn" (hàng) để không đè lên nhau.
function layoutWeek(week, instances) {
  const isos = week.map(toISO)
  const first = isos[0]
  const last = isos[6]
  const items = []
  for (const task of instances) {
    if (task.start > last || task.due < first) continue
    const start = task.start < first ? 0 : isos.indexOf(task.start)
    const end = task.due > last ? 6 : isos.indexOf(task.due)
    items.push({ task, start, end, cl: task.start < first, cr: task.due > last })
  }
  items.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start) || prioRank[a.task.priority] - prioRank[b.task.priority])
  const laneEnds = []
  const segments = []
  const hidden = Array(7).fill(0)
  for (const it of items) {
    let lane = laneEnds.findIndex((e) => e < it.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = it.end
    if (lane < MAX_LANES) segments.push({ ...it, lane })
    else for (let c = it.start; c <= it.end; c++) hidden[c]++
  }
  return { segments, hidden }
}
