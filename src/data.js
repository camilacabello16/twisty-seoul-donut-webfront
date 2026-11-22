// Dữ liệu giả lập cho bản demo (không có backend).

// Ngày theo giờ địa phương (toISOString dùng UTC nên lệch 1 ngày ở múi giờ UTC+).
const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const dayISO = (offset = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return toISO(d)
}

export const branches = [
  { id: 'b1', name: { vi: 'Quận 1', en: 'District 1' }, address: '12 Lê Lợi, Quận 1' },
  { id: 'b2', name: { vi: 'Quận 3', en: 'District 3' }, address: '88 Võ Văn Tần, Quận 3' },
  { id: 'b3', name: { vi: 'Thủ Đức', en: 'Thu Duc' }, address: '5 Võ Văn Ngân, Thủ Đức' },
]

// role: owner | manager | staff
export const accounts = [
  { id: 'u1', name: 'Nguyễn Thu Hà', role: 'owner', branches: ['b1', 'b2', 'b3'], canEditCatalog: true },
  { id: 'u2', name: 'Trần Minh Lan', role: 'manager', branches: ['b1', 'b2'], canEditCatalog: true },
  { id: 'u3', name: 'Lê Quốc Bảo', role: 'manager', branches: ['b3'], canEditCatalog: false },
  { id: 'u4', name: 'Phạm Gia Minh', role: 'staff', branches: ['b1'], canEditCatalog: false },
]

export const departments = [
  { id: 'd1', name: { vi: 'Bếp bánh', en: 'Bakery' } },
  { id: 'd2', name: { vi: 'Quầy bán hàng', en: 'Sales counter' } },
  { id: 'd3', name: { vi: 'Kho', en: 'Warehouse' } },
  { id: 'd4', name: { vi: 'Quản lý', en: 'Management' } },
]

const employeesBase = [
  { id: 'e1', name: 'Trần Minh Lan', dept: 'd4', title: { vi: 'Quản lý chi nhánh', en: 'Branch manager' }, branch: 'b1', base: 14000000, allowance: 1500000, bonus: 800000, deduction: 0, workdays: 24 },
  { id: 'e2', name: 'Phạm Gia Minh', dept: 'd2', title: { vi: 'Thu ngân', en: 'Cashier' }, branch: 'b1', base: 7500000, allowance: 500000, bonus: 0, deduction: 0, workdays: 25 },
  { id: 'e3', name: 'Đỗ Khánh Vy', dept: 'd1', title: { vi: 'Thợ bánh chính', en: 'Head baker' }, branch: 'b1', base: 11000000, allowance: 1000000, bonus: 500000, deduction: 0, workdays: 26 },
  { id: 'e4', name: 'Vũ Hoàng Nam', dept: 'd1', title: { vi: 'Phụ bếp', en: 'Kitchen assistant' }, branch: 'b1', base: 7000000, allowance: 300000, bonus: 0, deduction: 150000, workdays: 22 },
  { id: 'e5', name: 'Hoàng Thị Mai', dept: 'd2', title: { vi: 'Nhân viên bán hàng', en: 'Sales staff' }, branch: 'b2', base: 7200000, allowance: 400000, bonus: 200000, deduction: 0, workdays: 26 },
  { id: 'e6', name: 'Ngô Đức Thịnh', dept: 'd1', title: { vi: 'Thợ bánh', en: 'Baker' }, branch: 'b2', base: 9500000, allowance: 600000, bonus: 0, deduction: 0, workdays: 25 },
  { id: 'e7', name: 'Lê Quốc Bảo', dept: 'd4', title: { vi: 'Quản lý chi nhánh', en: 'Branch manager' }, branch: 'b3', base: 13000000, allowance: 1200000, bonus: 600000, deduction: 0, workdays: 26 },
  { id: 'e8', name: 'Bùi Ngọc Anh', dept: 'd2', title: { vi: 'Thu ngân', en: 'Cashier' }, branch: 'b3', base: 7500000, allowance: 500000, bonus: 0, deduction: 100000, workdays: 24 },
  { id: 'e9', name: 'Đặng Thanh Tùng', dept: 'd3', title: { vi: 'Thủ kho', en: 'Storekeeper' }, branch: 'b3', base: 8000000, allowance: 400000, bonus: 0, deduction: 0, workdays: 26 },
]

// status: active | onleave | resigned
export const employees = employeesBase.map((e, i) => ({
  phone: `09${String(10000000 + i * 1234567).slice(0, 8)}`,
  status: e.id === 'e4' ? 'onleave' : 'active',
  ...e,
}))

export const STANDARD_DAYS = 26

