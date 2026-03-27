export const project = {
  name: 'Olympus',
  version: '1.2.2',
  author: 'Olympus Launcher',
  supportedStores: ['steam', 'epic', 'ea', 'custom'] as const,
  supportedStoreNames: {
    steam: 'Steam',
    epic: 'Epic Games',
    ea: 'EA App',
    custom: 'Custom'
  }
}

export type StoreType = typeof project.supportedStores[number]
