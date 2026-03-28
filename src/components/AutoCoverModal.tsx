import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { themes, ThemeMode } from '../config'

interface AutoCoverModalProps {
  isOpen: boolean
  onClose: () => void
  theme: ThemeMode
  onSelectGame: (gameId: string, matches: { id: number; name: string; verified: boolean }[]) => void
  needsSelection: { gameId: string; gameName: string; matches: { id: number; name: string; verified: boolean }[] } | null
}

export default function AutoCoverModal({ isOpen, theme, onSelectGame, needsSelection }: AutoCoverModalProps) {
  const { t } = useTranslation()
  const themeColors = themes[theme]
  const [currentGame, setCurrentGame] = useState<string>('')
  const [status, setStatus] = useState<string>('searching')

  useEffect(() => {
    const unsubscribe = window.electronAPI.onAutoCoverProgress((data) => {
      if (data.gameName) {
        setCurrentGame(data.gameName)
      }
      setStatus(data.status)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (needsSelection) {
      onSelectGame(needsSelection.gameId, needsSelection.matches)
    }
  }, [needsSelection, onSelectGame])

  if (!isOpen) return null

  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return t('autoCover.searching', { gameName: currentGame })
      case 'complete':
        return t('autoCover.complete')
      default:
        return t('autoCover.searching', { gameName: currentGame })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative p-6 rounded-xl shadow-2xl max-w-md w-full mx-4"
        style={{ backgroundColor: themeColors.surface }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-center" style={{ color: themeColors.text }}>
            {getStatusMessage()}
          </p>
          {currentGame && (
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>
              {currentGame}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

interface GameSelectionModalProps {
  isOpen: boolean
  gameName: string
  matches: { id: number; name: string; verified: boolean }[]
  onSelect: (steamGridDbGameId: number) => void
  onSkip: () => void
  theme: ThemeMode
}

export function GameSelectionModal({ isOpen, gameName, matches, onSelect, onSkip, theme }: GameSelectionModalProps) {
  const { t } = useTranslation()
  const themeColors = themes[theme]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4"
        style={{ backgroundColor: themeColors.surface }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: themeColors.text }}>
          {t('autoCover.selectGameTitle')}
        </h3>
        <p className="text-sm mb-4" style={{ color: themeColors.textSecondary }}>
          {t('autoCover.selectGameDescription', { gameName })}
        </p>
        
        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => onSelect(match.id)}
              className="w-full text-left px-4 py-3 rounded-lg transition-colors"
              style={{ 
                backgroundColor: themeColors.card,
                border: `1px solid ${themeColors.border}`
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: themeColors.text }}>{match.name}</span>
                {match.verified && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400">
                    {t('autoCover.verified')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onSkip}
          className="w-full py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: themeColors.card,
            border: `1px solid ${themeColors.border}`,
            color: themeColors.textSecondary
          }}
        >
          {t('autoCover.skip')}
        </button>
      </div>
    </div>
  )
}
