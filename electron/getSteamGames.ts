import { exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'

export interface SteamGame {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: 'steam'
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  appid: string
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

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return ''
  }
}

function parseVDFKeyValue(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /"(\w+)"\s+"([^"]*)"/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    result[match[1]] = match[2]
  }
  
  return result
}

function parseVDFObject(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const blockRegex = /"(\w+)"\s*\{([^}]*)\}/g
  let blockMatch

  while ((blockMatch = blockRegex.exec(content)) !== null) {
    const blockName = blockMatch[1]
    const blockContent = blockMatch[2]
    result[blockName] = parseVDFKeyValue(blockContent)
    
    const nestedBlockRegex = /"(\w+)"\s*\{([^}]*)\}/g
    let nestedMatch
    const nestedContent = result[blockName] as Record<string, string>
    
    while ((nestedMatch = nestedBlockRegex.exec(blockContent)) !== null) {
      nestedContent[nestedMatch[1]] = parseVDFKeyValue(nestedMatch[2]) as unknown as string
    }
  }
  
  const simpleProps = parseVDFKeyValue(content)
  for (const [key, value] of Object.entries(simpleProps)) {
    if (!(key in result)) {
      result[key] = value
    }
  }
  
  return result
}

async function parseLibraryFoldersVDF(steamPath: string): Promise<string[]> {
  const libraryPaths: string[] = []

  const libraryFoldersPaths = [
    path.join(steamPath, 'steamapps', 'libraryfolders.vdf'),
    path.join(steamPath, 'config', 'libraryfolders.vdf')
  ]

  for (const libraryFoldersPath of libraryFoldersPaths) {
    if (!await fileExists(libraryFoldersPath)) continue

    try {
      const content = await readFileContent(libraryFoldersPath)
      log.info(`Parsing libraryfolders.vdf at: ${libraryFoldersPath}`)
      
      const parsed = parseVDFObject(content)
      log.info('Parsed VDF content:', JSON.stringify(parsed).substring(0, 500))

      const extractPaths = (obj: Record<string, unknown>): string[] => {
        const paths: string[] = []
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'path' && typeof value === 'string') {
            let cleanPath = value.replace(/\\\\/g, '\\').replace(/\//g, '\\')
            if (!cleanPath.endsWith('\\')) cleanPath += '\\'
            paths.push(cleanPath)
          } else if (typeof value === 'object' && value !== null) {
            paths.push(...extractPaths(value as Record<string, unknown>))
          }
        }
        return paths
      }

      const extractedPaths = extractPaths(parsed)
      log.info(`Extracted paths: ${extractedPaths.join(', ')}`)
      
      for (const p of extractedPaths) {
        if (!libraryPaths.includes(p)) {
          libraryPaths.push(p)
          log.info(`Found library: ${p}`)
        }
      }
    } catch (e) {
      log.warn(`Could not parse libraryfolders.vdf at ${libraryFoldersPath}:`, e)
    }
  }

  return libraryPaths
}

async function findGameExe(dirPath: string, gameName: string): Promise<string | null> {
  try {
    const files = await fs.readdir(dirPath)
    
    const exeFiles = files.filter(f => f.toLowerCase().endsWith('.exe'))
    
    for (const exe of exeFiles) {
      const exeName = exe.toLowerCase()
      if (
        !exeName.includes('unins') && 
        !exeName.includes('uninstall') &&
        !exeName.includes('setup') &&
        !exeName.includes('installer') &&
        !exeName.includes('crashhandler') &&
        !exeName.includes('redist') &&
        !exeName.includes('vc_redist')
      ) {
        return exe
      }
    }
  } catch {
    // Directory not accessible
  }
  return null
}

