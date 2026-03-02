import { exec } from 'child_process'
import log from 'electron-log'

export async function isAppRunning(processName: string): Promise<boolean> {
  if (!processName) {
    log.warn('isAppRunning called with empty processName')
    return false
  }
  
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`tasklist /FI "IMAGENAME eq ${processName}" /NH`, { windowsHide: true }, (error, stdout) => {
        if (error) {
          log.info(`Process ${processName} check error: ${error.message}`)
          resolve(false)
          return
        }
        const output = stdout.toLowerCase()
        const result = output.includes(processName.toLowerCase())
        
        log.info(`Process check - looking for: ${processName}, found: ${result}`)
        resolve(result)
      })
    } else {
      exec(`pgrep -f "${processName}"`, { windowsHide: true }, (error) => {
        resolve(!error)
      })
    }
  })
}
