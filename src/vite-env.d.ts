/// <reference types="vite/client" />

interface ScanProgress {
  current: number
  total: number
  currentGame: string
  store: string
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
    getSettings: () => Promise<import('./types').Settings>
    saveSettings: (settings: import('./types').Settings) => Promise<boolean>
    windowMinimize: () => Promise<void>
    windowMaximize: () => Promise<void>
    windowClose: () => Promise<void>
    windowIsMaximized: () => Promise<boolean>
    onScanProgress: (callback: (progress: ScanProgress) => void) => () => void
  }
}
