import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db, PlantStatus } from '../db/database'

function SearchIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function PlantCard({ plant }) {
  return (
    <Link
      to={`/plant/${plant.id}`}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 touch-feedback block"
    >
      <div className="flex items-center gap-3">
        {/* Plant photo or placeholder */}
        <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {plant.photoUrl ? (
            <img src={plant.photoUrl} alt={plant.name} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{plant.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{plant.lifecycle || 'Plant'}</p>
        </div>

        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${plant.status === PlantStatus.ACTIVE ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>
    </Link>
  )
}

function EmptyState({ showArchived }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {showArchived ? 'No archived plants' : 'No plants yet'}
      </h3>
      <p className="text-gray-500 mb-6">
        {showArchived
          ? 'Archived plants will appear here'
          : 'Start building your garden by adding your first plant'
        }
      </p>
      {!showArchived && (
        <Link
          to="/plant/new"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold touch-feedback"
        >
          <PlusIcon />
          Add First Plant
        </Link>
      )}
    </div>
  )
}

export default function MyGarden() {
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlants()
  }, [showArchived])

  async function loadPlants() {
    setLoading(true)
    try {
      const status = showArchived ? PlantStatus.ARCHIVED : PlantStatus.ACTIVE
      const allPlants = await db.plants.where('status').equals(status).toArray()
      setPlants(allPlants)
    } catch (error) {
      console.error('Error loading plants:', error)
    }
    setLoading(false)
  }

  // Filter plants by search query
  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold mb-4">My Garden</h1>

        {/* Toggle */}
        <div className="flex bg-green-700/50 rounded-lg p-1 mb-4">
          <button
            onClick={() => setShowArchived(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !showArchived ? 'bg-white text-green-700' : 'text-green-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              showArchived ? 'bg-white text-green-700' : 'text-green-100'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search plants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>
      </header>

      {/* Content */}
      <div className="px-4 -mt-2">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredPlants.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No plants found matching "{searchQuery}"</p>
            </div>
          ) : (
            <EmptyState showArchived={showArchived} />
          )
        ) : (
          <div className="space-y-3">
            {filteredPlants.map(plant => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {!showArchived && plants.length > 0 && (
        <Link
          to="/plant/new"
          className="fixed bottom-20 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center touch-feedback z-10"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <PlusIcon />
        </Link>
      )}
    </div>
  )
}
