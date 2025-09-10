"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { PLAN_DETAILS } from "@/types/auth"
import {
    CheckCircle,
    ArrowRight,
    Key,
    Code,
    Shield,
    BarChart3,
    Sparkles
} from "lucide-react"

export default function OnboardingPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)

    if (!user) {
        return null
    }

    const planDetails = PLAN_DETAILS[user.plan]

    const steps = [
        {
            title: "Welcome to Reduxy!",
            description: "Let's get you started with your new account",
            content: (
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">
                            Welcome, {user.firstName}!
                        </h2>
                        <p className="text-muted-foreground">
                            Thank you for choosing Reduxy. You're on the{' '}
                            <Badge variant="secondary" className="mx-1">
                                {planDetails.name}
                            </Badge>
                            plan.
                        </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                        <h3 className="font-semibold mb-2">What you get with {planDetails.name}:</h3>
                        <ul className="text-sm space-y-1">
                            {planDetails.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: "Create Your First API Key",
            description: "Generate an API key to start using the Reduxy Gateway",
            content: (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">API Keys</h3>
                        <p className="text-muted-foreground">
                            API keys authenticate your applications with the Reduxy Gateway.
                            You'll need one to start making requests.
                        </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="text-sm">
                            <strong>Quick Setup:</strong>
                        </div>
                        <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                            <li>Go to your Profile → API Keys section</li>
                            <li>Click "Create New API Key"</li>
                            <li>Give it a descriptive name (e.g., "Production")</li>
                            <li>Copy and securely store your API key</li>
                        </ol>
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={() => router.push('/profile?tab=api-keys')}
                            variant="outline"
                        >
                            <Key className="w-4 h-4 mr-2" />
                            Create API Key Now
                        </Button>
                    </div>
                </div>
            )
        },
        {
            title: "Start Using the Gateway",
            description: "Learn how to integrate Reduxy into your applications",
            content: (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Code className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Integration</h3>
                        <p className="text-muted-foreground">
                            Replace your direct API calls with Reduxy Gateway for automatic PII protection.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Before (Direct API)
                            </h4>
                            <code className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded block">
                                POST https://api.openai.com/v1/chat/completions
                            </code>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-green-500" />
                                After (Reduxy Gateway)
                            </h4>
                            <code className="text-xs bg-black/5 dark:bg-white/5 p-2 rounded block">
                                POST https://gateway.reduxy.ai/chat/completions
                            </code>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            📚 Next Steps
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Check our documentation for integration guides</li>
                            <li>• Test your API key with the /health endpoint</li>
                            <li>• Monitor your usage in the Dashboard</li>
                            <li>• Set up PII detection rules for your use case</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: "Monitor Your Usage",
            description: "Track requests, costs, and PII detections in real-time",
            content: (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Dashboard Analytics</h3>
                        <p className="text-muted-foreground">
                            Keep track of your API usage, costs, and PII detection activity.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-medium">What you can monitor:</h4>
                            <ul className="text-sm space-y-2">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    Request volume and trends
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    API usage costs
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    PII detection events
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    Response times and errors
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium">Available views:</h4>
                            <ul className="text-sm space-y-2">
                                <li className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    Real-time dashboard
                                </li>
                                <li className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    Detailed request logs
                                </li>
                                <li className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    Usage analytics
                                </li>
                                <li className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    Export capabilities
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center">
                        <Button onClick={() => router.push('/')}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Dashboard
                        </Button>
                    </div>
                </div>
            )
        }
    ]

    const currentStepData = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">R</span>
                            </div>
                            <span className="font-semibold">Reduxy Setup</span>
                        </div>
                        <Badge variant="outline">
                            {currentStep + 1} of {steps.length}
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-6">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                    <CardDescription className="text-base">
                        {currentStepData.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-8">
                        {currentStepData.content}
                    </div>

                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                        >
                            Previous
                        </Button>

                        {isLastStep ? (
                            <Button onClick={() => router.push('/')}>
                                Get Started
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={() => setCurrentStep(currentStep + 1)}>
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>

                    {isLastStep && (
                        <div className="text-center mt-6 pt-6 border-t">
                            <p className="text-sm text-muted-foreground">
                                🎉 You're all set! Welcome to Reduxy.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 