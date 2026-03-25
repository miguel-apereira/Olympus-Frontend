import { useState, cloneElement, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { GameInfo } from '../types'
import { ThemeColors } from '../config'
import { sidebarIcons } from '../config/sidebarIcons'

interface GameCardProps {
  game: GameInfo
  viewMode: 'grid' | 'list'
  onLaunch: (game: GameInfo) => void
  onRemove: (gameId: string) => void
  onHide: (gameId: string) => void
  onUnhide: (gameId: string) => void
  onToggleFavorite: (gameId: string) => void
  onEdit: (game: GameInfo) => void
  themeColors: ThemeColors
  showStoreOnGameCard: boolean
}

const storeLogos: Record<string, ReactElement> = {
  steam: cloneElement(sidebarIcons.steam, { className: 'w-4 h-4' }),
  epic: cloneElement(sidebarIcons.epic, { className: 'w-4 h-4' }),
  ea: cloneElement(sidebarIcons.ea, { className: 'w-4 h-4' }),
  custom: cloneElement(sidebarIcons.custom, { className: 'w-4 h-4' }),
}

const storeDisplayNames: Record<string, string> = {
  steam: 'Steam',
  epic: 'Epic',
  ea: 'EA',
  custom: 'Custom',
}

export default function GameCard({ game, viewMode, onLaunch, onRemove, onHide, onUnhide, onToggleFavorite, onEdit, themeColors, showStoreOnGameCard }: GameCardProps) {
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleLaunch = () => {
    onLaunch(game)
  }

  const formatLastPlayed = (dateStr?: string) => {
    if (!dateStr) return t('gameCard.neverPlayed')
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return t('gameCard.playedToday')
    if (diffDays === 1) return t('gameCard.playedYesterday')
    if (diffDays < 7) return t('gameCard.playedDaysAgo', { days: diffDays })
    if (diffDays < 30) return t('gameCard.playedWeeksAgo', { weeks: Math.floor(diffDays / 7) })
    return t('gameCard.playedMonthsAgo', { months: Math.floor(diffDays / 30) })
  }

  if (viewMode === 'list') {
    return (
      <div 
        className="game-card relative flex items-center gap-4 p-4 rounded-xl border hover:border-primary-500/30 select-none"
        style={{ 
          backgroundColor: themeColors.card, 
          borderColor: themeColors.border,
          zIndex: showMenu ? 40 : undefined
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 placeholder-icon" style={{ backgroundColor: themeColors.surface }}>
          {game.coverImage ? (
            <img src={`file://${game.coverImage}?t=${Date.now()}`} alt={game.name} className="w-full h-full object-cover" key={`${game.id}-${game.coverImage}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: themeColors.textSecondary }}>
              {(game.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate" style={{ color: themeColors.text }}>{game.name || 'Unknown Game'}</h3>
          <p className="text-sm" style={{ color: themeColors.textSecondary }}>{formatLastPlayed(game.lastPlayed)}</p>
          {game.playCount !== undefined && game.playCount > 0 && (
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>
              {t('gameCard.playedTimes', { count: game.playCount })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showStoreOnGameCard && (
            <span 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: 'transparent', color: themeColors.textSecondary }}
            >
              {storeDisplayNames[game.store] || game.store}
            </span>
          )}

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
                <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg shadow-xl z-50 overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderStyle: 'solid' }}>
                  <button
                    onClick={() => { onEdit(game); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10"
                    style={{ color: themeColors.text }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('gameCard.context_menu_edit')}
                  </button>
                  <button
                    onClick={() => { game.isHidden ? onUnhide(game.id) : onHide(game.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10"
                    style={{ color: themeColors.text }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {game.isHidden ? t('gameCard.unhide') : t('gameCard.context_menu_hide')}
                  </button>
                  <button
                    onClick={() => { onRemove(game.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('gameCard.context_menu_remove')}
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
      className="game-card group relative rounded-xl overflow-hidden border select-none"
      style={{ 
        backgroundColor: themeColors.card, 
        borderColor: themeColors.border,
        zIndex: showMenu ? 40 : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
    >
      <div className="aspect-[2/3] relative">
        {game.coverImage ? (
          <img 
            src={`file://${game.coverImage}?t=${Date.now()}`} 
            alt={game.name} 
            className="w-full h-full object-cover"
            key={`${game.id}-${game.coverImage}`}
          />
        ) : (
          <div className="w-full h-full placeholder-icon flex items-center justify-center" style={{ backgroundColor: themeColors.surface }}>
            <div className="text-6xl font-bold opacity-30" style={{ color: themeColors.textSecondary }}>
              {(game.name || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/70 to-transparent"></div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button
              onClick={handleLaunch}
              className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
              </svg>
              {t('gameCard.play')}
            </button>
          </div>
        </div>

        <div className="absolute top-2 left-2">
          {showStoreOnGameCard && (
            <span 
              className="px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1"
              style={{ backgroundColor: 'transparent', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {storeLogos[game.store]}
              {storeDisplayNames[game.store] || game.store}
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onToggleFavorite(game.id)}
            className="p-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
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

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg shadow-xl z-50 overflow-hidden" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderStyle: 'solid' }}>
                  <button
                    onClick={() => { onEdit(game); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10"
                    style={{ color: themeColors.text }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('gameCard.context_menu_edit')}
                  </button>
                  <button
                    onClick={() => { game.isHidden ? onUnhide(game.id) : onHide(game.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/10"
                    style={{ color: themeColors.text }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {game.isHidden ? t('gameCard.unhide') : t('gameCard.context_menu_hide')}
                  </button>
                  <button
                    onClick={() => { onRemove(game.id); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-red-400 hover:bg-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('gameCard.context_menu_remove')}
                  </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-medium text-sm truncate" style={{ color: themeColors.text }}>{game.name || 'Unknown Game'}</h3>
          <p className="text-xs mt-1 truncate" style={{ color: themeColors.textSecondary }}>{formatLastPlayed(game.lastPlayed)}</p>
          {game.playCount !== undefined && game.playCount > 0 && (
              <p className="text-xs mt-0.5 truncate" style={{ color: themeColors.textSecondary }}>
                {t('gameCard.playedTimes', { count: game.playCount })}
              </p>
          )}
      </div>
    </div>
  )
}
