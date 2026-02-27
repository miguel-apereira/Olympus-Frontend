export const project = {
  name: 'Olyumpus Launcher',
  version: '1.0.0',
  description: 'A modern game launcher for Windows',
  author: 'Salierus',
  supportedStores: ['steam', 'epic', 'custom'] as const,
  supportedStoreNames: {
    steam: 'Steam',
    epic: 'Epic Games',
    custom: 'Custom'
  }
}

export type StoreType = typeof project.supportedStores[number]
