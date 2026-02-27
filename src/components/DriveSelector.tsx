import { useState, useEffect } from 'react'
import { themes } from '../config'

interface DriveSelectorProps {
  onSelect: (drives: string[]) => void
  onClose: () => void
  isScanning: boolean
}

export default function DriveSelector({ onSelect, onClose, isScanning }: DriveSelectorProps) {
  const [drives, setDrives] = useState<string[]>([])
  const [selectedDrives, setSelectedDrives] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrives()
  }, [])

  const loadDrives = async () => {
    try {
      const availableDrives = await window.electronAPI.getDrives()
      setDrives(availableDrives)
      setSelectedDrives(availableDrives)
    } catch (error) {
      console.error('Error loading drives:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDrive = (drive: string) => {
    setSelectedDrives(prev => 
      prev.includes(drive)
        ? prev.filter(d => d !== drive)
        : [...prev, drive]
    )
  }

  const handleScan = () => {
    if (selectedDrives.length > 0) {
      onSelect(selectedDrives)
    }
  }

  const themeColors = themes.dark

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div 
        className="relative w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: themeColors.card }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: themeColors.text }}>
          Select Drives to Scan
        </h2>
        
        <p className="mb-4 text-sm" style={{ color: themeColors.textSecondary }}>
          Choose which drives to scan for games. The scan will look for Steam and Epic games.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
            {drives.map((drive) => (
              <label
                key={drive}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: selectedDrives.includes(drive) ? '#0284c7' : themeColors.surface,
                  color: selectedDrives.includes(drive) ? 'white' : themeColors.text
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDrives.includes(drive)}
                  onChange={() => toggleDrive(drive)}
                  className="w-4 h-4"
                />
                <span className="font-medium">{drive}</span>
                <span className="text-sm opacity-75">
                  ({drive === 'C:\\' ? 'System Drive' : 'Local Disk'})
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: themeColors.surface, 
              border: `1px solid ${themeColors.border}`,
              color: themeColors.text 
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning || selectedDrives.length === 0}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white rounded-lg transition-colors"
          >
            {isScanning ? 'Scanning...' : `Scan ${selectedDrives.length} Drive${selectedDrives.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
