import { useState, useEffect } from 'react'
import { db, PlantStatus, Months } from '../db/database'

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CalendarView({ plants, type }) {
  const title = type === 'sowing' ? 'Sowing Calendar' : 'Harvest Calendar'
  const periodField = type === 'sowing' ? 'sowingPeriod' : 'harvestPeriod'
  const emptyMessage = type === 'sowing'
    ? 'Add sowing periods to your plants to see them here'
    : 'Add harvest periods to your plants to see them here'

  // Filter plants that have the relevant period set
  const plantsWithPeriod = plants.filter(plant => {
    const period = plant[periodField]
    return period && (period.start !== undefined || period.end !== undefined)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`${type === 'sowing' ? 'bg-amber-500' : 'bg-green-600'} text-white px-4 py-3`}>
        <h2 className="font-semibold">{title}</h2>
      </div>

      {/* Month headers - using table layout for consistent column alignment */}
      <div>
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-gray-100">
              <th style={{ width: '90px' }} className="py-1 text-left"></th>
              {Months.map((month) => (
                <th key={month} className="text-center py-1 text-xs text-gray-500 font-medium h-12">
                  <span className="inline-block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {month}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {plantsWithPeriod.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-8 px-4">
                  <p className="text-gray-400 text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              plantsWithPeriod.map((plant) => {
                const period = plant[periodField]
                const startMonth = period?.start ?? 0
                const endMonth = period?.end ?? 11

                return (
                  <tr key={plant.id}>
                    <td
                      style={{ width: '90px' }}
                      className="px-2 py-1 text-sm font-medium text-gray-700 whitespace-nowrap overflow-visible relative z-10"
                    >
                      {plant.name}
                    </td>
                    {Months.map((_, index) => {
                      const isActive = index >= startMonth && index <= endMonth
                      return (
                        <td key={index} className="p-0 h-8 align-middle">
                          {isActive && (
                            <div
                              className={`h-4 ${
                                type === 'sowing' ? 'bg-amber-400' : 'bg-green-500'
                              } ${index === startMonth ? 'rounded-l-full ml-0.5' : ''} ${
                                index === endMonth ? 'rounded-r-full mr-0.5' : ''
                              }`}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Calendars() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [calendarType, setCalendarType] = useState('harvest') // 'harvest' or 'sowing'
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedPlantIds, setSelectedPlantIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPlants()
  }, [])

  async function loadPlants() {
    try {
      const activePlants = await db.plants
        .where('status')
        .equals(PlantStatus.ACTIVE)
        .toArray()
      activePlants.sort((a, b) => a.name.localeCompare(b.name))
      setPlants(activePlants)
    } catch (error) {
      console.error('Error loading plants:', error)
    }
    setLoading(false)
  }

  // Filter plants based on selection
  const displayedPlants = selectedPlantIds.length > 0
    ? plants.filter(p => selectedPlantIds.includes(p.id))
    : plants

  // Filter plant list for search
  const filteredPlantList = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function togglePlantSelection(plantId) {
    if (selectedPlantIds.includes(plantId)) {
      setSelectedPlantIds(selectedPlantIds.filter(id => id !== plantId))
    } else {
      setSelectedPlantIds([...selectedPlantIds, plantId])
    }
  }

  function selectAllPlants() {
    setSelectedPlantIds(plants.map(p => p.id))
  }

  function clearAllPlants() {
    setSelectedPlantIds([])
  }

  function clearFilters() {
    setSelectedPlantIds([])
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasActiveFilter = selectedPlantIds.length > 0

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold mb-4">Calendars</h1>

        {plants.length > 0 && (
          <>
            {/* Toggle */}
            <div className="flex bg-green-700/50 rounded-lg p-1 mb-4">
              <button
                onClick={() => setCalendarType('harvest')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  calendarType === 'harvest' ? 'bg-white text-green-700' : 'text-green-100'
                }`}
              >
                Harvest
              </button>
              <button
                onClick={() => setCalendarType('sowing')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  calendarType === 'sowing' ? 'bg-white text-green-700' : 'text-green-100'
                }`}
              >
                Sowing
              </button>
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <div className="flex items-center gap-2">
                  <FilterIcon />
                  <span className={hasActiveFilter ? 'text-gray-900' : 'text-gray-400'}>
                    {hasActiveFilter
                      ? `${selectedPlantIds.length} of ${plants.length} plants selected`
                      : 'Filter plants...'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFilters()
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <XIcon />
                    </button>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {/* Search */}
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

                    {/* Select All / Clear All */}
                    <div className="flex gap-2 p-2 border-b border-gray-100">
                      <button
                        onClick={selectAllPlants}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllPlants}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Plant List */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredPlantList.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          No plants found
                        </div>
                      ) : (
                        filteredPlantList.map(plant => {
                          const isSelected = selectedPlantIds.includes(plant.id)
                          return (
                            <button
                              key={plant.id}
                              onClick={() => togglePlantSelection(plant.id)}
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

                    {/* Apply Button */}
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </header>

      {/* Content */}
      <div className="px-4 -mt-2 space-y-4">
        {plants.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No active plants</h3>
            <p className="text-gray-500">Add plants to see their sowing and harvest calendars</p>
          </div>
        ) : (
          <CalendarView plants={displayedPlants} type={calendarType} />
        )}
      </div>
    </div>
  )
}
