import Dexie from 'dexie';

export const db = new Dexie('SeedlingDB');

db.version(1).stores({
  plants: '++id, name, status, createdAt',
  diaryEntries: '++id, plantId, date, careStage, year',
  tasks: '++id, *plantIds, date, time, completed',
  photos: '++id, plantId, diaryEntryId, createdAt, isMainPhoto',
  companionPlantings: '++id, plantId, companionPlantId'
});

// Plant status constants
export const PlantStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

// Care stage options
export const CareStages = [
  { id: 'sowed', label: 'Sowed/Started Seeds' },
  { id: 'transplanted', label: 'Transplanted/Repotted' },
  { id: 'planted', label: 'Planted' },
  { id: 'watered', label: 'Watered' },
  { id: 'fertilized', label: 'Fertilized' },
  { id: 'pruned', label: 'Pruned/Trimmed' },
  { id: 'treated', label: 'Treated (pests/disease)' },
  { id: 'harvested', label: 'Harvested' },
  { id: 'seeds_collected', label: 'Seeds Collected' },
  { id: 'task_completed', label: 'Task Completed' }
];

// Month names for calendars
export const Months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Frost tolerance options
export const FrostTolerance = {
  TENDER: 'Tender (no frost)',
  SEMI_HARDY: 'Semi-hardy (light frost)',
  HARDY: 'Hardy (hard frost)'
};

// Plant lifecycle options
export const PlantLifecycle = {
  ANNUAL: 'Annual',
  BIENNIAL: 'Biennial',
  PERENNIAL: 'Perennial'
};
