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
}

const electronAPI = {
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
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings): Promise<boolean> => ipcRenderer.invoke('save-settings', settings),
  windowMinimize: (): Promise<void> => ipcRenderer.invoke('window-minimize'),
  windowMaximize: (): Promise<void> => ipcRenderer.invoke('window-maximize'),
  windowClose: (): Promise<void> => ipcRenderer.invoke('window-close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window-is-maximized'),
  onScanProgress: (callback: (progress: { current: number; total: number; currentGame: string; store: string }) => void) => {
    const handler = (_: unknown, progress: { current: number; total: number; currentGame: string; store: string }) => callback(progress)
    ipcRenderer.on('scan-progress', handler)
    return () => ipcRenderer.removeListener('scan-progress', handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
