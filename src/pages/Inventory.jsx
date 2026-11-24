import { useMemo, useState } from 'react'
import { PackagePlus, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Badge, Empty, Modal, PageHeader, Tabs } from '../components/ui'
import { dayISO, parseISO } from '../data'

const daysTo = (iso) => (iso ? Math.round((parseISO(iso) - parseISO(dayISO(0))) / 86400000) : Infinity)
const UNITS = ['kg', 'g', 'lít', 'quả', 'gói', 'hộp']

export default function Inventory() {
  const { t, L, dateFmt, ingStock, prodStock, ingredients, products, stockLog, visibleBranchIds, allowedBranches, activeBranch } = useApp()
  const [tab, setTab] = useState('ing')
  const [importing, setImporting] = useState(null)
  const [creating, setCreating] = useState(false)
  const all = activeBranch === 'all'
  const bname = (id) => L(allowedBranches.find((b) => b.id === id).name)

  const rows = visibleBranchIds.flatMap((b) => ingredients.map((ing) => ({ b, ing, ...(ingStock[b]?.[ing.id] || { qty: 0, expiry: '' }) })))
  const warnCount = rows.filter((r) => r.qty < r.ing.min || daysTo(r.expiry) <= 3).length
  const history = useMemo(
    () => stockLog.filter((s) => visibleBranchIds.includes(s.branch)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
    [stockLog, visibleBranchIds],
  )

  return (
    <>
      <PageHeader
        title={t('nav.inventory')}
        sub={t('inv.sub')}
        actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={16} aria-hidden /> {t('inv.create')}</button>}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'ing', label: t('inv.ingredients'), count: warnCount || null },
          { id: 'fin', label: t('inv.finished') },
          { id: 'log', label: t('inv.history') },
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
                    <td>{r.expiry ? dateFmt(r.expiry) : <span className="muted">—</span>}</td>
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
                  const q = prodStock[b]?.[p.id] ?? 0
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

      {tab === 'log' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('inv.date')}</th><th>{t('inv.item')}</th>{all && <th>{t('branch.label')}</th>}<th className="num">{t('inv.qtyIn')}</th><th>{t('inv.supplier')}</th></tr></thead>
            <tbody>
              {history.map((s) => {
                const ing = ingredients.find((i) => i.id === s.ing)
                return (
                  <tr key={s.id}>
                    <td>{dateFmt(s.date)}</td>
                    <td><strong>{L(ing?.name)}</strong></td>
                    {all && <td>{bname(s.branch)}</td>}
                    <td className="num">{s.qty} {ing?.unit}</td>
                    <td>{s.supplier || <span className="muted">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!history.length && <Empty>{t('common.none')}</Empty>}
        </div>
      )}

      {importing && <ImportModal row={importing} onClose={() => setImporting(null)} />}
      {creating && <CreateIngredient onClose={() => setCreating(false)} />}
    </>
  )
}

function ImportModal({ row, onClose }) {
  const { t, L, actions, notify, stockLog } = useApp()
  const [qty, setQty] = useState('')
  const [expiry, setExpiry] = useState(dayISO(14))
  const [supplier, setSupplier] = useState('')
  const n = Number(qty)
  // Gợi ý nhà cung cấp từ các lần nhập trước; vẫn cho nhập tay tên bất kỳ
  const past = [...new Set(stockLog.filter((s) => s.ing === row.ing.id && s.supplier).map((s) => s.supplier))]
  return (
    <Modal
      title={`${t('inv.import')}: ${L(row.ing.name)}`}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary" disabled={!(n > 0)}
          onClick={() => { actions.importStock(row.b, row.ing.id, n, expiry, supplier.trim()); notify(t('inv.imported')); onClose() }}
        >{t('inv.import')}</button>
      </>}
    >
      <div className="row2">
        <label className="field"><span>{t('inv.qtyIn')} ({row.ing.unit})</span><input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} /></label>
        <label className="field"><span>{t('inv.expiry')}</span><input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></label>
      </div>
      <label className="field"><span>{t('inv.supplier')}</span>
        <input list="suppliers" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder={t('inv.supplierPh')} />
        <datalist id="suppliers">{past.map((s) => <option key={s} value={s} />)}</datalist>
      </label>
    </Modal>
  )
}

function CreateIngredient({ onClose }) {
  const { t, actions, notify } = useApp()
  const [f, setF] = useState({ name: '', unit: 'kg', min: '', cost: '' })
  return (
    <Modal
      title={t('inv.create')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          disabled={!f.name.trim() || !f.unit.trim()}
          onClick={() => {
            actions.addIngredient({ name: { vi: f.name.trim(), en: f.name.trim() }, unit: f.unit.trim(), min: Number(f.min) || 0, cost: Number(f.cost) || 0 })
            notify(t('inv.created'))
            onClose()
          }}
        >{t('common.save')}</button>
      </>}
    >
      <label className="field"><span>{t('inv.ingName')}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <div className="row3">
        <label className="field"><span>{t('inv.unit')}</span>
          <input list="units" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
          <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
        </label>
        <label className="field"><span>{t('inv.min')}</span><input type="number" min="0" step="any" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></label>
        <label className="field"><span>{t('inv.cost')} (₫)</span><input type="number" min="0" step="1000" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} /></label>
      </div>
      <p className="muted small">{t('inv.createNote')}</p>
    </Modal>
  )
}
