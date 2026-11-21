import { useState } from 'react'
import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { useApp } from '../store'
import { Badge, Empty, PageHeader, statusTone } from '../components/ui'
import { dayISO } from '../data'

export default function Orders() {
  const { role } = useApp()
  const [creating, setCreating] = useState(false)
  if (role === 'staff') return <NewOrder staff onDone={() => {}} />
  return creating ? <NewOrder onDone={() => setCreating(false)} /> : <OrderList onCreate={() => setCreating(true)} />
}

function OrderList({ onCreate }) {
  const { t, L, money, dateFmt, orders, products, employees, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')
  const all = activeBranch === 'all'
  const list = orders
    .filter((o) => visibleBranchIds.includes(o.branch) && (type === 'all' || o.type === type) && (!q || o.id.toLowerCase().includes(q.toLowerCase())))
    .slice(0, 40)
  const bname = (id) => L(allowedBranches.find((b) => b.id === id).name)

  return (
    <>
      <PageHeader
        title={t('nav.orders')}
        sub={t('orders.sub')}
        actions={<button className="btn btn-primary" onClick={onCreate}><Plus size={16} aria-hidden /> {t('orders.new')}</button>}
      />
      <div className="toolbar">
        <div className="chips" role="group" aria-label={t('orders.type')}>
          {['all', 'counter', 'preorder', 'custom'].map((k) => (
            <button key={k} className={type === k ? 'on' : ''} onClick={() => setType(k)}>{k === 'all' ? t('common.all') : t(`otype.${k}`)}</button>
          ))}
        </div>
        <input className="search" type="search" placeholder={t('orders.search')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('orders.search')} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('orders.id')}</th><th>{t('orders.time')}</th>{all && <th>{t('branch.label')}</th>}
              <th>{t('orders.type')}</th><th>{t('orders.items')}</th><th className="num">{t('orders.total')}</th><th>{t('common.status')}</th><th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.id}</strong></td>
                <td>{dateFmt(o.date)} {o.time}<div className="muted small">{employees.find((e) => e.id === o.by)?.name}</div></td>
                {all && <td>{bname(o.branch)}</td>}
                <td><Badge tone={o.type === 'counter' ? 'neutral' : 'info'}>{t(`otype.${o.type}`)}</Badge></td>
                <td className="clip">{o.items.map((it) => `${it.qty}× ${L(products.find((p) => p.id === it.pid).name)}`).join(', ')}</td>
                <td className="num"><strong>{money(o.total)}</strong></td>
                <td><Badge tone={statusTone[o.status]}>{t(`ostatus.${o.status}`)}</Badge></td>
                <td className="num">
                  {o.status !== 'cancelled' && o.date === dayISO(0) && (
                    <button className="btn btn-small" onClick={() => { actions.cancelOrder(o.id); notify(t('orders.cancelled')) }}>{t('common.cancel')}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <Empty>{t('common.none')}</Empty>}
      </div>
    </>
  )
}

