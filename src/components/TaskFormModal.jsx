import { useState, useEffect } from 'react'
import PlantMultiSelect from './PlantMultiSelect'
import { requestNotificationPermission, notificationsSupported } from '../utils/notifications'

function XIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function TaskFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode = 'create',
  initialData = null,
  preSelectedPlantId = null
}) {
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [plantIds, setPlantIds] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setDescription(initialData.description || '')
        setDate(initialData.date || '')
        setTime(initialData.time || '')
        setPlantIds(initialData.plantIds || [])
      } else {
        // Create mode - reset form
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setTime('')
        setPlantIds(preSelectedPlantId ? [preSelectedPlantId] : [])
      }
    }
  }, [isOpen, mode, initialData, preSelectedPlantId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim() || !date) return

    setSaving(true)

    // Request notification permission if time is set
    if (time && notificationsSupported()) {
      await requestNotificationPermission()
    }

    try {
      await onSave({
        id: initialData?.id,
        description: description.trim(),
        date,
        time: time || null,
        plantIds,
        completed: initialData?.completed || 0,
        createdAt: initialData?.createdAt || new Date().toISOString()
      })
      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!initialData?.id) return
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await onDelete(initialData.id)
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'New Task' : 'Edit Task'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XIcon />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                autoFocus
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Time (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-gray-400 font-normal">(optional, for notifications)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Plant selection */}
            <PlantMultiSelect
              selectedIds={plantIds}
              onChange={setPlantIds}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <TrashIcon />
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !description.trim() || !date}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
