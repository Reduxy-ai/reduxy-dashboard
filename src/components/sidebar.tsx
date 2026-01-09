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
    LogOut,
    User,
    Scissors,
    FileKey,
    FlaskConical
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
    {
        name: "Dashboard",
        href: "/",
        icon: BarChart3,
    },
    {
        name: "Test Lab",
        href: "/test-lab",
        icon: FlaskConical,
    },
    {
        name: "Policies",
        href: "/policies",
        icon: FileKey,
    },
    {
        name: "Logs",
        href: "/logs",
        icon: FileText,
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: Activity,
    },
    {
        name: "Profile",
        href: "/profile",
        icon: User,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const { user, logout } = useAuth()

    return (
        <div className="flex h-full w-64 flex-col bg-card border-r">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">R</span>
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

            {/* Theme Toggle and User Actions */}
            <div className="border-t p-4 space-y-2">
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

                {user && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </Button>
                )}
            </div>
        </div>
    )
} 