"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { registerSchema, type RegisterFormData } from "@/lib/validations"
import { PLAN_DETAILS, type MembershipPlan } from "@/types/auth"
import { Check, ArrowLeft, Loader2 } from "lucide-react"

export default function RegisterPage() {
    const [step, setStep] = useState<'plan' | 'details'>('plan')
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('starter')
    const [formData, setFormData] = useState<Partial<RegisterFormData>>({
        plan: 'starter'
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const router = useRouter()

    const handlePlanSelection = (plan: MembershipPlan) => {
        setSelectedPlan(plan)
        setFormData(prev => ({ ...prev, plan }))
    }

    const handleContinueToDetails = () => {
        setStep('details')
    }

    const handleBackToPlan = () => {
        setStep('plan')
    }

    const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrors({})

        try {
            const result = registerSchema.safeParse(formData)
            if (!result.success) {
                const formErrors: Record<string, string> = {}
                result.error.errors.forEach(error => {
                    formErrors[error.path[0] as string] = error.message
                })
                setErrors(formErrors)
                setLoading(false)
                return
            }

            const response = await register(result.data)
            if (response.success) {
                router.push('/onboarding')
            } else {
                setErrors({ general: response.error || 'Registration failed' })
            }
        } catch (error) {
            setErrors({ general: 'An unexpected error occurred' })
        } finally {
            setLoading(false)
        }
    }

    const renderPlanSelection = () => (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-6xl">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-lg">R</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold">Choose Your Plan</h1>
                    <p className="text-muted-foreground mt-2">
                        Select the plan that best fits your needs. You can upgrade or downgrade at any time.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {(Object.entries(PLAN_DETAILS) as [MembershipPlan, typeof PLAN_DETAILS[MembershipPlan]][]).map(([planKey, plan]) => (
                        <Card
                            key={planKey}
                            className={`cursor-pointer transition-all hover:shadow-lg ${selectedPlan === planKey
                                    ? 'ring-2 ring-primary shadow-lg'
                                    : 'hover:shadow-md'
                                } ${planKey === 'pro' ? 'relative border-primary' : ''}`}
                            onClick={() => handlePlanSelection(planKey)}
                        >
                            {planKey === 'pro' && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    {selectedPlan === planKey && (
                                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    {planKey !== 'starter' && planKey !== 'enterprise' && (
                                        <span className="text-muted-foreground">/month</span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {plan.features.slice(0, 5).map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                    {plan.features.length > 5 && (
                                        <li className="text-sm text-muted-foreground">
                                            +{plan.features.length - 5} more features
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/login">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </Button>
                    <Button onClick={handleContinueToDetails} className="min-w-[120px]">
                        Continue
                    </Button>
                </div>
            </div>
        </div>
    )

    const renderDetailsForm = () => (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToPlan}
                            className="p-0 h-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">R</span>
                            </div>
                            <div>
                                <div className="text-sm font-medium">Reduxy Dashboard</div>
                                <div className="text-xs text-muted-foreground">
                                    {PLAN_DETAILS[selectedPlan].name} Plan
                                </div>
                            </div>
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <CardDescription>
                        Enter your details to create your Reduxy account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.general && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive">{errors.general}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className={errors.firstName ? 'border-destructive' : ''}
                                    required
                                />
                                {errors.firstName && (
                                    <p className="text-sm text-destructive">{errors.firstName}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className={errors.lastName ? 'border-destructive' : ''}
                                    required
                                />
                                {errors.lastName && (
                                    <p className="text-sm text-destructive">{errors.lastName}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={errors.email ? 'border-destructive' : ''}
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">Company (Optional)</Label>
                            <Input
                                id="company"
                                type="text"
                                value={formData.company || ''}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className={errors.company ? 'border-destructive' : ''}
                            />
                            {errors.company && (
                                <p className="text-sm text-destructive">{errors.company}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password || ''}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={errors.password ? 'border-destructive' : ''}
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={formData.confirmPassword || ''}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className={errors.confirmPassword ? 'border-destructive' : ''}
                                required
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                            )}
                        </div>

                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="agreeToTerms"
                                checked={formData.agreeToTerms || false}
                                onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                                className={errors.agreeToTerms ? 'border-destructive' : ''}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="agreeToTerms"
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </label>
                                {errors.agreeToTerms && (
                                    <p className="text-xs text-destructive">{errors.agreeToTerms}</p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    return step === 'plan' ? renderPlanSelection() : renderDetailsForm()
} 