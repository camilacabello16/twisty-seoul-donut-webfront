import { FIXED_COSTS, STANDARD_DAYS, dayISO, ingredients, products } from './data'

export const netSalary = (e) => Math.round((e.base / STANDARD_DAYS) * e.workdays) + e.allowance + e.bonus - e.deduction

const costOf = Object.fromEntries(
  products.map((p) => [p.id, Object.entries(p.recipe).reduce((s, [id, q]) => s + q * ingredients.find((i) => i.id === id).cost, 0)]),
)
export const unitCost = (pid) => costOf[pid]
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
    return { date, value, label: new Date(date).toLocaleDateString(locale, { weekday: 'short' }) }
  })
}
