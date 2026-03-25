import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ScanProgressModalProps {
  isOpen: boolean
  progress: {
    current: number
    total: number
    currentGame: string
    store: string
  } | null
}

export default function ScanProgressModal({ isOpen, progress }: ScanProgressModalProps) {
  const [dots, setDots] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const percentage = progress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-[#1a1a1a] border border-[#333] rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-primary-600/30 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"
              style={{ animationDuration: '1s' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            {t('scanProgress.scanningGames')}{dots}
          </h2>

          {progress ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                {progress.store === 'steam' && t('scanProgress.scanningSteamGames')}
                {progress.store === 'epic' && t('scanProgress.scanningEpicGames')}
                {progress.store === 'ea' && t('scanProgress.scanningEAGames')}
                {progress.store === 'complete' && t('scanProgress.scanComplete')}
              </p>
              
              {progress.currentGame && (
                <p className="text-white text-sm font-medium truncate max-w-xs mx-auto">
                  {progress.currentGame}
                </p>
              )}

              {progress.total > 0 && (
                <>
                  <div className="w-full bg-[#333] rounded-full h-2 mt-4">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs">
                    {t('scanProgress.foundGames', { current: progress.current, total: progress.total })}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              {t('scanProgress.preparingToScan')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
