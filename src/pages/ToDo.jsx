import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns'

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

function ReminderCard({ reminder, plant, onComplete, onSnooze }) {
  const date = new Date(reminder.date)
  const isOverdue = isPast(date) && !isToday(date)

  let dateLabel = format(date, 'MMM d, yyyy')
  if (isToday(date)) dateLabel = 'Today'
  if (isTomorrow(date)) dateLabel = 'Tomorrow'

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onComplete(reminder.id)}
          className="mt-0.5 w-6 h-6 rounded-full border-2 border-green-500 flex-shrink-0 flex items-center justify-center touch-feedback hover:bg-green-50"
        >
          {reminder.completed && (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium">{reminder.description}</p>
          <Link
            to={`/plant/${reminder.plantId}`}
            className="text-sm text-green-600 hover:underline"
          >
            {plant?.name || 'Unknown plant'}
          </Link>
        </div>

        <div className="text-right flex-shrink-0">
          <span className={`text-sm font-medium ${isOverdue ? 'text-red-500' : isToday(date) ? 'text-green-600' : 'text-gray-500'}`}>
            {dateLabel}
          </span>
          {isToday(date) && (
            <button
              onClick={() => onSnooze(reminder.id)}
              className="block text-xs text-gray-400 hover:text-gray-600 mt-1"
            >
              Snooze
            </button>
          )}
        </div>
      </div>
    </div>
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
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No reminders</h3>
      <p className="text-gray-500">Add reminders to your plants to track tasks</p>
    </div>
  )
}

export default function ToDo() {
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [reminders, setReminders] = useState([])
  const [plants, setPlants] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    try {
      // Get incomplete reminders sorted by date
      const allReminders = await db.reminders
        .where('completed')
        .equals(0)
        .toArray()

      // Sort by date (nearest first)
      allReminders.sort((a, b) => new Date(a.date) - new Date(b.date))

      // Get plant info for each reminder
      const plantIds = [...new Set(allReminders.map(r => r.plantId))]
      const plantsData = await db.plants.where('id').anyOf(plantIds).toArray()
      const plantsMap = {}
      plantsData.forEach(p => { plantsMap[p.id] = p })

      setReminders(allReminders)
      setPlants(plantsMap)
    } catch (error) {
      console.error('Error loading reminders:', error)
    }
    setLoading(false)
  }

  async function handleComplete(reminderId) {
    try {
      await db.reminders.update(reminderId, { completed: 1 })
      setReminders(reminders.filter(r => r.id !== reminderId))
    } catch (error) {
      console.error('Error completing reminder:', error)
    }
  }

  async function handleSnooze(reminderId) {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await db.reminders.update(reminderId, { date: tomorrow.toISOString().split('T')[0] })
      loadReminders()
    } catch (error) {
      console.error('Error snoozing reminder:', error)
    }
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
          {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'} pending
        </p>
      </header>

      {/* Content */}
      <div className="px-4 -mt-2">
        {reminders.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {reminders.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                plant={plants[reminder.plantId]}
                onComplete={handleComplete}
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
    </div>
  )
}
