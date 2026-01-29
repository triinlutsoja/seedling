import { Outlet, NavLink } from 'react-router-dom'

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
        </div>
      </nav>
    </div>
  )
}
