// Notification utilities for task reminders

// Track scheduled notification timeouts
const scheduledTimeouts = new Map()

export function notificationsSupported() {
  return 'Notification' in window
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'denied'

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  return await Notification.requestPermission()
}

export function getNotificationPermission() {
  if (!notificationsSupported()) return 'denied'
  return Notification.permission
}

export function scheduleNotification(task) {
  if (Notification.permission !== 'granted') return null
  if (!task.time || !task.date) return null

  // Cancel any existing notification for this task
  cancelNotification(task.id)

  const notifyTime = new Date(`${task.date}T${task.time}`)
  const now = new Date()
  const delay = notifyTime.getTime() - now.getTime()

  // Don't schedule if time has passed
  if (delay <= 0) return null

  const timeoutId = setTimeout(() => {
    showNotification(task)
    scheduledTimeouts.delete(task.id)
  }, delay)

  scheduledTimeouts.set(task.id, timeoutId)

  // Store in localStorage for recovery after page refresh
  const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '{}')
  scheduled[task.id] = {
    time: notifyTime.toISOString(),
    description: task.description
  }
  localStorage.setItem('scheduledNotifications', JSON.stringify(scheduled))

  return timeoutId
}

export function cancelNotification(taskId) {
  const timeoutId = scheduledTimeouts.get(taskId)
  if (timeoutId) {
    clearTimeout(timeoutId)
    scheduledTimeouts.delete(taskId)
  }

  // Remove from localStorage
  const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '{}')
  delete scheduled[taskId]
  localStorage.setItem('scheduledNotifications', JSON.stringify(scheduled))
}

export function showNotification(task) {
  if (Notification.permission !== 'granted') return

  // Use service worker notification if available for better PWA support
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification('Seedling Reminder', {
        body: task.description,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `task-${task.id}`,
        requireInteraction: true,
        data: { taskId: task.id }
      })
    })
  } else {
    // Fallback to regular notification
    new Notification('Seedling Reminder', {
      body: task.description,
      icon: '/icon.svg',
      tag: `task-${task.id}`
    })
  }
}

export async function rescheduleAllNotifications(tasks) {
  if (Notification.permission !== 'granted') return

  // Cancel all existing
  scheduledTimeouts.forEach((_, taskId) => cancelNotification(taskId))

  // Schedule notifications for all incomplete tasks with time set
  for (const task of tasks) {
    if (task.completed === 0 && task.time) {
      scheduleNotification(task)
    }
  }
}

export async function checkMissedNotifications(tasks) {
  if (Notification.permission !== 'granted') return []

  const now = new Date()
  const missed = []

  for (const task of tasks) {
    if (task.completed === 0 && task.time && task.date) {
      const notifyTime = new Date(`${task.date}T${task.time}`)
      // If notification time was within the last 24 hours, consider it missed
      const hoursSinceMissed = (now - notifyTime) / (1000 * 60 * 60)
      if (hoursSinceMissed > 0 && hoursSinceMissed < 24) {
        missed.push(task)
      }
    }
  }

  return missed
}
