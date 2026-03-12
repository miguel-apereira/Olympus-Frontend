import SGDB from 'steamgriddb'
import { promises as fsPromises } from 'fs'
import path from 'path'
import log from 'electron-log'
import { SteamGridDBGame, SteamGridDBGrid } from './types'

let client: SGDB | null = null

export function initSteamGridDB(apiKey: string): void {
  if (!apiKey) {
    client = null
    return
  }
  client = new SGDB({ key: apiKey })
  log.info('SteamGridDB client initialized')
}

export function isClientInitialized(): boolean {
  return client !== null
}

export async function searchSteamGridDB(query: string): Promise<SteamGridDBGame[]> {
  if (!client) {
    log.warn('SteamGridDB client not initialized')
    return []
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
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      throw new Error('INVALID_API_KEY')
    }
    const errorMsg = error?.message || String(error)
    if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('Unauthorized') || errorMsg.includes('Forbidden') || errorMsg.toLowerCase().includes('unauthorized')) {
      throw new Error('INVALID_API_KEY')
    }
    throw error
  }
}

export async function validateSteamGridDBKey(): Promise<boolean> {
  if (!client) {
    return false
  }

  try {
    await client.getGrids({ type: 'game', id: 2254 })
    return true
  } catch (error: any) {
    log.error('Validation error:', JSON.stringify(error))
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return false
    }
    const errorMsg = error?.message || String(error)
    if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('forbidden')) {
      return false
    }
    return true
  }
}

export async function getSteamGridDBGrids(gameId: number): Promise<SteamGridDBGrid[]> {
  if (!client) {
    log.warn('SteamGridDB client not initialized')
    return []
  }

  try {
    const grids = await client.getGrids({ type: 'game', id: gameId })
    log.info('Raw grids count:', grids.length)
    
    const mapped = (grids as unknown as any[]).map((g: any) => {
      const url = typeof g.url === 'string' ? g.url : String(g.url || '')
      const thumb = typeof g.thumb === 'string' ? g.thumb : String(g.thumb || url)
      log.info('Mapped grid - thumb:', thumb)
      return {
        id: g.id,
        url,
        thumb,
        style: g.style || '',
        dimensions: `${g.width || 0}x${g.height || 0}`,
        likes: g.score ?? g.upvotes ?? 0
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
    const grids = await client.getGridsBySteamAppId(Number(appId))
    log.info('Raw grids by appid count:', grids.length)
    
    const mapped = (grids as unknown as any[]).map((g: any) => {
      const url = typeof g.url === 'string' ? g.url : String(g.url || '')
      const thumb = typeof g.thumb === 'string' ? g.thumb : String(g.thumb || url)
      log.info('Mapped grid by appid - thumb:', thumb)
      return {
        id: g.id,
        url,
        thumb,
        style: g.style || '',
        dimensions: `${g.width || 0}x${g.height || 0}`,
        likes: g.score ?? g.upvotes ?? 0
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
