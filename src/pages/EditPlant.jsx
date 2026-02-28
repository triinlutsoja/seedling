import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, PlantLifecycle, FrostTolerance, Months } from '../db/database'
import { deletePlant } from '../utils/plantUtils'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="p-2 -ml-2 touch-feedback">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}

function FormSection({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>
  )
}

function Select({ label, options, value, onChange, placeholder = 'Select...' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function MonthRangeSelect({ label, startValue, endValue, onStartChange, onEndChange }) {
  const monthOptions = Months.map((m, i) => ({ value: i, label: m }))

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <select
          value={startValue ?? ''}
          onChange={onStartChange}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        >
          <option value="">Start</option>
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-gray-400">to</span>
        <select
          value={endValue ?? ''}
          onChange={onEndChange}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        >
          <option value="">End</option>
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function TextArea({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        {...props}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        rows={4}
      />
    </div>
  )
}

export default function EditPlant() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [latinName, setLatinName] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [sowingStart, setSowingStart] = useState('')
  const [sowingEnd, setSowingEnd] = useState('')
  const [harvestStart, setHarvestStart] = useState('')
  const [harvestEnd, setHarvestEnd] = useState('')
  const [frostTolerance, setFrostTolerance] = useState('')
  const [instructions, setInstructions] = useState('')

  // Photo state
  const [currentMainPhoto, setCurrentMainPhoto] = useState(null)
  const [newMainPhoto, setNewMainPhoto] = useState(null)

  // Unsaved changes state
  const [originalValues, setOriginalValues] = useState(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadPlant()
  }, [id])

  async function loadPlant() {
    try {
      const plant = await db.plants.get(parseInt(id))
      if (!plant) {
        navigate('/')
        return
      }

      const loadedName = plant.name || ''
      const loadedLatinName = plant.latinName || ''
      const loadedLifecycle = plant.lifecycle || ''
      const loadedSowingStart = plant.sowingPeriod?.start?.toString() ?? ''
      const loadedSowingEnd = plant.sowingPeriod?.end?.toString() ?? ''
      const loadedHarvestStart = plant.harvestPeriod?.start?.toString() ?? ''
      const loadedHarvestEnd = plant.harvestPeriod?.end?.toString() ?? ''
      const loadedFrostTolerance = plant.frostTolerance || ''
      const loadedInstructions = plant.instructions || ''

      setName(loadedName)
      setLatinName(loadedLatinName)
      setLifecycle(loadedLifecycle)
      setSowingStart(loadedSowingStart)
      setSowingEnd(loadedSowingEnd)
      setHarvestStart(loadedHarvestStart)
      setHarvestEnd(loadedHarvestEnd)
      setFrostTolerance(loadedFrostTolerance)
      setInstructions(loadedInstructions)

      setOriginalValues({
        name: loadedName,
        latinName: loadedLatinName,
        lifecycle: loadedLifecycle,
        sowingStart: loadedSowingStart,
        sowingEnd: loadedSowingEnd,
        harvestStart: loadedHarvestStart,
        harvestEnd: loadedHarvestEnd,
        frostTolerance: loadedFrostTolerance,
        instructions: loadedInstructions,
      })

      // Load current main photo
      const mainPhoto = await db.photos
        .where('plantId')
        .equals(parseInt(id))
        .filter(photo => photo.isMainPhoto === true)
        .first()
      if (mainPhoto) {
        setCurrentMainPhoto(mainPhoto)
      }
    } catch (error) {
      console.error('Error loading plant:', error)
    }
    setLoading(false)
  }

  function handlePhotoSelect(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setNewMainPhoto(event.target.result)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const lifecycleOptions = Object.entries(PlantLifecycle).map(([key, value]) => ({
    value: value,
    label: value
  }))

  const frostOptions = Object.entries(FrostTolerance).map(([key, value]) => ({
    value: value,
    label: value
  }))

  const hasUnsavedChanges = originalValues !== null && (
    name !== originalValues.name ||
    latinName !== originalValues.latinName ||
    lifecycle !== originalValues.lifecycle ||
    sowingStart !== originalValues.sowingStart ||
    sowingEnd !== originalValues.sowingEnd ||
    harvestStart !== originalValues.harvestStart ||
    harvestEnd !== originalValues.harvestEnd ||
    frostTolerance !== originalValues.frostTolerance ||
    instructions !== originalValues.instructions ||
    newMainPhoto !== null
  )

  function handleBack() {
    if (hasUnsavedChanges) {
      setShowLeaveModal(true)
    } else {
      navigate(`/plant/${id}`)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await db.plants.update(parseInt(id), {
        name: name.trim(),
        latinName: latinName.trim() || null,
        lifecycle: lifecycle || null,
        sowingPeriod: sowingStart !== '' ? {
          start: parseInt(sowingStart),
          end: parseInt(sowingEnd || sowingStart)
        } : null,
        harvestPeriod: harvestStart !== '' ? {
          start: parseInt(harvestStart),
          end: parseInt(harvestEnd || harvestStart)
        } : null,
        frostTolerance: frostTolerance || null,
        instructions: instructions.trim() || null
      })

      // Save new main photo if one was selected
      if (newMainPhoto) {
        // Unset any existing main photo for this plant
        const existingMainPhotos = await db.photos
          .where('plantId')
          .equals(parseInt(id))
          .filter(photo => photo.isMainPhoto === true)
          .toArray()

        for (const photo of existingMainPhotos) {
          await db.photos.update(photo.id, { isMainPhoto: false })
        }

        // Add the new main photo
        await db.photos.add({
          plantId: parseInt(id),
          diaryEntryId: null,
          dataUrl: newMainPhoto,
          createdAt: new Date().toISOString(),
          isMainPhoto: true
        })
      }

      navigate(`/plant/${id}`)
    } catch (error) {
      console.error('Error updating plant:', error)
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePlant(id)
      navigate('/', {
        state: { message: `${name} has been permanently deleted.` }
      })
    } catch (error) {
      console.error('Error deleting plant:', error)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-green-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-green-50 safe-area-top hide-scrollbar">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <BackButton onClick={handleBack} />
          <h1 className="text-lg font-semibold">Edit Plant</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-8">
        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div className="w-32 h-32 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden relative">
              {newMainPhoto || currentMainPhoto ? (
                <>
                  <img
                    src={newMainPhoto || currentMainPhoto?.dataUrl}
                    alt="Plant"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <svg className="w-12 h-12 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs">Add Photo</span>
                </div>
              )}
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2">Tap to set profile picture</p>
        </div>

        <FormSection title="Basic Info">
          <Input
            label="Plant Name *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cherry Tomatoes"
            required
          />
          <Input
            label="Latin Name"
            type="text"
            value={latinName}
            onChange={(e) => setLatinName(e.target.value)}
            placeholder="e.g., Solanum lycopersicum"
          />
          <Select
            label="Plant Type"
            options={lifecycleOptions}
            value={lifecycle}
            onChange={(e) => setLifecycle(e.target.value)}
            placeholder="Select type..."
          />
        </FormSection>

        <FormSection title="Growing Season">
          <MonthRangeSelect
            label="Sowing Period"
            startValue={sowingStart}
            endValue={sowingEnd}
            onStartChange={(e) => setSowingStart(e.target.value)}
            onEndChange={(e) => setSowingEnd(e.target.value)}
          />
          <MonthRangeSelect
            label="Harvest Period"
            startValue={harvestStart}
            endValue={harvestEnd}
            onStartChange={(e) => setHarvestStart(e.target.value)}
            onEndChange={(e) => setHarvestEnd(e.target.value)}
          />
          <Select
            label="Frost Tolerance"
            options={frostOptions}
            value={frostTolerance}
            onChange={(e) => setFrostTolerance(e.target.value)}
            placeholder="Select tolerance..."
          />
        </FormSection>

        <FormSection title="Growing Instructions">
          <TextArea
            label="Notes"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add growing tips, spacing requirements, etc..."
          />
        </FormSection>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold touch-feedback disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden mt-6">
          <div className="px-4 py-3 border-b border-red-100 bg-red-50">
            <h2 className="font-semibold text-red-800">Danger Zone</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              Permanently delete this plant and all its associated data including diary entries, photos, and task links.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 border-2 border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
            >
              Delete Plant
            </button>
          </div>
        </div>
      </form>

      {/* Unsaved Changes Modal */}
      {showLeaveModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowLeaveModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
              <div className="flex justify-center pt-6">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="px-6 pt-4 pb-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
                <p className="text-gray-600 text-sm">You have unsaved changes. Are you sure you want to leave?</p>
              </div>
              <div className="flex border-t border-gray-100">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-bl-2xl"
                >
                  Keep Editing
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => navigate(`/plant/${id}`)}
                  className="flex-1 py-3 text-red-600 font-medium hover:bg-red-50 rounded-br-2xl"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Plant?"
        message={`Are you sure you want to permanently delete "${name}" and all its data? This includes all diary entries, photos, and task links. This action cannot be undone.`}
        confirmText="Delete Plant"
        isDeleting={deleting}
      />
    </div>
  )
}
