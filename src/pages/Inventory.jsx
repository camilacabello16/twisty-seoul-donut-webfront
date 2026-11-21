import { useState } from 'react'
import { PackagePlus } from 'lucide-react'
import { useApp } from '../store'
import { Badge, Modal, PageHeader, Tabs } from '../components/ui'
import { dayISO, suppliers } from '../data'

const daysTo = (iso) => Math.round((new Date(iso) - new Date(dayISO(0))) / 86400000)

export default function Inventory() {
  const { t, L, dateFmt, ingStock, prodStock, ingredients, products, visibleBranchIds, allowedBranches, activeBranch } = useApp()
  const [tab, setTab] = useState('ing')
  const [importing, setImporting] = useState(null)
  const all = activeBranch === 'all'
  const bname = (id) => L(allowedBranches.find((b) => b.id === id).name)

  const rows = visibleBranchIds.flatMap((b) => ingredients.map((ing) => ({ b, ing, ...ingStock[b][ing.id] })))
  const warnCount = rows.filter((r) => r.qty < r.ing.min || daysTo(r.expiry) <= 3).length

  return (
    <>
      <PageHeader title={t('nav.inventory')} sub={t('inv.sub')} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'ing', label: t('inv.ingredients'), count: warnCount || null },
          { id: 'fin', label: t('inv.finished') },
          { id: 'sup', label: t('inv.suppliers'), count: suppliers.length },
        ]}
      />

      {tab === 'ing' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('inv.item')}</th>
                {all && <th>{t('branch.label')}</th>}
                <th className="num">{t('inv.qty')}</th>
                <th className="num">{t('inv.min')}</th>
                <th>{t('inv.expiry')}</th>
                <th>{t('common.status')}</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const low = r.qty < r.ing.min
                const d = daysTo(r.expiry)
                return (
                  <tr key={r.b + r.ing.id}>
                    <td><strong>{L(r.ing.name)}</strong></td>
                    {all && <td>{bname(r.b)}</td>}
                    <td className="num">{r.qty} {r.ing.unit}</td>
                    <td className="num muted">{r.ing.min} {r.ing.unit}</td>
                    <td>{dateFmt(r.expiry)}</td>
                    <td>
                      {low && <Badge tone="bad">{t('inv.low')}</Badge>}{' '}
                      {d <= 3 && <Badge tone="warn">{d <= 0 ? t('inv.expired') : t('inv.expSoon', { n: d })}</Badge>}
                      {!low && d > 3 && <Badge tone="ok">{t('inv.ok')}</Badge>}
                    </td>
                    <td className="num">
                      <button className="btn btn-small" onClick={() => setImporting(r)}><PackagePlus size={14} aria-hidden /> {t('inv.import')}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fin' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('products.name')}</th>{all && <th>{t('branch.label')}</th>}<th className="num">{t('inv.qty')}</th><th>{t('common.status')}</th></tr></thead>
            <tbody>
              {visibleBranchIds.flatMap((b) =>
                products.map((p) => {
                  const q = prodStock[b][p.id] ?? 0
                  return (
                    <tr key={b + p.id}>
                      <td><strong>{L(p.name)}</strong></td>
                      {all && <td>{bname(b)}</td>}
                      <td className="num">{q}</td>
                      <td>{q === 0 ? <Badge tone="bad">{t('inv.soldOut')}</Badge> : q < 5 ? <Badge tone="warn">{t('inv.fewLeft')}</Badge> : <Badge tone="ok">{t('inv.ok')}</Badge>}</td>
                    </tr>
                  )
                }),
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sup' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('inv.supplier')}</th><th>{t('inv.supplies')}</th><th>{t('inv.phone')}</th></tr></thead>
            <tbody>
              {suppliers.map((s) => <tr key={s.id}><td><strong>{s.name}</strong></td><td>{L(s.items)}</td><td>{s.phone}</td></tr>)}
            </tbody>
          </table>
          <p className="note">{t('inv.sharedNote')}</p>
        </div>
      )}

      {importing && <ImportModal row={importing} onClose={() => setImporting(null)} />}
    </>
  )
}

function ImportModal({ row, onClose }) {
  const { t, L, actions, notify } = useApp()
  const [qty, setQty] = useState('')
  const [expiry, setExpiry] = useState(dayISO(14))
  const n = Number(qty)
  return (
    <Modal
      title={`${t('inv.import')}: ${L(row.ing.name)}`}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary" disabled={!(n > 0)}
          onClick={() => { actions.importStock(row.b, row.ing.id, n, expiry); notify(t('inv.imported')); onClose() }}
        >{t('inv.import')}</button>
      </>}
    >
      <div className="row2">
        <label className="field"><span>{t('inv.qty')} ({row.ing.unit})</span><input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
        <label className="field"><span>{t('inv.expiry')}</span><input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></label>
      </div>
      <p className="muted small">{t('inv.supplier')}: {suppliers.find((s) => s.id === row.ing.supplier).name}</p>
    </Modal>
  )
}
