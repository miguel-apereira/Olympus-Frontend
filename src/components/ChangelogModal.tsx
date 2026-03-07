import React, { useState, useEffect } from 'react'

interface ChangelogModalProps {
  isOpen: boolean
  onClose: () => void
  version?: string
}

interface ChangelogEntry {
  version: string
  changes: string[]
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchChangelog = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await window.electronAPI.fetchChangelog()
        
        if (result.error) {
          throw new Error(result.error)
        }
        
        const content = result.content
        
        // Parse the markdown content
        const entries: ChangelogEntry[] = []
        const lines = content.split('\n')
        
        let currentVersion: string | null = null
        let currentChanges: string[] = []
        
        for (const line of lines) {
          if (line.startsWith('## Version ')) {
            // Save previous version if exists
            if (currentVersion) {
              entries.push({ version: currentVersion, changes: currentChanges })
              currentChanges = []
            }
            // Extract version number
            const versionMatch = line.match(/## Version (\d+\.\d+\.\d+)/)
            if (versionMatch) {
              currentVersion = versionMatch[1]
            }
          } else if (currentVersion) {
            // Check if line starts with bullet point (with optional leading spaces)
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
              // Extract change item and remove <br> tags
              let change = trimmedLine.substring(2).trim()
              change = change.replace(/<br>|<br\/>/gi, '')
              // Convert markdown bold and italic to HTML
              change = change.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              change = change.replace(/\_(.*?)\_/g, '<i>$1</i>')
              if (change) {
                currentChanges.push(change)
              }
            }
          }
        }
        
        // Save last version
        if (currentVersion && currentChanges.length > 0) {
          entries.push({ version: currentVersion, changes: currentChanges })
        }
        
        setChangelog(entries)
      } catch (err) {
        console.error('Error fetching changelog:', err)
        setError('Failed to load changelog. Please check your internet connection.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChangelog()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 modal-overlay flex items-center justify-center z-50">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text">What's New</h2>
          <button
            onClick={onClose}
            className="p-1 text-theme-textSecondary hover:text-theme-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.open('https://github.com/miguel-apereira/Olympus-Frontend/wiki/Changelog', '_blank')}
                className="text-primary-600 hover:underline text-sm"
              >
                View changelog online
              </button>
            </div>
          ) : changelog.length > 0 ? (
            <div className="space-y-6">
              {changelog.map((entry, index) => (
                <div key={index} className="text-theme-text text-sm leading-relaxed">
                  <h2 className="font-semibold mb-3 text-theme-text text-base">Version {entry.version}</h2>
                   <ul className="space-y-2 ml-4">
                     {entry.changes.map((change, i) => (
                       <li key={i} dangerouslySetInnerHTML={{ __html: `• ${change}` }} />
                     ))}
                   </ul>
                </div>
              ))}
              
              
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-theme-textSecondary">No changelog entries found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChangelogModal