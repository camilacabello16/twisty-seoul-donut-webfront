import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Boxes, CalendarCheck2, CalendarDays, ChefHat, ClipboardList, Cookie, FileText, FolderKanban, KanbanSquare, LayoutDashboard, LogOut, Menu, Receipt, Settings, Store, Users, Wallet, X,
} from 'lucide-react'
import { useApp } from '../store'

// roles: owner = Quản lý chung, manager = Quản lý chi nhánh, staff = Nhân viên
// hidden: true = tạm ẩn khỏi menu (đơn hàng, tài chính, báo cáo); bỏ cờ này để bật lại
export const NAV = [
  { to: '/', key: 'nav.dashboard', icon: LayoutDashboard, roles: ['owner', 'manager'], end: true },
  { to: '/projects', key: 'nav.projects', icon: FolderKanban, roles: ['owner', 'manager', 'staff'] },
  { to: '/calendar', key: 'nav.calendar', icon: CalendarDays, roles: ['owner', 'manager', 'staff'] },
  { to: '/tasks', key: 'nav.tasks', icon: KanbanSquare, roles: ['owner', 'manager', 'staff'] },
  { to: '/hr', key: 'nav.hr', icon: Users, roles: ['owner', 'manager'] },
  { to: '/products', key: 'nav.products', icon: Cookie, roles: ['owner', 'manager', 'staff'] },
  { to: '/inventory', key: 'nav.inventory', icon: Boxes, roles: ['owner', 'manager', 'staff'] },
  { to: '/production', key: 'nav.production', icon: ChefHat, roles: ['owner', 'manager', 'staff'] },
  { to: '/orders', key: 'nav.orders', icon: Receipt, roles: ['owner', 'manager'], hidden: true },
  { to: '/finance', key: 'nav.finance', icon: Wallet, roles: ['owner', 'manager'], hidden: true },
  { to: '/requests', key: 'nav.requests', icon: ClipboardList, roles: ['owner', 'manager', 'staff'] },
  { to: '/reports', key: 'nav.reports', icon: FileText, roles: ['owner', 'manager'], hidden: true },
  { to: '/settings', key: 'nav.settings', icon: Settings, roles: ['owner', 'manager'] },
]

export function Brand({ mark }) {
  if (mark) {
    return (
      <div className="brand-mark" aria-label="Twisty Seoul">
        <img src="/image/brand-mark.png" alt="Twisty Seoul" />
      </div>
    )
  }
  return (
    <div className="brand-crop" aria-label="Twisty Seoul">
      <img src="/image/brand-logo.jpeg" alt="Twisty Seoul, where sweet moments begin" />
    </div>
  )
}

export default function Layout() {
  const { t, L, lang, setLang, account, role, logout, allowedBranches, canViewAll, activeBranch, setBranch, toast, requests, visibleBranchIds } = useApp()
  const [open, setOpen] = useState(false)
  const items = NAV.filter((n) => !n.hidden && n.roles.includes(role))
  const pendingApprovals = requests.filter((r) => r.status === 'pending' && r.approver === account.id && visibleBranchIds.includes(r.branch)).length

  return (
    <div className="shell">
      <aside className={`rail ${open ? 'open' : ''}`}>
        <div className="rail-top">
          <Brand mark />
          <button className="icon-btn rail-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Main">
          {items.map(({ to, key, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} aria-hidden />
              <span>{t(key)}</span>
              {to === '/requests' && pendingApprovals > 0 && <span className="nav-badge" aria-label={t('req.pendingBadge', { n: pendingApprovals })}>{pendingApprovals}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot">
          <div className="who">
            <span className="avatar" aria-hidden>{account.name.split(' ').pop()[0]}</span>
            <div>
              <strong>{account.name}</strong>
              <span>{t(`role.${role}`)}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-block" onClick={logout}>
            <LogOut size={16} aria-hidden /> {t('auth.logout')}
          </button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <div className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <label className="branch-switch">
            <Store size={16} aria-hidden />
            <span className="sr-only">{t('branch.current')}</span>
            <select value={activeBranch} onChange={(e) => setBranch(e.target.value)} disabled={allowedBranches.length < 2 && !canViewAll}>
              {canViewAll && <option value="all">{t('branch.all')}</option>}
              {allowedBranches.map((b) => (
                <option key={b.id} value={b.id}>{L(b.name)}</option>
              ))}
            </select>
          </label>
          <div className="topbar-right">
            <CalendarCheck2 size={16} aria-hidden className="muted" />
            <span className="muted today">{new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <div className="seg" role="group" aria-label="Language">
              <button className={lang === 'vi' ? 'on' : ''} onClick={() => setLang('vi')}>VI</button>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
