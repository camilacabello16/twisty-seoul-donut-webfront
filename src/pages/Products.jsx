import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../store'
import { Badge, Modal, PageHeader } from '../components/ui'
import { unitCostOf } from '../calc'

const CATS = ['bread', 'pastry', 'dessert', 'cookie', 'cake']

export default function Products() {
  const { t, L, money, products, ingredients, canEditCatalog, actions, notify } = useApp()
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState(null) // null | 'new' | product

  return (
    <>
      <PageHeader
        title={t('nav.products')}
        sub={t('products.sub')}
        actions={
          canEditCatalog
            ? <button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} aria-hidden /> {t('products.add')}</button>
            : <Badge tone="neutral"><Lock size={12} aria-hidden /> {t('products.readonly')}</Badge>
        }
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
              {canEditCatalog && <th aria-label="actions" />}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const cost = Math.round(unitCostOf(p, ingredients))
              const margin = p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0
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
                    <td className="num">{money(p.price)}</td>
                    <td className="num"><Badge tone={margin >= 60 ? 'ok' : margin >= 40 ? 'warn' : 'bad'}>{margin}%</Badge></td>
                    {canEditCatalog && (
                      <td className="num" onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => setForm(p)} aria-label={`${t('products.edit')}: ${L(p.name)}`}><Pencil size={15} /></button>
                      </td>
                    )}
                  </tr>
                  {isOpen && (
                    <tr className="detail">
                      <td />
                      <td colSpan={canEditCatalog ? 6 : 5}>
                        <strong className="small">{t('products.recipePer')}</strong>
                        <ul className="recipe">
                          {Object.entries(p.recipe).map(([id, q]) => {
                            const ing = ingredients.find((i) => i.id === id)
                            return <li key={id}><span>{L(ing?.name)}</span><span>{q} {ing?.unit}</span></li>
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

      {form && (
        <ProductForm
          product={form === 'new' ? null : form}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form === 'new') actions.addProduct(data)
            else actions.updateProduct(form.id, data)
            setForm(null)
            notify(t('products.sharedSaved'))
          }}
        />
      )}
    </>
  )
}

function ProductForm({ product, onClose, onSave }) {
  const { t, L, money, ingredients } = useApp()
  const [f, setF] = useState(() => ({
    name: product ? L(product.name) : '',
    cat: product?.cat || 'bread',
    price: product?.price ?? '',
    rows: product ? Object.entries(product.recipe).map(([ing, qty]) => ({ ing, qty })) : [{ ing: '', qty: '' }],
  }))
  const setRow = (i, patch) => setF({ ...f, rows: f.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) })
  const used = (i) => f.rows.filter((_, k) => k !== i).map((r) => r.ing)
  const valid = f.rows.filter((r) => r.ing && Number(r.qty) > 0)
  const recipe = Object.fromEntries(valid.map((r) => [r.ing, Number(r.qty)]))
  const cost = Math.round(unitCostOf({ recipe }, ingredients))
  const price = Number(f.price) || 0
  const margin = price ? Math.round(((price - cost) / price) * 100) : null

  return (
    <Modal
      wide
      title={product ? t('products.edit') : t('products.add')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          disabled={!f.name.trim() || price <= 0 || valid.length === 0}
          onClick={() => onSave({ name: { vi: f.name.trim(), en: f.name.trim() }, cat: f.cat, price, recipe })}
        >{t('common.save')}</button>
      </>}
    >
      <div className="row2">
        <label className="field"><span>{t('products.name')}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="field"><span>{t('products.cat')}</span>
          <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{CATS.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}</select>
        </label>
      </div>
      <label className="field"><span>{t('products.price')} (₫)</span><input type="number" min="0" step="1000" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>

      <fieldset className="recipe-edit">
        <legend>{t('products.recipePer')}</legend>
        {f.rows.map((r, i) => {
          const ing = ingredients.find((x) => x.id === r.ing)
          return (
            <div key={i} className="recipe-row">
              <select value={r.ing} onChange={(e) => setRow(i, { ing: e.target.value })} aria-label={t('inv.item')}>
                <option value="">{t('products.pickIng')}</option>
                {ingredients.filter((x) => !used(i).includes(x.id)).map((x) => <option key={x.id} value={x.id}>{L(x.name)}</option>)}
              </select>
              <input type="number" min="0" step="any" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value })} placeholder={t('products.qty')} aria-label={t('products.qty')} />
              <span className="muted">{ing?.unit || ''}</span>
              <button className="icon-btn danger" onClick={() => setF({ ...f, rows: f.rows.length > 1 ? f.rows.filter((_, k) => k !== i) : [{ ing: '', qty: '' }] })} aria-label={t('products.removeRow')}><Trash2 size={15} /></button>
            </div>
          )
        })}
        <button type="button" className="btn btn-small" onClick={() => setF({ ...f, rows: [...f.rows, { ing: '', qty: '' }] })} disabled={f.rows.length >= ingredients.length}><Plus size={14} aria-hidden /> {t('products.addIng')}</button>
      </fieldset>

      <p className="note">{t('products.costLine', { cost: money(cost), margin: margin == null ? '—' : `${margin}%` })}</p>
    </Modal>
  )
}
