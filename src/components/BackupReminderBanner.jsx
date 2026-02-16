function WarningIcon() {
  return (
    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

export default function BackupReminderBanner({ onExportClick, onDismiss }) {
  return (
    <div className="bg-green-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <WarningIcon />
        <div className="flex-1 min-w-0">
          <p className="text-red-700 text-sm">
            30 days since last backup. Export now to keep your data safe.
          </p>
        </div>
        <button
          onClick={onExportClick}
          className="text-red-700 font-medium text-sm underline flex-shrink-0 touch-feedback"
        >
          Export Now
        </button>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 flex-shrink-0 touch-feedback"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}
