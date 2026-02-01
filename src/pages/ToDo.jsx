import { useState, useEffect } from 'react'
import { db } from '../db/database'
import TaskCard from '../components/TaskCard'
import TaskFormModal from '../components/TaskFormModal'
import { scheduleNotification, cancelNotification, rescheduleAllNotifications } from '../utils/notifications'

function CalendarViewIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ListViewIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks</h3>
      <p className="text-gray-500">Tap the + button to add a task</p>
    </div>
  )
}

export default function ToDo() {
  const [viewMode, setViewMode] = useState('list')
  const [tasks, setTasks] = useState([])
  const [plants, setPlants] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      // Get incomplete tasks sorted by date
      const allTasks = await db.tasks
        .where('completed')
        .equals(0)
        .toArray()

      // Sort by date (nearest first)
      allTasks.sort((a, b) => new Date(a.date) - new Date(b.date))

      // Get all unique plant IDs from tasks
      const plantIds = [...new Set(allTasks.flatMap(t => t.plantIds || []))]
      const plantsData = await db.plants.where('id').anyOf(plantIds).toArray()
      const plantsMap = {}
      plantsData.forEach(p => { plantsMap[p.id] = p })

      setTasks(allTasks)
      setPlants(plantsMap)

      // Reschedule notifications for all tasks
      rescheduleAllNotifications(allTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
    setLoading(false)
  }

  async function handleComplete(taskId) {
    try {
      const task = await db.tasks.get(taskId)
      if (!task) return

      // Create diary entry for each linked plant
      for (const plantId of (task.plantIds || [])) {
        await db.diaryEntries.add({
          plantId,
          date: new Date().toISOString().split('T')[0],
          careStage: 'task_completed',
          note: task.description,
          year: new Date().getFullYear()
        })
      }

      // Mark task as completed
      await db.tasks.update(taskId, { completed: 1 })

      // Cancel any scheduled notification
      cancelNotification(taskId)

      // Remove from state
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  async function handleSnooze(taskId) {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await db.tasks.update(taskId, { date: tomorrow.toISOString().split('T')[0] })
      loadTasks()
    } catch (error) {
      console.error('Error snoozing task:', error)
    }
  }

  async function handleSaveTask(taskData) {
    try {
      if (taskData.id) {
        // Update existing task
        await db.tasks.update(taskData.id, {
          description: taskData.description,
          date: taskData.date,
          time: taskData.time,
          plantIds: taskData.plantIds
        })

        // Reschedule notification
        if (taskData.time) {
          scheduleNotification(taskData)
        } else {
          cancelNotification(taskData.id)
        }
      } else {
        // Create new task
        const id = await db.tasks.add({
          description: taskData.description,
          date: taskData.date,
          time: taskData.time,
          plantIds: taskData.plantIds,
          completed: 0,
          createdAt: new Date().toISOString()
        })

        // Schedule notification if time is set
        if (taskData.time) {
          scheduleNotification({ ...taskData, id })
        }
      }

      loadTasks()
    } catch (error) {
      console.error('Error saving task:', error)
      throw error
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await db.tasks.delete(taskId)
      cancelNotification(taskId)
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  function handleEditTask(task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleOpenCreate() {
    setEditingTask(null)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingTask(null)
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">To-Do</h1>

          {/* View toggle */}
          <div className="flex bg-green-700/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white' : ''}`}
            >
              <ListViewIcon active={viewMode === 'list'} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white' : ''}`}
            >
              <CalendarViewIcon active={viewMode === 'calendar'} />
            </button>
          </div>
        </div>
        <p className="text-green-100 text-sm">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} pending
        </p>
      </header>

      {/* Content */}
      <div className="px-4 -mt-2">
        {tasks.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                plants={plants}
                onComplete={handleComplete}
                onEdit={handleEditTask}
                onSnooze={handleSnooze}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-center text-gray-500">Calendar view coming soon</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-20 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center touch-feedback z-10"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <PlusIcon />
      </button>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        mode={editingTask ? 'edit' : 'create'}
        initialData={editingTask}
      />
    </div>
  )
}
