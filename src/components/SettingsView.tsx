import { useState, useEffect } from 'react'
import { Settings, GameInfo } from '../types'
import { project, labels, themesList, ThemeMode, themes } from '../config'
import logoBigUrl from '../assets/logo-big.png'

type SettingsTab = 'library' | 'appearance' | 'hidden' | 'about'

interface SettingsViewProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onScanGames: () => void
  isScanning: boolean
  onRefreshGames?: () => void
}

export default function SettingsView({ settings, onSave, onScanGames, isScanning, onRefreshGames }: SettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings)
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('library')
  const [hiddenGames, setHiddenGames] = useState<GameInfo[]>([])
  const [updateStatus, setUpdateStatus] = useState<{ status: string; version?: string; percent?: number; error?: string } | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [showRestartMessage, setShowRestartMessage] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  useEffect(() => {
    const loadHiddenGames = async () => {
      const allGames = await window.electronAPI.getAllGames()
      setHiddenGames(allGames.filter(g => g.isHidden))
    }
    loadHiddenGames()
  }, [activeTab])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onUpdateStatus((status) => {
      setUpdateStatus(status)
      setIsCheckingUpdate(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    onSave(localSettings)
  }, [localSettings])

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true)
    await window.electronAPI.checkForUpdates()
  }

  const handleDownloadUpdate = async () => {
    await window.electronAPI.downloadUpdate()
  }

  const handleInstallUpdate = () => {
    window.electronAPI.installUpdate()
  }

  const handleUnhideGame = async (gameId: string) => {
    await window.electronAPI.unhideGame(gameId)
    const allGames = await window.electronAPI.getAllGames()
    setHiddenGames(allGames.filter(g => g.isHidden))
    if (onRefreshGames) {
      onRefreshGames()
    }
  }

  const themeColors = themes[localSettings.theme]

  const handleThemeChange = (theme: ThemeMode) => {
    const newSettings = { ...localSettings, theme }
    setLocalSettings(newSettings)
    setThemeDropdownOpen(false)
    onSave(newSettings)
  }

  const currentTheme = themesList.find(t => t.id === localSettings.theme) || themesList[1]

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'library', label: labels.settings.application },
    { id: 'hidden', label: 'Hidden' },
    { id: 'appearance', label: labels.settings.appearance },
    { id: 'about', label: 'About' }
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
                    onClick={onScanGames}
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
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{labels.settings.application}</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: themeColors.text }}>{labels.settings.hardwareAcceleration}</p>
                    <p className="text-sm" style={{ color: themeColors.textSecondary }}>{labels.settings.hardwareAccelerationDescription}</p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !localSettings.hardwareAcceleration
                      setLocalSettings({ ...localSettings, hardwareAcceleration: newValue })
                      setShowRestartMessage(true)
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      localSettings.hardwareAcceleration ? 'bg-primary-600' : ''
                    }`}
                    style={{ backgroundColor: localSettings.hardwareAcceleration ? undefined : themeColors.border }}
                  >
                    <span 
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        localSettings.hardwareAcceleration ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                {showRestartMessage && (
                  <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-between">
                    <p className="text-sm" style={{ color: themeColors.text }}>Restart required for changes to take effect</p>
                    <button
                      onClick={() => window.electronAPI.restartApp()}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Restart Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hidden' && (
          <div className="space-y-4">
            <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Hidden Games</h2>
              
              {hiddenGames.length === 0 ? (
                <p style={{ color: themeColors.textSecondary }}>No hidden games</p>
              ) : (
                <div className="space-y-2">
                  {hiddenGames.map((game) => (
                    <div 
                      key={game.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: themeColors.surface }}
                    >
                      <div className="flex items-center gap-3">
                        {game.coverImage ? (
                          <img src={`file://${game.coverImage}`} alt={game.name} className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 rounded flex items-center justify-center" style={{ backgroundColor: themeColors.border }}>
                            <span className="text-lg font-bold" style={{ color: themeColors.textSecondary }}>{(game.name || '?').charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium" style={{ color: themeColors.text }}>{game.name}</p>
                          <p className="text-xs" style={{ color: themeColors.textSecondary }}>{game.store}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnhideGame(game.id)}
                        className="px-3 py-1 text-sm rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                      >
                        Unhide
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>About</h2>
              
              <div className="space-y-3" style={{ color: themeColors.textSecondary }}>
                <p className="text-2xl font-bold text-center" style={{ color: themeColors.text }}>{project.name}</p>
                <p className="text-center">Version {project.version}</p>
                <div className="flex justify-center py-4">
                  <img src={logoBigUrl} alt="Logo" className="h-40 w-auto object-contain" draggable="false" />
                </div>
                <p>{project.description}<br></br><br></br>
                  <span>This app is in early development.</span><br></br>
                  <span>Feel free to give your feedback, we're always open for suggestions/ideas!</span>
                </p>
                <div className="flex justify-end pt-1">
                  <span style={{fontSize: "14px"}}>From Portugal with ❤️</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6" style={{ backgroundColor: themeColors.card, border: `1px solid ${themeColors.border}` }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Updates</h2>

              <div className="space-y-4">
                {updateStatus?.status === 'checking' || isCheckingUpdate ? (
                  <div className="flex items-center gap-3" style={{ color: themeColors.textSecondary }}>
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking for updates...</span>
                  </div>
                ) : updateStatus?.status === 'available' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2" style={{ color: themeColors.text }}>
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Update {updateStatus.version} is available</span>
                    </div>
                    <button
                      onClick={handleDownloadUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download & Install
                    </button>
                  </div>
                ) : updateStatus?.status === 'downloading' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2" style={{ color: themeColors.textSecondary }}>
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Downloading update... {Math.round(updateStatus.percent || 0)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.border }}>
                      <div 
                        className="h-full bg-primary-600 transition-all" 
                        style={{ width: `${updateStatus.percent || 0}%` }}
                      />
                    </div>
                  </div>
                ) : updateStatus?.status === 'downloaded' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2" style={{ color: themeColors.text }}>
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update {updateStatus.version} is ready to install</span>
                    </div>
                    <button
                      onClick={handleInstallUpdate}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restart & Install
                    </button>
                  </div>
                ) : updateStatus?.status === 'not-available' ? (
                  <div className="flex items-center gap-2" style={{ color: themeColors.textSecondary }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>You're running the latest version</span>
                  </div>
                ) : updateStatus?.status === 'error' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Error: {updateStatus.error}</span>
                    </div>
                    <button
                      onClick={handleCheckForUpdates}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckForUpdates}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check for Updates
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
