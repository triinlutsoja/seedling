import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db, PlantStatus, CareStages, Months } from '../db/database'
import { format } from 'date-fns'
import PhotoGallery from '../components/PhotoGallery'

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

export default function PlantProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plant, setPlant] = useState(null)
  const [diaryEntries, setDiaryEntries] = useState([])
  const [entryPhotos, setEntryPhotos] = useState({}) // { entryId: [photo, ...] }
  const [reminders, setReminders] = useState([])
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

      // Load reminders
      const plantReminders = await db.reminders
        .where('plantId')
        .equals(parseInt(id))
        .toArray()
      plantReminders.sort((a, b) => new Date(a.date) - new Date(b.date))
      setReminders(plantReminders)
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
    e.target.value = '' // Reset input
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

      // Save photos linked to this entry
      for (const dataUrl of newPhotos) {
        await db.photos.add({
          plantId: parseInt(id),
          diaryEntryId: entryId,
          dataUrl,
          createdAt: new Date().toISOString()
        })
      }

      // Refresh entries and reset form
      await loadPlant()
      resetEntryForm()
    } catch (error) {
      console.error('Error saving diary entry:', error)
    }
    setSaving(false)
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

  // Get upcoming reminders (not completed)
  const upcomingReminders = reminders.filter(r => !r.completed)

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

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <Section title="Upcoming Reminders">
            <div className="space-y-2">
              {upcomingReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">{reminder.description}</p>
                    <p className="text-gray-500 text-xs">{format(new Date(reminder.date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

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
                    {CareStages.map(stage => (
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
                        return (
                          <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">
                                {format(new Date(entry.date), 'MMM d')}
                              </span>
                              {stage && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
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
          loadPlant() // Refresh to get updated main photo
        }}
      />
    </div>
  )
}
