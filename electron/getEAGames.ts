import { exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'

export interface EAGame {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: 'ea'
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  appid?: string
  processName?: string
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function getEAInstallPath(): Promise<string | null> {
  return new Promise((resolve) => {
    exec(
      'reg query "HKLM\\SOFTWARE\\Electronic Arts\\EA Desktop" /v LauncherAppPath',
      { windowsHide: true },
      (error, stdout) => {
        if (error) {
          exec(
            'reg query "HKLM\\SOFTWARE\\WOW6432Node\\Origin" /v ClientPath',
            { windowsHide: true },
            (err, out) => {
              if (err) {
                log.debug('Could not find EA App in registry')
                resolve(null)
              } else {
                const match = out.match(/ClientPath\s+REG_SZ\s+(.+)/)
                if (match) {
                  let eaPath = match[1].trim().replace(/\//g, '\\')
                  if (!eaPath.toLowerCase().endsWith('ealauncher.exe')) {
                    eaPath = path.join(eaPath, 'EALauncher.exe')
                  }
                  log.info(`Found EA App in WOW6432Node\\Origin: ${eaPath}`)
                  resolve(eaPath)
                } else {
                  resolve(null)
                }
              }
            }
          )
        } else {
          const match = stdout.match(/LauncherAppPath\s+REG_SZ\s+(.+)/)
          if (match) {
            let eaPath = match[1].trim().replace(/\//g, '\\')
            if (!eaPath.toLowerCase().endsWith('ealauncher.exe')) {
              eaPath = path.join(eaPath, 'EALauncher.exe')
            }
            log.info(`Found EA App in Electronic Arts\\EA Desktop: ${eaPath}`)
            resolve(eaPath)
          } else {
            resolve(null)
          }
        }
      }
    )
  })
}

interface OriginGame {
  id: string
  displayName: string
}

function cleanGameName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
}
  
async function getEAGamesFromRegistry(): Promise<OriginGame[]> {
  return new Promise((resolve) => {
    exec(
      'chcp 65001 >nul && reg query "HKLM\\SOFTWARE\\WOW6432Node\\Origin Games"',
      { windowsHide: true, encoding: 'utf8' },
      (error, stdout) => {
        if (error) {
          log.debug('Could not find Origin Games registry key')
          resolve([])
          return
        }

        const games: OriginGame[] = []
        const folderRegex = /Origin Games\\(.+?)\s*$/gm
        let match

        while ((match = folderRegex.exec(stdout)) !== null) {
          const gameId = match[1].trim()
          if (gameId) {
            games.push({ id: gameId, displayName: '' })
          }
        }

        if (games.length === 0) {
          resolve([])
          return
        }

        const gamePromises = games.map(async (game) => {
          return new Promise<void>((gameResolve) => {
            exec(
              `chcp 65001 >nul && reg query "HKLM\\SOFTWARE\\WOW6432Node\\Origin Games\\${game.id}" /v DisplayName`,
              { windowsHide: true, encoding: 'utf8' },
              (err, out) => {
                if (!err && out) {
                  const nameMatch = out.match(/DisplayName\s+REG_SZ\s+(.+)/)
                  if (nameMatch) {
                    game.displayName = nameMatch[1].trim()
                  }
                }
                gameResolve()
              }
            )
          })
        })

        Promise.all(gamePromises).then(() => {
          resolve(games.filter(g => g.displayName))
        })
      }
    )
  })
}

async function getInstalledEALicenseIds(): Promise<Set<string>> {
  const licenseDir = 'C:\\ProgramData\\Electronic Arts\\EA Services\\License'
  const installedIds = new Set<string>()
  
  try {
    const files = await fs.readdir(licenseDir)
    for (const file of files) {
      if (file.endsWith('.dlf')) {
        const gameId = file.replace('.dlf', '')
        installedIds.add(gameId)
      }
    }
    log.info(`Found ${installedIds.size} EA game licenses`)
  } catch (error) {
    log.debug('Could not read EA License folder:', error)
  }
  
  return installedIds
}

export async function getEAGames(): Promise<EAGame[]> {
  log.info('Detecting EA games...')
  const games: EAGame[] = []

  try {
    const eaPath = await getEAInstallPath()
    
    if (!eaPath) {
      log.info('EA App not found')
      return games
    }

    const launcherExists = await fileExists(eaPath)
    if (!launcherExists) {
      log.info('EALauncher.exe not found at expected path')
      return games
    }

    log.info(`EA App found at: ${eaPath}`)

    const [registryGames, installedLicenses] = await Promise.all([
      getEAGamesFromRegistry(),
      getInstalledEALicenseIds()
    ])
    
    log.info(`Found ${registryGames.length} EA games in registry, ${installedLicenses.size} have valid licenses`)

    for (const game of registryGames) {
      if (!installedLicenses.has(game.id)) {
        log.debug(`Skipping uninstalled EA game: ${game.displayName} (${game.id}) - no license found`)
        continue
      }
      
      const launchUri = `origin2://game/launch?offerIds=${game.id}`
      const cleanName = cleanGameName(game.displayName)
      
      games.push({
        id: `ea-${game.id}`,
        name: cleanName,
        executablePath: launchUri,
        store: 'ea',
        installLocation: path.dirname(eaPath),
        appid: game.id
      })
      
      log.info(`Found EA game: ${cleanName} (${game.id})`)
    }

    log.info(`Found ${games.length} EA games`)
  } catch (error) {
    log.error('Error detecting EA games:', error)
  }

  return games
}

export function getEALaunchUrl(gameId: string): string {
  return `origin2://game/launch?offerIds=${gameId}`
}