export const ingredients = [
  { id: 'i1', name: { vi: 'Bột mì', en: 'Flour' }, unit: 'kg', min: 20, cost: 22000, supplier: 's1' },
  { id: 'i2', name: { vi: 'Bơ lạt', en: 'Butter' }, unit: 'kg', min: 8, cost: 210000, supplier: 's2' },
  { id: 'i3', name: { vi: 'Đường', en: 'Sugar' }, unit: 'kg', min: 15, cost: 24000, supplier: 's1' },
  { id: 'i4', name: { vi: 'Trứng gà', en: 'Eggs' }, unit: 'quả', min: 120, cost: 3200, supplier: 's3' },
  { id: 'i5', name: { vi: 'Sữa tươi', en: 'Fresh milk' }, unit: 'lít', min: 20, cost: 32000, supplier: 's2' },
  { id: 'i6', name: { vi: 'Kem tươi', en: 'Whipping cream' }, unit: 'lít', min: 10, cost: 120000, supplier: 's2' },
  { id: 'i7', name: { vi: 'Socola đen', en: 'Dark chocolate' }, unit: 'kg', min: 5, cost: 260000, supplier: 's1' },
  { id: 'i8', name: { vi: 'Dâu tây', en: 'Strawberries' }, unit: 'kg', min: 6, cost: 180000, supplier: 's3' },
]

export const suppliers = [
  { id: 's1', name: 'Công ty Nguyên liệu Bánh Á Châu', phone: '028 3822 1100', items: { vi: 'Bột, đường, socola', en: 'Flour, sugar, chocolate' } },
  { id: 's2', name: 'Sữa & Bơ Đà Lạt Farm', phone: '0263 355 2201', items: { vi: 'Bơ, sữa, kem tươi', en: 'Butter, milk, cream' } },
  { id: 's3', name: 'Nông trại Xanh', phone: '0909 123 456', items: { vi: 'Trứng, dâu tây', en: 'Eggs, strawberries' } },
]

// Tồn kho nguyên liệu theo chi nhánh: qty + hạn dùng (số ngày kể từ hôm nay)
const stockSeed = {
  b1: { i1: [64, 90], i2: [14, 21], i3: [32, 200], i4: [90, 6], i5: [12, 2], i6: [18, 5], i7: [9, 120], i8: [4, 3] },
  b2: { i1: [28, 90], i2: [9, 12], i3: [40, 200], i4: [200, 9], i5: [30, 4], i6: [7, 1], i7: [6, 120], i8: [10, 4] },
  b3: { i1: [18, 90], i2: [20, 30], i3: [22, 200], i4: [160, 8], i5: [26, 5], i6: [14, 6], i7: [3, 120], i8: [8, 5] },
}
export const initialIngredientStock = Object.fromEntries(
  Object.entries(stockSeed).map(([b, items]) => [
    b,
    Object.fromEntries(Object.entries(items).map(([id, [qty, days]]) => [id, { qty, expiry: dayISO(days) }])),
  ]),
)

export const products = [
  { id: 'p1', name: { vi: 'Bánh xoắn Seoul', en: 'Seoul twist bun' }, cat: 'bread', price: 38000, recipe: { i1: 0.08, i2: 0.03, i3: 0.015, i4: 0.5, i5: 0.02 } },
  { id: 'p2', name: { vi: 'Croissant bơ', en: 'Butter croissant' }, cat: 'bread', price: 35000, recipe: { i1: 0.07, i2: 0.045, i3: 0.01, i4: 0.3 } },
  { id: 'p3', name: { vi: 'Bánh su kem', en: 'Cream puff' }, cat: 'pastry', price: 22000, recipe: { i1: 0.02, i2: 0.015, i4: 0.5, i6: 0.04 } },
  { id: 'p4', name: { vi: 'Tiramisu ly', en: 'Tiramisu cup' }, cat: 'dessert', price: 52000, recipe: { i3: 0.02, i4: 1, i6: 0.08 } },
  { id: 'p5', name: { vi: 'Cookie socola', en: 'Chocolate cookie' }, cat: 'cookie', price: 25000, recipe: { i1: 0.04, i2: 0.02, i3: 0.015, i7: 0.02 } },
  { id: 'p6', name: { vi: 'Bánh kem dâu (16cm)', en: 'Strawberry cake (16cm)' }, cat: 'cake', price: 360000, recipe: { i1: 0.15, i3: 0.08, i4: 6, i6: 0.4, i8: 0.25 } },
  { id: 'p7', name: { vi: 'Bánh kem socola (16cm)', en: 'Chocolate cake (16cm)' }, cat: 'cake', price: 380000, recipe: { i1: 0.15, i3: 0.09, i4: 6, i6: 0.3, i7: 0.2 } },
  { id: 'p8', name: { vi: 'Bánh mì sữa', en: 'Milk loaf' }, cat: 'bread', price: 28000, recipe: { i1: 0.18, i3: 0.02, i4: 1, i5: 0.1 } },
]

