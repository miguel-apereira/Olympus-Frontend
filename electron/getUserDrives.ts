import fs from 'fs'
import log from 'electron-log'

export async function getUserDrives(): Promise<string[]> {
  log.info('Getting user drives...')
  const drives: string[] = []

  if (process.platform === 'win32') {
    const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    for (const letter of letters) {
      const drivePath = `${letter}:\\`
      try {
        fs.accessSync(drivePath, fs.constants.R_OK)
        drives.push(drivePath)
      } catch {
        // Drive doesn't exist or not accessible
      }
    }
  } else {
    drives.push('/')
  }

  log.info(`Found drives: ${drives.join(', ')}`)
  return drives
}
