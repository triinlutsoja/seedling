import { useState, useEffect, useRef } from 'react'
import { db, PlantStatus } from '../db/database'

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

function XIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function PlantMultiSelect({ selectedIds, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [plants, setPlants] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadPlants()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedPlants = plants.filter(p => selectedIds.includes(p.id))

  function togglePlant(plantId) {
    if (selectedIds.includes(plantId)) {
      onChange(selectedIds.filter(id => id !== plantId))
    } else {
      onChange([...selectedIds, plantId])
    }
  }

  function removePlant(plantId, e) {
    e.stopPropagation()
    onChange(selectedIds.filter(id => id !== plantId))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Plants
      </label>

      {/* Selected plants chips */}
      {selectedPlants.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedPlants.map(plant => (
            <span
              key={plant.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full"
            >
              {plant.name}
              <button
                type="button"
                onClick={(e) => removePlant(plant.id, e)}
                className="hover:bg-green-200 rounded-full p-0.5"
                disabled={disabled}
              >
                <XIcon />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className="text-gray-500">
          {selectedIds.length === 0
            ? 'Select plants...'
            : `${selectedIds.length} plant${selectedIds.length > 1 ? 's' : ''} selected`
          }
        </span>
        <ChevronDownIcon />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
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
                {searchQuery ? 'No plants found' : 'No active plants'}
              </div>
            ) : (
              filteredPlants.map(plant => {
                const isSelected = selectedIds.includes(plant.id)
                return (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => togglePlant(plant.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 ${
                      isSelected ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckIcon />}
                    </div>
                    <span className="text-gray-900">{plant.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
