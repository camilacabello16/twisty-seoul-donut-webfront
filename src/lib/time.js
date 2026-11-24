export const SNAP = 15 // phút
export const DAY_MIN = 1440

// 'HH:MM' <-> số phút trong ngày. '23:59' được hiểu là hết ngày (24:00).
export const toMin = (hhmm) => {
  if (!hhmm) return null
  if (hhmm === '23:59') return DAY_MIN
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (n) => {
  if (n >= DAY_MIN) return '23:59'
  const v = Math.max(0, n)
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
}
export const showTime = (hhmm) => (hhmm === '23:59' ? '24:00' : hhmm)
export const snap = (n) => Math.round(n / SNAP) * SNAP
export const snapDown = (n) => Math.floor(n / SNAP) * SNAP
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

export const hasTimes = (t) => !!t.startTime && !!t.endTime
export const timeLabel = (t) => (hasTimes(t) ? `${showTime(t.startTime)}–${showTime(t.endTime)}` : '')
// Thời lượng mặc định khi thả vào lịch: theo ước tính giờ nếu có, tối thiểu 15 phút, mặc định 60 phút
export const defaultDuration = (t) => {
  if (hasTimes(t)) return Math.max(SNAP, toMin(t.endTime) - toMin(t.startTime))
  return t.estimate > 0 ? Math.max(SNAP, snap(t.estimate * 60)) : 60
}
