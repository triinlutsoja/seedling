import { useState, useEffect, useRef } from 'react'

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function Toast({
  message,
  details = null,
  type = 'success',
  onDismiss,
  duration = 7000
}) {
  const [touchStartY, setTouchStartY] = useState(null)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const toastRef = useRef(null)

  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration])

  function handleDismiss() {
    setIsDismissing(true)
    setTimeout(() => {
      onDismiss()
    }, 300)
  }

  function handleTouchStart(e) {
    setTouchStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  function handleTouchMove(e) {
    if (touchStartY === null) return
    const diff = e.touches[0].clientY - touchStartY
    // Only allow downward movement
    if (diff > 0) {
      setTranslateY(diff)
    }
  }

  function handleTouchEnd() {
    setIsDragging(false)
    if (translateY > 50) {
      // Threshold reached, dismiss
      handleDismiss()
    } else {
      // Snap back
      setTranslateY(0)
    }
    setTouchStartY(null)
  }

  const opacity = isDismissing ? 0 : Math.max(0, 1 - (translateY / 150))

  return (
    <div
      ref={toastRef}
      className={`fixed bottom-24 left-4 right-4 z-50 ${isDismissing ? 'animate-slide-down' : 'animate-slide-up'}`}
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: opacity,
        transition: isDragging ? 'none' : 'transform 0.15s ease-out, opacity 0.15s ease-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg">
        <div className="flex items-start gap-3">
          {type === 'success' ? <CheckIcon /> : <ErrorIcon />}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{message}</span>
            {details && (
              <p className="text-xs text-gray-400 mt-1 break-words">{details}</p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
