import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeToggleButtonProps {
  iconColor?: string
  className?: string
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ iconColor, className = '' }) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`rounded-lg p-2 transition-all hover:opacity-80 ${className}`}
    >
      {isDark ? (
        <Sun className="h-5 w-5" style={{ color: iconColor }} />
      ) : (
        <Moon className="h-5 w-5" style={{ color: iconColor }} />
      )}
    </button>
  )
}

export default ThemeToggleButton
