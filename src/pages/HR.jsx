import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { useApp } from '../store'
import { Empty, Modal, PageHeader, Tabs } from '../components/ui'
import { STANDARD_DAYS } from '../data'
import { netSalary, sum } from '../calc'

const STATUSES = ['active', 'onleave', 'resigned']
const sTone = { active: 'ok', onleave: 'warn', resigned: 'neutral' }

export default function HR() {
  const { t, L, lang, money, employees, departments, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [tab, setTab] = useState('staff')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null) // null | 'new' | employee
  const everyone = employees.filter((e) => visibleBranchIds.includes(e.branch))
  const list = everyone.filter((e) => e.status !== 'resigned') // dùng cho bảng lương
  const shown = everyone.filter((e) => filter === 'all' || e.status === filter)
  const myDepts = departments.filter((d) => visibleBranchIds.includes(d.branch))
  const bname = (id) => L(allowedBranches.find((b) => b.id === id)?.name)
  const dept = (id) => (id ? L(departments.find((d) => d.id === id)?.name) : null)
  const month = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { month: '2-digit', year: 'numeric' })

  return (
    <>
      <PageHeader
        title={t('nav.hr')}
        sub={t('hr.sub')}
        actions={tab === 'staff' && <button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} aria-hidden /> {t('hr.add')}</button>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'staff', label: t('hr.employees'), count: list.length },
          { id: 'depts', label: t('hr.org'), count: myDepts.length },
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
                  <th>{t('hr.name')}</th>
                  {activeBranch === 'all' && <th>{t('branch.label')}</th>}
                  <th>{t('hr.dept')}</th><th>{t('hr.title')}</th>
                  <th>{t('common.status')}</th><th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className={e.status === 'resigned' ? 'faded' : ''}>
                    <td><strong>{e.name}</strong><div className="muted small">{e.phone}</div></td>
                    {activeBranch === 'all' && <td>{bname(e.branch)}</td>}
                    <td>{dept(e.dept) || <span className="muted">{t('hr.noDept')}</span>}</td>
                    <td>{L(e.title)}</td>
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

      {tab === 'depts' && <Org />}
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

