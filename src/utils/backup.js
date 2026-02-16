import { db } from '../db/database'

// LocalStorage keys
const LAST_BACKUP_KEY = 'lastBackupDate'
const LAST_DISMISS_KEY = 'lastBackupReminderDismiss'

// === DATE TRACKING ===

export function getLastBackupDate() {
  const date = localStorage.getItem(LAST_BACKUP_KEY)
  return date ? new Date(date) : null
}

export function setLastBackupDate(date = new Date()) {
  localStorage.setItem(LAST_BACKUP_KEY, date.toISOString())
}

export function getDaysSinceLastBackup() {
  const lastBackup = getLastBackupDate()
  if (!lastBackup) return Infinity
  const now = new Date()
  const diffMs = now - lastBackup
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function shouldShowBackupReminder() {
  const daysSince = getDaysSinceLastBackup()
  if (daysSince < 30) return false

  // Check if dismissed today
  const lastDismiss = localStorage.getItem(LAST_DISMISS_KEY)
  if (lastDismiss) {
    const dismissDate = new Date(lastDismiss).toDateString()
    const today = new Date().toDateString()
    if (dismissDate === today) return false
  }

  return true
}

export function dismissBackupReminder() {
  localStorage.setItem(LAST_DISMISS_KEY, new Date().toISOString())
}

// === EXPORT ===

export async function exportAllData() {
  try {
    // Collect all data from IndexedDB
    const plants = await db.plants.toArray()
    const diaryEntries = await db.diaryEntries.toArray()
    const photos = await db.photos.toArray()
    const tasks = await db.tasks.toArray()
    const companionPlantings = await db.companionPlantings.toArray()

    // Get localStorage data
    const scheduledNotifications = localStorage.getItem('scheduledNotifications')

    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      data: {
        plants,
        diaryEntries,
        photos,
        tasks,
        companionPlantings,
        scheduledNotifications: scheduledNotifications ? JSON.parse(scheduledNotifications) : {}
      }
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0]
    const filename = `seedling-backup-${date}.json`

    // Create blob and download
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Update last backup date
    setLastBackupDate()

    return { success: true, filename }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error: error.message }
  }
}

// === IMPORT ===

export function validateBackupFile(data) {
  // Check required structure
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid file format' }
  }

  if (!data.data) {
    return { valid: false, error: 'Missing data section' }
  }

  const requiredTables = ['plants', 'diaryEntries', 'photos', 'tasks', 'companionPlantings']
  for (const table of requiredTables) {
    if (!Array.isArray(data.data[table])) {
      return { valid: false, error: `Missing or invalid ${table} data` }
    }
  }

  return { valid: true }
}

export async function importBackupData(data) {
  try {
    // Validate first
    const validation = validateBackupFile(data)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Clear all existing data and import new data in a transaction
    await db.transaction('rw',
      db.plants,
      db.diaryEntries,
      db.photos,
      db.tasks,
      db.companionPlantings,
      async () => {
        await db.plants.clear()
        await db.diaryEntries.clear()
        await db.photos.clear()
        await db.tasks.clear()
        await db.companionPlantings.clear()

        // Import new data
        if (data.data.plants.length) await db.plants.bulkAdd(data.data.plants)
        if (data.data.diaryEntries.length) await db.diaryEntries.bulkAdd(data.data.diaryEntries)
        if (data.data.photos.length) await db.photos.bulkAdd(data.data.photos)
        if (data.data.tasks.length) await db.tasks.bulkAdd(data.data.tasks)
        if (data.data.companionPlantings.length) await db.companionPlantings.bulkAdd(data.data.companionPlantings)
      }
    )

    // Restore localStorage data
    if (data.data.scheduledNotifications && Object.keys(data.data.scheduledNotifications).length > 0) {
      localStorage.setItem('scheduledNotifications', JSON.stringify(data.data.scheduledNotifications))
    }

    // Update last backup date to export date from file
    if (data.exportDate) {
      setLastBackupDate(new Date(data.exportDate))
    }

    return { success: true }
  } catch (error) {
    console.error('Import failed:', error)
    return { success: false, error: error.message }
  }
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
