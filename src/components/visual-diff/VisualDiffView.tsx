"use client"

import { useState, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    ArrowLeftRight, 
    Highlighter,
    Copy, 
    Check,
    ChevronDown,
    ChevronUp,
    ThumbsUp,
    ThumbsDown,
    X,
    Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Detection {
    entity_type: string
    value?: string
    text?: string
    start: number
    end: number
    confidence: number
    masked_text?: string
}

interface VisualDiffViewProps {
    originalText: string
    redactedText: string
    detections: Detection[]
    onFeedback?: (detection: Detection, type: 'correct' | 'incorrect') => void
    apiKey?: string
    className?: string
}

// Entity type colors - vibrant and distinct
const ENTITY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    PERSON: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500' },
    FIRST_NAME: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500' },
    LAST_NAME: { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500' },
    EMAIL: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500' },
    EMAIL_ADDRESS: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500' },
    PHONE: { bg: 'bg-violet-500/20', text: 'text-violet-400', ring: 'ring-violet-500' },
    PHONE_NUMBER: { bg: 'bg-violet-500/20', text: 'text-violet-400', ring: 'ring-violet-500' },
    ADDRESS: { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500' },
    SSN: { bg: 'bg-rose-500/20', text: 'text-rose-400', ring: 'ring-rose-500' },
    US_SSN: { bg: 'bg-rose-500/20', text: 'text-rose-400', ring: 'ring-rose-500' },
    CREDIT_CARD: { bg: 'bg-pink-500/20', text: 'text-pink-400', ring: 'ring-pink-500' },
    IP_ADDRESS: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-500/20', text: 'text-gray-400', ring: 'ring-gray-500' }

const getEntityColor = (entityType: string) => {
    return ENTITY_COLORS[entityType] || DEFAULT_COLOR
}

export function VisualDiffView({ 
    originalText, 
    redactedText, 
    detections,
    onFeedback,
    apiKey,
    className 
}: VisualDiffViewProps) {
    const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side')
    const [copiedText, setCopiedText] = useState<string | null>(null)
    const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null)
    const [showAllDetections, setShowAllDetections] = useState(true)
    const [feedbackSent, setFeedbackSent] = useState<Record<number, 'correct' | 'incorrect'>>({})

    // Sort detections by start position
    const sortedDetections = useMemo(() => {
        return [...detections].sort((a, b) => a.start - b.start)
    }, [detections])

    // Group detections by entity type for legend
    const detectionsByType = useMemo(() => {
        const groups: Record<string, Detection[]> = {}
        for (const d of detections) {
            if (!groups[d.entity_type]) groups[d.entity_type] = []
            groups[d.entity_type].push(d)
        }
        return groups
    }, [detections])

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedText(type)
            setTimeout(() => setCopiedText(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleFeedback = useCallback(async (detection: Detection, type: 'correct' | 'incorrect') => {
        // Mark as sent
        setFeedbackSent(prev => ({ ...prev, [detection.start]: type }))
        
        // Call parent callback
        if (onFeedback) {
            onFeedback(detection, type)
        }

        // Send to API if apiKey provided
        if (apiKey) {
            try {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                await fetch(`${API_BASE_URL}/feedback/detection`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        original_value: detection.value || detection.text,
                        original_type: detection.entity_type,
                        feedback_type: type === 'correct' ? 'true_positive' : 'false_positive',
                        confidence: detection.confidence,
                        context: originalText.slice(Math.max(0, detection.start - 50), Math.min(originalText.length, detection.end + 50))
                    })
                })
            } catch (err) {
                console.error('Failed to send feedback:', err)
            }
        }
    }, [apiKey, onFeedback, originalText])

    // Build highlighted text with proper positioning
    const renderHighlightedText = useCallback((text: string) => {
        const elements: React.ReactNode[] = []
        let lastEnd = 0

        for (const detection of sortedDetections) {
            // Add text before this detection
            if (detection.start > lastEnd) {
                elements.push(
                    <span key={`text-${lastEnd}`} className="text-foreground/90">
                        {text.slice(lastEnd, detection.start)}
                    </span>
                )
            }

            const colors = getEntityColor(detection.entity_type)
            const isSelected = selectedDetection?.start === detection.start
            const detectionText = text.slice(detection.start, detection.end)
            const feedback = feedbackSent[detection.start]

            elements.push(
                <span
                    key={`detection-${detection.start}`}
                    className={cn(
                        "relative inline cursor-pointer rounded px-1 py-0.5 transition-all",
                        colors.bg,
                        isSelected && `ring-2 ${colors.ring}`,
                        feedback === 'correct' && "ring-2 ring-green-500",
                        feedback === 'incorrect' && "ring-2 ring-red-500 line-through opacity-60"
                    )}
                    onClick={() => setSelectedDetection(isSelected ? null : detection)}
                >
                    {detectionText}
                    {feedback && (
                        <span className={cn(
                            "absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center",
                            feedback === 'correct' ? "bg-green-500" : "bg-red-500"
                        )}>
                            {feedback === 'correct' ? 
                                <Check className="w-2 h-2 text-white" /> : 
                                <X className="w-2 h-2 text-white" />
                            }
                        </span>
                    )}
                </span>
            )

            lastEnd = detection.end
        }

        // Add remaining text
        if (lastEnd < text.length) {
            elements.push(
                <span key={`text-${lastEnd}`} className="text-foreground/90">
                    {text.slice(lastEnd)}
                </span>
            )
        }

        return elements
    }, [sortedDetections, selectedDetection, feedbackSent])

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                        variant={viewMode === 'side-by-side' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8"
                        onClick={() => setViewMode('side-by-side')}
                    >
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Side by Side
                    </Button>
                    <Button
                        variant={viewMode === 'inline' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-8"
                        onClick={() => setViewMode('inline')}
                    >
                        <Highlighter className="w-4 h-4 mr-2" />
                        Inline
                    </Button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(detectionsByType).map(([type, items]) => {
                        const colors = getEntityColor(type)
                        return (
                            <Badge 
                                key={type} 
                                variant="secondary"
                                className={cn("text-xs font-medium", colors.bg, colors.text)}
                            >
                                {type} ({items.length})
                            </Badge>
                        )
                    })}
                </div>
            </div>

            {/* Main Content */}
            {viewMode === 'side-by-side' ? (
                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Original */}
                    <Card className="overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-yellow-500/10 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Original
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => copyToClipboard(originalText, 'original')}
                                >
                                    {copiedText === 'original' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {renderHighlightedText(originalText)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Redacted */}
                    <Card className="overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-green-500/10 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    Redacted
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => copyToClipboard(redactedText, 'redacted')}
                                >
                                    {copiedText === 'redacted' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
                                {redactedText}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-primary/5 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Highlighted View
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => copyToClipboard(redactedText, 'redacted')}
                            >
                                {copiedText === 'redacted' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                                Copy Redacted
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {renderHighlightedText(originalText)}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Selected Detection Detail Panel */}
            {selectedDetection && (
                <Card className="border-2 border-primary/50 overflow-hidden animate-in slide-in-from-top-2">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Badge className={cn(
                                        "text-sm font-semibold",
                                        getEntityColor(selectedDetection.entity_type).bg,
                                        getEntityColor(selectedDetection.entity_type).text
                                    )}>
                                        {selectedDetection.entity_type}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {Math.round(selectedDetection.confidence * 100)}% confidence
                                    </span>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Detected Value:</div>
                                    <code className="block p-2 bg-muted rounded text-sm font-mono">
                                        {selectedDetection.value || selectedDetection.text}
                                    </code>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">Will be replaced with:</div>
                                    <code className="block p-2 bg-muted rounded text-sm font-mono text-primary">
                                        {selectedDetection.masked_text || `[${selectedDetection.entity_type}]`}
                                    </code>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setSelectedDetection(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                
                                <div className="flex flex-col gap-1 mt-2">
                                    <span className="text-xs text-muted-foreground text-center">Feedback</span>
                                    <Button
                                        variant={feedbackSent[selectedDetection.start] === 'correct' ? 'default' : 'outline'}
                                        size="sm"
                                        className={cn(
                                            "h-9 gap-2",
                                            feedbackSent[selectedDetection.start] === 'correct' && "bg-green-600 hover:bg-green-700"
                                        )}
                                        onClick={() => handleFeedback(selectedDetection, 'correct')}
                                        disabled={!!feedbackSent[selectedDetection.start]}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        Correct
                                    </Button>
                                    <Button
                                        variant={feedbackSent[selectedDetection.start] === 'incorrect' ? 'default' : 'outline'}
                                        size="sm"
                                        className={cn(
                                            "h-9 gap-2",
                                            feedbackSent[selectedDetection.start] === 'incorrect' && "bg-red-600 hover:bg-red-700"
                                        )}
                                        onClick={() => handleFeedback(selectedDetection, 'incorrect')}
                                        disabled={!!feedbackSent[selectedDetection.start]}
                                    >
                                        <ThumbsDown className="w-4 h-4" />
                                        Wrong
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detection List */}
            {sortedDetections.length > 0 && (
                <Card>
                    <CardHeader 
                        className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setShowAllDetections(!showAllDetections)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                                {sortedDetections.length} Detection{sortedDetections.length > 1 ? 's' : ''}
                            </CardTitle>
                            {showAllDetections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </CardHeader>
                    
                    {showAllDetections && (
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {sortedDetections.map((d, idx) => {
                                    const colors = getEntityColor(d.entity_type)
                                    const isSelected = selectedDetection?.start === d.start
                                    const feedback = feedbackSent[d.start]
                                    
                                    return (
                                        <div 
                                            key={idx}
                                            className={cn(
                                                "flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                                                isSelected && "bg-primary/5"
                                            )}
                                            onClick={() => setSelectedDetection(isSelected ? null : d)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Badge 
                                                    variant="secondary"
                                                    className={cn("shrink-0 text-xs", colors.bg, colors.text)}
                                                >
                                                    {d.entity_type}
                                                </Badge>
                                                <code className="text-sm font-mono truncate text-muted-foreground">
                                                    {d.value || d.text}
                                                </code>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {Math.round(d.confidence * 100)}%
                                                </span>
                                                
                                                {feedback ? (
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center",
                                                        feedback === 'correct' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                                                    )}>
                                                        {feedback === 'correct' ? 
                                                            <ThumbsUp className="w-3 h-3" /> : 
                                                            <ThumbsDown className="w-3 h-3" />
                                                        }
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-green-500/20 hover:text-green-500"
                                                            onClick={() => handleFeedback(d, 'correct')}
                                                        >
                                                            <ThumbsUp className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-500"
                                                            onClick={() => handleFeedback(d, 'incorrect')}
                                                        >
                                                            <ThumbsDown className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    )
}
