import React from 'react'
import { ViewType } from '../types'
import { project, labels, ThemeMode, themes } from '../config'
import { sidebarIcons } from '../config/sidebarIcons'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  gameCounts: Record<string, number>
  theme: ThemeMode
  storesFound?: {
    steam: boolean
    epic: boolean
  }
  onLaunchStore?: (storeName: string) => void
}

export default function Sidebar({ currentView, onViewChange, gameCounts, theme, storesFound, onLaunchStore }: SidebarProps) {
  const themeColors = themes[theme]
  
  const baseMenuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
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
    }
  ]

  const storeMenuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    ...(storesFound?.steam ? [{
      id: 'steam' as ViewType,
      label: project.supportedStoreNames.steam,
      icon: sidebarIcons.steam
    }] : []),
    ...(storesFound?.epic ? [{
      id: 'epic' as ViewType,
      label: project.supportedStoreNames.epic,
      icon: sidebarIcons.epic
    }] : []),
    {
      id: 'custom' as ViewType,
      label: project.supportedStoreNames.custom,
      icon: sidebarIcons.custom
    }
  ]

  const menuItems = [...baseMenuItems, ...storeMenuItems]
  
  return (
    <aside 
      className="w-64 border-r flex flex-col"
      style={{ 
        backgroundColor: themeColors.surface, 
        borderColor: themeColors.border 
      }}
    >
      <nav className="flex-1 p-4 space-y-1 pt-8">
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

        {/* Store Launch Buttons Section */}
        {onLaunchStore && (storesFound?.steam || storesFound?.epic) && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-px bg-theme-border flex-1"></div>
              <span className="text-xs font-medium px-2" style={{ color: themeColors.textSecondary }}>
                Clients
              </span>
              <div className="h-px bg-theme-border flex-1"></div>
            </div>
            <div className="flex justify-center gap-2">
              {storesFound?.steam && (
                <button
                  onClick={() => onLaunchStore('steam')}
                  className="p-2 rounded-lg hover:bg-theme-border transition-colors flex items-center justify-center"
                  style={{ color: themeColors.textSecondary }}
                  title={`Open ${project.supportedStoreNames.steam}`}
                >
                  <span className="text-base">{sidebarIcons.steam}</span>
                </button>
              )}
              {storesFound?.epic && (
                <button
                  onClick={() => onLaunchStore('epic')}
                  className="p-2 rounded-lg hover:bg-theme-border transition-colors flex items-center justify-center"
                  style={{ color: themeColors.textSecondary }}
                  title={`Open ${project.supportedStoreNames.epic}`}
                >
                  <span className="text-base">{sidebarIcons.epic}</span>
                </button>
              )}
            </div>
          </div>
        )}

      <div className="p-4 border-t" style={{ borderColor: themeColors.border }}>
        <p className="text-xs text-center" style={{ color: themeColors.textSecondary }}>
          {project.name} {labels.app.version}{project.version}
        </p>
      </div>
    </aside>
  )
}
