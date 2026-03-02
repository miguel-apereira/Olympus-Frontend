import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import log from 'electron-log'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'
import { getSteamGames, getSteamLaunchUrl, getSteamInstallPath } from './getSteamGames'
import { getEpicGames } from './getEpicGames'
import { isAppRunning } from './gameProcess'
import { GameInfo, Settings } from './types'

const currentVersion = app.getVersion()

log.transports.file.level = 'info'
log.transports.console.level = 'debug'
log.info('Application starting...')

app.disableHardwareAcceleration()

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason)
})

const configDir = path.join(app.getPath('userData'), 'config')
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true })
}

const store = new Store({
  cwd: configDir,
  name: 'settings',
  defaults: {
    games: [],
    settings: {
      theme: 'dark',
      scanOnStartup: true
    }
  }
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
      sandbox: false
    },
    frame: false,
    titleBarStyle: 'hidden',
    show: false
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
    
    sendProgress(0, 0, '', 'steam')
    const steamGames = await getSteamGames()
    
    sendProgress(0, 0, '', 'epic')
    const epicGames = await getEpicGames()

    const allDetectedGames = [...steamGames, ...epicGames]
    const newGames = allDetectedGames.filter(g => !existingIds.has(g.id))

    const updatedGames = [...existingGames, ...newGames]
    
    const realGames = updatedGames.filter(g => !g.id.startsWith('dev-'))
    store.set('games', realGames)

    const visibleGames = realGames.filter(g => !g.isHidden)
    const returnedGames = isDev ? [...placeholderGames.filter(g => !g.isHidden), ...visibleGames] : visibleGames

    sendProgress(newGames.length, newGames.length, '', 'complete')
    
    log.info(`Scan complete. Found ${newGames.length} new games`)
    return { games: returnedGames, newCount: newGames.length }
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
  const games = store.get('games') as GameInfo[]
  const filtered = games.filter(g => g.id !== gameId)
  store.set('games', filtered)
  return true
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

ipcMain.handle('save-settings', async (_, settings: { theme: string; scanOnStartup: boolean }) => {
  store.set('settings', settings)
  return true
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

log.info('Main process initialized')
