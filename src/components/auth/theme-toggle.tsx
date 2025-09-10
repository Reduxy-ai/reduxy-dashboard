"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface AuthThemeToggleProps {
    variant?: 'gradient' | 'mobile'
}

export function AuthThemeToggle({ variant = 'gradient' }: AuthThemeToggleProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const gradientClasses = "h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
    const mobileClasses = "h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={variant === 'gradient' ? gradientClasses : mobileClasses}
            >
                <Sun className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={variant === 'gradient' ? gradientClasses : mobileClasses}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
} 