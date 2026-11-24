import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import { useApp } from '../store'
import { addDays, dayISO, parseISO } from '../data'
import { occurrences } from '../lib/recur'
import { clearDrag, getDrag, setDrag } from '../lib/dnd'
import { DAY_MIN, SNAP, clamp, defaultDuration, fromMin, hasTimes, showTime, snap, snapDown, toMin } from '../lib/time'
import { stateOf } from './TaskCalendar'

const PX = 1 // 1 phút = 1px, mỗi giờ 60px, mỗi ô 15 phút 15px
const HOURS = Array.from({ length: 24 }, (_, h) => h)

// Lịch theo ngày: trục dọc là giờ (chia 15 phút). Kéo khối công việc lên/xuống để đổi giờ,
// kéo mép trên/dưới để đổi độ dài, kéo công việc từ danh sách bên cạnh vào đúng giờ muốn làm.
export default function DayGrid({ tasks, day, setDay, onEdit, onCreate, onUpdate, onDropTask }) {
  const { t, L, lang, employees } = useApp()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const [now, setNow] = useState(() => new Date())
  const [preview, setPreview] = useState(null) // { key, s, e } khi đang kéo khối
  const [sel, setSel] = useState(null) // { s, e } khi kéo chọn khoảng để tạo mới
  const [ghost, setGhost] = useState(null) // { s, e } khi thả công việc từ danh sách
  const [allDayOver, setAllDayOver] = useState(false)
  const act = useRef(null)
  const latest = useRef(null)
  const scroller = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes()
    scroller.current.scrollTop = (day === today ? Math.max(0, nowMin - 90) : 7 * 60 - 30) * PX
    // chỉ cuộn khi mở hoặc đổi ngày
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  const instances = useMemo(() => tasks.flatMap((x) => occurrences(x, day, day)), [tasks, day])
  const isTimed = (i) => i.start === i.due && hasTimes(i)
  const timed = instances.filter(isTimed)
  const allDay = instances.filter((i) => !isTimed(i))
  const items = useMemo(() => layout(timed.map((inst) => ({ inst, s: toMin(inst.startTime), e: toMin(inst.endTime) }))), [timed])
  const original = (id) => tasks.find((x) => x.id === id)
  const emp = (id) => employees.find((e) => e.id === id)
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const yToMin = (e, el) => clamp((e.clientY - el.getBoundingClientRect().top) / PX, 0, DAY_MIN)

  // ----- kéo khối: dời giờ (move) hoặc đổi độ dài (top / bottom)
  const begin = (e, item, mode) => {
    e.stopPropagation()
    const block = e.currentTarget.closest('.dg-block')
    block.setPointerCapture(e.pointerId)
    act.current = { item, mode, y0: e.clientY, moved: false }
    latest.current = { s: item.s, e: item.e }
  }
  const move = (e) => {
    const a = act.current
    if (!a) return
    const dy = e.clientY - a.y0
    if (Math.abs(dy) > 3) a.moved = true
    if (!a.moved) return
    const d = snap(dy / PX)
    const { s: s0, e: e0 } = a.item
    let s = s0
    let en = e0
    if (a.mode === 'move') { s = clamp(s0 + d, 0, DAY_MIN - (e0 - s0)); en = s + (e0 - s0) }
    else if (a.mode === 'top') s = clamp(s0 + d, 0, e0 - SNAP)
    else en = clamp(e0 + d, s0 + SNAP, DAY_MIN)
    latest.current = { s, e: en }
    setPreview({ key: a.item.inst.key, s, e: en })
  }
  const end = (e) => {
    const a = act.current
    act.current = null
    setPreview(null)
    if (!a) return
    if (!a.moved) { if (a.mode === 'move') onEdit(original(a.item.inst.id)); return }
    // thả vào dải "cả ngày" thì bỏ giờ
    if (document.elementFromPoint(e.clientX, e.clientY)?.closest('.dg-allday')) {
      onUpdate(a.item.inst.id, { startTime: '', endTime: '' })
      return
    }
    const { s, e: en } = latest.current
    if (s !== a.item.s || en !== a.item.e) onUpdate(a.item.inst.id, { startTime: fromMin(s), endTime: fromMin(en) })
  }

  // ----- kéo chọn một khoảng trống để tạo công việc
  const selBegin = (e) => {
    if (e.target !== e.currentTarget) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const m = snapDown(yToMin(e, e.currentTarget))
    act.current = { select: true, m0: m, y0: e.clientY, moved: false }
  }
  const selMove = (e) => {
    const a = act.current
    if (!a?.select) return
    if (Math.abs(e.clientY - a.y0) > 3) a.moved = true
    if (!a.moved) return
    const m = yToMin(e, e.currentTarget)
    const s = Math.min(a.m0, snapDown(m))
    const en = Math.max(a.m0 + SNAP, snap(m))
    setSel({ s: clamp(s, 0, DAY_MIN - SNAP), e: clamp(Math.max(en, s + SNAP), SNAP, DAY_MIN) })
  }
  const selEnd = () => {
    const a = act.current
    act.current = null
    if (!a?.select) return
    const s = sel
    setSel(null)
    if (a.moved && s) onCreate({ date: day, startTime: fromMin(s.s), endTime: fromMin(s.e) })
  }

  // ----- thả công việc từ danh sách bên cạnh
  const dropOver = (e) => {
    const p = getDrag()
    if (!p) return
    e.preventDefault()
    const task = original(p.id)
    const dur = task ? defaultDuration(task) : 60
    const s = clamp(snapDown(yToMin(e, e.currentTarget)), 0, DAY_MIN - dur)
    setGhost({ s, e: s + dur })
  }
  const dropHere = (e) => {
    e.preventDefault()
    const p = getDrag()
    const g = ghost
    setGhost(null)
    clearDrag()
    if (p && g) onDropTask(p, day, g.s)
  }

  const label = parseISO(day).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <section className="dg" aria-label={label}>
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn bordered" onClick={() => setDay(addDays(day, -1))} aria-label={t('dg.prev')}><ChevronLeft size={18} /></button>
          <h2 aria-live="polite" className={day === today ? 'is-today' : ''}>{label}</h2>
          <button className="icon-btn bordered" onClick={() => setDay(addDays(day, 1))} aria-label={t('dg.next')}><ChevronRight size={18} /></button>
        </div>
        <div className="cal-tools">
          <label className="field inline">
            <span className="sr-only">{t('dg.pickDay')}</span>
            <input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label={t('dg.pickDay')} />
          </label>
          <button className="btn" onClick={() => setDay(today)}>{t('cal.today')}</button>
        </div>
      </div>

      <div
        className={`dg-allday ${allDayOver ? 'over' : ''}`}
        onDragOver={(e) => { if (getDrag()) { e.preventDefault(); setAllDayOver(true) } }}
        onDragLeave={() => setAllDayOver(false)}
        onDrop={(e) => { e.preventDefault(); const p = getDrag(); setAllDayOver(false); clearDrag(); if (p) onDropTask(p, day, null) }}
      >
        <span className="dg-gutter">{t('dg.allDay')}</span>
        <div className="dg-chips">
          {allDay.length === 0 && <span className="muted small">{t('dg.noAllDay')}</span>}
          {allDay.map((i) => (
            <button
              key={i.key}
              className={`tbar dg-chip st-${stateOf(i)} pr-${i.priority}`}
              draggable
              onDragStart={(e) => setDrag({ id: i.id, occ: i.occ, grab: 0 }, e)}
              onDragEnd={clearDrag}
              onClick={() => onEdit(original(i.id))}
              title={L(i.title)}
            >
              {i.series && <Repeat size={11} aria-hidden className="rep-ico" />}{L(i.title)}
            </button>
          ))}
        </div>
      </div>

      <div className="dg-scroll" ref={scroller}>
        <div className="dg-body" style={{ height: 24 * 60 * PX }}>
          <div className="dg-hours" aria-hidden>
            {HOURS.map((h) => <span key={h} style={{ top: h * 60 * PX }}>{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</span>)}
          </div>
          <div
            className="dg-col"
            onPointerDown={selBegin}
            onPointerMove={selMove}
            onPointerUp={selEnd}
            onDoubleClick={(e) => {
              if (e.target !== e.currentTarget) return
              const s = clamp(snapDown(yToMin(e, e.currentTarget)), 0, DAY_MIN - 60)
              onCreate({ date: day, startTime: fromMin(s), endTime: fromMin(s + 60) })
            }}
            onDragOver={dropOver}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setGhost(null) }}
            onDrop={dropHere}
            role="group"
            aria-label={t('dg.grid')}
          >
            {day === today && <i className="dg-now" style={{ top: nowMin * PX }} aria-hidden />}
            {sel && <div className="dg-sel" style={{ top: sel.s * PX, height: (sel.e - sel.s) * PX }}>{showTime(fromMin(sel.s))} – {showTime(fromMin(sel.e))}</div>}
            {ghost && <div className="dg-ghost" style={{ top: ghost.s * PX, height: (ghost.e - ghost.s) * PX }}>{showTime(fromMin(ghost.s))} – {showTime(fromMin(ghost.e))}</div>}

            {items.map((item) => {
              const { inst } = item
              const p = preview?.key === inst.key ? preview : null
              const s = p ? p.s : item.s
              const e = p ? p.e : item.e
              const h = (e - s) * PX
              return (
                <div
                  key={inst.key}
                  className={`dg-block st-${stateOf(inst)} pr-${inst.priority} ${p ? 'dragging' : ''} ${h < 30 ? 'short' : ''}`}
                  style={{ top: s * PX, height: h, left: `calc(${(item.col / item.cols) * 100}% + 2px)`, width: `calc(${100 / item.cols}% - 4px)` }}
                  onPointerDown={(ev) => begin(ev, { ...item, inst }, 'move')}
                  onPointerMove={move}
                  onPointerUp={end}
                  onKeyDown={(ev) => ev.key === 'Enter' && onEdit(original(inst.id))}
                  tabIndex={0}
                  role="button"
                  aria-label={`${L(inst.title)}, ${showTime(fromMin(s))}–${showTime(fromMin(e))}`}
                >
                  <span className="dg-handle top" onPointerDown={(ev) => begin(ev, { ...item, inst }, 'top')} aria-hidden />
                  <strong>{inst.series && <Repeat size={11} aria-hidden className="rep-ico" />}{L(inst.title)}</strong>
                  <span className="dg-time">{showTime(fromMin(s))}–{showTime(fromMin(e))}{h >= 60 && emp(inst.assignee) ? ` · ${emp(inst.assignee).name}` : ''}</span>
                  <span className="dg-handle bottom" onPointerDown={(ev) => begin(ev, { ...item, inst }, 'bottom')} aria-hidden />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <p className="muted small dg-hint">{t('dg.hint')}</p>
    </section>
  )
}

// Xếp các khối trùng giờ thành các cột cạnh nhau
function layout(list) {
  const sorted = [...list].sort((a, b) => a.s - b.s || b.e - a.e)
  const out = []
  let cluster = []
  let clusterEnd = -1
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((c) => c.col + 1))
    cluster.forEach((c) => out.push({ ...c, cols }))
    cluster = []
  }
  const colEnds = []
  for (const it of sorted) {
    if (it.s >= clusterEnd && cluster.length) { flush(); colEnds.length = 0 }
    let col = colEnds.findIndex((e) => e <= it.s)
    if (col === -1) col = colEnds.length
    colEnds[col] = it.e
    cluster.push({ ...it, col })
    clusterEnd = Math.max(clusterEnd, it.e)
  }
  if (cluster.length) flush()
  return out
}
