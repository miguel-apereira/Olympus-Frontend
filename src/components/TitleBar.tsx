import { useState, useEffect } from 'react'
import { project, ThemeMode, themes } from '../config'
import logoUrl from '../assets/logo.png'
import { Tooltip } from './Tooltip'
import { useTranslation } from 'react-i18next'

interface TitleBarProps {
  theme: ThemeMode
  onSettingsClick?: () => void
  onKnowledgeBaseClick?: () => void
}

export default function TitleBar({ theme, onSettingsClick, onKnowledgeBaseClick }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const { t } = useTranslation()
  const themeColors = themes[theme]

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.windowIsMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  const handleMinimize = () => {
    window.electronAPI.windowMinimize()
  }

  const handleMaximize = async () => {
    await window.electronAPI.windowMaximize()
    const maximized = await window.electronAPI.windowIsMaximized()
    setIsMaximized(maximized)
  }

  const handleClose = () => {
    window.electronAPI.windowClose()
  }

  return (
    <div 
      className="h-10 border-b flex items-center justify-between select-none"
      style={{ 
        backgroundColor: themeColors.surface, 
        borderColor: themeColors.border,
        WebkitAppRegion: 'drag' 
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-4">
        <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" draggable="false" />
        <span className="text-sm font-medium" style={{ color: themeColors.text }}>{project.name}</span>
      </div>

      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <Tooltip text={t('app.titlebar.settings')} position="bottom">
          <button
            onClick={onSettingsClick}
            className="w-10 h-10 flex items-center justify-center"
            style={{ color: themeColors.textSecondary }}
          >
            <span 
              className="w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.0)' : 'rgba(0,0,0,0.0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.0)' : 'rgba(0,0,0,0.0)'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </button>
        </Tooltip>
          <Tooltip text={t('app.titlebar.knowledgeBase')} position="bottom">
            <button
              onClick={onKnowledgeBaseClick}
              className="w-10 h-10 flex items-center justify-center"
              style={{ color: themeColors.textSecondary }}
            >
              <span 
                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150"
                style={{ 
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.0)' : 'rgba(0,0,0,0.0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.0)' : 'rgba(0,0,0,0.0)'
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 48 48">
                  <path fill="currentColor" d="M24.2015 35.65c0.5323 0 0.9818 -0.1838 1.3485 -0.5515s0.55 -0.8177 0.55 -1.35c0 -0.5323 -0.1838 -0.9818 -0.5515 -1.3485s-0.8177 -0.55 -1.35 -0.55c-0.5323 0 -0.9818 0.1838 -1.3485 0.5515s-0.55 0.8177 -0.55 1.35c0 0.5323 0.1838 0.9818 0.5515 1.3485s0.8177 0.55 1.35 0.55Zm-0.188 8.35c-2.758 0 -5.3497 -0.525 -7.775 -1.575 -2.4257 -1.05 -4.5468 -2.4833 -6.3635 -4.3 -1.81667 -1.8167 -3.25 -3.939 -4.3 -6.367C4.525 29.33 4 26.7357 4 23.975s0.525 -5.355 1.575 -7.783c1.05 -2.428 2.48333 -4.542 4.3 -6.342 1.8167 -1.8 3.939 -3.225 6.367 -4.275C18.67 4.525 21.2643 4 24.025 4s5.355 0.525 7.783 1.575c2.428 1.05 4.542 2.475 6.342 4.275 1.8 1.8 3.225 3.9167 4.275 6.35C43.475 18.6333 44 21.2288 44 23.9865c0 2.758 -0.525 5.3497 -1.575 7.775 -1.05 2.4257 -2.475 4.5438 -4.275 6.3545 -1.8 1.8103 -3.9167 3.2437 -6.35 4.3C29.3667 43.472 26.7712 44 24.0135 44Zm0.125 -29c1.0077 0 1.8948 0.3083 2.6615 0.925 0.7667 0.6167 1.15 1.4033 1.15 2.36 0 0.8767 -0.2608 1.6388 -0.7825 2.2865 -0.5217 0.6477 -1.1108 1.2572 -1.7675 1.8285 -0.7667 0.6333 -1.4333 1.3397 -2 2.119 -0.5667 0.7797 -0.85 1.6567 -0.85 2.631 0 0.3667 0.14 0.6583 0.42 0.875 0.28 0.2167 0.6067 0.325 0.98 0.325 0.4 0 0.7313 -0.1333 0.994 -0.4 0.2623 -0.2667 0.431 -0.6 0.506 -1 0.1 -0.7 0.3667 -1.3333 0.8 -1.9s0.9372 -1.0797 1.5115 -1.539c0.8257 -0.674 1.5052 -1.461 2.0385 -2.361 0.5333 -0.9 0.8 -1.8768 0.8 -2.9305 0 -1.6797 -0.625 -3.0778 -1.875 -4.1945 -1.25 -1.1167 -2.7325 -1.675 -4.4475 -1.675 -1.185 0 -2.3275 0.25 -3.4275 0.75s-2 1.2333 -2.7 2.2c-0.2333 0.3333 -0.3417 0.6917 -0.325 1.075 0.0167 0.3833 0.1745 0.6917 0.4735 0.925 0.3803 0.2667 0.7745 0.35 1.1825 0.25 0.4077 -0.1 0.7473 -0.3333 1.019 -0.7 0.425 -0.5967 0.9563 -1.0542 1.594 -1.3725 0.6373 -0.3183 1.3188 -0.4775 2.0445 -0.4775Z" stroke-width="1"></path>
                </svg>
              </span>
            </button>
          </Tooltip>
        <div className="w-px h-6 mx-1" style={{ backgroundColor: themeColors.border }}></div>
          <button
            onClick={handleMinimize}
            className="w-12 h-10 flex items-center justify-center duration-150"
            style={{ color: themeColors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              e.currentTarget.style.color = themeColors.text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = themeColors.textSecondary
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="w-12 h-10 flex items-center justify-center duration-150"
            style={{ color: themeColors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              e.currentTarget.style.color = themeColors.text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = themeColors.textSecondary
            }}
          >
            {isMaximized ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v2m0 8v2a2 2 0 002 2h2m8 0h2a2 2 0 002-2v-2m0-8V6a2 2 0 00-2-2h-2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-12 h-10 flex items-center justify-center duration-150 hover:bg-red-600 hover:text-white"
            style={{ color: themeColors.textSecondary }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
      </div>
    </div>
  )
}
