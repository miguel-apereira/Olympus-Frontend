import { createContext, useContext, ReactNode } from 'react'
import { ThemeMode, themes } from './theme'

export interface ThemeColors {
  bg: string
  surface: string
  card: string
  border: string
  text: string
  textSecondary: string
}

interface ThemeContextType {
  theme: ThemeMode
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: themes.dark
})

export const useTheme = () => useContext(ThemeContext)

interface ThemeProviderProps {
  children: ReactNode
  theme: ThemeMode
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const colors = themes[theme] as ThemeColors
  
  const style = {
    '--color-bg': colors.bg,
    '--color-surface': colors.surface,
    '--color-card': colors.card,
    '--color-border': colors.border,
    '--color-text': colors.text,
    '--color-text-secondary': colors.textSecondary,
  } as React.CSSProperties
  
  return (
    <ThemeContext.Provider value={{ theme, colors }}>
      <div style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
