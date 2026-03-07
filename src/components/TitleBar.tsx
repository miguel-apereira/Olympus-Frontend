import { useState, useEffect } from 'react'
import { project, ThemeMode, themes } from '../config'
import logoUrl from '../assets/logo.png'

interface TitleBarProps {
  theme: ThemeMode
  onSettingsClick?: () => void
}

export default function TitleBar({ theme, onSettingsClick }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)

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
        <button
          onClick={onSettingsClick}
          className="w-10 h-10 flex items-center justify-center"
          style={{ color: themeColors.textSecondary }}
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-gray-600/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </button>
        <div className="w-px h-6 mx-1" style={{ backgroundColor: themeColors.border }}></div>
        <button
          onClick={handleMinimize}
          className="w-12 h-10 flex items-center justify-center transition-colors hover:bg-gray-600 hover:text-white"
          style={{ color: themeColors.textSecondary }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-10 flex items-center justify-center transition-colors hover:bg-gray-600 hover:text-white"
          style={{ color: themeColors.textSecondary }}
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
          className="w-12 h-10 flex items-center justify-center transition-colors hover:bg-red-600 hover:text-white"
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
