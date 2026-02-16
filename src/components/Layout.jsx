import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import SettingsMenu from './SettingsMenu'
import ImportConfirmModal from './ImportConfirmModal'
import Toast from './Toast'
import {
  exportAllData,
  readBackupFile,
  validateBackupFile,
  importBackupData
} from '../utils/backup'

// Icon components
function GardenIcon({ active }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-green-600' : 'text-gray-500'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  )
}

function CalendarIcon({ active }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-green-600' : 'text-gray-500'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function TodoIcon({ active }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-green-600' : 'text-gray-500'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-green-600' : 'text-gray-500'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `
        flex flex-col items-center justify-center py-2 px-4 touch-feedback
        ${isActive ? 'text-green-600' : 'text-gray-500'}
      `}
    >
      {({ isActive }) => (
        <>
          <Icon active={isActive} />
          <span className={`text-xs mt-1 font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [backupData, setBackupData] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [toastData, setToastData] = useState(null)

  async function handleExport() {
    const result = await exportAllData()
    if (result.success) {
      setToastData({
        message: 'Backup exported successfully!',
        details: `${result.filename} saved to Downloads`,
        type: 'success'
      })
    } else {
      setToastData({
        message: 'Backup export failed. Please try again.',
        details: result.error,
        type: 'error'
      })
    }
  }

  async function handleImportSelect(file) {
    try {
      const data = await readBackupFile(file)
      const validation = validateBackupFile(data)
      if (!validation.valid) {
        setToastData({
          message: 'Invalid backup file',
          details: validation.error,
          type: 'error'
        })
        return
      }
      setSelectedFile(file)
      setBackupData(data)
      setSettingsOpen(false)
      setImportConfirmOpen(true)
    } catch (error) {
      setToastData({
        message: 'Failed to read backup file',
        details: error.message,
        type: 'error'
      })
    }
  }

  async function handleImportConfirm() {
    if (!backupData) return

    setIsImporting(true)
    const result = await importBackupData(backupData)
    setIsImporting(false)

    if (result.success) {
      setImportConfirmOpen(false)
      setSelectedFile(null)
      setBackupData(null)
      setToastData({
        message: 'Backup imported successfully!',
        details: 'Refreshing app...',
        type: 'success'
      })
      // Refresh the page to show imported data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      setToastData({
        message: 'Import failed. Please try again.',
        details: result.error,
        type: 'error'
      })
    }
  }

  return (
    <div className="h-full flex flex-col bg-green-50">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto hide-scrollbar safe-area-top">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          <NavItem to="/" icon={GardenIcon} label="My Garden" end />
          <NavItem to="/calendars" icon={CalendarIcon} label="Calendars" />
          <NavItem to="/todo" icon={TodoIcon} label="To-Do" />
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-4 touch-feedback text-gray-500"
          >
            <SettingsIcon active={false} />
            <span className="text-xs mt-1 font-medium text-gray-500">Settings</span>
          </button>
        </div>
      </nav>

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onExport={handleExport}
        onImportSelect={handleImportSelect}
      />

      {/* Import Confirmation Modal */}
      <ImportConfirmModal
        isOpen={importConfirmOpen}
        onClose={() => {
          setImportConfirmOpen(false)
          setSelectedFile(null)
          setBackupData(null)
        }}
        onConfirm={handleImportConfirm}
        fileName={selectedFile?.name || ''}
        isImporting={isImporting}
      />

      {/* Toast notification */}
      {toastData && (
        <Toast
          message={toastData.message}
          details={toastData.details}
          type={toastData.type}
          onDismiss={() => setToastData(null)}
        />
      )}
    </div>
  )
}
