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
  appid?: string
}

export interface Settings {
  theme: string
  scanOnStartup: boolean
}
