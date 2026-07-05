"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Moon, SunMedium } from "lucide-react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, systemTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const effectiveTheme = theme === "system" ? systemTheme || "light" : theme
  const isDark = effectiveTheme === "dark"

  return (
    <div className="mb-4 rounded-3xl border border-slate-200/80 bg-slate-100/80 p-3 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-100">
          <SunMedium className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Theme</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {effectiveTheme}
          </span>
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Toggle theme"
          />
          <Moon className="h-4 w-4 text-sky-500" />
        </div>
      </div>
    </div>
  )
}
