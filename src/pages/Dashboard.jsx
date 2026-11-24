import { useState } from 'react'
import { useApp } from '../store'
import { PageHeader } from '../components/ui'
import TaskDashboard from './tasks/TaskDashboard'
import TaskForm from '../components/TaskForm'

// Tổng quan: biểu đồ công việc của các chi nhánh đang xem
export default function Dashboard() {
  const { t, tasks, projects, employees, visibleBranchIds, allowedBranches, activeBranch, actions, notify } = useApp()
  const [form, setForm] = useState(null)
  const list = tasks.filter((x) => visibleBranchIds.includes(x.branch))
  const people = employees.filter((e) => visibleBranchIds.includes(e.branch) && e.status !== 'resigned')
  const myProjects = projects.filter((p) => p.branches.some((b) => visibleBranchIds.includes(b)))

  return (
    <>
      <PageHeader title={t('nav.dashboard')} sub={t('dash.sub')} />
      <TaskDashboard tasks={list} projects={myProjects} employees={people} onEdit={(task) => task && setForm({ task })} />
      {form && (
        <TaskForm
          task={form.task}
          people={people}
          projects={myProjects}
          branch={activeBranch === 'all' ? visibleBranchIds[0] : activeBranch}
          branchOptions={activeBranch === 'all' ? allowedBranches : undefined}
          onClose={() => setForm(null)}
          onSave={(data) => { actions.updateTask(form.task.id, data); setForm(null); notify(t('common.saved')) }}
          onDelete={() => {
            if (window.confirm(t('tasks.deleteConfirm'))) { actions.deleteTask(form.task.id); setForm(null); notify(t('tasks.deleted')) }
          }}
        />
      )}
    </>
  )
}