export const productCost = (p) =>
  Math.round(Object.entries(p.recipe).reduce((s, [id, q]) => s + q * ingredients.find((i) => i.id === id).cost, 0))

// Tồn kho thành phẩm theo chi nhánh
export const initialProductStock = {
  b1: { p1: 18, p2: 12, p3: 24, p4: 9, p5: 30, p6: 3, p7: 2, p8: 14 },
  b2: { p1: 10, p2: 16, p3: 12, p4: 6, p5: 22, p6: 2, p7: 4, p8: 8 },
  b3: { p1: 14, p2: 8, p3: 18, p4: 11, p5: 15, p6: 1, p7: 3, p8: 10 },
}

export const initialProduction = (() => {
  const mk = (b, rows) => rows.map(([pid, planned, done], i) => ({ id: `${b}-${i}`, branch: b, pid, planned, done }))
  return [
    ...mk('b1', [['p1', 40, 40], ['p2', 30, 18], ['p3', 36, 0], ['p6', 4, 0]]),
    ...mk('b2', [['p1', 24, 24], ['p5', 40, 10], ['p7', 3, 0]]),
    ...mk('b3', [['p2', 20, 20], ['p4', 18, 6], ['p8', 20, 0]]),
  ]
})()

export const initialProjects = [
  { id: 'pr1', name: { vi: 'Ra mắt menu Tết', en: 'Lunar New Year menu launch' }, desc: { vi: 'Bộ bánh và hộp quà Tết cho cả chuỗi.', en: 'Holiday pastry set and gift boxes for the whole chain.' }, owner: 'e1', start: dayISO(-10), end: dayISO(20), status: 'active', branches: ['b1', 'b2'], drive: 'https://drive.google.com/drive/folders/menu-tet' },
  { id: 'pr2', name: { vi: 'Vận hành hằng ngày', en: 'Daily operations' }, desc: { vi: 'Công việc lặp lại: mở ca, vệ sinh, kiểm kê.', en: 'Recurring work: opening, cleaning, stock counts.' }, owner: 'e1', start: dayISO(-120), end: '', status: 'active', branches: ['b1', 'b2', 'b3'], drive: '' },
  { id: 'pr3', name: { vi: 'Khai trương quầy mới', en: 'New counter opening' }, desc: { vi: 'Chuẩn bị mặt bằng, thiết bị và nhân sự cho quầy mới.', en: 'Prepare space, equipment and staff for the new counter.' }, owner: 'e7', start: dayISO(-20), end: dayISO(14), status: 'active', branches: ['b3'], drive: '' },
]

export const initialTasks = [
  { id: 't1', project: 'pr1', branch: 'b1', title: { vi: 'Chốt công thức bánh xoắn vị quế', en: 'Finalise cinnamon twist recipe' }, assignee: 'e3', status: 'doing', priority: 'high', due: dayISO(3), drive: '' },
  { id: 't2', project: 'pr1', branch: 'b1', title: { vi: 'Thiết kế hộp quà Tết', en: 'Design gift box' }, assignee: 'e1', status: 'todo', priority: 'medium', due: dayISO(9), drive: 'https://drive.google.com/drive/folders/hop-qua-tet' },
  { id: 't3', project: 'pr1', branch: 'b2', title: { vi: 'Đặt trước bao bì in logo', en: 'Pre-order printed packaging' }, assignee: 'e5', status: 'todo', priority: 'high', due: dayISO(5), drive: '' },
  { id: 't4', project: 'pr2', branch: 'b1', title: { vi: 'Kiểm kê kho cuối ngày', en: 'End-of-day stock count' }, assignee: 'e4', status: 'doing', priority: 'medium', due: dayISO(0), drive: '' },
  { id: 't5', project: 'pr2', branch: 'b1', title: { vi: 'Vệ sinh lò nướng', en: 'Clean the ovens' }, assignee: 'e4', status: 'done', priority: 'low', due: dayISO(-1), drive: '' },
  { id: 't6', project: 'pr2', branch: 'b2', title: { vi: 'Kiểm tra hạn sử dụng kem tươi', en: 'Check cream expiry dates' }, assignee: 'e6', status: 'todo', priority: 'high', due: dayISO(0), drive: '' },
  { id: 't7', project: 'pr2', branch: 'b3', title: { vi: 'Mở ca sáng', en: 'Open morning shift' }, assignee: 'e8', status: 'done', priority: 'low', due: dayISO(0), drive: '' },
  { id: 't8', project: 'pr3', branch: 'b3', title: { vi: 'Lắp tủ trưng bày bánh', en: 'Install pastry display case' }, assignee: 'e9', status: 'doing', priority: 'medium', due: dayISO(6), drive: '' },
  { id: 't9', project: 'pr3', branch: 'b3', title: { vi: 'Tuyển thêm 2 nhân viên bán hàng', en: 'Hire two sales staff' }, assignee: 'e7', status: 'todo', priority: 'medium', due: dayISO(14), drive: '' },
]

