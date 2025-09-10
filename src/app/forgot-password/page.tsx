"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations"
import { ArrowLeft, Mail, Loader2, Zap, Shield, Clock, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
    const [formData, setFormData] = useState<ResetPasswordFormData>({
        email: ""
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleInputChange = (field: keyof ResetPasswordFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const result = resetPasswordSchema.safeParse(formData)
            if (!result.success) {
                const formErrors: Record<string, string> = {}
                result.error.errors.forEach(error => {
                    formErrors[error.path[0] as string] = error.message
                })
                setErrors(formErrors)
                setLoading(false)
                return
            }

            // Mock API call - replace with actual implementation
            await new Promise(resolve => setTimeout(resolve, 2000))

            setSent(true)
        } catch (error) {
            setErrors({ general: 'Failed to send reset email. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <Zap className="h-8 w-8 mr-3" />
                            <h1 className="text-3xl font-bold">Reduxy</h1>
                        </div>
                        <p className="text-xl text-indigo-100">Secure account recovery</p>
                    </div>

                    <div className="space-y-6 max-w-md">
                        <div className="flex items-start space-x-4">
                            <Shield className="h-6 w-6 text-indigo-200 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-1">Secure Process</h3>
                                <p className="text-indigo-100 text-sm">We use industry-standard security measures to protect your account recovery process.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <Clock className="h-6 w-6 text-indigo-200 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-1">Quick Recovery</h3>
                                <p className="text-indigo-100 text-sm">Reset links are sent instantly and expire after 24 hours for your security.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <CheckCircle className="h-6 w-6 text-indigo-200 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold mb-1">Always Available</h3>
                                <p className="text-indigo-100 text-sm">Our support team is here to help if you need additional assistance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-indigo-200">
                        <p className="text-sm">"Security and reliability you can trust."</p>
                        <p className="text-xs mt-2 opacity-75">— Reduxy Security Team</p>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-400/20 rounded-full blur-lg"></div>
            </div>

            {/* Right Side - Reset Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8 text-center lg:text-left">
                        <div className="lg:hidden flex items-center justify-center mb-6">
                            <Zap className="h-8 w-8 mr-3 text-indigo-600" />
                            <h1 className="text-3xl font-bold">Reduxy</h1>
                        </div>

                        {sent ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="h-8 w-8 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-green-600">Check your email</h2>
                                <p className="text-muted-foreground mt-2">
                                    We've sent a password reset link to {formData.email}
                                </p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold tracking-tight">Reset your password</h2>
                                <p className="text-muted-foreground mt-2">
                                    Enter your email address and we'll send you a link to reset your password
                                </p>
                            </>
                        )}
                    </div>

                    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                        <CardContent className="p-0 lg:p-6">
                            {sent ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                        <div className="flex items-start space-x-3">
                                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-green-800">Reset link sent!</p>
                                                <p className="text-green-700 mt-1">
                                                    Check your inbox and click the link to reset your password.
                                                    The link will expire in 24 hours.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center text-sm text-muted-foreground">
                                        <p>Didn't receive the email? Check your spam folder or</p>
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto text-indigo-600 hover:text-indigo-500"
                                            onClick={() => setSent(false)}
                                        >
                                            try again
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
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
                                            placeholder="Enter your email address"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="h-11"
                                            required
                                        />
                                        {errors.email && (
                                            <span className="text-sm text-red-600">{errors.email}</span>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send reset link
                                    </Button>
                                </form>
                            )}

                            <div className="mt-6 text-center">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 font-medium hover:underline"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to login
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 