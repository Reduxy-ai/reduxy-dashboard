"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { type Policy } from "@/types/auth"
import {
    FlaskConical,
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
    Zap,
    ChevronDown,
    ChevronRight,
    FileText,
    Image as ImageIcon,
    Upload,
    Download,
    FileKey,
    Type,
    File,
    X,
    MessageSquareWarning
} from "lucide-react"
import { FeedbackWidget, MissedPIIReporter } from "@/components/feedback"

interface PIIDetection {
    entity_type: string
    text?: string
    value?: string
    start: number
    end: number
    confidence: number
    masked_text?: string
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

interface DocumentResponse {
    filename: string
    content_type: string
    file_size: number
    extracted_text?: string
    detections: PIIDetection[]
    processing_time_ms: number
    masking_strategy?: string
    token_mapping?: Record<string, string>
}

const EXAMPLE_TEXT = `Hi! I'm Michael Chen and my email is michael.chen@company.com. 
My phone number is +1-555-987-6543 and my credit card is 4532-1234-5678-9012. 
I live at 123 Main Street, New York, NY 10001. My SSN is 123-45-6789.`

type TabType = 'text' | 'document' | 'image'

export default function TestLabPage() {
    const [apiKey, setApiKey] = useState('')
    const [showApiKey, setShowApiKey] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>('text')
    const [copiedText, setCopiedText] = useState<string | null>(null)
    
    // Policy state
    const [policies, setPolicies] = useState<Policy[]>([])
    const [selectedPolicy, setSelectedPolicy] = useState<string>('')
    const [loadingPolicies, setLoadingPolicies] = useState(false)

    // Text tab state
    const [inputText, setInputText] = useState(EXAMPLE_TEXT)
    const [textLoading, setTextLoading] = useState(false)
    const [textResponse, setTextResponse] = useState<RedactionResponse | null>(null)
    const [textError, setTextError] = useState<string | null>(null)
    const [showDetections, setShowDetections] = useState(false)
    const [maskingStrategy, setMaskingStrategy] = useState<'token' | 'unique_token' | 'partial'>('token')

    // Document/Image tab state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fileLoading, setFileLoading] = useState(false)
    const [fileResponse, setFileResponse] = useState<DocumentResponse | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [redactedFileUrl, setRedactedFileUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch policies on mount
    useEffect(() => {
        fetchPolicies()
    }, [])

    const fetchPolicies = async () => {
        setLoadingPolicies(true)
        try {
            const token = localStorage.getItem('reduxy_auth_token')
            const response = await fetch('/api/policies', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setPolicies(data.policies || [])
            }
        } catch (error) {
            console.error('Failed to fetch policies:', error)
        } finally {
            setLoadingPolicies(false)
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

    // Text redaction handler
    const handleTextRedact = async (e: React.FormEvent) => {
        e.preventDefault()
        setTextLoading(true)
        setTextError(null)
        setTextResponse(null)

        if (!apiKey.trim()) {
            setTextError('API key is required')
            setTextLoading(false)
            return
        }

        if (!inputText.trim()) {
            setTextError('Input text is required')
            setTextLoading(false)
            return
        }

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            const requestBody = {
                messages: [{ role: "user", content: inputText }],
                detection_options: {
                    enhanced: true,
                    enable_presidio: true,
                    masking_strategy: maskingStrategy
                }
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

            setTextResponse(data)
        } catch (err) {
            setTextError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setTextLoading(false)
        }
    }

    // File upload handler
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setFileResponse(null)
            setFileError(null)
            setRedactedFileUrl(null)
        }
    }

    const clearFile = () => {
        setSelectedFile(null)
        setFileResponse(null)
        setFileError(null)
        setRedactedFileUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Document/Image process handler
    const handleFileProcess = async (mode: 'analyze' | 'redact') => {
        if (!selectedFile) return

        setFileLoading(true)
        setFileError(null)
        setFileResponse(null)
        setRedactedFileUrl(null)

        if (!apiKey.trim()) {
            setFileError('API key is required')
            setFileLoading(false)
            return
        }

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('masking_strategy', maskingStrategy)

            const endpoint = mode === 'analyze' ? '/documents/process' : '/documents/redact'

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            })

            if (mode === 'redact') {
                if (!res.ok) {
                    const errorData = await res.json()
                    throw new Error(errorData.detail?.message || 'Failed to redact file')
                }
                
                // Get redacted file as blob
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                setRedactedFileUrl(url)
                
                // Parse headers for detection info
                const totalRedactions = res.headers.get('X-Total-Redactions')
                setFileResponse({
                    filename: selectedFile.name,
                    content_type: selectedFile.type,
                    file_size: blob.size,
                    detections: [],
                    processing_time_ms: 0,
                    masking_strategy: maskingStrategy
                })
            } else {
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.detail?.message || data.detail || 'Failed to process file')
                }

                setFileResponse(data)
            }
        } catch (err) {
            setFileError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setFileLoading(false)
        }
    }

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="w-8 h-8" />
        if (type.includes('pdf')) return <FileText className="w-8 h-8" />
        return <File className="w-8 h-8" />
    }

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
        { id: 'document', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
        { id: 'image', label: 'Images', icon: <ImageIcon className="w-4 h-4" /> },
    ]

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FlaskConical className="h-8 w-8 text-primary" />
                        Test Lab
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Test PII detection and redaction for text, documents, and images
                    </p>
                </div>
            </div>

            {/* Configuration Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* API Key Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Key className="h-5 w-5" />
                            API Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey" className="text-sm">Reduxy API Key</Label>
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
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="h-3 w-3" />
                                <Link href="/profile" className="text-primary hover:underline">
                                    Get API key from profile <ExternalLink className="h-3 w-3 inline" />
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Policy & Options Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileKey className="h-5 w-5" />
                            Detection Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <Label className="text-sm">Policy</Label>
                            <select
                                className="w-full border rounded px-3 py-2 text-sm bg-background"
                                value={selectedPolicy}
                                onChange={(e) => setSelectedPolicy(e.target.value)}
                                disabled={loadingPolicies}
                            >
                                <option value="">Use default settings</option>
                                {policies.map((policy) => (
                                    <option key={policy.id} value={policy.id}>
                                        {policy.name} {policy.isDefault ? '(Default)' : ''}
                                    </option>
                                ))}
                            </select>
                            {policies.length === 0 && !loadingPolicies && (
                                <Link href="/policies/new" className="text-xs text-primary hover:underline block">
                                    Create your first policy →
                                </Link>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Masking Strategy</Label>
                            <div className="flex gap-2">
                                {(['token', 'unique_token', 'partial'] as const).map((strategy) => (
                                    <Button
                                        key={strategy}
                                        variant={maskingStrategy === strategy ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setMaskingStrategy(strategy)}
                                    >
                                        {strategy === 'unique_token' ? 'Unique' : strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Navigation */}
            <div className="border-b">
                <div className="flex gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Text Tab */}
                {activeTab === 'text' && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Input Text</CardTitle>
                                <CardDescription>Enter text containing PII to test redaction</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Enter text containing PII..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleTextRedact} disabled={textLoading} className="flex-1">
                                        {textLoading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                        ) : (
                                            <><Send className="w-4 h-4 mr-2" /> Redact PII</>
                                        )}
                                    </Button>
                                    <Button variant="outline" onClick={() => { setInputText(EXAMPLE_TEXT); setTextResponse(null); setTextError(null); }}>
                                        Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            {textError && (
                                <Card className="border-destructive/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <AlertCircle className="h-5 w-5" />
                                            <span>{textError}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {textResponse && (
                                <>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2">
                                                <Zap className="h-5 w-5" />
                                                Results
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <div className="text-muted-foreground">Processing Time</div>
                                                    <div className="font-medium">{textResponse.processing_time_ms}ms</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">PII Found</div>
                                                    <Badge variant={textResponse.pii_detections.length > 0 ? 'destructive' : 'secondary'}>
                                                        {textResponse.pii_detections.length}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2">
                                                <Shield className="h-5 w-5" />
                                                Redacted Text
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="relative">
                                                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto">
                                                    {textResponse.redacted_request.messages[0].content}
                                                </pre>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => copyToClipboard(textResponse.redacted_request.messages[0].content, 'redacted')}
                                                >
                                                    {copiedText === 'redacted' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {textResponse.pii_detections.length > 0 && (
                                        <Card>
                                            <CardHeader
                                                className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                                                onClick={() => setShowDetections(!showDetections)}
                                            >
                                                <CardTitle className="flex items-center justify-between text-base">
                                                    <span>Detections ({textResponse.pii_detections.length})</span>
                                                    {showDetections ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </CardTitle>
                                            </CardHeader>
                                            {showDetections && (
                                                <CardContent className="pt-0">
                                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                                        {textResponse.pii_detections.map((d, i) => (
                                                            <div key={i} className="border rounded p-2 text-sm">
                                                                <div className="flex items-center justify-between">
                                                                    <Badge variant="secondary">{d.entity_type}</Badge>
                                                                    <span className="text-muted-foreground text-xs">{Math.round(d.confidence * 100)}%</span>
                                                                </div>
                                                                <code className="text-xs bg-muted px-1 rounded mt-1 block truncate">{d.text || d.value}</code>
                                                                <FeedbackWidget
                                                                    detection={{
                                                                        entity_type: d.entity_type,
                                                                        value: d.text || d.value || '',
                                                                        confidence: d.confidence,
                                                                        start: d.start,
                                                                        end: d.end
                                                                    }}
                                                                    originalText={inputText}
                                                                    documentType="text"
                                                                    apiKey={apiKey}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t">
                                                        <MissedPIIReporter
                                                            originalText={inputText}
                                                            documentType="text"
                                                            apiKey={apiKey}
                                                        />
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    )}
                                </>
                            )}

                            {!textResponse && !textError && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center text-muted-foreground">
                                            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>Enter text and click "Redact PII" to test</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </>
                )}

                {/* Document & Image Tabs */}
                {(activeTab === 'document' || activeTab === 'image') && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {activeTab === 'document' ? 'Upload Document' : 'Upload Image'}
                                </CardTitle>
                                <CardDescription>
                                    {activeTab === 'document'
                                        ? 'Supported: PDF, DOCX, XLSX, PPTX'
                                        : 'Supported: PNG, JPG, JPEG, WEBP'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={activeTab === 'document'
                                        ? '.pdf,.docx,.xlsx,.pptx'
                                        : '.png,.jpg,.jpeg,.webp'
                                    }
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                
                                {!selectedFile ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                                    >
                                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activeTab === 'document' ? 'PDF, DOCX, XLSX, PPTX' : 'PNG, JPG, JPEG, WEBP'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-muted-foreground">
                                                {getFileIcon(selectedFile.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{selectedFile.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={clearFile}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleFileProcess('analyze')}
                                        disabled={!selectedFile || fileLoading}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        {fileLoading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Eye className="w-4 h-4 mr-2" />
                                        )}
                                        Analyze
                                    </Button>
                                    <Button
                                        onClick={() => handleFileProcess('redact')}
                                        disabled={!selectedFile || fileLoading}
                                        className="flex-1"
                                    >
                                        {fileLoading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Shield className="w-4 h-4 mr-2" />
                                        )}
                                        Redact
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            {fileError && (
                                <Card className="border-destructive/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <AlertCircle className="h-5 w-5" />
                                            <span>{fileError}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {redactedFileUrl && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2">
                                            <Check className="h-5 w-5 text-green-500" />
                                            Redaction Complete
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {selectedFile?.type.includes('image') && (
                                            <div className="border rounded-lg overflow-hidden">
                                                <img
                                                    src={redactedFileUrl}
                                                    alt="Redacted"
                                                    className="w-full h-auto"
                                                />
                                            </div>
                                        )}
                                        <Button asChild className="w-full">
                                            <a href={redactedFileUrl} download={`redacted_${selectedFile?.name}`}>
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Redacted File
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {fileResponse && fileResponse.detections.length > 0 && !redactedFileUrl && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5" />
                                            Analysis Results
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Processing Time</div>
                                                <div className="font-medium">{fileResponse.processing_time_ms}ms</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">PII Found</div>
                                                <Badge variant={fileResponse.detections.length > 0 ? 'destructive' : 'secondary'}>
                                                    {fileResponse.detections.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="border-t pt-3">
                                            <div className="text-sm font-medium mb-2">Detections</div>
                                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                                {fileResponse.detections.map((d, i) => (
                                                    <div key={i} className="border rounded p-2 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="secondary">{d.entity_type}</Badge>
                                                            <span className="text-muted-foreground text-xs">{Math.round(d.confidence * 100)}%</span>
                                                        </div>
                                                        <code className="text-xs bg-muted px-1 rounded mt-1 block truncate">{d.value}</code>
                                                        <FeedbackWidget
                                                            detection={{
                                                                entity_type: d.entity_type,
                                                                value: d.value || '',
                                                                confidence: d.confidence,
                                                                start: d.start,
                                                                end: d.end
                                                            }}
                                                            originalText={fileResponse.extracted_text || ''}
                                                            documentType={activeTab}
                                                            apiKey={apiKey}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t">
                                                <MissedPIIReporter
                                                    originalText={fileResponse.extracted_text || ''}
                                                    documentType={activeTab}
                                                    apiKey={apiKey}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {!fileResponse && !fileError && !redactedFileUrl && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center text-muted-foreground">
                                            {activeTab === 'document' ? (
                                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            ) : (
                                                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            )}
                                            <p>Upload a file to analyze or redact</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

