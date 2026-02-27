import { useState } from 'react'
import { GameInfo } from '../types'
import { labels, theme, ThemeColors } from '../config'

interface GameCardProps {
  game: GameInfo
  viewMode: 'grid' | 'list'
  onLaunch: (game: GameInfo) => void
  onRemove: (gameId: string) => void
  onToggleFavorite: (gameId: string) => void
  themeColors: ThemeColors
}

const storeColors = theme.colors.store

const storeLogos = {
  steam: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.668 0 .511 4.926.022 11.153l5.418 2.736c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.523-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-3.641l-2.836 4.13c-.622.063-1.239.148-1.841.253-1.232-2.422-3.541-4.143-6.209-4.143-3.821 0-6.953 3.127-6.953 6.987 0 3.652 2.824 6.635 6.389 7.449-.435-.053-.879-.082-1.329-.082-3.924 0-7.104 3.181-7.104 7.105 0 3.925 3.18 7.105 7.105 7.105 3.359 0 6.164-2.335 7.011-5.552.208.041.416.074.629.101.213-.027.424-.057.629-.101.847 3.217 3.652 5.552 7.011 5.552 3.924 0 7.105-3.18 7.105-7.105 0-3.174-2.093-5.851-5.059-6.784 3.478-1.015 6.059-4.058 6.059-7.682 0-3.921-3.181-7.105-7.105-7.105-.652 0-1.284.089-1.886.253l-2.815-4.158c-.042-.063-.089-.125-.135-.188l3.521-1.775C23.085 3.128 17.741 0 11.979 0zM8.866 18.898c-1.279 0-2.318-1.037-2.318-2.316 0-1.279 1.039-2.317 2.318-2.317 1.279 0 2.317 1.038 2.317 2.317 0 1.279-1.038 2.316-2.317 2zm8.812-7.223c-1.279 0-2.317-1.037-2.317-2.316 0-1.279 1.038-2.317 2.317-2.317 1.278 0 2.316 1.038 2.316 2.317 0 1.279-1.038 2.316-2.316 2.316z"/>
    </svg>
  ),
  epic: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 8.5V22h20V8.5L12 2zm0 2.5L18.5 9H16v6h-4V9H5.5L12 4.5z"/>
    </svg>
  ),
  custom: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}

export default function GameCard({ game, viewMode, onLaunch, onRemove, onToggleFavorite, themeColors }: GameCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatLastPlayed = (dateStr?: string) => {
    if (!dateStr) return labels.gameCard.neverPlayed
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return labels.gameCard.playedToday
    if (diffDays === 1) return labels.gameCard.playedYesterday
    if (diffDays < 7) return `Played ${diffDays} days ago`
    if (diffDays < 30) return `Played ${Math.floor(diffDays / 7)} weeks ago`
    return `Played ${Math.floor(diffDays / 30)} months ago`
  }

  if (viewMode === 'list') {
    return (
      <div 
        className="game-card flex items-center gap-4 p-4 rounded-xl border hover:border-primary-500/30"
        style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 placeholder-icon" style={{ backgroundColor: themeColors.surface }}>
          {game.coverImage ? (
            <img src={`file://${game.coverImage}`} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: themeColors.textSecondary }}>
              {(game.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" style={{ color: themeColors.text }}>{game.name || 'Unknown Game'}</h3>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>{formatLastPlayed(game.lastPlayed)}</p>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: storeColors[game.store] }}
          >
            {game.store.charAt(0).toUpperCase() + game.store.slice(1)}
          </span>

          {game.isFavorite && (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}

          {isHovered && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:text-white"
                style={{ color: themeColors.textSecondary }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-10 overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderStyle: 'solid' }}>
                  <button
                    onClick={() => { onLaunch(game); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/10"
                    style={{ color: themeColors.text }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {labels.gameCard.play}
                  </button>
                  <button
                    onClick={() => { onToggleFavorite(game.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/10"
                    style={{ color: themeColors.text }}
                  >
                    <svg className="w-4 h-4" fill={game.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {game.isFavorite ? labels.gameCard.removeFromFavorites : labels.gameCard.addToFavorites}
                  </button>
                  <button
                    onClick={() => { onRemove(game.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {labels.gameCard.remove}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      className="game-card group relative rounded-xl overflow-hidden border"
      style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
    >
      <div className="aspect-[3/4] relative">
        {game.coverImage ? (
          <img 
            src={`file://${game.coverImage}`} 
            alt={game.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full placeholder-icon flex items-center justify-center" style={{ backgroundColor: themeColors.surface }}>
            <div className="text-6xl font-bold opacity-30" style={{ color: themeColors.textSecondary }}>
              {(game.name || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button
              onClick={() => onLaunch(game)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play
            </button>
          </div>
        </div>

        <div className="absolute top-2 left-2">
          <span 
            className="px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1"
            style={{ backgroundColor: storeColors[game.store] }}
          >
            {storeLogos[game.store]}
            {game.store.charAt(0).toUpperCase() + game.store.slice(1)}
          </span>
        </div>

        <button
          onClick={() => onToggleFavorite(game.id)}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <svg 
            className={`w-4 h-4 ${game.isFavorite ? 'text-red-500' : 'text-white'}`} 
            fill={game.isFavorite ? "currentColor" : "none"} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-xl z-10 overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderStyle: 'solid' }}>
              <button
                onClick={() => { onLaunch(game); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10"
                style={{ color: themeColors.text }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                {labels.gameCard.play}
              </button>
              <button
                onClick={() => { onToggleFavorite(game.id); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10"
                style={{ color: themeColors.text }}
              >
                <svg className="w-4 h-4" fill={game.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {labels.gameCard.favorite}
              </button>
              <button
                onClick={() => { onRemove(game.id); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {labels.gameCard.remove}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm truncate" style={{ color: themeColors.text }}>{game.name || 'Unknown Game'}</h3>
        <p className="text-xs mt-1 truncate" style={{ color: themeColors.textSecondary }}>{formatLastPlayed(game.lastPlayed)}</p>
      </div>
    </div>
  )
}
