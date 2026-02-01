import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function TaskCard({ task, plants, onComplete, onEdit, onSnooze, showPlantLinks = true }) {
  const date = new Date(task.date)

  // Check if overdue: either date is past, or if time is set, check if datetime is past
  let isOverdue = isPast(date) && !isToday(date)
  if (task.time && isToday(date)) {
    const taskDateTime = new Date(`${task.date}T${task.time}`)
    isOverdue = isPast(taskDateTime)
  }

  let dateLabel = format(date, 'MMM d, yyyy')
  if (isToday(date)) dateLabel = 'Today'
  if (isTomorrow(date)) dateLabel = 'Tomorrow'

  // Get plant names for display
  const linkedPlants = (task.plantIds || [])
    .map(id => plants[id])
    .filter(Boolean)

  function handleCardClick(e) {
    // Don't trigger edit when clicking checkbox or snooze button
    if (e.target.closest('button') || e.target.closest('a')) return
    onEdit?.(task)
  }

  function handleCheckboxClick(e) {
    e.stopPropagation()
    onComplete(task.id)
  }

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border ${isOverdue ? 'border-red-200' : 'border-gray-100'} ${onEdit ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className="mt-0.5 w-6 h-6 rounded-full border-2 border-green-500 flex-shrink-0 flex items-center justify-center touch-feedback hover:bg-green-50"
        >
          {task.completed === 1 && <CheckIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium">{task.description}</p>

          {/* Plant links */}
          {showPlantLinks && linkedPlants.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
              {linkedPlants.map((plant, index) => (
                <span key={plant.id}>
                  <Link
                    to={`/plant/${plant.id}`}
                    className="text-sm text-green-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {plant.name}
                  </Link>
                  {index < linkedPlants.length - 1 && (
                    <span className="text-gray-400">,</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {linkedPlants.length === 0 && showPlantLinks && (
            <span className="text-sm text-gray-400">No plants linked</span>
          )}

          {/* Show time if set */}
          {task.time && (
            <span className={`text-xs mt-0.5 block ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              at {task.time}
            </span>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <span className={`text-sm font-medium ${isOverdue ? 'text-red-500' : isToday(date) ? 'text-green-600' : 'text-gray-500'}`}>
            {dateLabel}
          </span>
          {isToday(date) && onSnooze && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSnooze(task.id)
              }}
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
