'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg border border-transparent">
        <div className="size-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm border border-blue-200 dark:border-teal-700 hover:shadow-md transition-shadow"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="size-5 text-slate-700" />
      ) : (
        <Sun className="size-5 text-yellow-400" />
      )}
    </button>
  )
}