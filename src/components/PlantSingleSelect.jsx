import { useState, useEffect } from 'react'
import { db, PlantStatus } from '../db/database'

function ChevronUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function PlantSingleSelect({ selectedId, onChange, excludeIds = [], disabled, label = 'Plant' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [plants, setPlants] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPlants()
  }, [])

  async function loadPlants() {
    try {
      const allPlants = await db.plants
        .where('status')
        .equals(PlantStatus.ACTIVE)
        .toArray()
      allPlants.sort((a, b) => a.name.localeCompare(b.name))
      setPlants(allPlants)
    } catch (error) {
      console.error('Error loading plants:', error)
    }
  }

  const availablePlants = plants.filter(plant => !excludeIds.includes(plant.id))
  const filteredPlants = availablePlants.filter(plant =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedPlant = plants.find(p => p.id === selectedId)

  function selectPlant(plantId) {
    onChange(plantId)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className={selectedPlant ? 'text-gray-900' : 'text-gray-500'}>
          {selectedPlant ? selectedPlant.name : 'Select a plant...'}
        </span>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Invisible overlay to catch clicks outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50 w-full mt-1 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-64 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plants..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>

            {/* Plant list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredPlants.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  {searchQuery ? 'No plants found' : 'No plants available'}
                </div>
              ) : (
                filteredPlants.map(plant => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => selectPlant(plant.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 ${
                      plant.id === selectedId ? 'bg-green-50' : ''
                    }`}
                  >
                    <span className="text-gray-900">{plant.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
