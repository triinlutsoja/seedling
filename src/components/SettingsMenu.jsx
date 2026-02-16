import { useRef } from 'react'

function XIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

export default function SettingsMenu({
  isOpen,
  onClose,
  onExport,
  onImportSelect
}) {
  const fileInputRef = useRef(null)

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      onImportSelect(file)
      // Reset the input so the same file can be selected again
      e.target.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-2xl safe-area-bottom">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XIcon />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            {/* Export Button */}
            <button
              onClick={() => {
                onExport()
                onClose()
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 touch-feedback text-left"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DownloadIcon />
              </div>
              <div>
                <p className="font-medium text-gray-900">Export Backup</p>
                <p className="text-sm text-gray-500">Download your data as JSON</p>
              </div>
            </button>

            {/* Import Button */}
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 touch-feedback text-left"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <UploadIcon />
              </div>
              <div>
                <p className="font-medium text-gray-900">Import Backup</p>
                <p className="text-sm text-gray-500">Restore from a backup file</p>
              </div>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </>
  )
}
