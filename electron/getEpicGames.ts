import { promises as fs } from 'fs'
import path from 'path'
import log from 'electron-log'

export interface EpicGame {
  id: string
  name: string
  executablePath: string
  coverImage?: string
  store: 'epic'
  installLocation?: string
  lastPlayed?: string
  playCount?: number
  isFavorite?: boolean
  isHidden?: boolean
  processName?: string
}

interface LauncherInstalledGame {
  InstallLocation: string
  NamespaceId: string
  ItemId: string
  ArtifactId: string
  AppVersion: string
  AppName: string
}

interface LauncherInstalledData {
  InstallationList: LauncherInstalledGame[]
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

async function findGameExe(dirPath: string): Promise<string | null> {
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

export async function getEpicGames(): Promise<EpicGame[]> {
  log.info('Detecting Epic games...')
  const games: EpicGame[] = []
  const foundInstallLocations = new Set<string>()

  const epicManifestPaths = [
    path.join(process.env['ProgramData'] || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests')
  ]

  try {
    for (const manifestDir of epicManifestPaths) {
      try {
        const files = await fs.readdir(manifestDir)
        
        for (const file of files) {
          if (file.endsWith('.item')) {
            const manifestPath = path.join(manifestDir, file)
            const content = await fs.readFile(manifestPath, 'utf-8')
            
            try {
              const manifest = JSON.parse(content)
              const displayName = manifest.DisplayName || manifest.InstallLocation?.split('\\').pop()
              const installLocation = manifest.InstallLocation?.replace(/\//g, '\\')
              const appName = manifest.AppName
              
              if (displayName && installLocation) {
                if (await dirExists(installLocation)) {
                  foundInstallLocations.add(installLocation)
                  
                  const launchUri = appName 
                    ? `com.epicgames.launcher://apps/${appName}?action=launch&silent=true`
                    : installLocation

                  const processName = await findGameExe(installLocation)

                  games.push({
                    id: `epic-${displayName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: displayName,
                    executablePath: launchUri,
                    store: 'epic',
                    installLocation: installLocation,
                    processName: processName || undefined
                  })
                  log.info(`Found Epic game (manifest): ${displayName}`)
                }
              }
            } catch (e) {
              log.debug('Could not parse epic manifest:', file)
            }
          }
        }
      } catch (e) {
        log.debug('Could not read Epic manifest directory:', manifestDir)
      }
    }

    const launcherDatPath = path.join(
      process.env['ProgramData'] || 'C:\\ProgramData',
      'Epic',
      'UnrealEngineLauncher',
      'LauncherInstalled.dat'
    )

    try {
      const datContent = await fs.readFile(launcherDatPath, 'utf-8')
      const launcherData: LauncherInstalledData = JSON.parse(datContent)
      
      if (launcherData.InstallationList) {
        for (const installed of launcherData.InstallationList) {
          const installLocation = installed.InstallLocation?.replace(/\//g, '\\')
          const appName = installed.AppName
          
          if (!installLocation || !appName) continue

          if (foundInstallLocations.has(installLocation)) continue

          if (await dirExists(installLocation)) {
            const launchUri = `com.epicgames.launcher://apps/${appName}?action=launch&silent=true`
            
            const displayName = appName
            const processName = await findGameExe(installLocation)

            games.push({
              id: `epic-${appName.toLowerCase().replace(/\s+/g, '-')}`,
              name: displayName,
              executablePath: launchUri,
              store: 'epic',
              installLocation: installLocation,
              processName: processName || undefined
            })
            log.info(`Found Epic game (dat): ${displayName}`)
          }
        }
      }
    } catch (e) {
      log.debug('Could not read LauncherInstalled.dat:', e)
    }

    log.info(`Found ${games.length} Epic games`)
  } catch (error) {
    log.error('Error detecting Epic games:', error)
  }
  
  return games
}
