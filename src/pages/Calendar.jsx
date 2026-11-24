import { useState } from 'react'
import { Check, Plus, Repeat } from 'lucide-react'
import { useApp } from '../store'
import TaskForm from '../components/TaskForm'
import TaskCalendar from '../components/TaskCalendar'
import { Badge, PageHeader, statusTone } from '../components/ui'
import { dayISO, parseISO } from '../data'
import { attendanceOn, producedOn, sum } from '../calc'
import { occurrences } from '../lib/recur'
import { computeSchedule } from '../lib/schedule'

const prioRank = { high: 0, medium: 1, low: 2 }
const statusRank = { doing: 0, todo: 1, done: 2 }

export default function Calendar() {
  const { t, L, lang, tasks, projects, orders, requests, employees, departments, production, products, stockLog, ingredients, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [form, setForm] = useState(null) // null | { date } | { task }
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const today = dayISO(0)
  const [cursor, setCursor] = useState(() => parseISO(today.slice(0, 8) + '01'))
  const [selected, setSelected] = useState(today)
  const all = activeBranch === 'all'
  const bname = (id) => L(allowedBranches.find((b) => b.id === id)?.name)
  const myProjects = projects.filter((p) => p.branches.some((b) => visibleBranchIds.includes(b)))
  const branchTasks = tasks.filter((x) => visibleBranchIds.includes(x.branch))

  // Công việc đang diễn ra trong ngày (kể cả việc nhiều ngày và việc lặp lại)
  const tasksOn = (iso) =>
    branchTasks
      .flatMap((x) => occurrences(x, iso, iso))
      .sort((a, b) => Number(a.done) - Number(b.done) || statusRank[a.status] - statusRank[b.status] || prioRank[a.priority] - prioRank[b.priority])

  const schedule = (payload, iso) => {
    const task = tasks.find((x) => x.id === payload.id)
    if (task) {
      actions.updateTask(task.id, computeSchedule(task, payload, iso))
      notify(t('tasks.scheduled', { date: parseISO(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }) }))
    }
  }

  return (
    <>
      <PageHeader title={t('nav.calendar')} sub={t('cal.sub')} />

      <div className="cal-layout">
        <div className="cal-main">
          <TaskCalendar
            tasks={branchTasks}
            cursor={cursor}
            setCursor={setCursor}
            selected={selected}
            onSelect={setSelected}
            onCreate={(date) => setForm({ date })}
            onEdit={(task) => setForm({ task })}
            onDropTask={schedule}
          />
        </div>

        <DayDetail
          iso={selected}
          t={t} L={L} locale={locale} all={all} bname={bname}
          tasks={tasksOn(selected)}
          data={{ orders, requests, employees, departments, production, products, stockLog, ingredients, visibleBranchIds, tasks }}
          today={today}
          actions={actions}
          onAdd={() => setForm({ date: selected })}
          onEdit={(task) => setForm({ task })}
        />
      </div>

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
            if (data.due) setSelected(data.due)
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

function DayDetail({ iso, t, L, locale, all, bname, tasks, data, today, actions, onAdd, onEdit }) {
  const { orders, requests, employees, departments, production, products, stockLog, ingredients, visibleBranchIds } = data
  const made = producedOn(iso, visibleBranchIds, orders, production)
  const madeTotal = sum(Object.values(made), (n) => n)
  const imports = stockLog.filter((s) => s.date === iso && visibleBranchIds.includes(s.branch))
  const { working, off } = attendanceOn(iso, visibleBranchIds, employees, requests)
  const dept = (id) => L(departments.find((d) => d.id === id)?.name) || '—'
  const date = parseISO(iso)
  const toggle = (x) => (x.series ? actions.toggleOccurrence(x.id, x.occ) : actions.updateTask(x.id, { status: x.status === 'done' ? 'todo' : 'done' }))

  return (
    <aside className="day-detail" aria-label={t('cal.detail')} aria-live="polite">
      <header>
        <h2>{date.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h2>
        {iso === today && <Badge tone="info">{t('cal.today')}</Badge>}
      </header>

      <dl className="day-stats">
        <div><dt>{t('nav.tasks')}</dt><dd>{tasks.length}</dd></div>
        <div><dt>{t('cal.staff')}</dt><dd>{working.length}</dd></div>
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
              <li key={x.key}>
                <button className={`lv-check ${x.done ? 'on' : ''}`} onClick={() => toggle(x)} aria-pressed={x.done} aria-label={x.done ? t('tasks.reopen') : t('tasks.complete')}><Check size={14} aria-hidden /></button>
                <button className="d-task" onClick={() => onEdit(data.tasks.find((y) => y.id === x.id))} aria-label={`${t('tasks.edit')}: ${L(x.title)}`}>
                  <strong className={x.done ? 'struck' : ''}>{x.series && <Repeat size={12} aria-hidden className="rep-ico" />}{L(x.title)}</strong>
                  <span className="muted small">{employees.find((e) => e.id === x.assignee)?.name || t('tasks.unassigned')}{all && ` · ${bname(x.branch)}`}</span>
                </button>
                <Badge tone={statusTone[x.done ? 'done' : x.status === 'done' ? 'todo' : x.status]}>{t(`status.${x.done ? 'done' : x.status === 'done' ? 'todo' : x.status}`)}</Badge>
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
              <li key={pid}><span>{L(products.find((p) => p.id === pid)?.name)}</span><strong>{q}</strong></li>
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
              return (
                <li key={s.id}>
                  <span>{L(ing?.name)}{s.supplier && <span className="muted small"> · {s.supplier}</span>}{all && <span className="muted small"> · {bname(s.branch)}</span>}</span>
                  <strong>{s.qty} {ing?.unit}</strong>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </aside>
  )
}
