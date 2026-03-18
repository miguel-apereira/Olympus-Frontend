import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameInfo } from '../types'
import { ThemeMode } from '../config'
import SteamGridDBModal from './SteamGridDBModal'
import { Tooltip } from './Tooltip'

interface EditGameModalProps {
  game: GameInfo
  theme: ThemeMode
  onClose: () => void
  onSave: (game: GameInfo) => void
}

export default function EditGameModal({ game, theme, onClose, onSave }: EditGameModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(game.name)
  const [executablePath, setExecutablePath] = useState(game.executablePath)
  const [coverImage, setCoverImage] = useState(game.coverImage || '')
  const [isLoading, setIsLoading] = useState(false)
  const [showSteamGridDB, setShowSteamGridDB] = useState(false)

  const isStoreGame = game.store === 'steam' || game.store === 'epic' || game.store === 'ea'

  const handleCoverSelected = (coverPath: string) => {
    setCoverImage(coverPath)
  }

  const handleSelectExecutable = async () => {
    const path = await window.electronAPI.selectExecutable()
    if (path) {
      setExecutablePath(path)
    }
  }

  const handleSelectImage = async () => {
    const path = await window.electronAPI.selectImage()
    if (path) {
      // Set the selected path directly for preview
      // The actual saving will happen when the user clicks Save
      setCoverImage(path)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isStoreGame && (!name || !executablePath)) return

    setIsLoading(true)
    try {
      if (isStoreGame) {
        onSave({
          ...game,
          coverImage: coverImage || undefined
        })
      } else {
        onSave({
          ...game,
          name,
          executablePath,
          coverImage: coverImage || undefined
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay flex items-center justify-center z-50">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-xl mx-4 overflow-hidden fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text">{t('editGame.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-theme-textSecondary hover:text-theme-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {t('editGame.gameName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isStoreGame}
              className={`w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text ${isStoreGame ? 'opacity-50 cursor-not-allowed' : ''}`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {t('editGame.executablePath')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={executablePath}
                onChange={(e) => setExecutablePath(e.target.value)}
                disabled={isStoreGame}
                className={`flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text ${isStoreGame ? 'opacity-50 cursor-not-allowed' : ''}`}
                required
              />
              {!isStoreGame && (
                <button
                  type="button"
                  onClick={handleSelectExecutable}
                  className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
                >
                  {t('editGame.browse')}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {t('editGame.coverImage')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text"
              />
              <button
                type="button"
                onClick={handleSelectImage}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
              >
                {t('editGame.browse')}
              </button>
              <Tooltip text={t('editGame.steamGridDBTooltip')}>
              <button
                type="button"
                onClick={() => setShowSteamGridDB(true)}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-primary-500 hover:bg-theme-border transition-colors"
              >
                {t('editGame.steamGridDB')}
              </button>
              </Tooltip>
            </div>
          </div>

          {coverImage && (
            <div className="flex justify-center">
              <img 
                src={`file://${coverImage}?t=${Date.now()}`} 
                alt="Cover preview" 
                className="h-32 rounded-lg object-cover"
                key={coverImage}
              />
            </div>
          )}

          {isStoreGame && (
            <p className="text-xs text-theme-textSecondary italic">
              {t('editGame.onlyCoverEditable', { store: game.store })}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
            >
              {t('addGame.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              {t('addGame.save')}
            </button>
          </div>
        </form>
      </div>

      {showSteamGridDB && (
        <SteamGridDBModal
          gameName={name}
          gameId={game.id}
          steamAppId={game.store === 'steam' ? game.appid : undefined}
          theme={theme}
          onClose={() => setShowSteamGridDB(false)}
          onCoverSelected={handleCoverSelected}
        />
      )}
    </div>
  )
}
