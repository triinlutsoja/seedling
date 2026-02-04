import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast
} from 'date-fns'
import TaskCard from './TaskCard'

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarView({ tasks, plants, onComplete, onEdit, onSnooze }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Build a set of date strings that have tasks for quick lookup
  const taskDateSet = new Set(tasks.map(t => t.date))

  // Get tasks for the selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedTasks = tasks
    .filter(t => t.date === selectedDateStr)
    .sort((a, b) => {
      // Sort by time if available, otherwise keep date order
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })

  // Generate calendar grid days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  function handlePrevMonth() {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  function handleNextMonth() {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  function handleDateClick(day) {
    setSelectedDate(day)
  }

  function handleTodayClick() {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  return (
    <div className="space-y-3">
      {/* Calendar card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 touch-feedback"
          >
            <ChevronLeftIcon />
          </button>

          <button
            onClick={handleTodayClick}
            className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </button>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 touch-feedback"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const inCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDate)
            const today = isToday(day)
            const hasTasks = taskDateSet.has(dayStr)
            const isOverdue = hasTasks && isPast(day) && !isToday(day)

            return (
              <button
                key={dayStr}
                onClick={() => handleDateClick(day)}
                className={`
                  relative flex flex-col items-center justify-center py-2 rounded-lg transition-colors touch-feedback
                  ${!inCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-green-600 text-white' : ''}
                  ${!isSelected && today ? 'bg-green-50 text-green-700 font-semibold' : ''}
                  ${!isSelected && !today && inCurrentMonth ? 'text-gray-900 hover:bg-gray-50' : ''}
                `}
              >
                <span className={`text-sm leading-none ${isSelected ? 'font-semibold' : ''}`}>
                  {format(day, 'd')}
                </span>

                {/* Task dot indicator */}
                {hasTasks && (
                  <span
                    className={`
                      absolute bottom-1 w-1.5 h-1.5 rounded-full
                      ${isSelected ? 'bg-white' : isOverdue ? 'bg-red-500' : 'bg-green-500'}
                    `}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date tasks */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2 px-1">
          {isToday(selectedDate)
            ? 'Today'
            : format(selectedDate, 'EEEE, MMM d')}
        </h3>

        {selectedTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">No tasks for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                plants={plants}
                onComplete={onComplete}
                onEdit={onEdit}
                onSnooze={onSnooze}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
