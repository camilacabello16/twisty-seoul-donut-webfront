import { addDays } from '../data'
import { diffDays, taskStart } from './recur'

import { DAY_MIN, defaultDuration, fromMin } from './time'
import { isRecurring } from './recur'

// Thả vào lưới giờ của một ngày: đặt giờ bắt đầu/kết thúc (giữ thời lượng nếu đã có giờ).
// startMin = null nghĩa là chuyển thành việc cả ngày. Việc lặp lại giữ độ dài, việc thường trở thành việc trong 1 ngày.
export function computeTimed(task, payload, date, startMin) {
  const dates = isRecurring(task) && task.due ? computeSchedule(task, { ...payload, grab: 0 }, date) : { start: date, due: date }
  if (startMin == null) return { ...dates, startTime: '', endTime: '' }
  const dur = Math.min(defaultDuration(task), DAY_MIN)
  const s = Math.max(0, Math.min(startMin, DAY_MIN - dur))
  return { ...dates, startTime: fromMin(s), endTime: fromMin(s + dur) }
}

// Tính ngày bắt đầu/hạn mới khi kéo thả một công việc (hoặc một lần lặp) vào ngày dropIso.
// Việc chưa có lịch được đặt vào đúng ngày thả; việc đã có lịch giữ nguyên độ dài và dời theo vị trí con trỏ.
export function computeSchedule(task, payload, dropIso) {
  if (payload.occ == null || !task.due) return { start: dropIso, due: dropIso }
  const delta = diffDays(payload.occ, addDays(dropIso, -payload.grab))
  return { start: addDays(taskStart(task), delta), due: addDays(task.due, delta) }
}