// Chi nhánh -> phòng ban -> nhân sự
function Org() {
  const { t, L, employees, departments, visibleBranchIds, allowedBranches, actions, notify, isStaff } = useApp()
  const [open, setOpen] = useState({})
  const [deptForm, setDeptForm] = useState(null) // null | { dept? , branch? }
  const [addTo, setAddTo] = useState(null) // phòng ban đang thêm nhân viên
  const branches = allowedBranches.filter((b) => visibleBranchIds.includes(b.id))
  const members = (id) => employees.filter((e) => e.dept === id && e.status !== 'resigned')

  return (
    <>
      <div className="org-actions">
        <p className="muted small">{t('org.sub')}</p>
        {!isStaff && <button className="btn" onClick={() => setDeptForm({ branch: branches[0]?.id })}><Plus size={16} aria-hidden /> {t('org.addDept')}</button>}
      </div>

      {branches.map((b) => {
        const depts = departments.filter((d) => d.branch === b.id)
        const unassigned = employees.filter((e) => e.branch === b.id && !e.dept && e.status !== 'resigned')
        return (
          <section key={b.id} className="panel org-branch">
            <h2>{L(b.name)} <span className="tab-count">{depts.length}</span></h2>
            <div className="table-wrap flat">
              <table>
                <thead><tr><th aria-label="expand" /><th>{t('hr.dept')}</th><th>{t('org.head')}</th><th className="num">{t('hr.headcount')}</th><th aria-label="actions" /></tr></thead>
                <tbody>
                  {depts.map((d) => {
                    const ms = members(d.id)
                    const isOpen = !!open[d.id]
                    const head = employees.find((e) => e.id === d.head)
                    return (
                      <Fragment key={d.id}>
                        <tr>
                          <td><button className="icon-btn" aria-expanded={isOpen} aria-label={L(d.name)} onClick={() => setOpen({ ...open, [d.id]: !isOpen })}>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td>
                          <td><strong>{L(d.name)}</strong></td>
                          <td>{head?.name || <span className="muted">—</span>}</td>
                          <td className="num">{ms.length}</td>
                          <td className="num actions">
                            {!isStaff && <>
                              <button className="btn btn-small" onClick={() => setAddTo(d)}><UserPlus size={14} aria-hidden /> {t('org.addMember')}</button>
                              <button className="icon-btn" onClick={() => setDeptForm({ dept: d })} aria-label={`${t('org.editDept')}: ${L(d.name)}`}><Pencil size={15} /></button>
                              <button
                                className="icon-btn danger"
                                aria-label={`${t('org.deleteDept')}: ${L(d.name)}`}
                                onClick={() => { if (window.confirm(t('org.deleteConfirm', { name: L(d.name), n: ms.length }))) { actions.deleteDepartment(d.id); notify(t('org.deleted')) } }}
                              ><Trash2 size={15} /></button>
                            </>}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="detail">
                            <td />
                            <td colSpan={4}>
                              {ms.length === 0 ? <span className="muted small">{t('org.empty')}</span> : (
                                <ul className="d-list tight">
                                  {ms.map((e) => (
                                    <li key={e.id}>
                                      <span><strong>{e.name}</strong> <span className="muted small">· {L(e.title)}</span></span>
                                      {!isStaff && <button className="btn btn-small" onClick={() => { actions.updateEmployee(e.id, { dept: '' }); notify(t('common.saved')) }}><UserMinus size={13} aria-hidden /> {t('org.remove')}</button>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                  {unassigned.length > 0 && (
                    <tr className="faded-row">
                      <td />
                      <td colSpan={4}><strong>{t('hr.noDept')}</strong> <span className="muted small">· {unassigned.map((e) => e.name).join(', ')}</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!depts.length && <Empty>{t('common.none')}</Empty>}
            </div>
          </section>
        )
      })}

      {deptForm && (
        <DeptForm
          {...deptForm}
          branches={branches}
          onClose={() => setDeptForm(null)}
          onSave={(data) => {
            if (deptForm.dept) actions.updateDepartment(deptForm.dept.id, data)
            else actions.addDepartment(data)
            setDeptForm(null)
            notify(t('common.saved'))
          }}
        />
      )}
      {addTo && <AddMembers dept={addTo} onClose={() => setAddTo(null)} />}
    </>
  )
}

function DeptForm({ dept, branch, branches, onClose, onSave }) {
  const { t, L, employees } = useApp()
  const [f, setF] = useState(() => ({ name: dept ? L(dept.name) : '', branch: dept?.branch || branch, head: dept?.head || '' }))
  const pool = employees.filter((e) => e.branch === f.branch && e.status !== 'resigned')
  return (
    <Modal
      title={dept ? t('org.editDept') : t('org.addDept')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" disabled={!f.name.trim()} onClick={() => onSave({ ...f, name: { vi: f.name.trim(), en: f.name.trim() } })}>{t('common.save')}</button>
      </>}
    >
      <label className="field"><span>{t('org.deptName')}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <div className="row2">
        <label className="field"><span>{t('branch.label')}</span>
          <select value={f.branch} disabled={!!dept} onChange={(e) => setF({ ...f, branch: e.target.value, head: '' })}>
            {branches.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}
          </select>
        </label>
        <label className="field"><span>{t('org.head')}</span>
          <select value={f.head} onChange={(e) => setF({ ...f, head: e.target.value })}>
            <option value="">—</option>
            {pool.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>
      </div>
    </Modal>
  )
}

function AddMembers({ dept, onClose }) {
  const { t, L, employees, departments, actions, notify } = useApp()
  const [picked, setPicked] = useState([])
  const pool = employees.filter((e) => e.branch === dept.branch && e.dept !== dept.id && e.status !== 'resigned')
  const toggle = (id) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id])
  return (
    <Modal
      title={`${t('org.addMember')}: ${L(dept.name)}`}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" disabled={!picked.length} onClick={() => { picked.forEach((id) => actions.updateEmployee(id, { dept: dept.id })); notify(t('common.saved')); onClose() }}>{t('org.addN', { n: picked.length })}</button>
      </>}
    >
      {pool.length === 0 ? <p className="muted">{t('org.noPool')}</p> : (
        <ul className="pick-list">
          {pool.map((e) => (
            <li key={e.id}>
              <label>
                <input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} />
                <span><strong>{e.name}</strong> <span className="muted small">· {L(e.title)}</span></span>
                <span className="muted small">{e.dept ? L(departments.find((d) => d.id === e.dept)?.name) : t('hr.noDept')}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

function EmployeeForm({ employee, defaultBranch, onClose, onSave }) {
  const { t, L, allowedBranches, departments } = useApp()
  const [f, setF] = useState(() => ({
    name: employee?.name || '',
    phone: employee?.phone || '',
    dept: employee?.dept || '',
    title: employee ? L(employee.title) : '',
    branch: employee?.branch || defaultBranch,
    base: employee?.base ?? 7000000,
    allowance: employee?.allowance ?? 0,
    status: employee?.status || 'active',
  }))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const num = (k) => (e) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) })
  const depts = departments.filter((d) => d.branch === f.branch)
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
        <label className="field"><span>{t('branch.label')}</span>
          <select value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value, dept: '' })}>{allowedBranches.map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}</select>
        </label>
        <label className="field"><span>{t('hr.dept')}</span>
          <select value={f.dept} onChange={set('dept')}>
            <option value="">{t('hr.noDept')}</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{L(d.name)}</option>)}
          </select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('hr.title')}</span><input value={f.title} onChange={set('title')} placeholder={t('hr.titleHint')} /></label>
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
