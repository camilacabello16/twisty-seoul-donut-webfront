import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './store'
import Layout, { NAV } from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Projects from './pages/Projects'
import Calendar from './pages/Calendar'
import HR from './pages/HR'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Production from './pages/Production'
import Orders from './pages/Orders'
import Finance from './pages/Finance'
import Requests from './pages/Requests'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

const pages = {
  '/': Dashboard, '/calendar': Calendar, '/projects': Projects, '/tasks': Tasks, '/hr': HR, '/products': Products, '/inventory': Inventory, '/production': Production,
  '/orders': Orders, '/finance': Finance, '/requests': Requests, '/reports': Reports, '/settings': Settings,
}

export default function App() {
  const { account, role } = useApp()
  if (!account) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  const home = role === 'staff' ? '/tasks' : '/'
  return (
    <Routes>
      <Route element={<Layout />}>
        {NAV.filter((n) => !n.hidden && n.roles.includes(role)).map((n) => {
          const Page = pages[n.to]
          return <Route key={n.to} path={n.to} element={<Page />} />
        })}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Route>
    </Routes>
  )
}
