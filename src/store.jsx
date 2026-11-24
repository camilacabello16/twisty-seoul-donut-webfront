import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  accounts as seedAccounts,
  branches,
  employees as seedEmployees,
  ingredients as seedIngredients,
  initialDepartments,
  initialIngredientStock,
  initialOrders,
  initialProjects,
  initialProductStock,
  initialProduction,
  initialReports,
  initialRequests,
  initialTasks,
  products as seedProducts,
} from './data'
import { dict } from './i18n'
import { toISO, parseISO, initialStockLog } from './data'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const save = (key, v) => {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* demo: bỏ qua */
  }
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => load('ts.lang', 'vi'))
  const [accountId, setAccountId] = useState(() => load('ts.account', null))
  const [branchId, setBranchState] = useState(() => load('ts.branch', null))

  const [accounts, setAccounts] = useState(seedAccounts)
  const [orders, setOrders] = useState(initialOrders)
  const [requests, setRequests] = useState(initialRequests)
  const [tasks, setTasks] = useState(initialTasks)
  const [projects, setProjects] = useState(initialProjects)
  const [stockLog, setStockLog] = useState(initialStockLog)
  const [employees, setEmployees] = useState(seedEmployees)
  const [ingStock, setIngStock] = useState(initialIngredientStock)
  const [prodStock, setProdStock] = useState(initialProductStock)
  const [production, setProduction] = useState(initialProduction)
  const [reports, setReports] = useState(initialReports)
  const [products, setProducts] = useState(seedProducts)
  const [ingredients, setIngredients] = useState(seedIngredients)
  const [departments, setDepartments] = useState(initialDepartments)
  const [toast, setToast] = useState(null)
  const nextId = (prefix, list) => `${prefix}${Math.max(0, ...list.map((x) => Number(String(x.id).replace(/\D/g, '')) || 0)) + 1}`

  const account = accounts.find((a) => a.id === accountId) || null
  const role = account?.role
  const allowedBranches = useMemo(
    () => (account ? branches.filter((b) => account.branches.includes(b.id)) : []),
    [account],
  )
  // Chủ cửa hàng được xem tổng hợp ('all'); vai trò khác phải chọn đúng một chi nhánh.
  const canViewAll = role === 'owner'
  const activeBranch = branchId === 'all' && canViewAll ? 'all' : allowedBranches.find((b) => b.id === branchId)?.id || allowedBranches[0]?.id
  const visibleBranchIds = activeBranch === 'all' ? allowedBranches.map((b) => b.id) : activeBranch ? [activeBranch] : []

  const t = useCallback(
    (key, vars) => {
      const entry = dict[key]
      let s = entry ? entry[lang] ?? entry.vi : key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v)
      return s
    },
    [lang],
  )
  const L = useCallback((o) => (o && typeof o === 'object' ? o[lang] ?? o.vi : o), [lang])
  const money = useCallback(
    (n) => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US').format(Math.round(n)) + ' ₫',
    [lang],
  )
  const dateFmt = useCallback(
    (iso) => (iso ? parseISO(iso).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit' }) : '—'),
    [lang],
  )

  const notify = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const setLang = (l) => {
    setLangState(l)
    save('ts.lang', l)
    document.documentElement.lang = l
  }
  const login = (id, b) => {
    setAccountId(id)
    setBranchState(b)
    save('ts.account', id)
    save('ts.branch', b)
  }
  const logout = () => {
    setAccountId(null)
    save('ts.account', null)
  }
  const setBranch = (b) => {
    setBranchState(b)
    save('ts.branch', b)
  }

  const inBranch = (x) => visibleBranchIds.includes(x.branch)
  const canEditCatalog = role === 'owner' || !!account?.canEditCatalog

  const actions = {
    addOrder: (order) => {
      const id = `DH${1000 + orders.length + 1}`
      const today = new Date()
      const o = {
        ...order,
        id,
        date: toISO(today),
        time: today.toTimeString().slice(0, 5),
        status: 'done',
        by: employees.find((e) => e.name === account.name)?.id || 'e2',
      }
      setOrders((prev) => [o, ...prev])
      setProdStock((prev) => {
        const next = { ...prev, [order.branch]: { ...prev[order.branch] } }
        for (const it of order.items) next[order.branch][it.pid] = Math.max(0, (next[order.branch][it.pid] || 0) - it.qty)
        return next
      })
      return id
    },
    cancelOrder: (id) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))),
    addRequest: (r) => setRequests((prev) => [{ ...r, id: nextId('r', prev), status: 'pending' }, ...prev]),
    decideRequest: (id, status) =>
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, decidedBy: account.name, decidedAt: toISO(new Date()) } : r))),
    // Chuyển cột và/hoặc sắp xếp lại: chèn trước task `beforeId`, hoặc cuối cột khi không có.
    moveTask: (id, status, beforeId) =>
      setTasks((prev) => {
        const task = prev.find((x) => x.id === id)
        if (!task || id === beforeId) return prev
        const rest = prev.filter((x) => x.id !== id)
        const moved = { ...task, status }
        const at = beforeId ? rest.findIndex((x) => x.id === beforeId) : -1
        if (at === -1) return [...rest, moved]
        return [...rest.slice(0, at), moved, ...rest.slice(at)]
      }),
    updateTask: (id, patch) => setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    deleteTask: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
    addProject: (p) => setProjects((prev) => [...prev, { ...p, id: nextId('pr', prev) }]),
    updateProject: (id, patch) => setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    addTask: (task) =>
      setTasks((prev) => [
        ...prev,
        { category: 'operations', startTime: '', endTime: '', estimate: 0, description: '', note: '', department: '', repeat: { freq: 'none', interval: 1, weekdays: [], until: '' }, doneDates: [], start: '', due: '', drive: '', ...task, status: task.status || 'todo', id: nextId('t', prev) },
      ]),
    // Đánh dấu hoàn thành một lần lặp của công việc lặp lại
    toggleOccurrence: (id, occ) =>
      setTasks((prev) => prev.map((x) => {
        if (x.id !== id) return x
        const has = (x.doneDates || []).includes(occ)
        return { ...x, doneDates: has ? x.doneDates.filter((d) => d !== occ) : [...(x.doneDates || []), occ] }
      })),
    addDepartment: (d) => setDepartments((prev) => [...prev, { head: '', ...d, id: nextId('dp', prev) }]),
    updateDepartment: (id, patch) => setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d))),
    // Xóa phòng ban: nhân viên và công việc thuộc phòng ban đó chuyển về "chưa phân phòng ban"
    deleteDepartment: (id) => {
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      setEmployees((prev) => prev.map((e) => (e.dept === id ? { ...e, dept: '' } : e)))
      setTasks((prev) => prev.map((x) => (x.department === id ? { ...x, department: '' } : x)))
    },
    addIngredient: (ing) => {
      const id = nextId('i', ingredients)
      setIngredients((prev) => [...prev, { ...ing, id }])
      setIngStock((prev) => Object.fromEntries(Object.entries(prev).map(([b, s]) => [b, { ...s, [id]: { qty: 0, expiry: '' } }])))
      return id
    },
    addProduct: (p) => setProducts((prev) => [...prev, { ...p, id: nextId('p', prev) }]),
    updateProduct: (id, patch) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    addEmployee: (e) => setEmployees((prev) => [...prev, { workdays: 0, bonus: 0, deduction: 0, ...e, id: nextId('e', prev) }]),
    updateEmployee: (id, patch) => setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    setWorkdays: (id, workdays) => setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, workdays } : e))),
    importStock: (branch, ingId, qty, expiry, supplier = '') => {
      setIngStock((prev) => ({
        ...prev,
        [branch]: { ...prev[branch], [ingId]: { qty: (prev[branch][ingId]?.qty || 0) + qty, expiry: expiry || prev[branch][ingId]?.expiry || '' } },
      }))
      setStockLog((prev) => [...prev, { id: nextId('sl', prev), branch, ing: ingId, qty, date: toISO(new Date()), supplier }])
    },
    recordProduction: (rowId, qty) => {
      const row = production.find((r) => r.id === rowId)
      if (!row) return
      const p = products.find((x) => x.id === row.pid)
      const add = Math.min(qty, row.planned - row.done)
      if (add <= 0) return
      setProduction((prev) => prev.map((r) => (r.id === rowId ? { ...r, done: r.done + add } : r)))
      setProdStock((prev) => ({ ...prev, [row.branch]: { ...prev[row.branch], [row.pid]: (prev[row.branch][row.pid] || 0) + add } }))
      setIngStock((prev) => {
        const branchStock = { ...prev[row.branch] }
        for (const [iid, q] of Object.entries(p.recipe)) {
          const cur = branchStock[iid]
          if (cur) branchStock[iid] = { ...cur, qty: Math.max(0, +(cur.qty - q * add).toFixed(2)) }
        }
        return { ...prev, [row.branch]: branchStock }
      })
    },
    addReport: (r) => setReports((prev) => [{ ...r, id: `rp${prev.length + 1}` }, ...prev]),
    setPrice: (id, price) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, price } : p))),
    toggleCatalogRight: (id) => setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, canEditCatalog: !a.canEditCatalog } : a))),
  }

  const value = {
    lang, setLang, t, L, money, dateFmt,
    account, role, login, logout,
    allowedBranches, canViewAll, activeBranch, setBranch, visibleBranchIds, inBranch,
    accounts, orders, requests, tasks, projects, stockLog, employees, ingStock, prodStock, production, reports, products, ingredients, departments,
    canEditCatalog, isStaff: role === 'staff', actions, toast, notify,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
