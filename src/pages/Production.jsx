import { CheckCheck, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Badge, Empty, PageHeader } from '../components/ui'

export default function Production() {
  const { t, L, production, products, visibleBranchIds, allowedBranches, activeBranch, actions, notify, ingStock, ingredients } = useApp()
  const rows = production.filter((r) => visibleBranchIds.includes(r.branch))
  const all = activeBranch === 'all'
  const bname = (id) => L(allowedBranches.find((b) => b.id === id).name)

  const record = (r, qty) => {
    const p = products.find((x) => x.id === r.pid)
    const short = Object.entries(p.recipe).find(([iid, q]) => (ingStock[r.branch][iid]?.qty || 0) < q * qty)
    if (short) {
      notify(t('prod.short', { name: L(ingredients.find((i) => i.id === short[0]).name) }))
      return
    }
    actions.recordProduction(r.id, qty)
    notify(t('prod.recorded'))
  }

  return (
    <>
      <PageHeader title={t('nav.production')} sub={t('prod.sub')} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('products.name')}</th>
              {all && <th>{t('branch.label')}</th>}
              <th className="num">{t('prod.planned')}</th>
              <th className="num">{t('prod.done')}</th>
              <th>{t('prod.progress')}</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = products.find((x) => x.id === r.pid)
              const left = r.planned - r.done
              const pct = Math.round((r.done / r.planned) * 100)
              return (
                <tr key={r.id}>
                  <td><strong>{L(p.name)}</strong></td>
                  {all && <td>{bname(r.branch)}</td>}
                  <td className="num">{r.planned}</td>
                  <td className="num">{r.done}</td>
                  <td>
                    <div className="meter" aria-label={`${pct}%`}><i style={{ width: `${pct}%` }} /></div>
                  </td>
                  <td className="num actions">
                    {left === 0 ? (
                      <Badge tone="ok"><CheckCheck size={12} aria-hidden /> {t('prod.complete')}</Badge>
                    ) : (
                      <>
                        <button className="btn btn-small" onClick={() => record(r, Math.min(10, left))}><Plus size={14} aria-hidden /> {Math.min(10, left)}</button>
                        <button className="btn btn-small" onClick={() => record(r, left)}>{t('prod.finishAll')}</button>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && <Empty>{t('common.none')}</Empty>}
      </div>
      <p className="note">{t('prod.note')}</p>
    </>
  )
}
