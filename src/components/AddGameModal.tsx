import { useState } from 'react'
import { GameInfo } from '../types'
import { project, labels } from '../config'

interface AddGameModalProps {
  onClose: () => void
  onAdd: (game: Omit<GameInfo, 'id'>) => void
}

export default function AddGameModal({ onClose, onAdd }: AddGameModalProps) {
  const [name, setName] = useState('')
  const [executablePath, setExecutablePath] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [store, setStore] = useState<typeof project.supportedStores[number]>('custom')
  const [isLoading, setIsLoading] = useState(false)

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
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-md mx-4 overflow-hidden fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text">{labels.addGame.title}</h2>
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
              {labels.addGame.gameName} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={labels.addGame.gameNamePlaceholder}
              className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text placeholder-theme-textSecondary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {labels.addGame.executablePath} *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={executablePath}
                onChange={(e) => setExecutablePath(e.target.value)}
                placeholder={labels.addGame.executablePathPlaceholder}
                className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text placeholder-theme-textSecondary"
                required
              />
              <button
                type="button"
                onClick={handleSelectExecutable}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
              >
                {labels.addGame.browse}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {labels.addGame.coverImage}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder={labels.addGame.coverImagePlaceholder}
                className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text placeholder-theme-textSecondary"
              />
              <button
                type="button"
                onClick={handleSelectImage}
                className="px-4 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
              >
                {labels.addGame.browse}
              </button>
            </div>
          </div>

          {coverImage && (
            <div className="flex justify-center">
              <img 
                src={`file://${coverImage}`} 
                alt="Cover preview" 
                className="h-32 rounded-lg object-cover"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-theme-textSecondary mb-2">
              {labels.addGame.storeSource}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {project.supportedStores.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStore(s)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    store === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-theme-card text-theme-textSecondary hover:bg-theme-border'
                  }`}
                >
                  {project.supportedStoreNames[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-theme-card border border-theme-border rounded-lg text-theme-text hover:bg-theme-border transition-colors"
            >
              {labels.addGame.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !executablePath}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
            >
              {isLoading ? labels.addGame.adding : labels.addGame.addGame}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
