import { useState, useEffect } from 'react'
import { db } from '../db/database'
import PhotoViewer from './PhotoViewer'

export default function PhotoGallery({ plantId, isOpen, onClose }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [diaryEntries, setDiaryEntries] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadPhotos()
    }
  }, [isOpen, plantId])

  async function loadPhotos() {
    setLoading(true)
    try {
      // Load all photos for this plant
      const allPhotos = await db.photos
        .where('plantId')
        .equals(parseInt(plantId))
        .toArray()

      // Load diary entries to get dates
      const entries = await db.diaryEntries
        .where('plantId')
        .equals(parseInt(plantId))
        .toArray()

      const entriesMap = {}
      entries.forEach(entry => {
        entriesMap[entry.id] = entry
      })
      setDiaryEntries(entriesMap)

      // Sort: main photo first, then by createdAt descending (newest first)
      const sortedPhotos = allPhotos.sort((a, b) => {
        // Main photo always comes first
        if (a.isMainPhoto && !b.isMainPhoto) return -1
        if (!a.isMainPhoto && b.isMainPhoto) return 1
        // Then sort by date, newest first
        return new Date(b.createdAt) - new Date(a.createdAt)
      })

      setPhotos(sortedPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    }
    setLoading(false)
  }

  async function handleSetMainPhoto(photoId) {
    try {
      // Unset all existing main photos for this plant
      const existingMainPhotos = await db.photos
        .where('plantId')
        .equals(parseInt(plantId))
        .filter(photo => photo.isMainPhoto === true)
        .toArray()

      for (const photo of existingMainPhotos) {
        await db.photos.update(photo.id, { isMainPhoto: false })
      }

      // Set the new main photo
      await db.photos.update(photoId, { isMainPhoto: true })

      // Reload photos to update the order
      await loadPhotos()
      setSelectedPhoto(null)
    } catch (error) {
      console.error('Error setting main photo:', error)
    }
  }

  function getPhotoDate(photo) {
    if (photo.diaryEntryId && diaryEntries[photo.diaryEntryId]) {
      return diaryEntries[photo.diaryEntryId].date
    }
    return null
  }

  function getPhotoLabel(photo) {
    if (photo.isMainPhoto && !photo.diaryEntryId) {
      return 'Profile Picture'
    }
    const date = getPhotoDate(photo)
    if (date) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    if (photo.isMainPhoto) {
      return 'Profile Picture'
    }
    return new Date(photo.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-white touch-feedback"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Photos</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="h-full overflow-y-auto pt-16 pb-safe hide-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-square relative overflow-hidden"
              >
                <img
                  src={photo.dataUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {photo.isMainPhoto && (
                  <div className="absolute top-1 left-1 bg-green-500 rounded-full p-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          label={getPhotoLabel(selectedPhoto)}
          isMainPhoto={selectedPhoto.isMainPhoto}
          onClose={() => setSelectedPhoto(null)}
          onSetMainPhoto={() => handleSetMainPhoto(selectedPhoto.id)}
          onNext={() => {
            const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
            if (currentIndex < photos.length - 1) {
              setSelectedPhoto(photos[currentIndex + 1])
            }
          }}
          onPrev={() => {
            const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
            if (currentIndex > 0) {
              setSelectedPhoto(photos[currentIndex - 1])
            }
          }}
          hasNext={photos.findIndex(p => p.id === selectedPhoto.id) < photos.length - 1}
          hasPrev={photos.findIndex(p => p.id === selectedPhoto.id) > 0}
        />
      )}
    </div>
  )
}
