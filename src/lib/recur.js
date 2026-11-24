import { addDays, parseISO, toISO } from '../data'

export const diffDays = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000)
export const isRecurring = (t) => !!t.repeat && t.repeat.freq !== 'none'
export const taskStart = (t) => (t.start && t.due && t.start <= t.due ? t.start : t.due)

const addMonths = (iso, n) => {
  const d = parseISO(iso)
  const day = d.getDate()
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1)
  r.setDate(Math.min(day, new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()))
  return toISO(r)
}
const mondayOf = (iso) => addDays(iso, -((parseISO(iso).getDay() + 6) % 7))

// Ngày bắt đầu của từng lần lặp nằm (một phần) trong [from, to]
function occurrenceStarts(task, from, to) {
  const s0 = taskStart(task)
  const len = diffDays(s0, task.due)
  const { freq, interval = 1, weekdays = [], until = '' } = task.repeat
  const n = Math.max(1, interval)
  const hardEnd = until && until < to ? until : to
  const out = []
  const lo = addDays(from, -len) // lần lặp bắt đầu từ đây vẫn còn chạm vào khoảng
  if (freq === 'daily') {
    const k0 = Math.max(0, Math.ceil(diffDays(s0, lo) / n))
    for (let d = addDays(s0, k0 * n); d <= hardEnd; d = addDays(d, n)) out.push(d)
  } else if (freq === 'weekly') {
    const days = weekdays.length ? weekdays : [parseISO(s0).getDay()]
    const base = mondayOf(s0)
    for (let d = lo < s0 ? s0 : lo; d <= hardEnd; d = addDays(d, 1)) {
      const weeks = Math.floor(diffDays(base, mondayOf(d)) / 7)
      if (weeks % n === 0 && days.includes(parseISO(d).getDay())) out.push(d)
    }
  } else if (freq === 'monthly') {
    for (let k = 0; k < 600; k++) {
      const d = addMonths(s0, k * n)
      if (d > hardEnd) break
      if (d >= lo) out.push(d)
    }
  }
  return out
}

// Trả về các "lần xuất hiện" của công việc trong khoảng [from, to] (ISO). Việc không lặp trả về chính nó.
export function occurrences(task, from, to) {
  if (!task.due) return []
  const s0 = taskStart(task)
  if (!isRecurring(task)) {
    return s0 <= to && task.due >= from ? [{ ...task, occ: s0, start: s0, key: task.id, series: false, done: task.status === 'done' }] : []
  }
  const len = diffDays(s0, task.due)
  return occurrenceStarts(task, from, to)
    .filter((s) => s >= s0 && addDays(s, len) >= from && s <= to)
    .map((s) => ({
      ...task, occ: s, start: s, due: addDays(s, len), key: `${task.id}@${s}`, series: true,
      done: (task.doneDates || []).includes(s),
    }))
}

export function repeatLabel(repeat, t) {
  if (!repeat || repeat.freq === 'none') return ''
  const n = repeat.interval || 1
  return n > 1 ? t(`rep.every.${repeat.freq}`, { n }) : t(`rep.${repeat.freq}`)
}
