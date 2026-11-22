import { useCallback, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useApp } from '../store'
import { TaskForm } from './Tasks'
import { Badge, ContextMenu, PageHeader, statusTone } from '../components/ui'
import { dayISO, departments, parseISO, toISO } from '../data'
import { attendanceOn, producedOn, sum, valid } from '../calc'

const prioRank = { high: 0, medium: 1, low: 2 }
const statusRank = { doing: 0, todo: 1, done: 2 }

export default function Calendar() {
  const { t, L, lang, money, tasks, projects, orders, requests, employees, production, products, stockLog, ingredients, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [form, setForm] = useState(null) // null | { date } | { task }
  const [menu, setMenu] = useState(null) // null | { x, y, iso }
  const closeMenu = useCallback(() => setMenu(null), [])
  const myProjects = projects.filter((p) => p.branches.some((b) => visibleBranchIds.includes(b)))
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const [cursor, setCursor] = useState(() => parseISO(today.slice(0, 8) + '01'))
  const [selected, setSelected] = useState(today)
  const monthKey = toISO(cursor).slice(0, 7)
  const all = activeBranch === 'all'
  const bname = (id) => L(allowedBranches.find((b) => b.id === id)?.name)

  const goMonth = (delta) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
  const pickMonth = (value) => {
    if (!value) return
    const [y, m] = value.split('-').map(Number)
    setCursor(new Date(y, m - 1, 1))
  }
  const goToday = () => { setCursor(parseISO(today.slice(0, 8) + '01')); setSelected(today) }
  const pickDay = (iso) => {
    setSelected(iso)
    if (iso.slice(0, 7) !== monthKey) setCursor(parseISO(iso.slice(0, 8) + '01'))
  }

  // Các ô của lịch: tuần bắt đầu từ thứ 2
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7
    const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const total = Math.ceil((lead + daysIn) / 7) * 7
    return Array.from({ length: total }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), 1 - lead + i))
  }, [cursor])
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }))

  const tasksOn = (iso) =>
    tasks
      .filter((x) => x.due === iso && visibleBranchIds.includes(x.branch))
      .sort((a, b) => statusRank[a.status] - statusRank[b.status] || prioRank[a.priority] - prioRank[b.priority])

  const monthLabel = cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

  return (
    <>
      <PageHeader title={t('nav.calendar')} sub={t('cal.sub')} />

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

      <div className="cal-layout">
        <section className="cal" aria-label={monthLabel}>
          <div className="cal-head" aria-hidden>
            {weekdays.map((w, i) => <span key={w} className={i >= 5 ? 'we' : ''}>{w}</span>)}
          </div>
          <div className="cal-grid">
            {cells.map((d) => {
              const iso = toISO(d)
              const inMonth = iso.slice(0, 7) === monthKey
              const list = tasksOn(iso)
              const shown = list.slice(0, 3)
              return (
                <button
                  key={iso}
                  className={`cal-day ${inMonth ? '' : 'out'} ${iso === today ? 'today' : ''} ${iso === selected ? 'sel' : ''}`}
                  onClick={() => pickDay(iso)}
                  onDoubleClick={() => { pickDay(iso); setForm({ date: iso }) }}
                  onContextMenu={(e) => { e.preventDefault(); pickDay(iso); setMenu({ x: e.clientX, y: e.clientY, iso }) }}
                  aria-pressed={iso === selected}
                  aria-label={`${d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}, ${t('cal.taskCount', { n: list.length })}`}
                >
                  <span className="cal-num">{d.getDate()}</span>
                  {shown.map((x) => (
                    <span key={x.id} className={`chip-task st-${x.status} pr-${x.priority}`} title={L(x.title)}>{L(x.title)}</span>
                  ))}
                  {list.length > shown.length && <span className="chip-more">{t('cal.more', { n: list.length - shown.length })}</span>}
                </button>
              )
            })}
          </div>
        </section>

        <DayDetail
          iso={selected}
          t={t} L={L} money={money} locale={locale} all={all} bname={bname}
          tasks={tasksOn(selected)}
          data={{ orders, requests, employees, production, products, stockLog, ingredients, visibleBranchIds }}
          today={today}
          onAdd={() => setForm({ date: selected })}
          onEdit={(task) => setForm({ task })}
        />
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          title={parseISO(menu.iso).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          onClose={closeMenu}
          items={[{ key: 'add', label: t('tasks.add'), icon: Plus, onSelect: () => setForm({ date: menu.iso }) }]}
        />
      )}

      {form && (
        <TaskForm
          task={form.task || null}
          defaultDue={form.date || ''}
          people={employees.filter((e) => visibleBranchIds.includes(e.branch) && e.status !== 'resigned')}
          projects={myProjects}
          branch={all ? visibleBranchIds[0] : activeBranch}
          branchOptions={all ? allowedBranches : undefined}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form.task) actions.updateTask(form.task.id, data)
            else actions.addTask(data)
            if (data.due) pickDay(data.due)
            setForm(null)
            notify(t('common.saved'))
          }}
          onDelete={form.task ? () => {
            if (window.confirm(t('tasks.deleteConfirm'))) {
              actions.deleteTask(form.task.id)
              setForm(null)
              notify(t('tasks.deleted'))
            }
          } : null}
        />
      )}
    </>
  )
}

