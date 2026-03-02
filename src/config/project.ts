export const project = {
  name: 'Olympus Game Launcher',
  version: '1.0.0',
  description: 'Let your games reside in one place, and launch them from there.',
  author: 'Salierus',
  supportedStores: ['steam', 'epic', 'custom'] as const,
  supportedStoreNames: {
    steam: 'Steam',
    epic: 'Epic Games',
    custom: 'Custom'
  }
}

export type StoreType = typeof project.supportedStores[number]
