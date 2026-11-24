import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { useApp } from '../store'
import { Badge, DriveField, DriveLink, Empty, Modal, PageHeader, Tabs, statusTone } from '../components/ui'
import { dayISO } from '../data'

export default function Requests() {
  const { t, L, dateFmt, role, account, accounts, requests, employees, visibleBranchIds, activeBranch, actions, notify } = useApp()
  const staff = role === 'staff'
  const [tab, setTab] = useState('all')
  const [scope, setScope] = useState('inbox') // inbox | mine | all (không áp dụng cho nhân viên)
  const [adding, setAdding] = useState(false)
  const me = employees.find((e) => e.name === account.name)
  const nameOf = (id) => employees.find((e) => e.id === id)?.name
  const approverName = (id) => accounts.find((a) => a.id === id)?.name || '—'
  const canDecide = (r) => r.status === 'pending' && (r.approver === account.id || role === 'owner')

  const inScope = (r) => {
    if (!visibleBranchIds.includes(r.branch)) return false
    if (staff) return r.by === me?.id
    if (scope === 'inbox') return r.approver === account.id
    if (scope === 'mine') return r.by === me?.id
    return true
  }
  const scoped = requests.filter(inScope)
  const list = scoped.filter((r) => tab === 'all' || r.status === tab)
  const pendingN = scoped.filter((r) => r.status === 'pending').length
  const inboxPending = requests.filter((r) => visibleBranchIds.includes(r.branch) && r.approver === account.id && r.status === 'pending').length

  return (
    <>
      <PageHeader
        title={t('nav.requests')}
        sub={staff ? t('req.subStaff') : t('req.sub')}
        actions={<button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden /> {t('req.new')}</button>}
      />
      {!staff && (
        <div className="chips" role="group" aria-label={t('req.scope')}>
          <button className={scope === 'inbox' ? 'on' : ''} onClick={() => setScope('inbox')}>{t('req.inbox')}{inboxPending > 0 && <span className="tab-count">{inboxPending}</span>}</button>
          <button className={scope === 'mine' ? 'on' : ''} onClick={() => setScope('mine')}>{t('req.mine')}</button>
          <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>{t('req.allBranches')}</button>
        </div>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[{ id: 'all', label: t('common.all') }, { id: 'pending', label: t('rstatus.pending'), count: pendingN || null }, { id: 'approved', label: t('rstatus.approved') }, { id: 'rejected', label: t('rstatus.rejected') }]}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('req.type')}</th>{!staff && <th>{t('req.by')}</th>}<th>{t('req.period')}</th><th>{t('req.reason')}</th>
              <th>{t('req.approver')}</th><th>{t('drive.label')}</th><th>{t('common.status')}</th><th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td><strong>{t(`rtype.${r.type}`)}</strong></td>
                {!staff && <td>{nameOf(r.by)}</td>}
                <td style={{ whiteSpace: 'nowrap' }}>{dateFmt(r.from)}{r.to !== r.from && ` → ${dateFmt(r.to)}`}</td>
                <td className="clip">{L(r.reason)}</td>
                <td>{approverName(r.approver)}</td>
                <td><DriveLink href={r.drive} /></td>
                <td>
                  <Badge tone={statusTone[r.status]}>{t(`rstatus.${r.status}`)}</Badge>
                  {r.decidedBy && <div className="muted small">{r.decidedBy} · {dateFmt(r.decidedAt)}</div>}
                </td>
                <td className="num actions">
                  {canDecide(r) && (
                    <>
                      <button className="btn btn-small" onClick={() => { actions.decideRequest(r.id, 'approved'); notify(t('req.approvedMsg')) }}><Check size={14} aria-hidden /> {t('req.approve')}</button>
                      <button className="btn btn-small btn-danger" onClick={() => { actions.decideRequest(r.id, 'rejected'); notify(t('req.rejectedMsg')) }}><X size={14} aria-hidden /> {t('req.reject')}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <Empty>{t('common.none')}</Empty>}
      </div>

      {adding && (
        <RequestForm
          staff={staff}
          me={me}
          branch={activeBranch === 'all' ? visibleBranchIds[0] : activeBranch}
          onClose={() => setAdding(false)}
          onSave={(r) => { actions.addRequest(r); setAdding(false); notify(t('req.sent')) }}
        />
      )}
    </>
  )
}

function RequestForm({ staff, me, branch, onClose, onSave }) {
  const { t, employees, accounts, account } = useApp()
  const people = employees.filter((e) => e.branch === branch)
  // Người duyệt: quản lý chung hoặc quản lý của chi nhánh này (không tự duyệt đơn của mình)
  const approvers = accounts.filter((a) => a.id !== account.id && (a.role === 'owner' || (a.role === 'manager' && a.branches.includes(branch))))
  const [f, setF] = useState({ type: 'leave', from: dayISO(1), to: dayISO(1), reason: '', drive: '', by: me?.id || people[0]?.id, approver: approvers[0]?.id || '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <Modal
      title={t('req.new')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" disabled={!f.reason.trim() || !f.approver} onClick={() => onSave({ ...f, branch, reason: { vi: f.reason, en: f.reason } })}>{t('req.send')}</button>
      </>}
    >
      {!staff && (
        <label className="field"><span>{t('req.by')}</span>
          <select value={f.by} onChange={set('by')}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
      )}
      <div className="row2">
        <label className="field"><span>{t('req.type')}</span>
          <select value={f.type} onChange={set('type')}>{['leave', 'shift', 'purchase'].map((k) => <option key={k} value={k}>{t(`rtype.${k}`)}</option>)}</select>
        </label>
        <label className="field"><span>{t('req.approver')}</span>
          <select value={f.approver} onChange={set('approver')}>
            {approvers.length === 0 && <option value="">—</option>}
            {approvers.map((a) => <option key={a.id} value={a.id}>{a.name} · {t(`role.${a.role}`)}</option>)}
          </select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('req.from')}</span><input type="date" value={f.from} onChange={set('from')} /></label>
        <label className="field"><span>{t('req.to')}</span><input type="date" min={f.from} value={f.to} onChange={set('to')} /></label>
      </div>
      <label className="field"><span>{t('req.reason')}</span><textarea rows={3} value={f.reason} onChange={set('reason')} /></label>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