async function findSteamGamesInLibrary(libraryPath: string): Promise<SteamGame[]> {
  const games: SteamGame[] = []
  const steamAppsPath = path.join(libraryPath, 'steamapps')

  const excludedAppIds = ['228980', '250820']

  try {
    if (!await fileExists(steamAppsPath)) {
      return games
    }

    const files = await fs.readdir(steamAppsPath)

    for (const file of files) {
      if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
        const manifestPath = path.join(steamAppsPath, file)
        const content = await readFileContent(manifestPath)

        try {
          const parsed = parseVDFObject(content)
          const appState = parsed as Record<string, Record<string, string>>

          if (appState.AppState) {
            const appid = appState.AppState.appid || ''
            const gameName = appState.AppState.name || ''
            const installDir = appState.AppState.installdir || ''
            const lastPlayedTimestamp = appState.AppState.LastPlayed || ''

            if (excludedAppIds.includes(appid)) {
              log.info(`Skipping excluded app: ${gameName} (${appid})`)
              continue
            }

            if (gameName && installDir) {
              const installPath = path.join(steamAppsPath, 'common', installDir)
              const exists = await fileExists(installPath)

              if (exists) {
                const lastPlayed = lastPlayedTimestamp
                  ? new Date(parseInt(lastPlayedTimestamp) * 1000).toISOString()
                  : undefined

                const processName = await findGameExe(installPath, gameName)

                games.push({
                  id: `steam-${appid}`,
                  name: gameName,
                  executablePath: `steam://rungameid/${appid}`,
                  store: 'steam',
                  installLocation: installPath,
                  lastPlayed: lastPlayed,
                  appid: appid,
                  processName: processName || undefined
                })
                log.info(`Found game: ${gameName} (${appid}) at ${installPath}`)
              } else {
                log.warn(`Game folder not found for ${gameName}: ${installPath}`)
              }
            }
          }
        } catch (e) {
          log.warn(`Could not parse ACF file ${file}:`, e)
        }
      }
    }
  } catch (e) {
    log.warn(`Could not read steam library at ${libraryPath}:`, e)
  }

  return games
}

export async function getSteamGames(drives?: string[]): Promise<SteamGame[]> {
  log.info('Detecting Steam games...')
  const games: SteamGame[] = []
  const scannedPaths = new Set<string>()

  try {
    let steamPath = await getSteamInstallPath()
    log.info(`Steam from registry: ${steamPath}`)

    if (!steamPath && drives && drives.length > 0) {
      log.info('Searching for Steam on drives...')
      for (const drive of drives) {
        const possiblePaths = [
          path.join(drive, 'Program Files (x86)', 'Steam'),
          path.join(drive, 'Program Files', 'Steam'),
          path.join(drive, 'Steam')
        ]

        for (const p of possiblePaths) {
          const steamappsPath = path.join(p, 'steamapps')
          const exists = await fileExists(steamappsPath)
          log.info(`Checking ${steamappsPath}: ${exists}`)
          if (exists) {
            steamPath = p
            log.info(`Found Steam at: ${p}`)
            break
          }
        }
        if (steamPath) break
      }
    }

    if (!steamPath) {
      log.info('Steam installation not found')
      return games
    }

    log.info(`Steam path: ${steamPath}`)

    const libraryPaths = await parseLibraryFoldersVDF(steamPath)

    const mainSteamAppsPath = path.join(steamPath, 'steamapps')
    if (await fileExists(mainSteamAppsPath)) {
      libraryPaths.unshift(steamPath.replace(/\\$/, ''))
    }

    log.info(`Total libraries to scan: ${libraryPaths.length}`)

    for (const libPath of libraryPaths) {
      if (scannedPaths.has(libPath)) continue
      scannedPaths.add(libPath)

      log.info(`Scanning library: ${libPath}`)
      const libraryGames = await findSteamGamesInLibrary(libPath)
      log.info(`Found ${libraryGames.length} games in ${libPath}`)
      games.push(...libraryGames)
    }

    log.info(`Found ${games.length} Steam games`)
  } catch (error) {
    log.error('Error detecting Steam games:', error)
  }

  return games
}

export function getSteamLaunchUrl(appid: string): string {
  return `steam://rungameid/${appid}`
}
