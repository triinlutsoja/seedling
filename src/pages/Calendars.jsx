import { useState, useEffect } from 'react'
import { db, PlantStatus, Months } from '../db/database'

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
      <div className="bg-green-600 text-white px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
      </div>

      {/* Month headers */}
      <div className="grid grid-cols-12 border-b border-gray-100">
        {Months.map((month) => (
          <div key={month} className="text-center py-2 text-xs text-gray-500 font-medium">
            {month}
          </div>
        ))}
      </div>

      {/* Plant rows */}
      {plantsWithPeriod.length === 0 ? (
        <div className="text-center py-8 px-4">
          <p className="text-gray-400 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {plantsWithPeriod.map((plant) => {
            const period = plant[periodField]
            const startMonth = period?.start ?? 0
            const endMonth = period?.end ?? 11

            return (
              <div key={plant.id} className="flex items-center">
                <div className="w-24 px-3 py-2 text-sm font-medium text-gray-700 truncate flex-shrink-0">
                  {plant.name}
                </div>
                <div className="grid grid-cols-12 flex-1">
                  {Months.map((_, index) => {
                    const isActive = index >= startMonth && index <= endMonth
                    return (
                      <div key={index} className="h-8 flex items-center justify-center">
                        {isActive && (
                          <div
                            className={`h-4 w-full ${
                              type === 'sowing' ? 'bg-amber-400' : 'bg-green-500'
                            } ${index === startMonth ? 'rounded-l-full ml-1' : ''} ${
                              index === endMonth ? 'rounded-r-full mr-1' : ''
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Calendars() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlants()
  }, [])

  async function loadPlants() {
    try {
      const activePlants = await db.plants
        .where('status')
        .equals(PlantStatus.ACTIVE)
        .toArray()
      setPlants(activePlants)
    } catch (error) {
      console.error('Error loading plants:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full pb-4">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold">Calendars</h1>
        <p className="text-green-100 text-sm mt-1">
          Seasonal overview for active plants
        </p>
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
          <>
            <CalendarView plants={plants} type="sowing" />
            <CalendarView plants={plants} type="harvest" />
          </>
        )}
      </div>
    </div>
  )
}
