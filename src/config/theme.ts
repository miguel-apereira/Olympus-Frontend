export type ThemeMode = 'light' | 'dark'

export interface ThemeDefinition {
  id: ThemeMode
  name: string
  colors: {
    bg: string
    surface: string
    card: string
    border: string
    text: string
    textSecondary: string
  }
}

export const themesList: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      bg: '#f5f5f5',
      surface: '#ffffff',
      card: '#ffffff',
      border: '#e5e5e5',
      text: '#1a1a1a',
      textSecondary: '#6b7280'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      bg: '#0f0f0f',
      surface: '#1a1a1a',
      card: '#242424',
      border: '#333333',
      text: '#ffffff',
      textSecondary: '#a0a0a0'
    }
  }
]

export const themes: Record<ThemeMode, ThemeDefinition['colors']> = {
  light: {
    bg: '#f5f5f5',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#e5e5e5',
    text: '#1a1a1a',
    textSecondary: '#6b7280'
  },
  dark: {
    bg: '#0f0f0f',
    surface: '#1a1a1a',
    card: '#242424',
    border: '#333333',
    text: '#ffffff',
    textSecondary: '#a0a0a0'
  }
}

export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e'
    },
    store: {
      steam: '#1b2838',
      epic: '#2a2a2a',
      custom: '#6b7280'
    }
  },
  dimensions: {
    sidebarWidth: '16rem',
    titleBarHeight: '2.5rem',
    windowMinWidth: 900,
    windowMinHeight: 600,
    windowDefaultWidth: 1280,
    windowDefaultHeight: 800,
    gameCardAspectRatio: '3/4',
    gameCardGrid: {
      xs: 2,
      sm: 3,
      md: 4,
      lg: 5,
      xl: 6
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px'
  },
  fonts: {
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  animations: {
    spin: 'spin 1s linear infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    fadeIn: 'fadeIn 0.3s ease-in-out'
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out'
  }
}

export const getThemeColors = (mode: ThemeMode) => {
  return {
    bg: themes[mode].bg,
    surface: themes[mode].surface,
    card: themes[mode].card,
    border: themes[mode].border,
    text: themes[mode].text,
    textSecondary: themes[mode].textSecondary
  }
}

export const labels = {
  app: {
    loading: 'Loading...',
    version: 'v'
  },
  sidebar: {
    allGames: 'All Games',
    favorites: 'Favorites',
    recentlyPlayed: 'Recently Played',
    settings: 'Settings',
    yourGames: 'Your PC Games'
  },
  gameGrid: {
    noGamesFound: 'No Games Found',
    noGamesDescription: 'Start by scanning for installed games or manually add a game to your library.',
    scanForGames: 'Scan for Games',
    scanning: 'Scanning...',
    gridView: 'Grid View',
    listView: 'List View',
    scanningForGames: 'Scanning for games...'
  },
  gameCard: {
    play: 'Play',
    favorite: 'Favorite',
    remove: 'Remove',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    neverPlayed: 'Never played',
    playedToday: 'Played today',
    playedYesterday: 'Played yesterday',
    playedDaysAgo: 'Played {days} days ago',
    playedWeeksAgo: 'Played {weeks} weeks ago',
    playedMonthsAgo: 'Played {months} months ago'
  },
  addGame: {
    title: 'Add Game',
    gameName: 'Game Name',
    gameNamePlaceholder: 'Enter game name',
    executablePath: 'Executable Path',
    executablePathPlaceholder: 'C:\\Games\\game.exe',
    coverImage: 'Cover Image (optional)',
    coverImagePlaceholder: 'C:\\Images\\cover.jpg',
    storeSource: 'Store / Source',
    browse: 'Browse',
    cancel: 'Cancel',
    addGame: 'Add Game',
    adding: 'Adding...'
  },
  settings: {
    title: 'Settings',
    application: 'Application',
    library: 'Library',
    scanOnStartup: 'Scan on startup',
    scanOnStartupDescription: 'Automatically scan for new games when the app launches',
    manualScan: 'Manual Scan',
    manualScanDescription: 'Scan your computer for installed games from Steam and Epic Games.',
    hardwareAcceleration: 'Hardware Acceleration',
    hardwareAccelerationDescription: 'Use GPU for smoother rendering. Disable if you experience display issues.',
    appearance: 'Appearance',
    theme: 'Theme',
    themeDescription: 'Choose your preferred color theme',
    darkMode: 'Dark',
    lightMode: 'Light',
    about: 'About',
    version: 'Version'
  },
  search: {
    placeholder: 'Search games...'
  },
  header: {
    games: 'games',
    game: 'game'
  }
}
