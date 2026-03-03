export const project = {
  name: 'Olympus Frontend',
  version: '1.0.2',
  description: 'Let your games reside in Mount Olympus and launch them from there.',
  author: 'Salierus',
  supportedStores: ['steam', 'epic', 'custom'] as const,
  supportedStoreNames: {
    steam: 'Steam',
    epic: 'Epic Games',
    custom: 'Custom'
  }
}

export type StoreType = typeof project.supportedStores[number]
