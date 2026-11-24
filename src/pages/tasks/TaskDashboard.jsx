import { useApp } from '../../store'
import { Badge, BarChart } from '../../components/ui'
import { addDays, dayISO, parseISO, TASK_CATEGORIES } from '../../data'
import { STATUS_COLS } from '../../components/TaskForm'
import { isRecurring, occurrences } from '../../lib/recur'

const prioTone = { high: 'bad', medium: 'warn', low: 'neutral' }
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export default function TaskDashboard({ tasks, projects, employees, onEdit }) {
  const { t, L, dateFmt, departments } = useApp()
  const today = dayISO(0)
  const soon = addDays(today, 7)
  const open = tasks.filter((x) => x.status !== 'done')
  const overdue = open.filter((x) => x.due && x.due < today && !isRecurring(x)).sort((a, b) => a.due.localeCompare(b.due))
  // Các lần đến hạn trong 14 ngày tới (gồm cả công việc lặp lại)
  const horizon = addDays(today, 13)
  const dueInstances = tasks.flatMap((x) => occurrences(x, today, horizon)).filter((o) => !o.done && o.status !== 'done' && o.due >= today && o.due <= horizon)
  const upcoming = dueInstances.filter((o) => o.due <= soon).sort((a, b) => a.due.localeCompare(b.due))
  const perDay = Array.from({ length: 14 }, (_, i) => {
    const iso = addDays(today, i)
    return { label: String(parseISO(iso).getDate()), value: dueInstances.filter((o) => o.due === iso).length }
  })
  const byCategory = TASK_CATEGORIES.map((c) => ({ key: c, n: open.filter((x) => x.category === c).length })).filter((r) => r.n)
  const byDept = [...departments.map((d) => ({ key: d.id, label: L(d.name), n: open.filter((x) => x.department === d.id).length })), { key: '', label: t('tasks.noDept'), n: open.filter((x) => !x.department).length }]
    .filter((r) => r.n)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
  const done = tasks.filter((x) => x.status === 'done').length
  const count = (s) => tasks.filter((x) => x.status === s).length
  const emp = (id) => employees.find((e) => e.id === id)

  const load = [...employees.map((e) => ({ key: e.id, name: e.name, n: open.filter((x) => x.assignee === e.id).length })), { key: '', name: t('tasks.unassigned'), n: open.filter((x) => !x.assignee).length }]
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
  const maxLoad = load[0]?.n || 1
  const byProject = [...projects, { id: '', name: { vi: t('tasks.noProject'), en: t('tasks.noProject') } }]
    .map((p) => {
      const xs = tasks.filter((x) => x.project === p.id)
      return { p, total: xs.length, done: xs.filter((x) => x.status === 'done').length, late: xs.filter((x) => x.status !== 'done' && x.due && x.due < today).length }
    })
    .filter((r) => r.total)

  return (
    <div className="td">
      <section className="strip" aria-label={t('tasks.view.dashboard')}>
        <div><span className="muted">{t('td.total')}</span><strong>{tasks.length}</strong></div>
        <div><span className="muted">{t('status.doing')}</span><strong>{count('doing')}</strong></div>
        <div><span className="muted">{t('td.overdue')}</span><strong className={overdue.length ? 'neg' : ''}>{overdue.length}</strong></div>
        <div><span className="muted">{t('td.dueSoon')}</span><strong>{upcoming.length}</strong></div>
        <div><span className="muted">{t('status.done')}</span><strong>{done}</strong><small className="muted">{pct(done, tasks.length)}%</small></div>
      </section>

      <div className="grid-2 even">
        <section className="panel">
          <h2>{t('td.byStatus')}</h2>
          <div className="stack" role="img" aria-label={STATUS_COLS.map((s) => `${t(`status.${s}`)}: ${count(s)}`).join(', ')}>
            {STATUS_COLS.map((s) => count(s) > 0 && <i key={s} className={`seg-${s}`} style={{ flexGrow: count(s) }}>{count(s)}</i>)}
          </div>
          <ul className="legend">
            {STATUS_COLS.map((s) => <li key={s}><i className={`dot seg-${s}`} /> {t(`status.${s}`)} <strong>{count(s)}</strong></li>)}
          </ul>
          <h2 className="mt">{t('td.byPriority')}</h2>
          <ul className="rank">
            {['high', 'medium', 'low'].map((p) => {
              const n = open.filter((x) => x.priority === p).length
              return <li key={p}><span>{t(`prio.${p}`)}</span><div className="rank-bar"><i style={{ width: `${pct(n, open.length)}%` }} /></div><strong>{n}</strong></li>
            })}
          </ul>
        </section>

        <section className="panel">
          <h2>{t('td.workload')}</h2>
          {load.length === 0 ? <p className="muted small">{t('common.none')}</p> : (
            <ul className="rank">
              {load.map((r) => <li key={r.key || 'none'}><span>{r.name}</span><div className="rank-bar"><i style={{ width: `${(r.n / maxLoad) * 100}%` }} /></div><strong>{r.n}</strong></li>)}
            </ul>
          )}
          <p className="muted small">{t('td.workloadNote')}</p>
        </section>
      </div>

      <div className="grid-2 even">
        <section className="panel">
          <h2>{t('td.dueNext14')}</h2>
          <BarChart data={perDay} format={(v) => String(v)} height={170} highlightLast={false} />
          <p className="muted small">{t('td.dueNext14Note')}</p>
        </section>
        <section className="panel">
          <h2>{t('td.byCategory')}</h2>
          {byCategory.length === 0 ? <p className="muted small">{t('common.none')}</p> : (
            <ul className="rank">
              {byCategory.map((r) => <li key={r.key}><span>{t(`tcat.${r.key}`)}</span><div className="rank-bar"><i style={{ width: `${pct(r.n, open.length)}%` }} /></div><strong>{r.n}</strong></li>)}
            </ul>
          )}
          <h2 className="mt">{t('td.byDept')}</h2>
          {byDept.length === 0 ? <p className="muted small">{t('common.none')}</p> : (
            <ul className="rank">
              {byDept.map((r) => <li key={r.key || 'none'}><span>{r.label}</span><div className="rank-bar"><i style={{ width: `${pct(r.n, open.length)}%` }} /></div><strong>{r.n}</strong></li>)}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>{t('td.byProject')}</h2>
        <ul className="proj-rows">
          {byProject.map(({ p, total, done: d, late }) => (
            <li key={p.id}>
              <strong>{L(p.name)}</strong>
              <div className="meter" aria-label={`${pct(d, total)}%`}><i style={{ width: `${pct(d, total)}%` }} /></div>
              <span className="muted small">{t('proj.tasks', { done: d, total })}</span>
              {late > 0 && <Badge tone="bad">{t('td.lateN', { n: late })}</Badge>}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid-2 even">
        <DeadlineList title={t('td.overdue')} tone="bad" items={overdue} onEdit={(x) => onEdit(tasks.find((y) => y.id === x.id))} emp={emp} L={L} dateFmt={dateFmt} t={t} />
        <DeadlineList title={t('td.dueSoonTitle')} tone="warn" items={upcoming} onEdit={(x) => onEdit(tasks.find((y) => y.id === x.id))} emp={emp} L={L} dateFmt={dateFmt} t={t} />
      </div>
    </div>
  )
}

function DeadlineList({ title, tone, items, onEdit, emp, L, dateFmt, t }) {
  return (
    <section className="panel">
      <h2>{title} <span className="tab-count">{items.length}</span></h2>
      {items.length === 0 ? <p className="muted small">{t('td.none')}</p> : (
        <ul className="d-list">
          {items.map((x) => (
            <li key={x.key || x.id}>
              <button className="d-task" onClick={() => onEdit(x)}>
                <strong>{L(x.title)}</strong>
                <span className="muted small">{emp(x.assignee)?.name || t('tasks.unassigned')}</span>
              </button>
              <Badge tone={tone}>{dateFmt(x.due)}</Badge>
              <Badge tone={prioTone[x.priority]}>{t(`prio.${x.priority}`)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
