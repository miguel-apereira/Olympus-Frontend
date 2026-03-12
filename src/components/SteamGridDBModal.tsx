import { useState, useEffect, useCallback } from 'react'
import { ThemeMode } from '../config'

interface SteamGridDBGame {
  id: number
  name: string
  types: string[]
  verified: boolean
}

interface SteamGridDBGrid {
  id: number
  url: string
  thumb: string
  style: string
  dimensions: string
  likes: number
}

interface SteamGridDBModalProps {
  gameName: string
  gameId: string
  steamAppId?: string
  theme: ThemeMode
  onClose: () => void
  onCoverSelected: (coverPath: string) => void
}

type ModalStep = 'loading' | 'games' | 'covers' | 'error'

export default function SteamGridDBModal({
  gameName,
  gameId,
  steamAppId,
  onClose,
  onCoverSelected
}: SteamGridDBModalProps) {
  const [step, setStep] = useState<ModalStep>('loading')
  const [searchResults, setSearchResults] = useState<SteamGridDBGame[]>([])
  const [selectedGame, setSelectedGame] = useState<SteamGridDBGame | null>(null)
  const [grids, setGrids] = useState<SteamGridDBGrid[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const performSearch = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.searchSteamGridDB(query)
      
      if (result.error) {
        setError(result.error)
        setStep('error')
        return
      }

      if (result.games.length === 0) {
        setError('No games found matching your game')
        setStep('error')
        return
      }

      setSearchResults(result.games)

      const exactMatches = result.games.filter(
        g => g.name.toLowerCase().trim() === query.toLowerCase().trim()
      )

      if (exactMatches.length === 1) {
        await loadGridsForGame(exactMatches[0])
      } else if (result.games.length === 1) {
        await loadGridsForGame(result.games[0])
      } else {
        setStep('games')
      }
    } catch (err) {
      setError('Failed to search for games')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadGridsForGame = async (game: SteamGridDBGame) => {
    setIsLoading(true)
    setError(null)
    setSelectedGame(game)

    try {
      const result = await window.electronAPI.getSteamGridDBGrids(game.id)
      console.log('Frontend received grids:', result.grids)
      
      if (result.error) {
        setError(result.error)
        setStep('error')
        return
      }

      if (result.grids.length === 0) {
        setError('No covers available for this game')
        setStep('error')
        return
      }

      setGrids(result.grids)
      setStep('covers')
    } catch (err) {
      setError('Failed to load covers')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGridsByAppId = async (appId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.getSteamGridDBGridsByAppId(appId)
      
      if (result.error) {
        if (result.error.includes('rate limit') || result.error.includes('Too Many Requests')) {
          await performSearch(gameName)
          return
        }
        setError(result.error)
        setStep('error')
        return
      }

      if (result.grids.length === 0) {
        await performSearch(gameName)
        return
      }

      setGrids(result.grids)
      setStep('covers')
    } catch (err) {
      await performSearch(gameName)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (steamAppId) {
      loadGridsByAppId(steamAppId)
    } else {
      performSearch(gameName)
    }
  }, [steamAppId, gameName, performSearch])

  const handleSelectGame = async (game: SteamGridDBGame) => {
    await loadGridsForGame(game)
  }

  const handleDownload = async (grid: SteamGridDBGrid) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.downloadSteamGridDBCover(grid.url, gameId)
      if (result.error) {
        setError(result.error)
      } else {
        onCoverSelected(result.path)
        onClose()
      }
    } catch (err) {
      setError('Failed to download cover')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToGames = () => {
    setStep('games')
    setSelectedGame(null)
    setGrids([])
  }

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-3xl mx-4 overflow-hidden fade-in max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-white">
            Download Cover from SteamGridDB
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#66c0f4]"></div>
            </div>
          )}

          {step === 'games' && (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">
                Found multiple games. Select the correct one:
              </p>
              {searchResults.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-3 bg-[#242424] hover:bg-[#333] rounded-lg transition-colors flex items-center justify-between"
                >
                  <span className="text-white">{game.name}</span>
                  <div className="flex items-center gap-2">
                    {game.verified && (
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                        Verified
                      </span>
                    )}
                    {game.types.includes('steam') && (
                      <span className="text-xs px-2 py-0.5 bg-[#1b2838]/50 text-[#66c0f4] rounded">
                        Steam
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'covers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-white">
                  {selectedGame ? selectedGame.name : 'Select a cover:'}
                </p>
                {searchResults.length > 1 && (
                  <button
                    onClick={handleBackToGames}
                    className="text-sm text-[#66c0f4] hover:text-[#4da6df]"
                  >
                    Choose different game
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {grids.map((grid) => {
                  const [width, height] = grid.dimensions.split('x').map(Number)
                  const aspectRatio = width && height ? width / height : 3/4
                  
                  return (
                    <button
                      key={grid.id}
                      onClick={() => handleDownload(grid)}
                      disabled={isLoading}
                      className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-[#66c0f4] transition-all disabled:opacity-50"
                      style={{ aspectRatio: `${aspectRatio}` }}
                    >
                      <img
                        src={grid.thumb}
                        alt={`Cover ${grid.id}`}
                        className="w-full h-full object-contain bg-[#1b2838]"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          console.log('Image failed to load:', grid.thumb)
                          e.currentTarget.src = grid.url
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        
                      </div>
                    </button>
                  )
                })}
              </div>

              {grids.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No covers available for this game
                </p>
              )}
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8">
              <button
                onClick={() => performSearch(gameName)}
                className="px-4 py-2 bg-[#1b2838] hover:bg-[#2a3f54] text-[#66c0f4] rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {isLoading && step !== 'loading' && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#66c0f4]"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
