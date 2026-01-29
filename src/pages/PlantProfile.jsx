import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db, PlantStatus, CareStages, Months } from '../db/database'
import { format } from 'date-fns'

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
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
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
    <div className="min-h-screen bg-green-50 safe-area-top">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={() => navigate(-1)} />
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
          <div className="w-20 h-20 rounded-xl bg-green-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            {plant.photoUrl ? (
              <img src={plant.photoUrl} alt={plant.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </div>
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
        <Section title="Diary">
          {diaryEntries.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No diary entries yet</p>
          ) : (
            <div className="space-y-4">
              {years.map(year => (
                <div key={year}>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">{year}</h3>
                  <div className="space-y-2">
                    {entriesByYear[year].map(entry => {
                      const stage = CareStages.find(s => s.id === entry.careStage)
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
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
