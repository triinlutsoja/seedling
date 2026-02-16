export default function ImportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  isImporting = false
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
          {/* Icon */}
          <div className="flex justify-center pt-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Replace All Data?
            </h3>
            <p className="text-gray-600 text-sm">
              This will replace all current data with the backup from <span className="font-medium">{fileName}</span>. This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-bl-2xl disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={onConfirm}
              disabled={isImporting}
              className="flex-1 py-3 text-amber-600 font-medium hover:bg-amber-50 rounded-br-2xl disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
