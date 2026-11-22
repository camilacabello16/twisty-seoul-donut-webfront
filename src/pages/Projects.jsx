import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pencil, Plus } from 'lucide-react'
import { useApp } from '../store'
import { Badge, DriveField, DriveLink, Empty, Modal, PageHeader } from '../components/ui'
import { dayISO } from '../data'

const tone = { active: 'info', paused: 'warn', done: 'ok' }

export default function Projects() {
  const { t, L, dateFmt, projects, tasks, employees, visibleBranchIds, allowedBranches, actions, notify } = useApp()
  const [editing, setEditing] = useState(null) // null | 'new' | project
  const list = projects.filter((p) => p.branches.some((b) => visibleBranchIds.includes(b)))
  const owner = (id) => employees.find((e) => e.id === id)?.name || '—'

  return (
    <>
      <PageHeader
        title={t('nav.projects')}
        sub={t('proj.sub')}
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} aria-hidden /> {t('proj.new')}</button>}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('proj.name')}</th><th>{t('proj.owner')}</th><th>{t('req.period')}</th>
              <th>{t('proj.progress')}</th><th>{t('proj.status')}</th><th>{t('drive.label')}</th><th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const mine = tasks.filter((x) => x.project === p.id && visibleBranchIds.includes(x.branch))
              const done = mine.filter((x) => x.status === 'done').length
              const pct = mine.length ? Math.round((done / mine.length) * 100) : 0
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{L(p.name)}</strong>
                    <div className="muted small clip">{L(p.desc)}</div>
                    <div className="muted small">{p.branches.map((b) => L(allowedBranches.find((x) => x.id === b)?.name)).filter(Boolean).join(', ')}</div>
                  </td>
                  <td>{owner(p.owner)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateFmt(p.start)} → {p.end ? dateFmt(p.end) : t('proj.open')}</td>
                  <td className="progress-cell">
                    <div className="meter" aria-label={`${pct}%`}><i style={{ width: `${pct}%` }} /></div>
                    <span className="muted small">{mine.length ? t('proj.tasks', { done, total: mine.length }) : t('proj.noTasks')}</span>
                  </td>
                  <td><Badge tone={tone[p.status]}>{t(`pstatus.${p.status}`)}</Badge></td>
                  <td><DriveLink href={p.drive} /></td>
                  <td className="num actions">
                    <Link className="btn btn-small" to={`/tasks?project=${p.id}`}>{t('proj.viewTasks')} <ArrowRight size={14} aria-hidden /></Link>
                    <button className="icon-btn" onClick={() => setEditing(p)} aria-label={t('proj.edit')}><Pencil size={15} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!list.length && <Empty>{t('common.none')}</Empty>}
      </div>

      {editing && (
        <ProjectForm
          project={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') actions.addProject(data)
            else actions.updateProject(editing.id, data)
            setEditing(null)
            notify(t('common.saved'))
          }}
        />
      )}
    </>
  )
}

function ProjectForm({ project, onClose, onSave }) {
  const { t, L, employees, allowedBranches, visibleBranchIds } = useApp()
  const [f, setF] = useState(() => ({
    name: project ? L(project.name) : '',
    desc: project ? L(project.desc) : '',
    owner: project?.owner || employees.find((e) => visibleBranchIds.includes(e.branch))?.id,
    start: project?.start || dayISO(0),
    end: project?.end || '',
    status: project?.status || 'active',
    branches: project?.branches || visibleBranchIds,
    drive: project?.drive || '',
  }))
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const people = employees.filter((e) => allowedBranches.some((b) => b.id === e.branch))
  const toggle = (id) => setF({ ...f, branches: f.branches.includes(id) ? f.branches.filter((b) => b !== id) : [...f.branches, id] })

  return (
    <Modal
      title={project ? t('proj.edit') : t('proj.new')}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className="btn btn-primary"
          disabled={!f.name.trim() || !f.branches.length}
          onClick={() => onSave({ ...f, name: { vi: f.name, en: f.name }, desc: { vi: f.desc, en: f.desc } })}
        >{t('common.save')}</button>
      </>}
    >
      <label className="field"><span>{t('proj.name')}</span><input value={f.name} onChange={set('name')} /></label>
      <label className="field"><span>{t('proj.desc')}</span><textarea rows={2} value={f.desc} onChange={set('desc')} /></label>
      <div className="row2">
        <label className="field"><span>{t('proj.owner')}</span>
          <select value={f.owner} onChange={set('owner')}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
        <label className="field"><span>{t('proj.status')}</span>
          <select value={f.status} onChange={set('status')}>{['active', 'paused', 'done'].map((s) => <option key={s} value={s}>{t(`pstatus.${s}`)}</option>)}</select>
        </label>
      </div>
      <div className="row2">
        <label className="field"><span>{t('proj.start')}</span><input type="date" value={f.start} onChange={set('start')} /></label>
        <label className="field"><span>{t('proj.end')}</span><input type="date" min={f.start} value={f.end} onChange={set('end')} /></label>
      </div>
      <fieldset className="field checks">
        <legend>{t('proj.branches')}</legend>
        {allowedBranches.map((b) => (
          <label key={b.id}><input type="checkbox" checked={f.branches.includes(b.id)} onChange={() => toggle(b.id)} /> {L(b.name)}</label>
        ))}
      </fieldset>
      <DriveField value={f.drive} onChange={(v) => setF({ ...f, drive: v })} />
    </Modal>
  )
}
