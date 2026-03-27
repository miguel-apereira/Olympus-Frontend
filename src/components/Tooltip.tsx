import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ThemeMode } from '../config'

interface TooltipProps {
  children: ReactNode
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface TooltipContextType {
  showTooltip: (text: string, position: 'top' | 'bottom' | 'left' | 'right', e: React.MouseEvent) => void
  hideTooltip: () => void
}

const TooltipContext = createContext<TooltipContextType | null>(null)

export function useTooltip() {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider')
  }
  return context
}

interface TooltipProviderProps {
  children: ReactNode
  theme: ThemeMode
}

export function TooltipProvider({ children, theme }: TooltipProviderProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; position: 'top' | 'bottom' | 'left' | 'right' } | null>(null)

  const showTooltip = useCallback((text: string, position: 'top' | 'bottom' | 'left' | 'right', e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    let x = rect.left + rect.width / 2
    let y = rect.top

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2
        y = rect.top
        break
      case 'bottom':
        x = rect.left + rect.width / 2
        y = rect.bottom
        break
      case 'left':
        x = rect.left
        y = rect.top + rect.height / 2
        break
      case 'right':
        x = rect.right
        y = rect.top + rect.height / 2
        break
    }

    setTooltip({ text, x, y, position })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(null)
  }, [])

  const getTooltipStyle = () => {
    if (!tooltip) return {}

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      pointerEvents: 'none',
      zIndex: 9999,
      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#1f2937',
      border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
    }

    switch (tooltip.position) {
      case 'top':
        return {
          ...baseStyle,
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, -100%)',
          marginTop: -6,
          animation: 'tooltipFadeInTop 0.1s ease-out'
        }
      case 'bottom':
        return {
          ...baseStyle,
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-50%, 0)',
          marginTop: 6,
          animation: 'tooltipFadeInBottom 0.1s ease-out'
        }
      case 'left':
        return {
          ...baseStyle,
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(-100%, -50%)',
          marginLeft: -6,
          animation: 'tooltipFadeInLeft 0.1s ease-out'
        }
      case 'right':
        return {
          ...baseStyle,
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translate(0, -50%)',
          marginLeft: 6,
          animation: 'tooltipFadeInRight 0.1s ease-out'
        }
    }
  }

  const getArrowStyle = () => {
    if (!tooltip) return {}

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: 8,
      height: 8,
      backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
      borderRight: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
      borderBottom: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
      transform: 'rotate(45deg)'
    }

    switch (tooltip.position) {
      case 'top':
        return { ...baseStyle, left: '50%', bottom: -5, marginLeft: -4 }
      case 'bottom':
        return { ...baseStyle, left: '50%', top: -5, marginLeft: -4, transform: 'rotate(-135deg)' }
      case 'left':
        return { ...baseStyle, left: 'auto', right: -5, top: '50%', marginTop: -4, transform: 'rotate(135deg)' }
      case 'right':
        return { ...baseStyle, left: -5, top: '50%', marginTop: -4, transform: 'rotate(-45deg)' }
    }
  }

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {tooltip && createPortal(
        <div
          style={getTooltipStyle()}
        >
          {tooltip.text}
          <div style={getArrowStyle()} />
        </div>,
        document.body
      )}
    </TooltipContext.Provider>
  )
}

export function Tooltip({ children, text, position = 'top' }: TooltipProps) {
  const { showTooltip, hideTooltip } = useTooltip()
  
  return (
    <div
      onMouseEnter={(e) => showTooltip(text, position, e)}
      onMouseLeave={hideTooltip}
    >
      {children}
    </div>
  )
}
