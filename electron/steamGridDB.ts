import SGDB from 'steamgriddb'
import axios from 'axios'
import { promises as fsPromises } from 'fs'
import path from 'path'
import log from 'electron-log'
import { SteamGridDBGame, SteamGridDBGrid } from './types'

let client: SGDB | null = null
let apiKey: string = ''

export function initSteamGridDB(key: string): void {
  if (!key) {
    client = null
    apiKey = ''
    return
  }
  apiKey = key
  client = new SGDB({ key })
  log.info('SteamGridDB client initialized')
}

export function isClientInitialized(): boolean {
  return client !== null
}

export async function searchSteamGridDB(query: string): Promise<SteamGridDBGame[]> {
  if (!client) {
    log.warn('SteamGridDB client not initialized')
    throw new Error('SteamGridDB client not initialized')
  }

  try {
    const games = await client.searchGame(query)
    return games.map((g) => ({
      id: g.id,
      name: g.name,
      types: g.types,
      verified: g.verified
    }))
  } catch (error: any) {
    log.error('Error searching SteamGridDB:', JSON.stringify(error))
    throw error
  }
}

export async function validateSteamGridDBKey(): Promise<boolean> {
  if (!client || !apiKey) {
    log.warn('validateSteamGridDBKey: No client or key')
    return false
  }

  try {
    log.info('validateSteamGridDBKey: Using direct axios POST to validate...')
    const response = await axios.post('https://www.steamgriddb.com/api/v2/games/search', 
      { term: 'test' },
      { 
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        },
        timeout: 10000
      }
    )
    log.info('validateSteamGridDBKey: Got response, status:', response.status)
    return response.status === 200
  } catch (error: any) {
    const status = error?.response?.status
    const errorMsg = error?.message || String(error)
    let responseData = error?.response?.data
    if (typeof responseData === 'string') {
      responseData = responseData.substring(0, 200)
    }
    log.error('validateSteamGridDBKey: CAUGHT ERROR:', { status, errorMsg, responseData })
    
    // 401 = definitely invalid key
    if (status === 401 || status === 403) {
      log.info('validateSteamGridDBKey: Key is definitely invalid (401/403)')
      return false
    }
    
    // For any other error (like 404), check if it's an "invalid key" message
    const respStr = String(responseData || '')
    if (respStr.toLowerCase().includes('invalid') && respStr.toLowerCase().includes('key')) {
      log.info('validateSteamGridDBKey: Response indicates invalid key')
      return false
    }
    
    // Any other error - assume key is valid but endpoint issue
    log.warn('validateSteamGridDBKey: Non-auth error, assuming key is valid')
    return true
  }
}

export async function getSteamGridDBGrids(gameId: number): Promise<SteamGridDBGrid[]> {
  if (!client) {
    log.warn('SteamGridDB client not initialized')
    return []
  }

  try {
    const grids = await client.getGrids({ 
      type: 'game', 
      id: gameId,
      dimensions: ['600x900', '660x930']
    } as any)
    log.info('Raw grids count:', grids.length)
    
    const mapped = (grids as unknown as any[]).map((g: any) => {
      const url = typeof g.url === 'string' ? g.url : String(g.url || '')
      const thumb = typeof g.thumb === 'string' ? g.thumb : String(g.thumb || url)
      return {
        id: g.id,
        url,
        thumb,
        style: g.style || '',
        dimensions: `${g.width || 0}x${g.height || 0}`,
        likes: g.upvotes || 0
      }
    })
    return mapped.sort((a, b) => b.likes - a.likes)
  } catch (error) {
    log.error('Error getting SteamGridDB grids:', error)
    throw error
  }
}

export async function getSteamGridDBGridsBySteamAppId(appId: string): Promise<SteamGridDBGrid[]> {
  if (!client) {
    log.warn('SteamGridDB client not initialized')
    return []
  }

  try {
    const grids = await client.getGridsBySteamAppId(Number(appId), {
      dimensions: ['600x900', '660x930']
    } as any)
    log.info('Raw grids by appid count:', grids.length)
    
    const mapped = (grids as unknown as any[]).map((g: any) => {
      const url = typeof g.url === 'string' ? g.url : String(g.url || '')
      const thumb = typeof g.thumb === 'string' ? g.thumb : String(g.thumb || url)
      return {
        id: g.id,
        url,
        thumb,
        style: g.style || '',
        dimensions: `${g.width || 0}x${g.height || 0}`,
        likes: g.upvotes || 0
      }
    })
    return mapped.sort((a, b) => b.likes - a.likes)
  } catch (error) {
    log.error('Error getting SteamGridDB grids by appid:', error)
    throw error
  }
}

export async function downloadSteamGridDBCover(
  gridUrl: string,
  gameId: string,
  userDataPath: string
): Promise<string> {
  try {
    const coversDir = path.join(userDataPath, 'config', 'covers', gameId)
    await fsPromises.mkdir(coversDir, { recursive: true })

    const ext = gridUrl.includes('.gif') ? '.gif' : 
                 gridUrl.includes('.webp') ? '.webp' :
                 gridUrl.includes('.jpg') ? '.jpg' : '.png'
    const destPath = path.join(coversDir, `cover${ext}`)

    const response = await fetch(gridUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await fsPromises.writeFile(destPath, buffer)

    log.info('Cover downloaded to:', destPath)
    return destPath
  } catch (error) {
    log.error('Error downloading SteamGridDB cover:', error)
    throw error
  }
}

export function isExactMatch(gameName: string, searchResultName: string): boolean {
  return gameName.toLowerCase().trim() === searchResultName.toLowerCase().trim()
}
