import { useState, useRef, useEffect } from 'react'

export default function PhotoViewer({ photo, label, isMainPhoto, onClose, onSetMainPhoto, onNext, onPrev, hasNext, hasPrev }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const lastTouchRef = useRef(null)
  const lastDistanceRef = useRef(null)
  const containerRef = useRef(null)
  const swipeStartRef = useRef(null)

  // Reset zoom when photo changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [photo])

  function getDistance(touch1, touch2) {
    return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Pinch zoom start
      lastDistanceRef.current = getDistance(e.touches[0], e.touches[1])
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      swipeStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      if (scale > 1) {
        // Pan start (only when zoomed in)
        setIsDragging(true)
        lastTouchRef.current = {
          x: touch.clientX,
          y: touch.clientY
        }
      }
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault()
      const newDistance = getDistance(e.touches[0], e.touches[1])
      if (lastDistanceRef.current) {
        const delta = newDistance / lastDistanceRef.current
        setScale(prev => Math.min(Math.max(prev * delta, 1), 4))
      }
      lastDistanceRef.current = newDistance
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan (only when zoomed in)
      const touch = e.touches[0]
      const deltaX = touch.clientX - lastTouchRef.current.x
      const deltaY = touch.clientY - lastTouchRef.current.y

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))

      lastTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY
      }
    }
  }

  function handleTouchEnd(e) {
    // Check for horizontal swipe (only when not zoomed)
    if (scale <= 1 && swipeStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - swipeStartRef.current.x
      const deltaY = touch.clientY - swipeStartRef.current.y
      const deltaTime = Date.now() - swipeStartRef.current.time

      // Swipe threshold: at least 50px horizontal movement, less vertical, within 300ms
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 300) {
        if (deltaX > 0 && hasPrev) {
          onPrev()
        } else if (deltaX < 0 && hasNext) {
          onNext()
        }
      }
    }

    lastDistanceRef.current = null
    lastTouchRef.current = null
    swipeStartRef.current = null
    setIsDragging(false)

    // Reset position if scale is back to 1
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  function handleEdgeTap(e) {
    // Only handle edge taps when not zoomed
    if (scale > 1) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const edgeWidth = rect.width * 0.2 // 20% of screen width on each edge

    if (x < edgeWidth && hasPrev) {
      onPrev()
    } else if (x > rect.width - edgeWidth && hasNext) {
      onNext()
    }
  }

  function handleDoubleClick(e) {
    e.preventDefault()
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }

  return (
    <div className="fixed inset-0 z-60 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-white touch-feedback"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="h-full flex items-center justify-center overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={handleEdgeTap}
      >
        <img
          src={photo.dataUrl}
          alt=""
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          draggable={false}
        />

        {/* Navigation indicators */}
        {scale <= 1 && hasPrev && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        )}
        {scale <= 1 && hasNext && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Footer with Set as Main Photo button */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent pb-safe">
        <div className="flex items-center justify-center px-4 py-4">
          {!isMainPhoto && (
            <button
              onClick={onSetMainPhoto}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full touch-feedback"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-medium">Set as Main Photo</span>
            </button>
          )}
          {isMainPhoto && (
            <div className="flex items-center gap-2 bg-green-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Main Photo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
