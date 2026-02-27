import { useState, useEffect } from 'react'
import { Settings } from '../types'
import { project, labels, themesList, ThemeMode, themes } from '../config'
import DriveSelector from './DriveSelector'

interface SettingsViewProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onScanGames: (drives: string[]) => void
  isScanning: boolean
}

type SettingsTab = 'library' | 'appearance'

export default function SettingsView({ settings, onSave, onScanGames, isScanning }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings)
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('library')
  const [showDriveSelector, setShowDriveSelector] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const themeColors = themes[localSettings.theme]

  const handleSave = async () => {
    await onSave(localSettings)
  }

  const handleThemeChange = (theme: ThemeMode) => {
    const newSettings = { ...localSettings, theme }
    setLocalSettings(newSettings)
    setThemeDropdownOpen(false)
    onSave(newSettings)
  }

  const currentTheme = themesList.find(t => t.id === localSettings.theme) || themesList[1]

  const handleScanClick = () => {
    setShowDriveSelector(true)
  }

  const handleDriveSelect = (selectedDrives: string[]) => {
    setShowDriveSelector(false)
    onScanGames(selectedDrives)
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'library', label: labels.settings.library },
    { id: 'appearance', label: labels.settings.appearance }
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: themeColors.bg }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: themeColors.text }}>{labels.settings.title}</h1>

        <div className="flex border-b mb-6" style={{ borderColor: themeColors.border }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 font-medium transition-colors relative"
              style={{ 
                color: activeTab === tab.id ? '#0284c7' : themeColors.textSecondary 
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0284c7' }} />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{labels.settings.library}</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: themeColors.text }}>{labels.settings.scanOnStartup}</p>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>{labels.settings.scanOnStartupDescription}</p>
                  </div>
                  <button
                    onClick={() => {
                      setLocalSettings({ ...localSettings, scanOnStartup: !localSettings.scanOnStartup })
                      setTimeout(handleSave, 0)
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      localSettings.scanOnStartup ? 'bg-primary-600' : ''
                    }`}
                    style={{ backgroundColor: localSettings.scanOnStartup ? undefined : themeColors.border }}
                  >
                    <span 
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        localSettings.scanOnStartup ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: themeColors.border }}>
                  <p className="font-medium mb-2" style={{ color: themeColors.text }}>{labels.settings.manualScan}</p>
                  <p className="text-sm mb-4" style={{ color: themeColors.textSecondary }}>
                    {labels.settings.manualScanDescription}
                  </p>
                  <button
                    onClick={handleScanClick}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {labels.gameGrid.scanning}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {labels.gameGrid.scanForGames}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{labels.settings.about}</h2>
              
              <div className="space-y-2" style={{ color: themeColors.textSecondary }}>
                <p><span style={{ color: themeColors.text }}>{project.name}</span> {labels.app.version}{project.version}</p>
                <p>{project.description}</p>
                <p className="text-sm">Supports {project.supportedStoreNames.steam}, {project.supportedStoreNames.epic}, and {project.supportedStoreNames.custom} games</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{labels.settings.appearance}</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-1" style={{ color: themeColors.text }}>{labels.settings.theme}</p>
                  <p className="text-sm mb-3" style={{ color: themeColors.textSecondary }}>{labels.settings.themeDescription}</p>
                  
                  <div className="relative">
                    <button
                      onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: themeColors.surface, 
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.text 
                      }}
                    >
                      <span>{currentTheme.name}</span>
                      <svg className={`w-5 h-5 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {themeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-10 overflow-hidden" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
                        {themesList.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                            style={{ 
                              backgroundColor: localSettings.theme === theme.id ? '#0284c7' : undefined,
                              color: localSettings.theme === theme.id ? 'white' : themeColors.text 
                            }}
                          >
                            <span>{theme.name}</span>
                            {localSettings.theme === theme.id && (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDriveSelector && (
        <DriveSelector
          onSelect={handleDriveSelect}
          onClose={() => setShowDriveSelector(false)}
          isScanning={isScanning}
        />
      )}
    </div>
  )
}
