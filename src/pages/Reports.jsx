import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../store'
import { DriveField, DriveLink, Empty, Modal, PageHeader } from '../components/ui'
import { dayISO } from '../data'
import { sum, valid } from '../calc'

export default function Reports() {
  const { t, L, money, orders, products, reports, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [adding, setAdding] = useState(false)
  const from = dayISO(-29)
  const list = orders.filter((o) => visibleBranchIds.includes(o.branch) && valid(o) && o.date >= from)
  const bname = (id) => L(allowedBranches.find((b) => b.id === id)?.name)

  const byType = ['counter', 'preorder', 'custom'].map((k) => {
    const xs = list.filter((o) => o.type === k)
    return { k, n: xs.length, v: sum(xs, (o) => o.total) }
  })
  const byCat = {}
  list.forEach((o) => o.items.forEach((it) => {
    const p = products.find((x) => x.id === it.pid)
    byCat[p.cat] = (byCat[p.cat] || 0) + it.qty * p.price
  }))
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  const maxCat = cats[0]?.[1] || 1
  const docs = reports.filter((r) => visibleBranchIds.includes(r.branch))

  return (
    <>
      <PageHeader title={t('nav.reports')} sub={t('rep.sub')} />
      <div className="grid-2">
        <section className="panel">
          <h2>{t('rep.byType')}</h2>
          <table className="plain-table">
            <thead><tr><th>{t('orders.type')}</th><th className="num">{t('rep.orders')}</th><th className="num">{t('fin.revenue')}</th></tr></thead>
            <tbody>{byType.map((r) => <tr key={r.k}><td>{t(`otype.${r.k}`)}</td><td className="num">{r.n}</td><td className="num">{money(r.v)}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="panel">
          <h2>{t('rep.byCat')}</h2>
          <ul className="rank">
            {cats.map(([c, v]) => (
              <li key={c}><span>{t(`cat.${c}`)}</span><div className="rank-bar"><i style={{ width: `${(v / maxCat) * 100}%` }} /></div><strong>{money(v)}</strong></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('rep.docs')}</h2>
          <button className="btn btn-small" onClick={() => setAdding(true)}><Plus size={14} aria-hidden /> {t('rep.add')}</button>
        </div>
        <p className="muted small">{t('rep.docsNote')}</p>
        <div className="table-wrap flat">
          <table>
            <thead><tr><th>{t('rep.name')}</th>{activeBranch === 'all' && <th>{t('branch.label')}</th>}<th>{t('rep.period')}</th><th>{t('drive.label')}</th></tr></thead>
            <tbody>
              {docs.map((r) => (
                <tr key={r.id}><td><strong>{L(r.name)}</strong></td>{activeBranch === 'all' && <td>{bname(r.branch)}</td>}<td>{r.period}</td><td><DriveLink href={r.drive} /></td></tr>
              ))}
            </tbody>
          </table>
          {!docs.length && <Empty>{t('common.none')}</Empty>}
        </div>
      </section>

      {adding && (
        <ReportForm
          branch={activeBranch === 'all' ? visibleBranchIds[0] : activeBranch}
          onClose={() => setAdding(false)}
          onSave={(r) => { actions.addReport(r); setAdding(false); notify(t('common.saved')) }}
        />
      )}
    </>
  )
}

function ReportForm({ branch, onClose, onSave }) {
  const { t } = useApp()
  const [f, setF] = useState({ name: '', period: dayISO(0).slice(0, 7), drive: '' })
  return (
    <Modal
      title={t('rep.add')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button className="btn btn-primary" disabled={!f.name.trim()} onClick={() => onSave({ ...f, name: { vi: f.name, en: f.name }, branch })}>{t('common.save')}</button>
      </>}
    >
      <label className="field"><span>{t('rep.name')}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="field"><span>{t('rep.period')}</span><input type="month" value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} /></label>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
