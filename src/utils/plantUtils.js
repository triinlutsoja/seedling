import { db } from '../db/database'
import { cancelNotification } from './notifications'

/**
 * Permanently deletes a plant and all associated data:
 * - All diary entries for the plant
 * - All photos linked to the plant
 * - Removes plant from linked tasks (or deletes task if it's the only plant)
 *
 * @param {number} plantId - The ID of the plant to delete
 * @returns {Promise<void>}
 */
export async function deletePlant(plantId) {
  const id = parseInt(plantId)

  // 1. Delete all diary entries for this plant
  await db.diaryEntries
    .where('plantId')
    .equals(id)
    .delete()

  // 2. Delete all photos for this plant
  await db.photos
    .where('plantId')
    .equals(id)
    .delete()

  // 3. Handle tasks - either remove plant from task or delete task entirely
  const linkedTasks = await db.tasks
    .where('plantIds')
    .equals(id)
    .toArray()

  for (const task of linkedTasks) {
    if (task.plantIds.length === 1) {
      // This plant is the only one linked - delete the task entirely
      cancelNotification(task.id)
      await db.tasks.delete(task.id)
    } else {
      // Multiple plants linked - just remove this plant from the task
      const newPlantIds = task.plantIds.filter(pid => pid !== id)
      const newCompletedPlantIds = (task.completedPlantIds || []).filter(pid => pid !== id)
      await db.tasks.update(task.id, {
        plantIds: newPlantIds,
        completedPlantIds: newCompletedPlantIds
      })
    }
  }

  // 4. Also check completedPlantIds for tasks this plant completed
  const allTasks = await db.tasks.toArray()
  for (const task of allTasks) {
    if (task.completedPlantIds && task.completedPlantIds.includes(id)) {
      const newCompletedPlantIds = task.completedPlantIds.filter(pid => pid !== id)
      await db.tasks.update(task.id, { completedPlantIds: newCompletedPlantIds })
    }
  }

  // 5. Delete all companion planting relationships involving this plant
  await db.companionPlantings.where('plantId').equals(id).delete()
  await db.companionPlantings.where('companionPlantId').equals(id).delete()

  // 6. Finally, delete the plant record itself
  await db.plants.delete(id)
}
