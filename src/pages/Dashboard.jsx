import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Hourglass } from 'lucide-react'
import { useApp } from '../store'
import { BarChart, PageHeader } from '../components/ui'
import { financeFor, lastDays, sum, valid } from '../calc'
import { dayISO } from '../data'

export default function Dashboard() {
  const { t, L, lang, money, orders, employees, requests, tasks, ingStock, ingredients, products, visibleBranchIds, allowedBranches } = useApp()
  const ids = visibleBranchIds
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const todayOrders = orders.filter((o) => ids.includes(o.branch) && o.date === today && valid(o))
  const fin = financeFor(ids, orders, employees)
  const week = lastDays(7, orders, ids, locale)

  const alerts = []
  for (const b of ids) {
    for (const ing of ingredients) {
      const s = ingStock[b][ing.id]
      const bn = L(allowedBranches.find((x) => x.id === b).name)
      const days = Math.round((new Date(s.expiry) - new Date(today)) / 86400000)
      if (s.qty < ing.min) alerts.push({ k: `low-${b}-${ing.id}`, tone: 'bad', text: t('dash.low', { name: L(ing.name), qty: s.qty, unit: ing.unit, branch: bn }), to: '/inventory' })
      if (days <= 3) alerts.push({ k: `exp-${b}-${ing.id}`, tone: 'warn', text: t('dash.expiring', { name: L(ing.name), days, branch: bn }), to: '/inventory' })
    }
  }
  const pending = requests.filter((r) => ids.includes(r.branch) && r.status === 'pending')
  const due = tasks.filter((x) => ids.includes(x.branch) && x.status !== 'done' && x.due <= today)

  const weekStart = dayISO(-6)
  const sold = {}
  orders.filter((o) => ids.includes(o.branch) && valid(o) && o.date >= weekStart).forEach((o) => o.items.forEach((it) => (sold[it.pid] = (sold[it.pid] || 0) + it.qty)))
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxSold = top[0]?.[1] || 1

  return (
    <>
      <PageHeader title={t('nav.dashboard')} sub={t('dash.sub')} />

      <section className="strip" aria-label="Summary">
        <div><span className="muted">{t('dash.revToday')}</span><strong>{money(sum(todayOrders, (o) => o.total))}</strong></div>
        <div><span className="muted">{t('dash.ordersToday')}</span><strong>{todayOrders.length}</strong></div>
        <div><span className="muted">{t('dash.revMonth')}</span><strong>{money(fin.revenue)}</strong></div>
        <div><span className="muted">{t('fin.payrollFund')}</span><strong>{money(fin.payroll)}</strong></div>
        <div><span className="muted">{t('fin.profit')}</span><strong className={fin.profit < 0 ? 'neg' : ''}>{money(fin.profit)}</strong></div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>{t('dash.last7')}</h2>
          <BarChart data={week} format={(v) => (v / 1e6).toFixed(1) + 'tr'} />
        </section>

        <section className="panel">
          <h2>{t('dash.attention')}</h2>
          <ul className="alert-list">
            {pending.length > 0 && (
              <li><Link to="/requests"><ClipboardList size={16} aria-hidden /> {t('dash.pendingReq', { n: pending.length })}</Link></li>
            )}
            {due.length > 0 && (
              <li><Link to="/tasks"><Hourglass size={16} aria-hidden /> {t('dash.dueTasks', { n: due.length })}</Link></li>
            )}
            {alerts.slice(0, 6).map((a) => (
              <li key={a.k}><Link to={a.to} className={`tone-${a.tone}`}><AlertTriangle size={16} aria-hidden /> {a.text}</Link></li>
            ))}
            {!pending.length && !due.length && !alerts.length && <li className="muted">{t('dash.allGood')}</li>}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>{t('dash.top')}</h2>
        <ul className="rank">
          {top.map(([pid, qty]) => (
            <li key={pid}>
              <span>{L(products.find((p) => p.id === pid).name)}</span>
              <div className="rank-bar"><i style={{ width: `${(qty / maxSold) * 100}%` }} /></div>
              <strong>{qty}</strong>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
