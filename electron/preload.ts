import { contextBridge, ipcRenderer } from 'electron'

export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: 'steam' | 'epic' | 'custom'
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  appid?: string
  processName?: string
}

export interface Settings {
  theme: string
  scanOnStartup: boolean
}

export interface ScanResult {
  games: GameInfo[]
  newCount: number
  removedCount: number
}

export interface UpdateInfo {
  currentVersion: string
  latestVersion?: string
  isUpdateAvailable?: boolean
  releaseNotes?: string
  status?: string
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev-mode'
  version?: string
  releaseNotes?: string
  percent?: number
  error?: string
}

interface ElectronAPI {
  getGames: () => Promise<GameInfo[]>
  getAllGames: () => Promise<GameInfo[]>
  saveGames: (games: GameInfo[]) => Promise<boolean>
  scanGames: () => Promise<ScanResult>
  addGame: (game: Omit<GameInfo, 'id'>) => Promise<GameInfo>
  removeGame: (gameId: string) => Promise<boolean>
  hideGame: (gameId: string) => Promise<boolean>
  unhideGame: (gameId: string) => Promise<boolean>
  launchGame: (game: GameInfo) => Promise<boolean>
  selectExecutable: () => Promise<string | null>
  selectImage: () => Promise<string | null>
  saveGameCover: (gameId: string, imagePath: string) => Promise<string>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<boolean>
  refreshStorePaths: () => Promise<{ steam: string | null; epic: string | null }>
  getStorePaths: () => Promise<{ steamPath: string | null; epicPath: string | null }>
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
  onScanProgress: (callback: (progress: { current: number; total: number; currentGame: string; store: string }) => void) => () => void
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
  fetchChangelog: () => Promise<{ content: string; error?: string }>
}

const electronAPI: ElectronAPI = {
  getGames: (): Promise<GameInfo[]> => ipcRenderer.invoke('get-games'),
  getAllGames: (): Promise<GameInfo[]> => ipcRenderer.invoke('get-all-games'),
  saveGames: (games: GameInfo[]): Promise<boolean> => ipcRenderer.invoke('save-games', games),
  scanGames: (): Promise<ScanResult> => ipcRenderer.invoke('scan-games'),
  addGame: (game: Omit<GameInfo, 'id'>): Promise<GameInfo> => ipcRenderer.invoke('add-game', game),
  removeGame: (gameId: string): Promise<boolean> => ipcRenderer.invoke('remove-game', gameId),
  hideGame: (gameId: string): Promise<boolean> => ipcRenderer.invoke('hide-game', gameId),
  unhideGame: (gameId: string): Promise<boolean> => ipcRenderer.invoke('unhide-game', gameId),
  launchGame: (game: GameInfo): Promise<boolean> => ipcRenderer.invoke('launch-game', game),
  selectExecutable: (): Promise<string | null> => ipcRenderer.invoke('select-executable'),
  selectImage: (): Promise<string | null> => ipcRenderer.invoke('select-image'),
  saveGameCover: (gameId: string, imagePath: string): Promise<string> => ipcRenderer.invoke('save-game-cover', gameId, imagePath),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings): Promise<boolean> => ipcRenderer.invoke('save-settings', settings),
  refreshStorePaths: (): Promise<{ steam: string | null; epic: string | null }> => ipcRenderer.invoke('refresh-store-paths'),
  getStorePaths: (): Promise<{ steamPath: string | null; epicPath: string | null }> => ipcRenderer.invoke('get-store-paths'),
  getFavorites: (): Promise<string[]> => ipcRenderer.invoke('get-favorites'),
  saveFavorites: (favoriteIds: string[]): Promise<boolean> => ipcRenderer.invoke('save-favorites', favoriteIds),
  toggleFavorite: (gameId: string): Promise<string[]> => ipcRenderer.invoke('toggle-favorite', gameId),
  windowMinimize: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
  windowMaximize: (): Promise<void> => ipcRenderer.invoke('window-maximize'),
  windowClose: (): Promise<void> => ipcRenderer.invoke('window-close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),
  restartApp: (): Promise<void> => ipcRenderer.invoke('restart-app'),
  checkForUpdates: (): Promise<UpdateInfo | null> => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (): Promise<boolean> => ipcRenderer.invoke('download-update'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('install-update'),
  launchStore: (storeName: string): Promise<{ success: boolean; message?: string }> => ipcRenderer.invoke('launch-store', storeName),
  onScanProgress: (callback: (progress: { current: number; total: number; currentGame: string; store: string }) => void) => {
    const handler = (_: unknown, progress: { current: number; total: number; currentGame: string; store: string }) => callback(progress)
    ipcRenderer.on('scan-progress', handler)
    return () => ipcRenderer.removeListener('scan-progress', handler)
  },
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const handler = (_: unknown, status: UpdateStatus) => callback(status)
    ipcRenderer.on('update-status', handler)
    return () => ipcRenderer.removeListener('update-status', handler)
  },
  fetchChangelog: (): Promise<{ content: string; error?: string }> => ipcRenderer.invoke('fetch-changelog')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
