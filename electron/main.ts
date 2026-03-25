import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { promises as fsPromises } from 'fs'
import log from 'electron-log'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'
import { getSteamGames, getSteamLaunchUrl, getSteamInstallPath } from './getSteamGames'
import { getEpicGames } from './getEpicGames'
import { getEAGames } from './getEAGames'
import { isAppRunning } from './gameProcess'
import { updateStorePaths, getEpicInstallPath } from './getStoresPath'
import { GameInfo, Settings } from './types'
import { 
  initSteamGridDB, 
  searchSteamGridDB, 
  getSteamGridDBGrids, 
  getSteamGridDBGridsBySteamAppId,
  downloadSteamGridDBCover,
  isExactMatch,
  isClientInitialized,
  validateSteamGridDBKey
} from './steamGridDB'

const currentVersion = app.getVersion()

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
log.info('Application starting...')

const configDir = path.join(app.getPath('userData'), 'config')
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true })
}

const store = new Store({
  cwd: configDir,
  name: 'settings',
  defaults: {
    games: [],
    favorites: [],
    settings: {
      theme: 'dark',
      scanOnStartup: true,
      hardwareAcceleration: true,
      showStoreOnGameCard: true
    }
  }
})

const startupSettings = store.get('settings') as Settings
let hardwareAccelerationEnabled = startupSettings?.hardwareAcceleration ?? true
log.info(`Hardware acceleration setting: ${hardwareAccelerationEnabled}`)

