"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { Loader2, Zap, Shield, BarChart3, Users } from "lucide-react"

export default function LoginPage() {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: ""
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const router = useRouter()

    const handleInputChange = (field: keyof LoginFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const result = loginSchema.safeParse(formData)
            if (!result.success) {
                const formErrors: Record<string, string> = {}
                result.error.errors.forEach(error => {
                    formErrors[error.path[0] as string] = error.message
                })
                setErrors(formErrors)
                setLoading(false)
                return
            }

            const response = await login(result.data)
            if (response.success) {
                router.push("/")
            } else {
                setErrors({ general: response.error || 'Login failed' })
            }
        } catch (error) {
            setErrors({ general: 'An unexpected error occurred' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <Zap className="h-8 w-8 mr-3" />
                            <h1 className="text-3xl font-bold">Reduxy</h1>
                        </div>
                        <p className="text-xl text-blue-100">AI Gateway Dashboard</p>
                    </div>

                    <div className="space-y-6 max-w-md">
                        <div className="flex items-start space-x-4">
                            <Shield className="h-6 w-6 text-blue-200 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-1">Enterprise Security</h3>
                                <p className="text-blue-100 text-sm">Advanced authentication and API key management for your AI infrastructure.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <BarChart3 className="h-6 w-6 text-blue-200 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-1">Real-time Analytics</h3>
                                <p className="text-blue-100 text-sm">Monitor your AI gateway performance with comprehensive analytics and insights.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Users className="h-6 w-6 text-blue-200 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-1">Team Management</h3>
                                <p className="text-blue-100 text-sm">Collaborate with your team and manage access controls efficiently.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-blue-200">
                        <p className="text-sm">"Reduxy has transformed our AI infrastructure management."</p>
                        <p className="text-xs mt-2 opacity-75">— Leading Tech Company</p>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-lg"></div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8 text-center lg:text-left">
                        <div className="lg:hidden flex items-center justify-center mb-6">
                            <Zap className="h-8 w-8 mr-3 text-blue-600" />
                            <h1 className="text-3xl font-bold">Reduxy</h1>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground mt-2">
                            Enter your credentials to access your dashboard
                        </p>
                    </div>

                    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                        <CardContent className="p-0 lg:p-6">
                            <form onSubmit={handleLogin} className="space-y-4">
                                {errors.general && (
                                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                                        {errors.general}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="h-11"
                                        required
                                    />
                                    {errors.email && (
                                        <span className="text-sm text-red-600">{errors.email}</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className="h-11"
                                        required
                                    />
                                    {errors.password && (
                                        <span className="text-sm text-red-600">{errors.password}</span>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign in to your account
                                </Button>
                            </form>

                            <div className="mt-6 p-3 bg-gray-50 rounded-md border">
                                <p className="text-sm text-gray-600 text-center mb-1">Demo credentials:</p>
                                <p className="text-sm font-mono text-center">admin@reduxy.ai / admin123</p>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Don't have an account?{" "}
                                    <Link
                                        href="/register"
                                        className="text-blue-600 hover:text-blue-500 font-medium hover:underline"
                                    >
                                        Sign up for free
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 