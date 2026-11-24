import { FIXED_COSTS, STANDARD_DAYS, dayISO, ingredients, parseISO, products } from './data'

export const netSalary = (e) => Math.round((e.base / STANDARD_DAYS) * e.workdays) + e.allowance + e.bonus - e.deduction

const costOf = Object.fromEntries(
  products.map((p) => [p.id, Object.entries(p.recipe).reduce((s, [id, q]) => s + q * ingredients.find((i) => i.id === id).cost, 0)]),
)
export const unitCost = (pid) => costOf[pid]
// Giá vốn theo công thức hiện tại và danh sách nguyên liệu hiện tại (kể cả nguyên liệu mới tạo)
export const unitCostOf = (product, ings) =>
  Object.entries(product.recipe).reduce((s, [id, q]) => s + q * (ings.find((i) => i.id === id)?.cost || 0), 0)
export const orderCogs = (o) => o.items.reduce((s, it) => s + it.qty * costOf[it.pid], 0)

export const monthStart = () => dayISO(0).slice(0, 8) + '01'
export const valid = (o) => o.status !== 'cancelled'

export const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)

export function financeFor(branchIds, orders, employees) {
  const monthOrders = orders.filter((o) => branchIds.includes(o.branch) && valid(o) && o.date >= monthStart())
  const revenue = sum(monthOrders, (o) => o.total)
  const cogs = sum(monthOrders, orderCogs)
  const payroll = sum(employees.filter((e) => branchIds.includes(e.branch) && e.status !== 'resigned'), netSalary)
  const rent = sum(branchIds, (b) => FIXED_COSTS[b].rent)
  const other = sum(branchIds, (b) => FIXED_COSTS[b].other)
  const cost = cogs + payroll + rent + other
  return { revenue, cogs, payroll, rent, other, cost, profit: revenue - cost, orders: monthOrders.length }
}

export function lastDays(n, orders, branchIds, locale) {
  return Array.from({ length: n }, (_, i) => {
    const date = dayISO(i - (n - 1))
    const value = sum(orders.filter((o) => o.date === date && branchIds.includes(o.branch) && valid(o)), (o) => o.total)
    return { date, value, label: parseISO(date).toLocaleDateString(locale, { weekday: 'short' }) }
  })
}

// Nhân sự đi làm theo ngày. Chưa có chấm công nên lịch này suy ra từ:
// - mỗi nhân viên nghỉ cố định 1 ngày/tuần (xoay vòng theo thứ tự),
// - đơn nghỉ phép đã duyệt,
// - trạng thái "đang nghỉ phép" (từ hôm nay trở đi).
export function attendanceOn(date, branchIds, employees, requests) {
  const weekday = parseISO(date).getDay()
  const today = dayISO(0)
  const working = []
  const off = []
  employees.forEach((e, i) => {
    if (!branchIds.includes(e.branch) || e.status === 'resigned') return
    const leave = requests.some((r) => r.type === 'leave' && r.status === 'approved' && r.by === e.id && r.from <= date && date <= r.to)
    if (leave || (e.status === 'onleave' && date >= today)) off.push({ e, why: 'leave' })
    else if (i % 7 === weekday) off.push({ e, why: 'dayoff' })
    else working.push(e)
  })
  return { working, off }
}

// Số lượng sản phẩm đã làm trong ngày: hôm nay lấy từ kế hoạch sản xuất,
// các ngày trước suy ra từ số bán ra (mẫu), ngày sau chưa có.
export function producedOn(date, branchIds, orders, production) {
  const today = dayISO(0)
  const out = {}
  if (date > today) return out
  if (date === today) {
    production.filter((r) => branchIds.includes(r.branch)).forEach((r) => { if (r.done) out[r.pid] = (out[r.pid] || 0) + r.done })
    return out
  }
  orders.filter((o) => branchIds.includes(o.branch) && o.date === date && valid(o)).forEach((o) =>
    o.items.forEach((it) => { out[it.pid] = (out[it.pid] || 0) + it.qty }),
  )
  for (const pid of Object.keys(out)) out[pid] += (date.charCodeAt(9) + pid.charCodeAt(1)) % 4
  return out
}
