import { useEffect, useState } from 'react'
import { themes, ThemeMode } from '../config'

interface WebViewProps {
  title: string
  defaultUrl: string
}

export default function WebView({ title, defaultUrl }: WebViewProps) {
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [url, setUrl] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isMaximized, setIsMaximized] = useState(false)
  const themeColors = themes[theme]

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.windowIsMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    const queryString = hash.split('?')[1] || ''
    const params = new URLSearchParams(queryString)
    const pageUrl = params.get('url') || defaultUrl
    setUrl(pageUrl)

    const savedSettings = localStorage.getItem('olympus-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.theme) {
          setTheme(parsed.theme)
        }
      } catch {
        // use default
      }
    }
  }, [defaultUrl])

  const handleClose = () => {
    window.electronAPI.windowClose()
  }

  const handleMinimize = () => {
    window.electronAPI.windowMinimize()
  }

  const handleMaximize = async () => {
    await window.electronAPI.windowMaximize()
    const maximized = await window.electronAPI.windowIsMaximized()
    setIsMaximized(maximized)
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: themeColors.bg }}>
      <div 
        className="h-10 flex items-center justify-between select-none"
        style={{ 
          backgroundColor: '#161616',
        }}
      >
        <div style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} className="flex-1">
          <span className="text-sm font-medium pl-4" style={{ color: themeColors.text }}>{title}</span>
        </div>
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="flex items-center">
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
      <iframe
        src={url}
        className="flex-1 w-full border-none"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        title={title}
        onError={() => setError('Failed to load the page')}
      />
      {error && (
        <div className="flex-1 flex items-center justify-center" style={{ color: themeColors.text }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
