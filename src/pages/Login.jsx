import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Crown, ShoppingBag, UserCog } from 'lucide-react'
import { useApp } from '../store'
import { branches } from '../data'
import { Brand } from '../components/Layout'

const icons = { owner: Crown, manager: UserCog, staff: ShoppingBag }

export default function Login() {
  const { t, L, lang, setLang, accounts, login } = useApp()
  const nav = useNavigate()
  const [id, setId] = useState('u2')
  const acc = accounts.find((a) => a.id === id)
  const [branch, setBranch] = useState(acc.branches[0])

  const pick = (a) => {
    setId(a.id)
    setBranch(a.role === 'owner' ? 'all' : a.branches[0])
  }

  const submit = (e) => {
    e.preventDefault()
    login(id, branch)
    nav(acc.role === 'staff' ? '/orders' : '/', { replace: true })
  }

  return (
    <div className="login">
      <div className="login-side">
        <Brand />
        <h1>{t('login.title')}</h1>
        <p>{t('login.sub')}</p>
      </div>
      <form className="login-form" onSubmit={submit}>
        <div className="seg login-lang" role="group" aria-label="Language">
          <button type="button" className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>VI</button>
          <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        </div>
        <h2>{t('auth.login')}</h2>
        <p className="muted">{t('login.demo')}</p>

        <fieldset className="accounts">
          <legend className="sr-only">{t('login.account')}</legend>
          {accounts.map((a) => {
            const Icon = icons[a.role]
            return (
              <label key={a.id} className={`account ${id === a.id ? 'on' : ''}`}>
                <input type="radio" name="acc" checked={id === a.id} onChange={() => pick(a)} />
                <Icon size={20} aria-hidden />
                <span>
                  <strong>{a.name}</strong>
                  <small>{t(`role.${a.role}`)} · {a.role === 'owner' ? t('branch.all') : a.branches.length + ' ' + t('branch.count')}</small>
                </span>
              </label>
            )
          })}
        </fieldset>

        <label className="field">
          <span>{t('branch.pick')}</span>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            {acc.role === 'owner' && <option value="all">{t('branch.all')}</option>}
            {acc.branches.map((b) => (
              <option key={b} value={b}>{L(branchName(b))}</option>
            ))}
          </select>
        </label>

        <button className="btn btn-primary btn-lg" type="submit">
          {t('auth.login')} <ArrowRight size={18} aria-hidden />
        </button>
      </form>
    </div>
  )
}

const branchName = (id) => branches.find((b) => b.id === id)?.name
