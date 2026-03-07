import { exec } from 'child_process'
import { app } from 'electron'
import log from 'electron-log'
import Store from 'electron-store'
import path from 'path'
import fs from 'fs'

interface StorePaths {
  steam: string | null
  epic: string | null
}

const configDir = path.join(app.getPath('userData'), 'config')
const settingsPath = path.join(configDir, 'settings.json')

function getStore(): Store {
  return new Store({
    cwd: configDir,
    name: 'settings'
  })
}

export async function getSteamInstallPath(): Promise<string | null> {
  return new Promise((resolve) => {
    exec(
      'reg query "HKCU\\Software\\Valve\\Steam" /v InstallPath',
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          exec(
            'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath',
            { windowsHide: true },
            (err, out) => {
              if (err) {
                log.debug('Could not find Steam in registry (HKCU and HKLM)')
                resolve(null)
              } else {
                const match = out.match(/InstallPath\s+REG_SZ\s+(.+)/)
                if (match) {
                  const steamPath = match[1].trim().replace(/\//g, '\\')
                  log.info(`Found Steam in HKLM: ${steamPath}`)
                  resolve(steamPath)
                } else {
                  resolve(null)
                }
              }
            }
          )
        } else {
          const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/)
          if (match) {
            const steamPath = match[1].trim().replace(/\//g, '\\')
            log.info(`Found Steam in HKCU: ${steamPath}`)
            resolve(steamPath)
          } else {
            resolve(null)
          }
        }
      }
    )
  })
}

export async function getEpicInstallPath(): Promise<string | null> {
  return new Promise((resolve) => {
    exec(
      'reg query "HKLM\\SOFTWARE\\WOW6432Node\\EpicGames\\Epic Games Updater" /v EpicGamesLauncherExecutable',
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          log.debug('Could not find Epic Games in registry')
          resolve(null)
        } else {
          const match = stdout.match(/EpicGamesLauncherExecutable\s+REG_SZ\s+(.+)/)
          if (match) {
            const epicPath = match[1].trim().replace(/\//g, '\\')
            log.info(`Found Epic Games: ${epicPath}`)
            resolve(epicPath)
          } else {
            resolve(null)
          }
        }
      }
    )
  })
}

export async function updateStorePaths(): Promise<StorePaths> {
  const store = getStore()
  
  const steamInstallPath = await getSteamInstallPath()
  const steamPath = steamInstallPath ? path.join(steamInstallPath, 'steam.exe') : null
  const epicPath = await getEpicInstallPath()
  
  const currentSettings = store.get('settings') as Record<string, unknown> || {}
  
  const newSettings = {
    ...currentSettings,
    gameClients: {
      steam: steamPath,
      epic: epicPath
    }
  }
  
  store.set('settings', newSettings)
  
  log.info(`Store paths updated - Steam: ${steamPath}, Epic: ${epicPath}`)
  
  return { steam: steamPath, epic: epicPath }
}

export function getStorePathsFromSettings(): StorePaths {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      return {
        steam: data.settings?.gameClients?.steam || null,
        epic: data.settings?.gameClients?.epic || null
      }
    }
  } catch (error) {
    log.error('Error reading store paths from settings:', error)
  }
  
  return { steam: null, epic: null }
}
