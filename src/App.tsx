import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import GameGrid from './components/GameGrid'
import AddGameModal from './components/AddGameModal'
import SettingsView from './components/SettingsView'
import TitleBar from './components/TitleBar'
import ScanProgressModal from './components/ScanProgressModal'
import EditGameModal from './components/EditGameModal'
import ChangelogModal from './components/ChangelogModal'
import { GameInfo, ViewType, Settings } from './types'
import { project, labels, themes } from './config'

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', message, source, lineno, colno, error)
}

window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason)
}

function App() {
  const [games, setGames] = useState<GameInfo[]>([])
  const [currentView, setCurrentView] = useState<ViewType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGame, setEditingGame] = useState<GameInfo | null>(null)
  const [settings, setSettings] = useState<Settings>({ theme: 'dark', scanOnStartup: true, hardwareAcceleration: true })
  const [storesFound, setStoresFound] = useState<{ steam: boolean; epic: boolean }>({ steam: true, epic: true })
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentGame: string; store: string } | null>(null)
  const [updateStatus, setUpdateStatus] = useState<{ status: string; version?: string; percent?: number; error?: string } | null>(null)
  const [showChangelog, setShowChangelog] = useState(false)

  const themeColors = themes[settings.theme]

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onScanProgress((progress) => {
      setScanProgress(progress)
      if (progress.store === 'complete') {
        setTimeout(() => {
          setIsScanning(false)
          setScanProgress(null)
        }, 1500)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onUpdateStatus((status) => {
      setUpdateStatus(status)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    window.electronAPI.checkForUpdates()
  }, [])

  const loadInitialData = async () => {
    try {
      console.log('Loading initial data...')
      const [loadedGames, loadedSettings, favorites, storePaths] = await Promise.all([
        window.electronAPI.getGames(),
        window.electronAPI.getSettings(),
        window.electronAPI.getFavorites(),
        window.electronAPI.getStorePaths()
      ])
      console.log('Games loaded:', loadedGames.length)
      console.log('Settings loaded:', loadedSettings)
      console.log('Favorites loaded:', favorites)
      console.log('Store paths:', storePaths)
      
      setStoresFound({
        steam: !!storePaths.steamPath,
        epic: !!storePaths.epicPath
      })
      
      const favoriteSet = new Set(favorites)
      const gamesWithFavorites = loadedGames.map(g => ({
        ...g,
        isFavorite: favoriteSet.has(g.id)
      }))
      
      const settingsWithDefaults: Settings = {
        theme: loadedSettings?.theme || 'dark',
        scanOnStartup: loadedSettings?.scanOnStartup ?? true,
        hardwareAcceleration: loadedSettings?.hardwareAcceleration ?? true,
        integrations: loadedSettings?.integrations
      }
      
      setGames(gamesWithFavorites)
      setSettings(settingsWithDefaults)

      if (settingsWithDefaults.scanOnStartup) {
        await scanForGames()
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const scanForGames = async () => {
    setIsScanning(true)
    try {
      const result = await window.electronAPI.scanGames()
      setGames(result.games)
    } catch (error) {
      console.error('Error scanning games:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleAddGame = async (gameData: Omit<GameInfo, 'id'>) => {
    try {
      let coverImage = gameData.coverImage
      
      if (coverImage && !coverImage.includes('covers')) {
        try {
          const tempId = `temp-${Date.now()}`
          const savedPath = await window.electronAPI.saveGameCover(tempId, coverImage)
          coverImage = savedPath
        } catch (error) {
          console.error('Error copying cover:', error)
        }
      }
      
      const newGame = await window.electronAPI.addGame({ ...gameData, coverImage })
      
      if (coverImage && coverImage.includes('temp-')) {
        const actualCover = await window.electronAPI.saveGameCover(newGame.id, coverImage)
        const updatedGame = { ...newGame, coverImage: actualCover }
        await window.electronAPI.saveGames(games.map(g => g.id === newGame.id ? updatedGame : g))
        newGame.coverImage = actualCover
      }
      
      setGames(prev => [...prev, newGame])
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding game:', error)
    }
  }

  const handleRemoveGame = async (gameId: string) => {
    try {
      await window.electronAPI.removeGame(gameId)
      setGames(prev => prev.filter(g => g.id !== gameId))
    } catch (error) {
      console.error('Error removing game:', error)
    }
  }

  const handleHideGame = async (gameId: string) => {
    try {
      await window.electronAPI.hideGame(gameId)
      setGames(prev => prev.filter(g => g.id !== gameId))
    } catch (error) {
      console.error('Error hiding game:', error)
    }
  }

  const handleUnhideGame = async (gameId: string) => {
    try {
      await window.electronAPI.unhideGame(gameId)
      const updatedGames = await window.electronAPI.getGames()
      setGames(updatedGames)
    } catch (error) {
      console.error('Error unhiding game:', error)
    }
  }

  const handleEditGame = async (updatedGame: GameInfo) => {
    try {
      let coverImage = updatedGame.coverImage
      
      // Handle cover image copying if a new image was selected
      if (coverImage && !coverImage.includes('covers') && !coverImage.startsWith('file://')) {
        try {
          const savedPath = await window.electronAPI.saveGameCover(updatedGame.id, coverImage)
          coverImage = savedPath
        } catch (error) {
          console.error('Error copying cover:', error)
        }
      }
      
      const finalGame = { ...updatedGame, coverImage }
      await window.electronAPI.saveGames(games.map(g => g.id === updatedGame.id ? finalGame : g))
      setGames(prev => prev.map(g => g.id === updatedGame.id ? finalGame : g))
      setEditingGame(null)
    } catch (error) {
      console.error('Error editing game:', error)
    }
  }

  const handleLaunchStore = async (storeName: string) => {
    try {
      const result = await window.electronAPI.launchStore(storeName)
      if (!result.success) {
        console.error(`Error launching ${storeName}:`, result.message)
      }
    } catch (error) {
      console.error('Error launching store:', error)
    }
  }

  const handleLaunchGame = async (game: GameInfo) => {
    try {
      await window.electronAPI.launchGame(game)
      
      setGames(prev => prev.map(g => {
        if (g.id === game.id) {
          return {
            ...g,
            lastPlayed: new Date().toISOString(),
            playCount: (g.playCount || 0) + 1
          }
        }
        return g
      }))
    } catch (error) {
      console.error('Error launching game:', error)
    }
  }

  const handleToggleFavorite = async (gameId: string) => {
    try {
      const newFavorites = await window.electronAPI.toggleFavorite(gameId)
      const favoriteSet = new Set(newFavorites)
      const updatedGames = games.map(g => ({
        ...g,
        isFavorite: favoriteSet.has(g.id)
      }))
      setGames(updatedGames)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      await window.electronAPI.saveSettings(newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const getFilteredGames = (): GameInfo[] => {
    let filtered = games

    if (currentView === 'favorites') {
      filtered = games.filter(g => g.isFavorite)
    } else if (currentView === 'recent') {
      filtered = games
        .filter(g => g.lastPlayed)
        .sort((a, b) => {
          const dateA = new Date(a.lastPlayed || 0).getTime()
          const dateB = new Date(b.lastPlayed || 0).getTime()
          return dateB - dateA
        })
        .slice(0, 10)
    } else if (currentView !== 'all' && currentView !== 'settings') {
      filtered = games.filter(g => g.store === currentView)
    }

    if (searchQuery) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const filteredGames = getFilteredGames()

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-red-900 text-white">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div 
        className="h-screen w-screen flex items-center justify-center"
        style={{ backgroundColor: themeColors.bg }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: themeColors.textSecondary }}>{labels.app.loading}</p>
        </div>
      </div>
    )
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    setSearchQuery('')
  }

  const appStyle = {
    '--color-bg': themeColors.bg,
    '--color-surface': themeColors.surface,
    '--color-card': themeColors.card,
    '--color-border': themeColors.border,
    '--color-text': themeColors.text,
    '--color-text-secondary': themeColors.textSecondary,
  } as React.CSSProperties

  return (
    <div className="h-screen w-screen flex flex-col" style={appStyle}>
      <TitleBar theme={settings.theme} onSettingsClick={() => setCurrentView('settings')} />
      
       {updateStatus && updateStatus.status === 'available' && (
         <div className="bg-primary-600 px-4 py-2 flex items-center justify-between text-white">
           <div className="flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             <span>Update {updateStatus.version} available</span>
           </div>
           <div className="flex items-center gap-2">
             <button
               onClick={() => setShowChangelog(true)}
               className="px-3 py-1 bg-white bg-opacity-20 text-white rounded text-sm font-medium hover:bg-opacity-30"
             >
               What's new
             </button>
             <button
               onClick={() => window.electronAPI.downloadUpdate()}
               className="px-3 py-1 bg-white text-primary-600 rounded text-sm font-medium hover:bg-gray-100"
             >
               Download & Install
             </button>
           </div>
         </div>
       )}

      {updateStatus && updateStatus.status === 'downloading' && (
        <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Downloading update... {Math.round(updateStatus.percent || 0)}%</span>
          </div>
          <div className="w-32 h-2 bg-blue-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all" 
              style={{ width: `${updateStatus.percent || 0}%` }}
            />
          </div>
        </div>
      )}

      {updateStatus && updateStatus.status === 'downloaded' && (
        <div className="bg-green-600 px-4 py-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Update {updateStatus.version} ready to install</span>
          </div>
          <button
            onClick={() => window.electronAPI.installUpdate()}
            className="px-3 py-1 bg-white text-green-600 rounded text-sm font-medium hover:bg-gray-100"
          >
            Restart & Install
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          gameCounts={{
            all: games.length,
            favorites: games.filter(g => g.isFavorite).length,
            recent: games.filter(g => g.lastPlayed).length,
            steam: games.filter(g => g.store === 'steam').length,
            epic: games.filter(g => g.store === 'epic').length,
            custom: games.filter(g => g.store === 'custom').length
          }}
          theme={settings.theme}
          storesFound={storesFound}
          onLaunchStore={handleLaunchStore}
        />
        
        <main 
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: themeColors.bg }}
        >
          {currentView === 'settings' ? (
            <SettingsView 
              settings={settings}
              onSave={handleSaveSettings}
              onScanGames={scanForGames}
              isScanning={isScanning}
              onRefreshGames={async () => {
                const games = await window.electronAPI.getGames()
                setGames(games)
              }}
            />
          ) : (
            <>
              <header 
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: themeColors.border }}
              >
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: themeColors.text }}>
                    {currentView === 'all' && labels.sidebar.allGames}
                    {currentView === 'favorites' && labels.sidebar.favorites}
                    {currentView === 'recent' && labels.sidebar.recentlyPlayed}
                    {currentView === 'steam' && project.supportedStoreNames.steam + ' Library'}
                    {currentView === 'epic' && project.supportedStoreNames.epic + ' Library'}
                    {currentView === 'custom' && project.supportedStoreNames.custom + ' Games'}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
                    {filteredGames.length} {filteredGames.length === 1 ? labels.header.game : labels.header.games}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={labels.search.placeholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 px-4 py-2 pl-10 rounded-lg focus:outline-none"
                      style={{ 
                        backgroundColor: themeColors.surface, 
                        border: `1px solid ${themeColors.border}`,
                        color: themeColors.text,
                      }}
                    />
                    <svg 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ color: themeColors.textSecondary }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {labels.addGame.title}
                  </button>
                </div>
              </header>

              <GameGrid
                games={filteredGames}
                onLaunch={handleLaunchGame}
                onRemove={handleRemoveGame}
                onHide={handleHideGame}
                onUnhide={handleUnhideGame}
                onToggleFavorite={handleToggleFavorite}
                onEdit={setEditingGame}
                isEmpty={filteredGames.length === 0}
                isScanning={isScanning}
                onScan={scanForGames}
                themeColors={themeColors}
              />
            </>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddGameModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddGame}
        />
      )}

      {editingGame && (
        <EditGameModal
          game={editingGame}
          theme={settings.theme}
          onClose={() => setEditingGame(null)}
          onSave={handleEditGame}
        />
      )}

       <ScanProgressModal
         isOpen={isScanning}
         progress={scanProgress}
       />

       <ChangelogModal
         isOpen={showChangelog}
         onClose={() => setShowChangelog(false)}
         version={updateStatus?.version}
       />
     </div>
   )
}

export default App
