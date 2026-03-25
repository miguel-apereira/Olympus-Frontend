/// <reference types="vite/client" />

interface ScanProgress {
  current: number
  total: number
  currentGame: string
  store: string
}

interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev-mode'
  version?: string
  releaseNotes?: string
  percent?: number
  error?: string
}

interface UpdateInfo {
  currentVersion: string
  latestVersion?: string
  isUpdateAvailable?: boolean
  releaseNotes?: string
  status?: string
}

interface Window {
  electronAPI: {
    getGames: () => Promise<import('./types').GameInfo[]>
    getAllGames: () => Promise<import('./types').GameInfo[]>
    saveGames: (games: import('./types').GameInfo[]) => Promise<boolean>
    scanGames: () => Promise<{ games: import('./types').GameInfo[]; newCount: number }>
    addGame: (game: Omit<import('./types').GameInfo, 'id'>) => Promise<import('./types').GameInfo>
    removeGame: (gameId: string) => Promise<boolean>
    hideGame: (gameId: string) => Promise<boolean>
    unhideGame: (gameId: string) => Promise<boolean>
    launchGame: (game: import('./types').GameInfo) => Promise<boolean>
    selectExecutable: () => Promise<string | null>
    selectImage: () => Promise<string | null>
    saveGameCover: (gameId: string, imagePath: string) => Promise<string>
    getSettings: () => Promise<import('./types').Settings>
    saveSettings: (settings: import('./types').Settings) => Promise<boolean>
    refreshStorePaths: () => Promise<{ steam: string | null; epic: string | null; ea: string | null }>
    getStorePaths: () => Promise<{ steamPath: string | null; epicPath: string | null; eaPath: string | null }>
    getFavorites: () => Promise<string[]>
    saveFavorites: (favoriteIds: string[]) => Promise<boolean>
    toggleFavorite: (gameId: string) => Promise<string[]>
    windowMinimize: () => Promise<void>
    windowMaximize: () => Promise<void>
    windowClose: () => Promise<void>
    windowIsMaximized: () => Promise<boolean>
    restartApp: () => Promise<void>
    checkForUpdates: () => Promise<UpdateInfo | null>
    downloadUpdate: () => Promise<boolean>
    installUpdate: () => Promise<void>
    launchStore: (storeName: string) => Promise<{ success: boolean; message?: string }>
    onScanProgress: (callback: (progress: ScanProgress) => void) => () => void
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
    fetchChangelog: () => Promise<{ content: string; error?: string }>
    searchSteamGridDB: (query: string) => Promise<{ games: { id: number; name: string; types: string[]; verified: boolean }[]; error?: string }>
    getSteamGridDBGrids: (gameId: number) => Promise<{ grids: { id: number; url: string; thumb: string; style: string; dimensions: string; likes: number }[]; error?: string }>
    getSteamGridDBGridsByAppId: (appId: string) => Promise<{ grids: { id: number; url: string; thumb: string; style: string; dimensions: string; likes: number }[]; error?: string }>
    downloadSteamGridDBCover: (gridUrl: string, gameId: string) => Promise<{ path: string; error?: string }>
    initSteamGridDB: (apiKey: string) => Promise<{ success: boolean; error?: string }>
    validateSteamGridDBKey: () => Promise<{ success: boolean; error?: string }>
    checkSteamGridDBStatus: () => Promise<{ initialized: boolean }>
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
  }
}
