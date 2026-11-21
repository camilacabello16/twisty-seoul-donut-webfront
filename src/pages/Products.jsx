import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { useApp } from '../store'
import { Badge, PageHeader } from '../components/ui'
import { ingredients } from '../data'
import { unitCost } from '../calc'

export default function Products() {
  const { t, L, money, products, canEditCatalog, actions, notify } = useApp()
  const [open, setOpen] = useState(null)

  return (
    <>
      <PageHeader
        title={t('nav.products')}
        sub={t('products.sub')}
        actions={<Badge tone={canEditCatalog ? 'ok' : 'neutral'}>{canEditCatalog ? t('products.canEdit') : <><Lock size={12} aria-hidden /> {t('products.readonly')}</>}</Badge>}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th aria-label="expand" />
              <th>{t('products.name')}</th>
              <th>{t('products.cat')}</th>
              <th className="num">{t('products.cost')}</th>
              <th className="num">{t('products.price')}</th>
              <th className="num">{t('products.margin')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cost = Math.round(unitCost(p.id))
              const margin = Math.round(((p.price - cost) / p.price) * 100)
              const isOpen = open === p.id
              return (
                <Fragment key={p.id}>
                  <tr className="clickable" onClick={() => setOpen(isOpen ? null : p.id)}>
                    <td>
                      <button className="icon-btn" aria-expanded={isOpen} aria-label={t('products.recipe')}>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td><strong>{L(p.name)}</strong></td>
                    <td>{t(`cat.${p.cat}`)}</td>
                    <td className="num">{money(cost)}</td>
                    <td className="num" onClick={(e) => e.stopPropagation()}>
                      {canEditCatalog ? (
                        <input
                          className="mini wide" type="number" min="0" step="1000" value={p.price}
                          aria-label={`${t('products.price')} ${L(p.name)}`}
                          onChange={(e) => actions.setPrice(p.id, Number(e.target.value) || 0)}
                          onBlur={() => notify(t('products.sharedSaved'))}
                        />
                      ) : money(p.price)}
                    </td>
                    <td className="num"><Badge tone={margin >= 60 ? 'ok' : margin >= 40 ? 'warn' : 'bad'}>{margin}%</Badge></td>
                  </tr>
                  {isOpen && (
                    <tr className="detail">
                      <td />
                      <td colSpan={5}>
                        <strong className="small">{t('products.recipePer')}</strong>
                        <ul className="recipe">
                          {Object.entries(p.recipe).map(([id, q]) => {
                            const ing = ingredients.find((i) => i.id === id)
                            return <li key={id}><span>{L(ing.name)}</span><span>{q} {ing.unit}</span></li>
                          })}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
