import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameInfo } from '../types'
import { project, ThemeMode, themes } from '../config'
import SteamGridDBModal from './SteamGridDBModal'
import { Tooltip } from './Tooltip'

interface AddGameModalProps {
  onClose: () => void
  onAdd: (game: Omit<GameInfo, 'id'>) => void
  theme: ThemeMode
}

export default function AddGameModal({ onClose, onAdd, theme }: AddGameModalProps) {
  const { t } = useTranslation()
  const themeColors = themes[theme]
  const [name, setName] = useState('')
  const [executablePath, setExecutablePath] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [store] = useState<typeof project.supportedStores[number]>('custom')
  const [isLoading, setIsLoading] = useState(false)
  const [showSteamGridDB, setShowSteamGridDB] = useState(false)

  const handleSelectExecutable = async () => {
    const path = await window.electronAPI.selectExecutable()
    if (path) {
      setExecutablePath(path)
      if (!name) {
        const fileName = path.split('\\').pop()?.replace('.exe', '') || ''
        setName(fileName)
      }
    }
  }

  const handleSelectImage = async () => {
    const path = await window.electronAPI.selectImage()
    if (path) {
      setCoverImage(path)
    }
  }

  const handleCoverSelected = (coverPath: string) => {
    setCoverImage(coverPath)
    setShowSteamGridDB(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !executablePath) return

    setIsLoading(true)
    try {
      onAdd({
        name,
        executablePath,
        coverImage: coverImage || undefined,
        store
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay flex items-center justify-center z-50">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-xl mx-4 overflow-hidden fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text">{t('addGame.title')}</h2>
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
              {t('addGame.gameName')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('addGame.gameNamePlaceholder')}
              className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text placeholder-theme-textSecondary"
            />
            <p className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>
              {t('addGame.gameNameAutoFill')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {t('addGame.executablePath')} *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={executablePath}
                onChange={(e) => setExecutablePath(e.target.value)}
                placeholder={t('addGame.executablePathPlaceholder')}
                className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text placeholder-theme-textSecondary"
                required
              />
              <button
                type="button"
                onClick={handleSelectExecutable}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
              >
                {t('addGame.browse')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {t('addGame.coverImage')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder={t('addGame.coverImagePlaceholder')}
                className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text placeholder-theme-textSecondary"
              />
              <button
                type="button"
                onClick={handleSelectImage}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
              >
                {t('addGame.browse')}
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
              disabled={isLoading || !executablePath}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              {isLoading ? t('addGame.adding') : t('addGame.addGame')}
            </button>
          </div>
        </form>
      </div>

      {showSteamGridDB && (
        <SteamGridDBModal
          gameName={name || executablePath.split('\\').pop()?.replace('.exe', '') || ''}
          gameId="new-game"
          theme={theme}
          onClose={() => setShowSteamGridDB(false)}
          onCoverSelected={handleCoverSelected}
        />
      )}
    </div>
  )
}
