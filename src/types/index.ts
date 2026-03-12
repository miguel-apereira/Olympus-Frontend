import { StoreType, ThemeMode } from '../config'

export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: StoreType
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  appid?: string
  processName?: string
}

export interface Settings {
  theme: ThemeMode
  scanOnStartup: boolean
  hardwareAcceleration: boolean
  integrations?: {
    steamGridDBApiKey?: string
  }
}

export type ViewType = 'all' | 'favorites' | 'recent' | 'steam' | 'epic' | 'custom' | 'settings'

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'dev-mode'
  version?: string
  releaseNotes?: string
  percent?: number
  error?: string
}


