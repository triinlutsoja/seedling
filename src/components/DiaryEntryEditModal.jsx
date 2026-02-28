import { useState, useEffect } from 'react'
import DeleteConfirmModal from './DeleteConfirmModal'
import { CareStages } from '../db/database'

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

export default function DiaryEntryEditModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  entry,
  existingPhotos = []
}) {
  const [date, setDate] = useState('')
  const [careStage, setCareStage] = useState('')
  const [note, setNote] = useState('')
  const [photosToRemove, setPhotosToRemove] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen && entry) {
      setDate(entry.date || new Date().toISOString().split('T')[0])
      setCareStage(entry.careStage || '')
      setNote(entry.note || '')
      setPhotosToRemove([])
      setNewPhotos([])
    }
  }, [isOpen, entry])

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setNewPhotos(prev => [...prev, event.target.result])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removeExistingPhoto(photoId) {
    setPhotosToRemove(prev => [...prev, photoId])
  }

  function removeNewPhoto(index) {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(entry.id, {
        date,
        careStage: careStage || null,
        note: note.trim() || null,
        photosToRemove,
        newPhotos
      })
      onClose()
    } catch (error) {
      console.error('Error saving diary entry:', error)
    }
    setSaving(false)
  }

  async function handleDeleteConfirm() {
    if (!entry?.id) return
    setDeleting(true)
    try {
      await onDelete(entry.id)
      setShowDeleteModal(false)
      onClose()
    } catch (error) {
      console.error('Error deleting diary entry:', error)
    }
    setDeleting(false)
  }

  if (!isOpen) return null

  const isTaskCompleted = entry?.careStage === 'task_completed'
  const keptPhotos = existingPhotos.filter(p => !photosToRemove.includes(p.id))

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
              Edit Diary Entry
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
            {/* Info for task_completed entries */}
            {isTaskCompleted && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  This entry was created by completing a task. Editing it here won't affect the original task.
                </p>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Care Stage (not shown for task_completed entries) */}
            {!isTaskCompleted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Care Stage (optional)</label>
                <select
                  value={careStage}
                  onChange={(e) => setCareStage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">General note</option>
                  {CareStages.filter(s => s.id !== 'task_completed').map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add notes about this entry..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                autoFocus
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
              <div className="flex flex-wrap gap-2">
                {keptPhotos.map(photo => (
                  <div key={photo.id} className="relative w-16 h-16">
                    <img src={photo.dataUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newPhotos.map((photo, index) => (
                  <div key={`new-${index}`} className="relative w-16 h-16">
                    <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    multiple
                  />
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <TrashIcon />
              </button>
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
                disabled={saving}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete this diary entry?"
        message="This cannot be undone."
        confirmText="Delete Entry"
        isDeleting={deleting}
      />
    </>
  )
}
