import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db, PlantStatus, CareStages, Months } from '../db/database'
import { format, isToday, isPast } from 'date-fns'
import PhotoGallery from '../components/PhotoGallery'
import TaskFormModal from '../components/TaskFormModal'
import CompanionFormModal from '../components/CompanionFormModal'
import { scheduleNotification, cancelNotification } from '../utils/notifications'

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="p-2 -ml-2 touch-feedback">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function CompanionCard({ plant, photo, benefits, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer active:bg-gray-100"
    >
      <div className="w-12 h-12 rounded-lg bg-green-100 flex-shrink-0 overflow-hidden">
        {photo ? (
          <img src={photo.dataUrl} alt={plant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{plant.name}</p>
        <p className="text-sm text-gray-500 line-clamp-2">{benefits}</p>
      </div>
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

export default function PlantProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plant, setPlant] = useState(null)
  const [diaryEntries, setDiaryEntries] = useState([])
  const [entryPhotos, setEntryPhotos] = useState({})
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [mainPhoto, setMainPhoto] = useState(null)
  const [showGallery, setShowGallery] = useState(false)
  const [totalPhotos, setTotalPhotos] = useState(0)

  // Diary entry form state
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0])
  const [entryCareStage, setEntryCareStage] = useState('')
  const [entryNote, setEntryNote] = useState('')
  const [newPhotos, setNewPhotos] = useState([])
  const [saving, setSaving] = useState(false)

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editingDiaryEntryId, setEditingDiaryEntryId] = useState(null)

  // Companion plants state
  const [companionMode, setCompanionMode] = useState('helpedBy')
  const [companionsHelpedBy, setCompanionsHelpedBy] = useState([])
  const [companionsHelps, setCompanionsHelps] = useState([])
  const [companionModalOpen, setCompanionModalOpen] = useState(false)
  const [editingCompanion, setEditingCompanion] = useState(null)

  useEffect(() => {
    loadPlant()
  }, [id])

  async function loadPlant() {
    try {
      const plantData = await db.plants.get(parseInt(id))
      if (!plantData) {
        navigate('/')
        return
      }
      setPlant(plantData)

      // Load diary entries
      const entries = await db.diaryEntries
        .where('plantId')
        .equals(parseInt(id))
        .toArray()
      entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      setDiaryEntries(entries)

      // Load photos for entries
      const photos = await db.photos
        .where('plantId')
        .equals(parseInt(id))
        .toArray()
      const photosByEntry = photos.reduce((acc, photo) => {
        if (photo.diaryEntryId) {
          if (!acc[photo.diaryEntryId]) acc[photo.diaryEntryId] = []
          acc[photo.diaryEntryId].push(photo)
        }
        return acc
      }, {})
      setEntryPhotos(photosByEntry)
      setTotalPhotos(photos.length)

      // Find the main photo
      const main = photos.find(p => p.isMainPhoto === true)
      setMainPhoto(main || null)

      // Load tasks for this plant using multiEntry index
      const plantTasks = await db.tasks
        .where('plantIds')
        .equals(parseInt(id))
        .toArray()
      // Filter incomplete and sort by date
      const incompleteTasks = plantTasks.filter(t => t.completed === 0)
      incompleteTasks.sort((a, b) => new Date(a.date) - new Date(b.date))
      setTasks(incompleteTasks)

      // Load companion plants that help THIS plant (helpedBy)
      const helpedByRelations = await db.companionPlantings
        .where('plantId')
        .equals(parseInt(id))
        .toArray()
      const helpedByDetails = await Promise.all(
        helpedByRelations.map(async (relation) => {
          const companionPlant = await db.plants.get(relation.companionPlantId)
          const photo = await db.photos
            .where('plantId')
            .equals(relation.companionPlantId)
            .filter(p => p.isMainPhoto === true)
            .first()
          return { ...relation, companionPlant, mainPhoto: photo }
        })
      )
      setCompanionsHelpedBy(helpedByDetails.filter(c => c.companionPlant))

      // Load plants THIS plant helps (helps)
      const helpsRelations = await db.companionPlantings
        .where('companionPlantId')
        .equals(parseInt(id))
        .toArray()
      const helpsDetails = await Promise.all(
        helpsRelations.map(async (relation) => {
          const helpedPlant = await db.plants.get(relation.plantId)
          const photo = await db.photos
            .where('plantId')
            .equals(relation.plantId)
            .filter(p => p.isMainPhoto === true)
            .first()
          return { ...relation, helpedPlant, mainPhoto: photo }
        })
      )
      setCompanionsHelps(helpsDetails.filter(c => c.helpedPlant))
    } catch (error) {
      console.error('Error loading plant:', error)
    }
    setLoading(false)
  }

  async function toggleArchive() {
    const newStatus = plant.status === PlantStatus.ACTIVE ? PlantStatus.ARCHIVED : PlantStatus.ACTIVE
    await db.plants.update(plant.id, { status: newStatus })
    setPlant({ ...plant, status: newStatus })
  }

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

  function removeNewPhoto(index) {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
  }

  function resetEntryForm() {
    setShowEntryForm(false)
    setEntryDate(new Date().toISOString().split('T')[0])
    setEntryCareStage('')
    setEntryNote('')
    setNewPhotos([])
  }

  async function handleSaveEntry() {
    setSaving(true)
    try {
      const entryId = await db.diaryEntries.add({
        plantId: parseInt(id),
        date: entryDate,
        careStage: entryCareStage || null,
        note: entryNote.trim() || null,
        year: new Date(entryDate).getFullYear()
      })

      for (const dataUrl of newPhotos) {
        await db.photos.add({
          plantId: parseInt(id),
          diaryEntryId: entryId,
          dataUrl,
          createdAt: new Date().toISOString()
        })
      }

      await loadPlant()
      resetEntryForm()
    } catch (error) {
      console.error('Error saving diary entry:', error)
    }
    setSaving(false)
  }

  async function handleCompleteTask(taskId) {
    try {
      const task = await db.tasks.get(taskId)
      if (!task) return

      // Create diary entry for this plant
      await db.diaryEntries.add({
        plantId: parseInt(id),
        date: new Date().toISOString().split('T')[0],
        careStage: 'task_completed',
        note: task.description,
        year: new Date().getFullYear(),
        taskId: taskId
      })

      // If task is only linked to this plant, mark as completed
      // Otherwise, remove this plant from plantIds and track in completedPlantIds
      if (task.plantIds.length === 1) {
        await db.tasks.update(taskId, { completed: 1 })
        cancelNotification(taskId)
      } else {
        const newPlantIds = task.plantIds.filter(pid => pid !== parseInt(id))
        const completedPlantIds = [...(task.completedPlantIds || []), parseInt(id)]
        await db.tasks.update(taskId, { plantIds: newPlantIds, completedPlantIds })
      }

      await loadPlant()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  function handleEditTask(task) {
    setEditingTask(task)
    setTaskModalOpen(true)
  }

  function handleOpenCreateTask() {
    setEditingTask(null)
    setTaskModalOpen(true)
  }

  function handleCloseTaskModal() {
    setTaskModalOpen(false)
    setEditingTask(null)
    setEditingDiaryEntryId(null)
  }

  async function handleSaveTask(taskData) {
    try {
      if (taskData.id) {
        await db.tasks.update(taskData.id, {
          description: taskData.description,
          date: taskData.date,
          time: taskData.time,
          plantIds: taskData.plantIds
        })

        // Sync description to all diary entries linked to this task
        const linkedEntries = await db.diaryEntries
          .where('careStage')
          .equals('task_completed')
          .filter(e => e.taskId === taskData.id)
          .toArray()
        for (const entry of linkedEntries) {
          await db.diaryEntries.update(entry.id, { note: taskData.description })
        }

        if (taskData.time) {
          scheduleNotification(taskData)
        } else {
          cancelNotification(taskData.id)
        }
      } else {
        const newId = await db.tasks.add({
          description: taskData.description,
          date: taskData.date,
          time: taskData.time,
          plantIds: taskData.plantIds,
          completed: 0,
          createdAt: new Date().toISOString()
        })

        if (taskData.time) {
          scheduleNotification({ ...taskData, id: newId })
        }
      }

      await loadPlant()
    } catch (error) {
      console.error('Error saving task:', error)
      throw error
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await db.tasks.delete(taskId)
      cancelNotification(taskId)
      await loadPlant()
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  async function handleDiaryEntryClick(entry) {
    if (entry.careStage !== 'task_completed' || !entry.taskId) return
    try {
      const task = await db.tasks.get(entry.taskId)
      if (!task) return
      setEditingTask(task)
      setEditingDiaryEntryId(entry.id)
      setTaskModalOpen(true)
    } catch (error) {
      console.error('Error loading task from diary entry:', error)
    }
  }

  async function handleUncompleteTask() {
    if (!editingTask || !editingDiaryEntryId) return
    try {
      const task = await db.tasks.get(editingTask.id)
      if (!task) return

      // Restore task as incomplete
      const plantIdInt = parseInt(id)
      const updates = { completed: 0 }

      // Ensure this plant is in the task's plantIds
      if (!task.plantIds.includes(plantIdInt)) {
        updates.plantIds = [...task.plantIds, plantIdInt]
      }

      // Remove this plant from completedPlantIds
      if (task.completedPlantIds?.length) {
        updates.completedPlantIds = task.completedPlantIds.filter(pid => pid !== plantIdInt)
      }

      await db.tasks.update(task.id, updates)

      // Delete the diary entry
      await db.diaryEntries.delete(editingDiaryEntryId)

      // Reschedule notification if task has a time
      if (task.time) {
        scheduleNotification({ ...task, ...updates })
      }

      handleCloseTaskModal()
      await loadPlant()
    } catch (error) {
      console.error('Error uncompleting task:', error)
      throw error
    }
  }

  function handleEditCompanion(companion) {
    setEditingCompanion(companion)
    setCompanionModalOpen(true)
  }

  function handleOpenCreateCompanion() {
    setEditingCompanion(null)
    setCompanionModalOpen(true)
  }

  function handleCloseCompanionModal() {
    setCompanionModalOpen(false)
    setEditingCompanion(null)
  }

  async function handleSaveCompanion(data) {
    if (data.id) {
      await db.companionPlantings.update(data.id, {
        companionPlantId: data.companionPlantId,
        benefits: data.benefits
      })
    } else {
      await db.companionPlantings.add({
        plantId: parseInt(id),
        companionPlantId: data.companionPlantId,
        benefits: data.benefits
      })
    }
    await loadPlant()
  }

  async function handleDeleteCompanion(companionId) {
    await db.companionPlantings.delete(companionId)
    await loadPlant()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-green-50">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!plant) return null

  // Group diary entries by year
  const entriesByYear = diaryEntries.reduce((acc, entry) => {
    const year = new Date(entry.date).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(entry)
    return acc
  }, {})

  const years = Object.keys(entriesByYear).sort((a, b) => b - a)

  const formatPeriod = (period) => {
    if (!period || period.start === undefined) return 'Not set'
    return `${Months[period.start]} - ${Months[period.end]}`
  }

  return (
    <div className="h-full overflow-y-auto bg-green-50 safe-area-top hide-scrollbar">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={() => navigate('/')} />
          <div className="flex items-center gap-2">
            <Link
              to={`/plant/${id}/edit`}
              className="p-2 touch-feedback"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
            <button onClick={toggleArchive} className="p-2 touch-feedback">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Plant photo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => totalPhotos > 0 && setShowGallery(true)}
            className={`w-20 h-20 rounded-xl bg-green-500 flex items-center justify-center overflow-hidden flex-shrink-0 relative ${totalPhotos > 0 ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {mainPhoto ? (
              <img src={mainPhoto.dataUrl} alt={plant.name} className="w-full h-full object-cover" />
            ) : plant.photoUrl ? (
              <img src={plant.photoUrl} alt={plant.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
            {totalPhotos > 0 && (
              <div className="absolute bottom-1 right-1 bg-black/50 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white text-xs font-medium">{totalPhotos}</span>
              </div>
            )}
          </button>
          <div>
            <h1 className="text-2xl font-bold">{plant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                plant.status === PlantStatus.ACTIVE
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {plant.status === PlantStatus.ACTIVE ? 'Active' : 'Archived'}
              </span>
              {plant.lifecycle && (
                <span className="text-green-200 text-sm">{plant.lifecycle}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 pb-8">
        {/* General Info */}
        <Section title="General Info">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-900">{plant.lifecycle || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sowing Period</span>
              <span className="text-gray-900">{formatPeriod(plant.sowingPeriod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Harvest Period</span>
              <span className="text-gray-900">{formatPeriod(plant.harvestPeriod)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Frost Tolerance</span>
              <span className="text-gray-900">{plant.frostTolerance || 'Not set'}</span>
            </div>
          </div>
        </Section>

        {/* Growing Instructions */}
        {plant.instructions && (
          <Section title="Growing Instructions">
            <p className="text-gray-700 whitespace-pre-wrap">{plant.instructions}</p>
          </Section>
        )}

        {/* Companion Plants */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Companion Plants</h2>
            <button
              onClick={handleOpenCreateCompanion}
              className="p-1 touch-feedback rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {/* Toggle buttons */}
            {(companionsHelpedBy.length > 0 || companionsHelps.length > 0) && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setCompanionMode('helpedBy')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    companionMode === 'helpedBy'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Helped by ({companionsHelpedBy.length})
                </button>
                <button
                  onClick={() => setCompanionMode('helps')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    companionMode === 'helps'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Helps ({companionsHelps.length})
                </button>
              </div>
            )}

            {/* Explanatory text */}
            {(companionsHelpedBy.length > 0 || companionsHelps.length > 0) && (
              <p className="text-sm text-gray-500 mb-3">
                {companionMode === 'helpedBy'
                  ? `${plant.name} grows best when the following are planted nearby:`
                  : `${plant.name} is a beneficial companion to:`
                }
              </p>
            )}

            {/* Companion list */}
            {companionMode === 'helpedBy' ? (
              companionsHelpedBy.length > 0 ? (
                <div className="space-y-2">
                  {companionsHelpedBy.map(companion => (
                    <div key={companion.id} className="flex items-center gap-2">
                      <div
                        onClick={() => navigate(`/plant/${companion.companionPlantId}`)}
                        className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer active:bg-gray-100"
                      >
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex-shrink-0 overflow-hidden">
                          {companion.mainPhoto ? (
                            <img src={companion.mainPhoto.dataUrl} alt={companion.companionPlant.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{companion.companionPlant.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-2">{companion.benefits}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <button
                        onClick={() => handleEditCompanion(companion)}
                        className="p-2 text-gray-400 hover:text-green-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No companion plants added</p>
              )
            ) : (
              companionsHelps.length > 0 ? (
                <div className="space-y-2">
                  {companionsHelps.map(companion => (
                    <CompanionCard
                      key={companion.id}
                      plant={companion.helpedPlant}
                      photo={companion.mainPhoto}
                      benefits={companion.benefits}
                      onClick={() => navigate(`/plant/${companion.plantId}`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">{plant.name} is not a companion to any plants</p>
              )
            )}
          </div>
        </div>

        {/* To-Do Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">To-Do</h2>
            <button
              onClick={handleOpenCreateTask}
              className="p-1 touch-feedback rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-center py-2">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const date = new Date(task.date)
                  let isOverdue = isPast(date) && !isToday(date)
                  if (task.time && isToday(date)) {
                    const taskDateTime = new Date(`${task.date}T${task.time}`)
                    isOverdue = isPast(taskDateTime)
                  }
                  let dateLabel = format(date, 'MMM d, yyyy')
                  if (isToday(date)) dateLabel = 'Today'

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer active:bg-gray-100 ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}
                      onClick={() => handleEditTask(task)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompleteTask(task.id)
                        }}
                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-green-500 flex-shrink-0 flex items-center justify-center hover:bg-green-50"
                      >
                        {task.completed === 1 && <CheckIcon />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-medium">{task.description}</p>
                        {task.time && (
                          <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>at {task.time}</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                        {dateLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Diary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Diary</h2>
            <button
              onClick={() => setShowEntryForm(!showEntryForm)}
              className="p-1 touch-feedback rounded-full hover:bg-gray-100"
            >
              <svg className={`w-6 h-6 text-green-600 transition-transform ${showEntryForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {/* New Entry Form */}
            {showEntryForm && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Care Stage (optional)</label>
                  <select
                    value={entryCareStage}
                    onChange={(e) => setEntryCareStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="">General note</option>
                    {CareStages.filter(s => s.id !== 'task_completed').map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    value={entryNote}
                    onChange={(e) => setEntryNote(e.target.value)}
                    placeholder="Add notes about this entry..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newPhotos.map((photo, index) => (
                      <div key={index} className="relative w-16 h-16">
                        <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button
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
                <div className="flex gap-2">
                  <button
                    onClick={resetEntryForm}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium touch-feedback"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEntry}
                    disabled={saving}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium touch-feedback disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>
            )}

            {/* Diary Entries List */}
            {diaryEntries.length === 0 && !showEntryForm ? (
              <p className="text-gray-400 text-center py-4">No diary entries yet</p>
            ) : diaryEntries.length > 0 && (
              <div className="space-y-4">
                {years.map(year => (
                  <div key={year}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{year}</h3>
                    <div className="space-y-2">
                      {entriesByYear[year].map(entry => {
                        const stage = CareStages.find(s => s.id === entry.careStage)
                        const photos = entryPhotos[entry.id] || []
                        const isClickable = entry.careStage === 'task_completed' && entry.taskId
                        return (
                          <div
                            key={entry.id}
                            className={`p-3 bg-gray-50 rounded-lg ${isClickable ? 'cursor-pointer active:bg-gray-100' : ''}`}
                            onClick={isClickable ? () => handleDiaryEntryClick(entry) : undefined}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">
                                {format(new Date(entry.date), 'MMM d')}
                              </span>
                              {stage && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  stage.id === 'task_completed'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {stage.label}
                                </span>
                              )}
                            </div>
                            {entry.note && (
                              <p className="text-gray-700 text-sm">{entry.note}</p>
                            )}
                            {photos.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {photos.map(photo => (
                                  <img
                                    key={photo.id}
                                    src={photo.dataUrl}
                                    alt=""
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      <PhotoGallery
        plantId={id}
        isOpen={showGallery}
        onClose={() => {
          setShowGallery(false)
          loadPlant()
        }}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onUncomplete={editingDiaryEntryId ? handleUncompleteTask : undefined}
        mode={editingTask ? 'edit' : 'create'}
        initialData={editingTask}
        preSelectedPlantId={parseInt(id)}
      />

      {/* Companion Form Modal */}
      <CompanionFormModal
        isOpen={companionModalOpen}
        onClose={handleCloseCompanionModal}
        onSave={handleSaveCompanion}
        onDelete={handleDeleteCompanion}
        mode={editingCompanion ? 'edit' : 'create'}
        initialData={editingCompanion}
        currentPlantId={parseInt(id)}
        existingCompanionIds={companionsHelpedBy.map(c => c.companionPlantId)}
      />
    </div>
  )
}
