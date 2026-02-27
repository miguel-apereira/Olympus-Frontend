import { ViewType } from '../types'
import { project, labels, ThemeMode, themes } from '../config'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  gameCounts: Record<string, number>
  theme: ThemeMode
}

const menuItems: { id: ViewType; label: string; icon: JSX.Element }[] = [
  {
    id: 'all',
    label: labels.sidebar.allGames,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    id: 'favorites',
    label: labels.sidebar.favorites,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
  {
    id: 'recent',
    label: labels.sidebar.recentlyPlayed,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'steam',
    label: project.supportedStoreNames.steam,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.979 0C5.668 0 .511 4.926.022 11.153l5.418 2.736c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.523-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-3.641l-2.836 4.13c-.622.063-1.239.148-1.841.253-1.232-2.422-3.541-4.143-6.209-4.143-3.821 0-6.953 3.127-6.953 6.987 0 3.652 2.824 6.635 6.389 7.449-.435-.053-.879-.082-1.329-.082-3.924 0-7.104 3.181-7.104 7.105 0 3.925 3.18 7.105 7.105 7.105 3.359 0 6.164-2.335 7.011-5.552.208.041.416.074.629.101.213-.027.424-.057.629-.101.847 3.217 3.652 5.552 7.011 5.552 3.924 0 7.105-3.18 7.105-7.105 0-3.174-2.093-5.851-5.059-6.784 3.478-1.015 6.059-4.058 6.059-7.682 0-3.921-3.181-7.105-7.105-7.105-.652 0-1.284.089-1.886.253l-2.815-4.158c-.042-.063-.089-.125-.135-.188l3.521-1.775C23.085 3.128 17.741 0 11.979 0zM8.866 18.898c-1.279 0-2.318-1.037-2.318-2.316 0-1.279 1.039-2.317 2.318-2.317 1.279 0 2.317 1.038 2.317 2.317 0 1.279-1.038 2.316-2.317 2.zm8.812-7.223c-1.279 0-2.317-1.037-2.317-2.316 0-1.279 1.038-2.317 2.317-2.317 1.278 0 2.316 1.038 2.316 2.317 0 1.279-1.038 2.316-2.316 2.316z"/>
      </svg>
    )
  },
  {
    id: 'epic',
    label: project.supportedStoreNames.epic,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 8.5V22h20V8.5L12 2zm0 2.5L18.5 9H16v6h-4V9H5.5L12 4.5z"/>
      </svg>
    )
  },
  {
    id: 'custom',
    label: project.supportedStoreNames.custom,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: labels.sidebar.settings,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
]

export default function Sidebar({ currentView, onViewChange, gameCounts, theme }: SidebarProps) {
  const themeColors = themes[theme]
  
  return (
    <aside 
      className="w-64 border-r flex flex-col"
      style={{ 
        backgroundColor: themeColors.surface, 
        borderColor: themeColors.border 
      }}
    >
      <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: themeColors.text }}>{project.name}</h1>
            <p className="text-xs" style={{ color: themeColors.textSecondary }}>{labels.sidebar.yourGames}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`sidebar-item w-full flex items-center justify-between px-4 py-3 rounded-lg text-left ${
              currentView === item.id 
                ? 'active bg-primary-500/10 text-primary-400' 
                : 'hover:bg-opacity-10'
            }`}
            style={{ 
              color: currentView === item.id ? undefined : themeColors.textSecondary 
            }}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-medium" style={{ color: currentView === item.id ? '#38bdf8' : themeColors.text }}>
                {item.label}
              </span>
            </div>
            {item.id !== 'settings' && gameCounts[item.id] > 0 && (
              <span 
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: themeColors.card, 
                  color: themeColors.textSecondary 
                }}
              >
                {gameCounts[item.id]}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: themeColors.border }}>
        <p className="text-xs text-center" style={{ color: themeColors.textSecondary }}>
          {project.name} {labels.app.version}{project.version}
        </p>
      </div>
    </aside>
  )
}