function DayDetail({ iso, t, L, money, locale, all, bname, tasks, data, today, onAdd, onEdit }) {
  const { orders, requests, employees, production, products, stockLog, ingredients, visibleBranchIds } = data
  const dayOrders = orders.filter((o) => o.date === iso && visibleBranchIds.includes(o.branch))
  const good = dayOrders.filter(valid)
  const revenue = sum(good, (o) => o.total)
  const made = producedOn(iso, visibleBranchIds, orders, production)
  const madeTotal = sum(Object.values(made), (n) => n)
  const imports = stockLog.filter((s) => s.date === iso && visibleBranchIds.includes(s.branch))
  const { working, off } = attendanceOn(iso, visibleBranchIds, employees, requests)
  const dept = (id) => L(departments.find((d) => d.id === id)?.name)
  const date = parseISO(iso)

  return (
    <aside className="day-detail" aria-label={t('cal.detail')} aria-live="polite">
      <header>
        <h2>{date.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h2>
        {iso === today && <Badge tone="info">{t('cal.today')}</Badge>}
      </header>

      <dl className="day-stats">
        <div><dt>{t('cal.orders')}</dt><dd>{good.length}{dayOrders.length > good.length && <small> (+{dayOrders.length - good.length} {t('ostatus.cancelled').toLowerCase()})</small>}</dd></div>
        <div><dt>{t('fin.revenue')}</dt><dd>{money(revenue)}</dd></div>
        <div><dt>{t('cal.made')}</dt><dd>{madeTotal}</dd></div>
        <div><dt>{t('cal.imported')}</dt><dd>{imports.length}</dd></div>
      </dl>

      <section>
        <div className="d-title">
          <h3>{t('nav.tasks')} <span className="tab-count">{tasks.length}</span></h3>
          <button className="btn btn-small btn-primary" onClick={onAdd}><Plus size={14} aria-hidden /> {t('tasks.add')}</button>
        </div>
        {tasks.length === 0 ? <p className="muted small">{t('cal.noTasks')}</p> : (
          <ul className="d-list">
            {tasks.map((x) => (
              <li key={x.id}>
                <button className="d-task" onClick={() => onEdit(x)} aria-label={`${t('tasks.edit')}: ${L(x.title)}`}>
                  <strong>{L(x.title)}</strong>
                  <span className="muted small">{data.employees.find((e) => e.id === x.assignee)?.name}{all && ` · ${bname(x.branch)}`}</span>
                </button>
                <Badge tone={statusTone[x.status]}>{t(`status.${x.status}`)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>{t('cal.staff')} <span className="tab-count">{working.length}</span></h3>
        {working.length === 0 ? <p className="muted small">{t('common.none')}</p> : (
          <ul className="d-list">
            {working.map((e) => (
              <li key={e.id}><div><strong>{e.name}</strong><span className="muted small">{L(e.title)} · {dept(e.dept)}{all && ` · ${bname(e.branch)}`}</span></div></li>
            ))}
          </ul>
        )}
        {off.length > 0 && (
          <>
            <p className="d-sub">{t('cal.off')}</p>
            <ul className="d-list">
              {off.map(({ e, why }) => (
                <li key={e.id} className="faded-li"><div><strong>{e.name}</strong></div><Badge tone={why === 'leave' ? 'warn' : 'neutral'}>{t(why === 'leave' ? 'estatus.onleave' : 'cal.dayoff')}</Badge></li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h3>{t('cal.madeTitle')} <span className="tab-count">{madeTotal}</span></h3>
        {madeTotal === 0 ? <p className="muted small">{iso > today ? t('cal.future') : t('common.none')}</p> : (
          <ul className="d-list tight">
            {Object.entries(made).sort((a, b) => b[1] - a[1]).map(([pid, q]) => (
              <li key={pid}><span>{L(products.find((p) => p.id === pid).name)}</span><strong>{q}</strong></li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>{t('cal.importTitle')} <span className="tab-count">{imports.length}</span></h3>
        {imports.length === 0 ? <p className="muted small">{t('common.none')}</p> : (
          <ul className="d-list tight">
            {imports.map((s) => {
              const ing = ingredients.find((i) => i.id === s.ing)
              return <li key={s.id}><span>{L(ing.name)}{all && <span className="muted small"> · {bname(s.branch)}</span>}</span><strong>{s.qty} {ing.unit}</strong></li>
            })}
          </ul>
        )}
      </section>
    </aside>
  )
}
