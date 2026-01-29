import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, PlantStatus, PlantLifecycle, FrostTolerance, Months } from '../db/database'

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

export default function AddPlant() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [sowingStart, setSowingStart] = useState('')
  const [sowingEnd, setSowingEnd] = useState('')
  const [harvestStart, setHarvestStart] = useState('')
  const [harvestEnd, setHarvestEnd] = useState('')
  const [frostTolerance, setFrostTolerance] = useState('')
  const [instructions, setInstructions] = useState('')

  const lifecycleOptions = Object.entries(PlantLifecycle).map(([key, value]) => ({
    value: value,
    label: value
  }))

  const frostOptions = Object.entries(FrostTolerance).map(([key, value]) => ({
    value: value,
    label: value
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      const plantId = await db.plants.add({
        name: name.trim(),
        status: PlantStatus.ACTIVE,
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
        instructions: instructions.trim() || null,
        createdAt: new Date().toISOString()
      })

      navigate(`/plant/${plantId}`)
    } catch (error) {
      console.error('Error adding plant:', error)
      setSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-green-50 safe-area-top hide-scrollbar">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <BackButton onClick={() => navigate(-1)} />
          <h1 className="text-lg font-semibold">Add New Plant</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-8 safe-area-bottom">
        <FormSection title="Basic Info">
          <Input
            label="Plant Name *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cherry Tomatoes"
            required
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
          {saving ? 'Adding...' : 'Add Plant'}
        </button>
      </form>
    </div>
  )
}
