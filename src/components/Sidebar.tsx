import { ViewType } from '../types'
import { project, labels, ThemeMode, themes } from '../config'
import { sidebarIcons } from '../config/sidebarIcons'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  gameCounts: Record<string, number>
  theme: ThemeMode
}

const menuItems: { id: ViewType; label: string; icon: typeof sidebarIcons.all }[] = [
  {
    id: 'all',
    label: labels.sidebar.allGames,
    icon: sidebarIcons.all
  },
  {
    id: 'favorites',
    label: labels.sidebar.favorites,
    icon: sidebarIcons.favorites
  },
  {
    id: 'recent',
    label: labels.sidebar.recentlyPlayed,
    icon: sidebarIcons.recent
  },
  {
    id: 'steam',
    label: project.supportedStoreNames.steam,
    icon: sidebarIcons.steam
  },
  {
    id: 'epic',
    label: project.supportedStoreNames.epic,
    icon: sidebarIcons.epic
  },
  {
    id: 'custom',
    label: project.supportedStoreNames.custom,
    icon: sidebarIcons.custom
  },
  {
    id: 'settings',
    label: labels.sidebar.settings,
    icon: sidebarIcons.settings
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
