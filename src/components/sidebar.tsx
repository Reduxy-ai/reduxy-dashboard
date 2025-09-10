"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    FileText,
    Shield,
    Settings,
    Activity,
    Moon,
    Sun,
    LogIn
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

const navigation = [
    {
        name: "Dashboard",
        href: "/",
        icon: BarChart3,
    },
    {
        name: "Logs",
        href: "/logs",
        icon: FileText,
    },
    {
        name: "PII Detection",
        href: "/pii",
        icon: Shield,
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: Activity,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
    {
        name: "Login",
        href: "/login",
        icon: LogIn,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex h-full w-64 flex-col bg-card border-r">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">R</span>
                    </div>
                    <div>
                        <div className="font-semibold text-lg">Reduxy</div>
                        <div className="text-xs text-muted-foreground">Dashboard</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.name} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    isActive && "bg-secondary"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            {/* Theme Toggle */}
            <div className="border-t p-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-full justify-start gap-3"
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                </Button>
            </div>
        </div>
    )
} 