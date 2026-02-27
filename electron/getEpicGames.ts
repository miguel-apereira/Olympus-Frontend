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
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function getEpicGames(): Promise<EpicGame[]> {
  log.info('Detecting Epic games...')
  const games: EpicGame[] = []
  
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
              const installLocation = manifest.InstallLocation
              const launchExecutable = manifest.LaunchExecutable
              
              if (displayName && installLocation && launchExecutable) {
                const exePath = path.join(installLocation, launchExecutable)
                
                if (await fileExists(exePath)) {
                  games.push({
                    id: `epic-${displayName.toLowerCase().replace(/\s+/g, '-')}`,
                    name: displayName,
                    executablePath: exePath,
                    store: 'epic',
                    installLocation: installLocation
                  })
                  log.info(`Found Epic game: ${displayName}`)
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

    log.info(`Found ${games.length} Epic games`)
  } catch (error) {
    log.error('Error detecting Epic games:', error)
  }
  
  return games
}
