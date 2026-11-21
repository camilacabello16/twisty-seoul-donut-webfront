import { useApp } from '../store'
import { BarChart, PageHeader } from '../components/ui'
import { financeFor, lastDays, netSalary, sum } from '../calc'

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0)

export default function Finance() {
  const { t, L, lang, money, orders, employees, visibleBranchIds, allowedBranches, activeBranch } = useApp()
  const ids = visibleBranchIds
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const f = financeFor(ids, orders, employees)
  const days = lastDays(14, orders, ids, locale).map((d) => ({ ...d, label: d.date.slice(8) }))
  const staff = employees.filter((e) => ids.includes(e.branch) && e.status !== 'resigned')
  const month = new Date().toLocaleDateString(locale, { month: '2-digit', year: 'numeric' })

  const costs = [
    { k: 'cogs', label: t('fin.cogs'), v: f.cogs },
    { k: 'payroll', label: t('fin.payrollFund'), v: f.payroll },
    { k: 'rent', label: t('fin.rent'), v: f.rent },
    { k: 'other', label: t('fin.other'), v: f.other },
  ]

  return (
    <>
      <PageHeader title={t('nav.finance')} sub={t('fin.sub', { month })} />

      <section className="strip" aria-label="Summary">
        <div><span className="muted">{t('fin.revenue')}</span><strong>{money(f.revenue)}</strong><small className="muted">{t('fin.ordersCount', { n: f.orders })}</small></div>
        <div><span className="muted">{t('fin.totalCost')}</span><strong>{money(f.cost)}</strong></div>
        <div><span className="muted">{t('fin.payrollFund')}</span><strong>{money(f.payroll)}</strong><small className="muted">{t('fin.ofRevenue', { p: pct(f.payroll, f.revenue) })}</small></div>
        <div><span className="muted">{t('fin.profit')}</span><strong className={f.profit < 0 ? 'neg' : ''}>{money(f.profit)}</strong><small className="muted">{t('fin.margin', { p: pct(f.profit, f.revenue) })}</small></div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>{t('fin.daily')}</h2>
          <BarChart data={days} format={(v) => (v / 1e6).toFixed(1)} height={200} />
          <p className="muted small">{t('fin.unitNote')}</p>
        </section>
        <section className="panel">
          <h2>{t('fin.costBreakdown')}</h2>
          <ul className="rank">
            {costs.map((c) => (
              <li key={c.k}>
                <span>{c.label}</span>
                <div className="rank-bar"><i style={{ width: `${pct(c.v, f.cost)}%` }} /></div>
                <strong>{money(c.v)}</strong>
              </li>
            ))}
          </ul>
          <p className="formula">{t('fin.formula')}</p>
        </section>
      </div>

      {activeBranch === 'all' && (
        <section className="panel">
          <h2>{t('fin.byBranch')}</h2>
          <div className="table-wrap flat">
            <table>
              <thead><tr><th>{t('branch.label')}</th><th className="num">{t('fin.revenue')}</th><th className="num">{t('fin.payrollFund')}</th><th className="num">{t('fin.totalCost')}</th><th className="num">{t('fin.profit')}</th></tr></thead>
              <tbody>
                {allowedBranches.map((b) => {
                  const x = financeFor([b.id], orders, employees)
                  return (
                    <tr key={b.id}>
                      <td><strong>{L(b.name)}</strong></td>
                      <td className="num">{money(x.revenue)}</td>
                      <td className="num">{money(x.payroll)}</td>
                      <td className="num">{money(x.cost)}</td>
                      <td className={`num ${x.profit < 0 ? 'neg' : ''}`}><strong>{money(x.profit)}</strong></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel">
        <h2>{t('fin.payrollFundTitle')} <span className="muted">· {t('fin.fromPayroll')}</span></h2>
        <div className="table-wrap flat">
          <table>
            <thead><tr><th>{t('hr.name')}</th><th>{t('hr.title')}</th><th className="num">{t('hr.workdays')}</th><th className="num">{t('hr.net')}</th><th className="num">{t('fin.share')}</th></tr></thead>
            <tbody>
              {staff.map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.name}</strong></td><td>{L(e.title)}</td><td className="num">{e.workdays}</td>
                  <td className="num">{money(netSalary(e))}</td><td className="num">{pct(netSalary(e), f.payroll)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={3}>{t('fin.payrollFund')}</td><td className="num"><strong>{money(sum(staff, netSalary))}</strong></td><td className="num">100%</td></tr></tfoot>
          </table>
        </div>
      </section>
    </>
  )
}
