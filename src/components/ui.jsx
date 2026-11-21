import { useEffect, useRef } from 'react'
import { ExternalLink, Link2, X } from 'lucide-react'
import { useApp } from '../store'

export function PageHeader({ title, sub, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export const Badge = ({ tone = 'neutral', children }) => <span className={`badge badge-${tone}`}>{children}</span>

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }) {
  const ref = useRef(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector('input, select, textarea, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export const Empty = ({ children }) => <div className="empty">{children}</div>

export function BarChart({ data, format, height = 180, highlightLast = true }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="bars" style={{ height }} role="img" aria-label="chart">
      {data.map((d, i) => (
        <div key={d.label + i} className="bar-col">
          <span className="bar-val">{d.value ? format(d.value) : ''}</span>
          <div className="bar-track">
            <div className={`bar ${highlightLast && i === data.length - 1 ? 'is-last' : ''}`} style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Field lưu liên kết Google Drive (thay cho tích hợp Word/Excel)
export function DriveField({ value, onChange, label }) {
  const { t } = useApp()
  return (
    <label className="field">
      <span>{label || t('drive.label')}</span>
      <div className="input-icon">
        <Link2 size={16} aria-hidden />
        <input type="url" placeholder="https://drive.google.com/..." value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  )
}

export function DriveLink({ href }) {
  const { t } = useApp()
  if (!href) return <span className="muted">—</span>
  return (
    <a className="link" href={href} target="_blank" rel="noreferrer">
      {t('drive.open')} <ExternalLink size={13} aria-hidden />
    </a>
  )
}

export const statusTone = { pending: 'warn', approved: 'ok', rejected: 'bad', done: 'ok', cancelled: 'bad', doing: 'info', todo: 'neutral' }
