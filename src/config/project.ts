export const project = {
  name: 'Olympus',
  version: '1.2.0',
  author: 'Salierus',
  supportedStores: ['steam', 'epic', 'ea', 'custom'] as const,
  supportedStoreNames: {
    steam: 'Steam',
    epic: 'Epic Games',
    ea: 'EA App',
    custom: 'Custom'
  }
}

export type StoreType = typeof project.supportedStores[number]
