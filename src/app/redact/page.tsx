"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import {
    Scissors,
    Key,
    Send,
    Copy,
    Check,
    AlertCircle,
    Info,
    Loader2,
    ExternalLink,
    Eye,
    EyeOff,
    Shield,
    Zap
} from "lucide-react"

interface PIIDetection {
    entity_type: string
    text: string
    start: number
    end: number
    confidence: number
    masked_text: string
}

interface RedactionResponse {
    id: string
    object: string
    created: number
    original_request: any
    redacted_request: any
    pii_detections: PIIDetection[]
    processing_time_ms: number
}

const EXAMPLE_TEXT = `Hi! I'm Michael Chen and my email is michael.chen@company.com. My phone number is +1-555-987-6543 and my credit card is 4532-1234-5678-9012. I live at 123 Main Street, New York, NY 10001. My SSN is 123-45-6789 and I was born on March 15, 1985.

I need help with my account. Can you please look up my information using my driver's license number DL123456789? I also have a passport number P123456789 if that helps.

Thank you for your assistance!`

export default function RedactPage() {
    const [apiKey, setApiKey] = useState('')
    const [inputText, setInputText] = useState(EXAMPLE_TEXT)
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState<RedactionResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showApiKey, setShowApiKey] = useState(false)
    const [copiedText, setCopiedText] = useState<string | null>(null)

    // Detection options
    const [detectionOptions, setDetectionOptions] = useState({
        enhanced: true,
        enable_spacy: false,
        enable_presidio: true,
        enable_fuzzy_names: true,
        enable_international_phone: true,
        masking_strategy: 'token' as 'token' | 'partial' | 'custom'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResponse(null)

        if (!apiKey.trim()) {
            setError('API key is required')
            setLoading(false)
            return
        }

        if (!inputText.trim()) {
            setError('Input text is required')
            setLoading(false)
            return
        }

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            const requestBody = {
                messages: [
                    {
                        role: "user",
                        content: inputText
                    }
                ],
                detection_options: detectionOptions
            }

            const res = await fetch(`${API_BASE_URL}/chat/redact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.detail?.message || data.detail || 'Failed to process redaction request')
            }

            setResponse(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedText(type)
            setTimeout(() => setCopiedText(null), 2000)
        } catch (err) {
            console.error('Failed to copy text:', err)
        }
    }

    const resetForm = () => {
        setInputText(EXAMPLE_TEXT)
        setResponse(null)
        setError(null)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Scissors className="h-8 w-8 text-primary" />
                        PII Redaction Demo
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Test the Reduxy Gateway's PII detection and redaction capabilities
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                API Configuration
                            </CardTitle>
                            <CardDescription>
                                Enter your Reduxy API key to test the redaction endpoint
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">Reduxy API Key</Label>
                                <div className="relative">
                                    <Input
                                        id="apiKey"
                                        type={showApiKey ? 'text' : 'password'}
                                        placeholder="rdk_your_api_key_here"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                        {showApiKey ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    <span>
                                        Don't have an API key?
                                        <Link href="/profile" className="text-primary hover:underline ml-1">
                                            Generate one in your profile
                                            <ExternalLink className="h-3 w-3 inline ml-1" />
                                        </Link>
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Detection Options
                            </CardTitle>
                            <CardDescription>
                                Configure PII detection features (plan-dependent)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="enhanced" className="text-sm">Enhanced Detection</Label>
                                    <Switch
                                        id="enhanced"
                                        checked={detectionOptions.enhanced}
                                        onCheckedChange={(checked) =>
                                            setDetectionOptions(prev => ({ ...prev, enhanced: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="presidio" className="text-sm">Presidio Engine</Label>
                                    <Switch
                                        id="presidio"
                                        checked={detectionOptions.enable_presidio}
                                        onCheckedChange={(checked) =>
                                            setDetectionOptions(prev => ({ ...prev, enable_presidio: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="spacy" className="text-sm">spaCy NER</Label>
                                    <Switch
                                        id="spacy"
                                        checked={detectionOptions.enable_spacy}
                                        onCheckedChange={(checked) =>
                                            setDetectionOptions(prev => ({ ...prev, enable_spacy: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="fuzzy" className="text-sm">Fuzzy Names</Label>
                                    <Switch
                                        id="fuzzy"
                                        checked={detectionOptions.enable_fuzzy_names}
                                        onCheckedChange={(checked) =>
                                            setDetectionOptions(prev => ({ ...prev, enable_fuzzy_names: checked }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="intl-phone" className="text-sm">Intl. Phone</Label>
                                    <Switch
                                        id="intl-phone"
                                        checked={detectionOptions.enable_international_phone}
                                        onCheckedChange={(checked) =>
                                            setDetectionOptions(prev => ({ ...prev, enable_international_phone: checked }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm">Masking Strategy</Label>
                                <div className="flex gap-2">
                                    {(['token', 'partial', 'custom'] as const).map((strategy) => (
                                        <Button
                                            key={strategy}
                                            variant={detectionOptions.masking_strategy === strategy ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setDetectionOptions(prev => ({ ...prev, masking_strategy: strategy }))}
                                        >
                                            {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Input Text</CardTitle>
                            <CardDescription>
                                Enter text containing PII to test redaction
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="inputText">Text to Redact</Label>
                                <Textarea
                                    id="inputText"
                                    placeholder="Enter text containing PII..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Redact PII
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                    disabled={loading}
                                >
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results */}
                <div className="space-y-6">
                    {error && (
                        <Card className="border-destructive">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    Error
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-destructive">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {response && (
                        <>
                            {/* Processing Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="h-5 w-5" />
                                        Processing Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">Request ID</div>
                                            <div className="font-mono">{response.id}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Processing Time</div>
                                            <div>{response.processing_time_ms}ms</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">PII Entities Found</div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={response.pii_detections.length > 0 ? 'destructive' : 'secondary'}>
                                                    {response.pii_detections.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Timestamp</div>
                                            <div>{new Date(response.created * 1000).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* PII Detections */}
                            {response.pii_detections.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="h-5 w-5 text-destructive" />
                                            PII Detections ({response.pii_detections.length})
                                        </CardTitle>
                                        <CardDescription>
                                            Sensitive information found in the input text
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {response.pii_detections.map((detection, index) => (
                                                <div key={index} className="border rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Badge variant="destructive">
                                                            {detection.entity_type}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {Math.round(detection.confidence * 100)}% confidence
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Original: </span>
                                                            <code className="bg-destructive/10 px-1 rounded">{detection.text}</code>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Masked: </span>
                                                            <code className="bg-muted px-1 rounded">{detection.masked_text}</code>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Position: </span>
                                                            <span>{detection.start}-{detection.end}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Original vs Redacted */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Original Text</CardTitle>
                                    <CardDescription>
                                        The original input text before redaction
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                                            {response.original_request.messages[0].content}
                                        </pre>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => copyToClipboard(response.original_request.messages[0].content, 'original')}
                                        >
                                            {copiedText === 'original' ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        Redacted Text
                                    </CardTitle>
                                    <CardDescription>
                                        The text after PII detection and masking
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <pre className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto border border-green-200 dark:border-green-800">
                                            {response.redacted_request.messages[0].content}
                                        </pre>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => copyToClipboard(response.redacted_request.messages[0].content, 'redacted')}
                                        >
                                            {copiedText === 'redacted' ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Info Card */}
                    {!response && !error && (
                        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                    <Info className="h-5 w-5" />
                                    About PII Redaction
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                                <p>
                                    The <code>/chat/redact</code> endpoint processes your text through advanced PII detection
                                    and masking without forwarding to any AI provider.
                                </p>
                                <div className="space-y-2">
                                    <div className="font-medium">Detected PII Types:</div>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        <div>• Email addresses</div>
                                        <div>• Phone numbers</div>
                                        <div>• Credit card numbers</div>
                                        <div>• Social Security numbers</div>
                                        <div>• Names (person, organization)</div>
                                        <div>• Addresses</div>
                                        <div>• Driver's license numbers</div>
                                        <div>• Passport numbers</div>
                                    </div>
                                </div>
                                <p>
                                    Detection features vary by plan. Enterprise plans include advanced engines
                                    like spaCy NER and enhanced Presidio detection.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
} 