export const initialRequests = [
  { id: 'r1', branch: 'b1', by: 'e2', type: 'leave', from: dayISO(4), to: dayISO(5), reason: { vi: 'Việc gia đình', en: 'Family matter' }, status: 'pending', drive: '' },
  { id: 'r2', branch: 'b1', by: 'e4', type: 'shift', from: dayISO(2), to: dayISO(2), reason: { vi: 'Đổi ca chiều sang ca sáng', en: 'Swap afternoon for morning shift' }, status: 'pending', drive: '' },
  { id: 'r3', branch: 'b2', by: 'e6', type: 'purchase', from: dayISO(1), to: dayISO(1), reason: { vi: 'Mua thêm khay nướng 60x40', en: 'Buy more 60x40 baking trays' }, status: 'approved', drive: 'https://drive.google.com/file/d/bao-gia-khay' },
  { id: 'r4', branch: 'b3', by: 'e8', type: 'leave', from: dayISO(-6), to: dayISO(-6), reason: { vi: 'Khám sức khỏe', en: 'Medical check-up' }, status: 'rejected', drive: '' },
]

export const initialReports = [
  { id: 'rp1', name: { vi: 'Báo cáo doanh thu tháng trước', en: 'Last month revenue report' }, branch: 'b1', period: '2026-10', drive: 'https://drive.google.com/file/d/doanh-thu-t10' },
  { id: 'rp2', name: { vi: 'Bảng lương tháng trước', en: 'Last month payroll' }, branch: 'b1', period: '2026-10', drive: 'https://drive.google.com/file/d/luong-t10' },
  { id: 'rp3', name: { vi: 'Biên bản kiểm kê quý 3', en: 'Q3 stock-take minutes' }, branch: 'b2', period: '2026-09', drive: '' },
]

export const FIXED_COSTS = {
  b1: { rent: 38000000, other: 6500000 },
  b2: { rent: 32000000, other: 5200000 },
  b3: { rent: 24000000, other: 4800000 },
}

// Sinh đơn hàng 30 ngày gần nhất (xác định, không ngẫu nhiên giữa các lần tải)
const lcg = (seed) => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export const initialOrders = (() => {
  const rand = lcg(2026)
  const out = []
  const volume = { b1: 46, b2: 34, b3: 28 }
  const staffByBranch = { b1: 'e2', b2: 'e5', b3: 'e8' }
  let n = 1000
  for (const b of Object.keys(volume)) {
    for (let day = -29; day <= 0; day++) {
      const weekend = [0, 6].includes(parseISO(dayISO(day)).getDay())
      const count = Math.round(volume[b] * (weekend ? 1.4 : 1) * (0.8 + rand() * 0.4))
      for (let k = 0; k < count; k++) {
        const lines = 1 + Math.floor(rand() * 3)
        const items = []
        for (let l = 0; l < lines; l++) {
          const p = products[Math.floor(rand() * products.length)]
          const qty = p.price > 100000 ? 1 : 1 + Math.floor(rand() * 3)
          if (!items.find((x) => x.pid === p.id)) items.push({ pid: p.id, qty })
        }
        const total = items.reduce((s, it) => s + it.qty * products.find((p) => p.id === it.pid).price, 0)
        const hasCake = items.some((it) => it.pid === 'p6' || it.pid === 'p7')
        const r = rand()
        out.push({
          id: `DH${n++}`,
          branch: b,
          date: dayISO(day),
          time: `${String(8 + Math.floor(rand() * 12)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}`,
          type: hasCake ? (r < 0.5 ? 'custom' : 'preorder') : 'counter',
          items,
          total,
          note: '',
          status: r > 0.96 ? 'cancelled' : 'done',
          by: staffByBranch[b],
        })
      }
    }
  }
  return out.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
})()

// Lịch sử nhập kho nguyên liệu (mẫu): mỗi chi nhánh nhập vài lần mỗi tuần
export const initialStockLog = (() => {
  const out = []
  const sizes = { i1: 25, i2: 6, i3: 20, i4: 120, i5: 20, i6: 8, i7: 4, i8: 6 }
  ;['b1', 'b2', 'b3'].forEach((b, bi) => {
    for (let day = -45; day <= 0; day++) {
      if ((day + 100 + bi) % 3 !== 0) continue
      const picks = ingredients.filter((_, i) => (i + day + 100 + bi) % 4 === 0)
      picks.forEach((ing) => out.push({ id: `sl-${b}-${day}-${ing.id}`, branch: b, ing: ing.id, qty: sizes[ing.id], date: dayISO(day) }))
    }
  })
  return out
})()
