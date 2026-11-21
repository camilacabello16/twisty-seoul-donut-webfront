import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { useApp } from '../store'
import { Badge, DriveField, DriveLink, Empty, Modal, PageHeader, Tabs, statusTone } from '../components/ui'
import { dayISO } from '../data'

export default function Requests() {
  const { t, L, dateFmt, role, account, requests, employees, visibleBranchIds, activeBranch, actions, notify } = useApp()
  const [tab, setTab] = useState('all')
  const [adding, setAdding] = useState(false)
  const staff = role === 'staff'
  const me = employees.find((e) => e.name === account.name)
  const list = requests
    .filter((r) => visibleBranchIds.includes(r.branch) && (!staff || r.by === me?.id) && (tab === 'all' || r.status === tab))
  const pendingN = requests.filter((r) => visibleBranchIds.includes(r.branch) && r.status === 'pending' && (!staff || r.by === me?.id)).length

  return (
    <>
      <PageHeader
        title={t('nav.requests')}
        sub={staff ? t('req.subStaff') : t('req.sub')}
        actions={<button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden /> {t('req.new')}</button>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[{ id: 'all', label: t('common.all') }, { id: 'pending', label: t('rstatus.pending'), count: pendingN || null }, { id: 'approved', label: t('rstatus.approved') }, { id: 'rejected', label: t('rstatus.rejected') }]}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>{t('req.type')}</th>{!staff && <th>{t('req.by')}</th>}<th>{t('req.period')}</th><th>{t('req.reason')}</th><th>{t('drive.label')}</th><th>{t('common.status')}</th>{!staff && <th aria-label="actions" />}</tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td><strong>{t(`rtype.${r.type}`)}</strong></td>
                {!staff && <td>{employees.find((e) => e.id === r.by)?.name}</td>}
                <td>{dateFmt(r.from)}{r.to !== r.from && ` → ${dateFmt(r.to)}`}</td>
                <td className="clip">{L(r.reason)}</td>
                <td><DriveLink href={r.drive} /></td>
                <td><Badge tone={statusTone[r.status]}>{t(`rstatus.${r.status}`)}</Badge></td>
                {!staff && (
                  <td className="num actions">
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-small" onClick={() => { actions.decideRequest(r.id, 'approved'); notify(t('req.approvedMsg')) }}><Check size={14} aria-hidden /> {t('req.approve')}</button>
                        <button className="btn btn-small btn-danger" onClick={() => { actions.decideRequest(r.id, 'rejected'); notify(t('req.rejectedMsg')) }}><X size={14} aria-hidden /> {t('req.reject')}</button>
                      </>
                    )}
                  </td>
                )}
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
  const { t, employees } = useApp()
  const people = employees.filter((e) => e.branch === branch)
  const [f, setF] = useState({ type: 'leave', from: dayISO(1), to: dayISO(1), reason: '', drive: '', by: me?.id || people[0]?.id })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <Modal
      title={t('req.new')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" disabled={!f.reason.trim()} onClick={() => onSave({ ...f, branch, reason: { vi: f.reason, en: f.reason } })}>{t('req.send')}</button>
      </>}
    >
      {!staff && (
        <label className="field"><span>{t('req.by')}</span>
          <select value={f.by} onChange={set('by')}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
      )}
      <label className="field"><span>{t('req.type')}</span>
        <select value={f.type} onChange={set('type')}>{['leave', 'shift', 'purchase'].map((k) => <option key={k} value={k}>{t(`rtype.${k}`)}</option>)}</select>
      </label>
      <div className="row2">
        <label className="field"><span>{t('req.from')}</span><input type="date" value={f.from} onChange={set('from')} /></label>
        <label className="field"><span>{t('req.to')}</span><input type="date" min={f.from} value={f.to} onChange={set('to')} /></label>
      </div>
      <label className="field"><span>{t('req.reason')}</span><textarea rows={3} value={f.reason} onChange={set('reason')} /></label>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
