export interface GameInfo {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: 'steam' | 'epic' | 'ea' | 'custom'
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
  hardwareAcceleration: boolean
  language?: string
  showStoreOnGameCard?: boolean
  integrations?: {
    steamGridDBApiKey?: string
  }
}

export interface SteamGridDBGame {
  id: number
  name: string
  types: string[]
  verified: boolean
}

export interface SteamGridDBGrid {
  id: number
  url: string
  thumb: string
  style: string
  dimensions: string
  likes: number
}