function NewOrder({ staff, onDone }) {
  const { t, L, money, products, prodStock, orders, account, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [branch, setBranch] = useState(activeBranch === 'all' ? visibleBranchIds[0] : activeBranch)
  const [cart, setCart] = useState({})
  const [type, setType] = useState('counter')
  const [pickup, setPickup] = useState('')
  const [note, setNote] = useState('')
  const [lastId, setLastId] = useState(null)
  const b = activeBranch === 'all' ? branch : activeBranch

  const stock = (pid) => prodStock[b][pid] ?? 0
  const items = Object.entries(cart).filter(([, q]) => q > 0).map(([pid, qty]) => ({ pid, qty }))
  const total = items.reduce((s, it) => s + it.qty * products.find((p) => p.id === it.pid).price, 0)
  const add = (pid, d) => {
    const next = Math.max(0, (cart[pid] || 0) + d)
    if (type === 'counter' && next > stock(pid)) return notify(t('orders.noStock'))
    setCart({ ...cart, [pid]: next })
  }
  const submit = () => {
    const id = actions.addOrder({ branch: b, type, items, total, note: [pickup && `${t('orders.pickup')}: ${pickup}`, note].filter(Boolean).join(' · ') })
    setCart({}); setNote(''); setPickup(''); setLastId(id)
    notify(t('orders.created', { id }))
    if (!staff) onDone()
  }

  const mine = orders.filter((o) => o.branch === b && o.date === dayISO(0)).slice(0, 5)

  return (
    <>
      <PageHeader
        title={staff ? t('orders.counterTitle') : t('orders.new')}
        sub={staff ? t('orders.counterSub', { name: account.name }) : undefined}
        actions={!staff && <button className="btn btn-ghost" onClick={onDone}>{t('common.back')}</button>}
      />
      <div className="pos">
        <section aria-label={t('nav.products')}>
          <div className="pos-grid">
            {products.map((p) => {
              const st = stock(p.id)
              const disabled = type === 'counter' && st === 0
              return (
                <button key={p.id} className={`pos-item ${cart[p.id] ? 'in' : ''}`} disabled={disabled} onClick={() => add(p.id, 1)}>
                  <span className="pos-name">{L(p.name)}</span>
                  <span className="pos-price">{money(p.price)}</span>
                  <span className={`pos-stock ${st < 5 ? 'low' : ''}`}>{disabled ? t('inv.soldOut') : t('orders.inStock', { n: st })}</span>
                  {cart[p.id] > 0 && <span className="pos-qty">{cart[p.id]}</span>}
                </button>
              )
            })}
          </div>
        </section>

        <aside className="cart" aria-label={t('orders.cart')}>
          <h2><ShoppingBasket size={18} aria-hidden /> {t('orders.cart')}</h2>
          {!staff && (
            <div className="row2">
              <label className="field"><span>{t('orders.type')}</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>{['counter', 'preorder', 'custom'].map((k) => <option key={k} value={k}>{t(`otype.${k}`)}</option>)}</select>
              </label>
              {activeBranch === 'all' && (
                <label className="field"><span>{t('branch.label')}</span>
                  <select value={branch} onChange={(e) => { setBranch(e.target.value); setCart({}) }}>{allowedBranches.map((x) => <option key={x.id} value={x.id}>{L(x.name)}</option>)}</select>
                </label>
              )}
            </div>
          )}
          {type !== 'counter' && (
            <label className="field"><span>{t('orders.pickup')}</span><input type="date" min={dayISO(0)} value={pickup} onChange={(e) => setPickup(e.target.value)} /></label>
          )}
          {items.length === 0 ? (
            <p className="muted cart-empty">{t('orders.cartEmpty')}</p>
          ) : (
            <ul className="cart-lines">
              {items.map((it) => {
                const p = products.find((x) => x.id === it.pid)
                return (
                  <li key={it.pid}>
                    <span className="cl-name">{L(p.name)}</span>
                    <span className="stepper">
                      <button className="icon-btn" onClick={() => add(it.pid, -1)} aria-label="−"><Minus size={14} /></button>
                      <b>{it.qty}</b>
                      <button className="icon-btn" onClick={() => add(it.pid, 1)} aria-label="+"><Plus size={14} /></button>
                    </span>
                    <span className="cl-sum">{money(it.qty * p.price)}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <label className="field"><span>{t('orders.note')}</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('orders.notePh')} /></label>
          <div className="cart-total"><span>{t('orders.total')}</span><strong>{money(total)}</strong></div>
          <div className="cart-actions">
            <button className="btn btn-ghost" disabled={!items.length} onClick={() => setCart({})}><Trash2 size={16} aria-hidden /> {t('orders.clear')}</button>
            <button className="btn btn-primary" disabled={!items.length || (type !== 'counter' && !pickup)} onClick={submit}>{t('orders.create')}</button>
          </div>
          <p className="muted small">{t('orders.noPayment')}</p>
        </aside>
      </div>

      {staff && (
        <section className="panel">
          <h2>{t('orders.todayList')}</h2>
          {lastId && <p className="note">{t('orders.created', { id: lastId })}</p>}
          <ul className="plain">
            {mine.map((o) => (
              <li key={o.id}><strong>{o.id}</strong> <span className="muted">{o.time}</span> <span>{money(o.total)}</span> <Badge tone={statusTone[o.status]}>{t(`ostatus.${o.status}`)}</Badge></li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