if (!hardwareAccelerationEnabled) {
  app.disableHardwareAcceleration()
  log.info('Hardware acceleration disabled')
}

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  log.info('Creating main window...')
  
   mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      scrollBounce: false,
      enablePreferredSizeMode: true
    },
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    // Hardware acceleration optimizations
    transparent: false
  })

  mainWindow.once('ready-to-show', () => {
    log.info('Window ready to show')
    mainWindow?.show()
    
    if (VITE_DEV_SERVER_URL) {
      mainWindow?.webContents.openDevTools()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    log.info('Loading dev server URL:', VITE_DEV_SERVER_URL)
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    log.info('Loading production build')
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  log.info('App ready')
  updateStorePaths()
  
  const currentSettings = store.get('settings') as Settings
  if (currentSettings.integrations?.steamGridDBApiKey) {
    initSteamGridDB(currentSettings.integrations.steamGridDBApiKey)
  }
  
  createWindow()

  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow?.webContents.toggleDevTools()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  log.info('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const isDev = !app.isPackaged

const placeholderGames: GameInfo[] = isDev ? [
  {
    id: 'dev-steam-1',
    name: 'Test Steam Game',
    executablePath: 'steam://rungameid/123456',
    store: 'steam',
    installLocation: 'C:\\Games\\TestSteam',
    lastPlayed: new Date().toISOString(),
    playCount: 5,
    isFavorite: true,
    appid: '123456'
  },
  {
    id: 'dev-epic-1',
    name: 'Test Epic Game',
    executablePath: 'C:\\Games\\TestEpic\\game.exe',
    store: 'epic',
    installLocation: 'C:\\Games\\TestEpic',
    lastPlayed: new Date(Date.now() - 86400000).toISOString(),
    playCount: 2,
    isFavorite: false
  },
  {
    id: 'dev-custom-1',
    name: 'Test Custom Game',
    executablePath: 'C:\\Games\\Custom\\game.exe',
    store: 'custom',
    installLocation: 'C:\\Games\\Custom'
  }
] : []

ipcMain.handle('get-games', async () => {
  log.info('IPC: get-games called')
  const games = store.get('games') as GameInfo[]
  const visibleGames = games.filter(g => !g.isHidden)
  if (isDev) {
    return [...placeholderGames.filter(g => !g.isHidden), ...visibleGames]
  }
  return visibleGames
})

ipcMain.handle('get-all-games', async () => {
  log.info('IPC: get-all-games called')
  const games = store.get('games') as GameInfo[]
  if (isDev) {
    return [...placeholderGames, ...games]
  }
  return games
})

ipcMain.handle('save-games', async (_, games: GameInfo[]) => {
  log.info('IPC: save-games called, count:', games.length)
  store.set('games', games)
  return true
})

ipcMain.handle('hide-game', async (_, gameId: string) => {
  log.info('IPC: hide-game called', gameId)
  const games = store.get('games') as GameInfo[]
  const updated = games.map(g => g.id === gameId ? { ...g, isHidden: true } : g)
  store.set('games', updated)
  return true
})

ipcMain.handle('unhide-game', async (_, gameId: string) => {
  log.info('IPC: unhide-game called', gameId)
  const games = store.get('games') as GameInfo[]
  const updated = games.map(g => g.id === gameId ? { ...g, isHidden: false } : g)
  store.set('games', updated)
  return true
})

ipcMain.handle('scan-games', async (event) => {
  log.info('IPC: scan-games called')
  try {
    const sendProgress = (current: number, total: number, currentGame: string, store: string) => {
      event.sender.send('scan-progress', { current, total, currentGame, store })
    }

    const existingGames = store.get('games') as GameInfo[]
    const existingIds = new Set(existingGames.map(g => g.id))
    const customGames = existingGames.filter(g => g.store === 'custom')
    const nonCustomGames = existingGames.filter(g => g.store !== 'custom')
    
    sendProgress(0, 0, '', 'steam')
    const steamGames = await getSteamGames()
    
    sendProgress(0, 0, '', 'epic')
    const epicGames = await getEpicGames()

    sendProgress(0, 0, '', 'ea')
    const eaGames = await getEAGames()

    const allDetectedGames = [...steamGames, ...epicGames, ...eaGames]
    const detectedIds = new Set(allDetectedGames.map(g => g.id))

    const keptGames = nonCustomGames.filter(g => detectedIds.has(g.id))
    
    const removedGames = nonCustomGames.filter(g => !detectedIds.has(g.id))
    if (removedGames.length > 0) {
      log.info(`Removing ${removedGames.length} uninstalled games: ${removedGames.map(g => g.name).join(', ')}`)
      for (const game of removedGames) {
        const coversPath = path.join(app.getPath('userData'), 'config', 'covers', game.id)
        try {
          await fsPromises.rm(coversPath, { recursive: true, force: true })
          log.info('Deleted covers folder for uninstalled game:', game.name)
        } catch (err) {
          log.warn('Failed to delete covers folder for game:', game.name, err)
        }
      }
    }

    const newGames = allDetectedGames.filter(g => !existingIds.has(g.id))

    const updatedGames = [...customGames, ...keptGames, ...newGames]
    
    const realGames = updatedGames.filter(g => !g.id.startsWith('dev-'))
    store.set('games', realGames)

    const favorites = store.get('favorites') as string[]
    const favoriteIds = new Set(favorites)
    const visibleGames = realGames.filter(g => !g.isHidden)
    const returnedGames = (isDev ? [...placeholderGames.filter(g => !g.isHidden), ...visibleGames] : visibleGames).map(g => ({
      ...g,
      isFavorite: favoriteIds.has(g.id)
    }))

    sendProgress(newGames.length, newGames.length, '', 'complete')
    
    log.info(`Scan complete. Found ${newGames.length} new games, removed ${removedGames.length} uninstalled games`)
    return { games: returnedGames, newCount: newGames.length, removedCount: removedGames.length }
  } catch (error) {
    log.error('Error scanning games:', error)
    throw error
  }
})

ipcMain.handle('add-game', async (_, game: Omit<GameInfo, 'id'>) => {
  log.info('IPC: add-game called', game.name)
  const games = store.get('games') as GameInfo[]
  const newGame: GameInfo = {
    ...game,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  games.push(newGame)
  store.set('games', games)
  return newGame
})

ipcMain.handle('remove-game', async (_, gameId: string) => {
  log.info('IPC: remove-game called', gameId)

  const coversPath = path.join(app.getPath('userData'), 'config', 'covers', gameId)
  try {
    await fsPromises.rm(coversPath, { recursive: true, force: true })
    log.info('Deleted covers folder:', coversPath)
  } catch (err) {
    log.warn('Failed to delete covers folder:', err)
  }

  const games = store.get('games') as GameInfo[]
  const filtered = games.filter(g => g.id !== gameId)
  store.set('games', filtered)
  return true
})

ipcMain.handle('launch-store', async (_, storeName: string) => {
  log.info('IPC: launch-store called', storeName)
  try {
    if (storeName === 'steam') {
      const steamPath = await getSteamInstallPath()
      if (steamPath) {
        const steamExe = path.join(steamPath, 'steam.exe')
        const isSteamRunning = await isAppRunning('steam.exe')
        
        if (!isSteamRunning) {
          log.info(`Launching Steam: ${steamExe}`)
          exec(`"${steamExe}"`)
        } else {
          log.info('Steam is already running')
        }
      } else {
        log.warn('Steam not found')
        return { success: false, message: 'Steam not installed' }
      }
    } else if (storeName === 'epic') {
      const epicPath = await getEpicInstallPath()
      if (epicPath) {
        log.info(`Launching Epic Games: ${epicPath}`)
        exec(`"${epicPath}"`)
      } else {
        log.warn('Epic Games not found')
        return { success: false, message: 'Epic Games not installed' }
      }
    } else if (storeName === 'ea') {
      const { getEAInstallPath } = await import('./getEAGames')
      const eaPath = await getEAInstallPath()
      if (eaPath) {
        log.info(`Launching EA App: ${eaPath}`)
        exec(`"${eaPath}"`)
      } else {
        log.warn('EA App not found')
        return { success: false, message: 'EA App not installed' }
      }
    } else {
      log.warn(`Unknown store: ${storeName}`)
      return { success: false, message: 'Unknown store' }
    }
    
    return { success: true }
  } catch (error) {
    log.error('Error launching store:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('launch-game', async (_, game: GameInfo) => {
  log.info('IPC: launch-game called', game.name)
  try {
    if (game.store === 'steam' && game.appid) {
      const steamPath = await getSteamInstallPath()
      if (steamPath) {
        const steamExe = path.join(steamPath, 'steam.exe')
        const isSteamRunning = await isAppRunning('steam.exe')
        
        if (!isSteamRunning) {
          log.info(`Launching Steam with -silent: ${steamExe}`)
          exec(`"${steamExe}" -silent`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        } else {
          log.info('Steam is already running, skipping launch')
        }
      }
      
      const steamUrl = getSteamLaunchUrl(game.appid)
      log.info(`Launching Steam game via: ${steamUrl}`)
      await shell.openExternal(steamUrl)
    } else if (game.store === 'epic' || game.executablePath.startsWith('com.epicgames')) {
      const epicUrl = game.executablePath.startsWith('com.epicgames') 
        ? game.executablePath 
        : game.executablePath
      log.info(`Launching Epic game via: ${epicUrl}`)
      await shell.openExternal(epicUrl)
    } else if (game.store === 'ea' || game.executablePath.startsWith('origin2://')) {
      const eaUrl = game.executablePath
      log.info(`Launching EA game via: ${eaUrl}`)
      await shell.openExternal(eaUrl)
    } else {
      await shell.openPath(game.executablePath)
    }
    
    const games = store.get('games') as GameInfo[]
    const updated = games.map(g => {
      if (g.id === game.id) {
        return {
          ...g,
          lastPlayed: new Date().toISOString(),
          playCount: (g.playCount || 0) + 1
        }
      }
      return g
    })
    store.set('games', updated)
    
    log.info('Game launched successfully:', game.name)
    return true
  } catch (error) {
    log.error('Error launching game:', error)
    throw error
  }
})

ipcMain.handle('select-executable', async () => {
  log.info('IPC: select-executable called')
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('select-image', async () => {
  log.info('IPC: select-image called')
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle('save-game-cover', async (_, gameId: string, imagePath: string) => {
  log.info('IPC: save-game-cover called', gameId, imagePath)
  
  try {
    const coversDir = path.join(app.getPath('userData'), 'config', 'covers', gameId)
    
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true })
    }
    
    const ext = path.extname(imagePath) || '.png'
    const destPath = path.join(coversDir, `cover${ext}`)
    
    fs.copyFileSync(imagePath, destPath)
    
    log.info('Cover copied to:', destPath)
    return destPath
  } catch (error) {
    log.error('Error saving cover:', error)
    throw error
  }
})

ipcMain.handle('get-settings', async () => {
  return store.get('settings')
})

ipcMain.handle('refresh-store-paths', async () => {
  return await updateStorePaths()
})

ipcMain.handle('get-store-paths', async () => {
  const settings = store.get('settings') as { gameClients?: { steam?: string | null; epic?: string | null; ea?: string | null } }
  return {
    steamPath: settings?.gameClients?.steam || null,
    epicPath: settings?.gameClients?.epic || null,
    eaPath: settings?.gameClients?.ea || null
  }
})

ipcMain.handle('save-settings', async (_, settings: Settings) => {
  const currentSettings = store.get('settings') as Record<string, unknown>
  store.set('settings', {
    ...currentSettings,
    ...settings
  })
  return true
})

ipcMain.handle('get-favorites', async () => {
  return store.get('favorites') as string[]
})

ipcMain.handle('save-favorites', async (_, favoriteIds: string[]) => {
  store.set('favorites', favoriteIds)
  return true
})

ipcMain.handle('toggle-favorite', async (_, gameId: string) => {
  const favorites = store.get('favorites') as string[]
  const index = favorites.indexOf(gameId)
  if (index === -1) {
    favorites.push(gameId)
  } else {
    favorites.splice(index, 1)
  }
  store.set('favorites', favorites)
  return favorites
})

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

ipcMain.handle('restart-app', () => {
  app.relaunch()
  app.exit(0)
})

autoUpdater.logger = log
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...')
  mainWindow?.webContents.send('update-status', { status: 'checking' })
})

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version)
  mainWindow?.webContents.send('update-status', { 
    status: 'available', 
    version: info.version,
    releaseNotes: info.releaseNotes
  })
})

autoUpdater.on('update-not-available', () => {
  log.info('No update available')
  mainWindow?.webContents.send('update-status', { status: 'not-available' })
})

autoUpdater.on('download-progress', (progress) => {
  log.info(`Download progress: ${progress.percent.toFixed(1)}%`)
  mainWindow?.webContents.send('update-status', { 
    status: 'downloading', 
    percent: progress.percent 
  })
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version)
  mainWindow?.webContents.send('update-status', { 
    status: 'downloaded', 
    version: info.version 
  })
})

autoUpdater.on('error', (error) => {
  log.error('Auto-updater error:', error)
  mainWindow?.webContents.send('update-status', { 
    status: 'error', 
    error: error.message 
  })
})

ipcMain.handle('check-for-updates', async () => {
  log.info('IPC: check-for-updates called')
  try {
    if (!app.isPackaged) {
      log.info('Skipping auto-update check in development mode')
      return { status: 'dev-mode', currentVersion }
    }
    const result = await autoUpdater.checkForUpdates()
    return result?.updateInfo ? {
      currentVersion,
      latestVersion: result.updateInfo.version,
      isUpdateAvailable: true,
      releaseNotes: result.updateInfo.releaseNotes
    } : null
  } catch (error) {
    log.error('Error checking for updates:', error)
    return null
  }
})

ipcMain.handle('download-update', async () => {
  log.info('IPC: download-update called')
  try {
    await autoUpdater.downloadUpdate()
    return true
  } catch (error) {
    log.error('Error downloading update:', error)
    return false
  }
})

ipcMain.handle('install-update', () => {
  log.info('IPC: install-update called')
  autoUpdater.quitAndInstall()
})

ipcMain.handle('fetch-changelog', async () => {
  log.info('IPC: fetch-changelog called')
  try {
    const response = await fetch('https://raw.githubusercontent.com/wiki/miguel-apereira/Olympus-Frontend/Changelog.md')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const content = await response.text()
    return { content, error: undefined }
  } catch (error) {
    log.error('Error fetching changelog:', error)
    return { content: '', error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('search-steamgriddb', async (_, query: string) => {
  log.info('IPC: search-steamgriddb called', query)
  if (!isClientInitialized()) {
    return { error: 'SteamGridDB API key not configured. You can set your API key in the settings.' }
  }
  try {
    const games = await searchSteamGridDB(query)
    return { games, error: undefined }
  } catch (error) {
    log.error('Error searching SteamGridDB:', error)
    return { games: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('get-steamgriddb-grids', async (_, gameId: number) => {
  log.info('IPC: get-steamgriddb-grids called', gameId)
  if (!isClientInitialized()) {
    return { grids: [], error: 'SteamGridDB API key not configured' }
  }
  try {
    const grids = await getSteamGridDBGrids(gameId)
    log.info('Returning grids to frontend, count:', grids.length, 'first thumb:', grids[0]?.thumb)
    return { grids, error: undefined }
  } catch (error) {
    log.error('Error getting SteamGridDB grids:', error)
    return { grids: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('get-steamgriddb-grids-by-appid', async (_, appId: string) => {
  log.info('IPC: get-steamgriddb-grids-by-appid called', appId)
  if (!isClientInitialized()) {
    return { grids: [], error: 'SteamGridDB API key not configured' }
  }
  try {
    const grids = await getSteamGridDBGridsBySteamAppId(appId)
    return { grids, error: undefined }
  } catch (error) {
    log.error('Error getting SteamGridDB grids by appid:', error)
    return { grids: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('download-steamgriddb-cover', async (_, gridUrl: string, gameId: string) => {
  log.info('IPC: download-steamgriddb-cover called', gameId)
  try {
    const coverPath = await downloadSteamGridDBCover(gridUrl, gameId, app.getPath('userData'))
    return { path: coverPath, error: undefined }
  } catch (error) {
    log.error('Error downloading SteamGridDB cover:', error)
    return { path: '', error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('init-steamgriddb', async (_, apiKey: string) => {
  log.info('IPC: init-steamgriddb called')
  try {
    initSteamGridDB(apiKey)
    
    const isValid = await validateSteamGridDBKey()
    if (!isValid) {
      return { success: false, error: 'Invalid API key' }
    }
    
    return { success: true }
  } catch (error: any) {
    log.error('Error initializing SteamGridDB:', error?.message || error)
    initSteamGridDB('')
    if (error?.message === 'INVALID_API_KEY' || error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('Unauthorized') || error?.message?.includes('Forbidden')) {
      return { success: false, error: 'Invalid API key' }
    }
    return { success: false, error: error.message || 'Failed to validate API key' }
  }
})

ipcMain.handle('check-steamgriddb-status', async () => {
  return { initialized: isClientInitialized() }
})

ipcMain.handle('validate-steamgriddb-key', async () => {
  log.info('IPC: validate-steamgriddb-key called')
  try {
    const isValid = await validateSteamGridDBKey()
    if (isValid) {
      return { success: true }
    } else {
      return { success: false, error: 'Invalid API key' }
    }
  } catch (error: any) {
    log.error('Error validating SteamGridDB key:', error?.message || error)
    return { success: false, error: error?.message || 'Failed to validate API key' }
  }
})

ipcMain.handle('open-external', async (_, url: string) => {
  log.info('IPC: open-external called', url)
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    log.error('Error opening external URL:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

log.info('Main process initialized')
