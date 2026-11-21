import { useState } from 'react'
import { useApp } from '../store'
import { Pencil, Plus } from 'lucide-react'
import { Badge, Empty, Modal, PageHeader, Tabs } from '../components/ui'
import { departments, STANDARD_DAYS } from '../data'
import { netSalary, sum } from '../calc'

const STATUSES = ['active', 'onleave', 'resigned']
const sTone = { active: 'ok', onleave: 'warn', resigned: 'neutral' }

export default function HR() {
  const { t, L, lang, money, employees, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [tab, setTab] = useState('staff')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null) // null | 'new' | employee
  const everyone = employees.filter((e) => visibleBranchIds.includes(e.branch))
  const list = everyone.filter((e) => e.status !== 'resigned') // dùng cho phòng ban và bảng lương
  const shown = everyone.filter((e) => filter === 'all' || e.status === filter)
  const bname = (id) => L(allowedBranches.find((b) => b.id === id)?.name)
  const dept = (id) => L(departments.find((d) => d.id === id).name)
  const month = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { month: '2-digit', year: 'numeric' })

  return (
    <>
      <PageHeader
        title={t('nav.hr')}
        sub={t('hr.sub')}
        actions={<button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} aria-hidden /> {t('hr.add')}</button>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'staff', label: t('hr.employees'), count: list.length },
          { id: 'depts', label: t('hr.departments'), count: departments.length },
          { id: 'payroll', label: t('hr.payroll') },
        ]}
      />

      {tab === 'staff' && (
        <>
          <div className="chips" role="group" aria-label={t('common.status')}>
            {['all', ...STATUSES].map((s) => (
              <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{s === 'all' ? t('common.all') : t(`estatus.${s}`)}</button>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('hr.name')}</th><th>{t('hr.dept')}</th><th>{t('hr.title')}</th>
                  {activeBranch === 'all' && <th>{t('branch.label')}</th>}
                  <th>{t('common.status')}</th><th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className={e.status === 'resigned' ? 'faded' : ''}>
                    <td><strong>{e.name}</strong><div className="muted small">{e.phone}</div></td>
                    <td>{dept(e.dept)}</td>
                    <td>{L(e.title)}</td>
                    {activeBranch === 'all' && <td>{bname(e.branch)}</td>}
                    <td>
                      <select
                        className={`status-select tone-${sTone[e.status]}`}
                        value={e.status}
                        aria-label={`${t('common.status')}: ${e.name}`}
                        onChange={(ev) => { actions.updateEmployee(e.id, { status: ev.target.value }); notify(t('hr.statusUpdated')) }}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{t(`estatus.${s}`)}</option>)}
                      </select>
                    </td>
                    <td className="num"><button className="icon-btn" onClick={() => setForm(e)} aria-label={`${t('hr.edit')}: ${e.name}`}><Pencil size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && <Empty>{t('common.none')}</Empty>}
          </div>
          <p className="note">{t('hr.resignedNote')}</p>
        </>
      )}

      {tab === 'depts' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('hr.dept')}</th><th className="num">{t('hr.headcount')}</th></tr></thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}><td><strong>{L(d.name)}</strong></td><td className="num">{list.filter((e) => e.dept === d.id).length}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payroll' && <Payroll list={list} month={month} bname={bname} showBranch={activeBranch === 'all'} money={money} />}

      {form && (
        <EmployeeForm
          employee={form === 'new' ? null : form}
          defaultBranch={activeBranch === 'all' ? allowedBranches[0].id : activeBranch}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form === 'new') actions.addEmployee(data)
            else actions.updateEmployee(form.id, data)
            setForm(null)
            notify(t('common.saved'))
          }}
        />
      )}
    </>
  )
}

function EmployeeForm({ employee, defaultBranch, onClose, onSave }) {
  const { t, L, allowedBranches } = useApp()
  const [f, setF] = useState(() => ({
    name: employee?.name || '',
    phone: employee?.phone || '',
    dept: employee?.dept || departments[0].id,
    title: employee ? L(employee.title) : '',
    branch: employee?.branch || defaultBranch,
    base: employee?.base ?? 7000000,
    allowance: employee?.allowance ?? 0,
    status: employee?.status || 'active',
  }))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const num = (k) => (e) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) })
  return (
    <Modal
      title={employee ? t('hr.edit') : t('hr.add')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          disabled={!f.name.trim() || !f.title.trim()}
          onClick={() => onSave({ ...f, name: f.name.trim(), title: { vi: f.title.trim(), en: f.title.trim() } })}
        >{t('common.save')}</button>
      </>}
    >
      <div className="row2">
        <label className="field"><span>{t('hr.name')}</span><input value={f.name} onChange={set('name')} /></label>
        <label className="field"><span>{t('hr.phone')}</span><input type="tel" value={f.phone} onChange={set('phone')} /></label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('hr.dept')}</span>
          <select value={f.dept} onChange={set('dept')}>{departments.map((d) => <option key={d.id} value={d.id}>{L(d.name)}</option>)}</select>
        </label>
        <label className="field"><span>{t('hr.title')}</span><input value={f.title} onChange={set('title')} placeholder={t('hr.titleHint')} /></label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('branch.label')}</span>
          <select value={f.branch} onChange={set('branch')}>{allowedBranches.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}</select>
        </label>
        <label className="field"><span>{t('common.status')}</span>
          <select value={f.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s} value={s}>{t(`estatus.${s}`)}</option>)}</select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('hr.base')} (₫)</span><input type="number" min="0" step="100000" value={f.base} onChange={num('base')} /></label>
        <label className="field"><span>{t('hr.allowance')} (₫)</span><input type="number" min="0" step="50000" value={f.allowance} onChange={num('allowance')} /></label>
      </div>
    </Modal>
  )
}

function Payroll({ list, month, bname, showBranch, money }) {
  const { t, actions, notify } = useApp()
  return (
    <>
      <div className="note">{t('hr.payrollNote', { month, days: STANDARD_DAYS })}</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('hr.name')}</th>
              {showBranch && <th>{t('branch.label')}</th>}
              <th className="num">{t('hr.base')}</th>
              <th className="num">{t('hr.workdays')}</th>
              <th className="num">{t('hr.allowance')}</th>
              <th className="num">{t('hr.bonus')}</th>
              <th className="num">{t('hr.deduction')}</th>
              <th className="num">{t('hr.net')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.name}</strong></td>
                {showBranch && <td>{bname(e.branch)}</td>}
                <td className="num">{money(e.base)}</td>
                <td className="num">
                  <input
                    className="mini"
                    type="number" min="0" max="31" inputMode="numeric"
                    value={e.workdays}
                    aria-label={`${t('hr.workdays')} ${e.name}`}
                    onChange={(ev) => actions.setWorkdays(e.id, Math.min(31, Math.max(0, Number(ev.target.value) || 0)))}
                    onBlur={() => notify(t('common.saved'))}
                  />
                </td>
                <td className="num">{money(e.allowance)}</td>
                <td className="num">{money(e.bonus)}</td>
                <td className="num">{e.deduction ? '−' + money(e.deduction) : '—'}</td>
                <td className="num"><strong>{money(netSalary(e))}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={showBranch ? 7 : 6}>{t('fin.payrollFund')}</td>
              <td className="num"><strong>{money(sum(list, netSalary))}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
