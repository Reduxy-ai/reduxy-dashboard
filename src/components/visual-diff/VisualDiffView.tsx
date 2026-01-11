"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    ArrowLeftRight, 
    Eye, 
    EyeOff, 
    Copy, 
    Check,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown
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
    className?: string
}

// Entity type colors for consistent highlighting
const ENTITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    PERSON: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300' },
    EMAIL: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300' },
    PHONE: { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300' },
    ADDRESS: { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300' },
    SSN: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-300' },
    CREDIT_CARD: { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-700 dark:text-pink-300' },
    IP_ADDRESS: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-700 dark:text-cyan-300' },
    DEFAULT: { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300' },
}

const getEntityColor = (entityType: string) => {
    return ENTITY_COLORS[entityType] || ENTITY_COLORS.DEFAULT
}

interface HighlightedSegment {
    text: string
    isDetection: boolean
    detection?: Detection
    start: number
    end: number
}

export function VisualDiffView({ 
    originalText, 
    redactedText, 
    detections,
    onFeedback,
    className 
}: VisualDiffViewProps) {
    const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('inline')
    const [showTooltips, setShowTooltips] = useState(true)
    const [copiedText, setCopiedText] = useState<string | null>(null)
    const [hoveredDetection, setHoveredDetection] = useState<Detection | null>(null)
    const [expandedDetection, setExpandedDetection] = useState<number | null>(null)

    // Sort detections by start position
    const sortedDetections = useMemo(() => {
        return [...detections].sort((a, b) => a.start - b.start)
    }, [detections])

    // Build highlighted segments for original text
    const highlightedSegments = useMemo(() => {
        const segments: HighlightedSegment[] = []
        let currentPos = 0

        for (const detection of sortedDetections) {
            // Add text before this detection
            if (detection.start > currentPos) {
                segments.push({
                    text: originalText.slice(currentPos, detection.start),
                    isDetection: false,
                    start: currentPos,
                    end: detection.start
                })
            }

            // Add the detection
            const detectionText = detection.value || detection.text || originalText.slice(detection.start, detection.end)
            segments.push({
                text: detectionText,
                isDetection: true,
                detection,
                start: detection.start,
                end: detection.end
            })

            currentPos = detection.end
        }

        // Add remaining text
        if (currentPos < originalText.length) {
            segments.push({
                text: originalText.slice(currentPos),
                isDetection: false,
                start: currentPos,
                end: originalText.length
            })
        }

        return segments
    }, [originalText, sortedDetections])

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedText(type)
            setTimeout(() => setCopiedText(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const DetectionTooltip = ({ detection, children }: { detection: Detection; children: React.ReactNode }) => {
        const colors = getEntityColor(detection.entity_type)
        const isExpanded = expandedDetection === detection.start

        return (
            <span className="relative inline">
                <span
                    className={cn(
                        "cursor-pointer rounded px-0.5 border transition-all",
                        colors.bg,
                        colors.border,
                        hoveredDetection?.start === detection.start && "ring-2 ring-primary ring-offset-1"
                    )}
                    onMouseEnter={() => setHoveredDetection(detection)}
                    onMouseLeave={() => setHoveredDetection(null)}
                    onClick={() => setExpandedDetection(isExpanded ? null : detection.start)}
                >
                    {children}
                </span>
                
                {/* Tooltip */}
                {showTooltips && hoveredDetection?.start === detection.start && (
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                        <span className={cn(
                            "block px-3 py-2 rounded-lg shadow-lg border text-xs whitespace-nowrap",
                            "bg-popover text-popover-foreground"
                        )}>
                            <span className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className={cn("text-xs", colors.text)}>
                                    {detection.entity_type}
                                </Badge>
                                <span className="text-muted-foreground">
                                    {Math.round(detection.confidence * 100)}% confidence
                                </span>
                            </span>
                            <span className="block font-mono text-xs opacity-75">
                                → {detection.masked_text || `[${detection.entity_type}]`}
                            </span>
                            {onFeedback && (
                                <span className="flex gap-1 mt-2 pt-2 border-t">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={(e) => { e.stopPropagation(); onFeedback(detection, 'correct') }}
                                    >
                                        <ThumbsUp className="w-3 h-3 mr-1" /> Correct
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => { e.stopPropagation(); onFeedback(detection, 'incorrect') }}
                                    >
                                        <ThumbsDown className="w-3 h-3 mr-1" /> Wrong
                                    </Button>
                                </span>
                            )}
                        </span>
                        {/* Arrow */}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover" />
                    </span>
                )}
            </span>
        )
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'inline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('inline')}
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        Inline
                    </Button>
                    <Button
                        variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('side-by-side')}
                    >
                        <ArrowLeftRight className="w-4 h-4 mr-1" />
                        Side by Side
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTooltips(!showTooltips)}
                    >
                        {showTooltips ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="ml-1 text-xs">{showTooltips ? 'Hide' : 'Show'} Tooltips</span>
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(ENTITY_COLORS).filter(([key]) => key !== 'DEFAULT').map(([type, colors]) => {
                    const count = detections.filter(d => d.entity_type === type).length
                    if (count === 0) return null
                    return (
                        <span key={type} className={cn("px-2 py-1 rounded border", colors.bg, colors.border, colors.text)}>
                            {type} ({count})
                        </span>
                    )
                })}
            </div>

            {/* Content */}
            {viewMode === 'inline' ? (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                            <span>Highlighted View</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(redactedText, 'redacted')}
                            >
                                {copiedText === 'redacted' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="ml-1 text-xs">Copy Redacted</span>
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                            {highlightedSegments.map((segment, idx) => (
                                segment.isDetection && segment.detection ? (
                                    <DetectionTooltip key={idx} detection={segment.detection}>
                                        {segment.text}
                                    </DetectionTooltip>
                                ) : (
                                    <span key={idx}>{segment.text}</span>
                                )
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Original
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(originalText, 'original')}
                                >
                                    {copiedText === 'original' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap font-mono min-h-[200px]">
                                {highlightedSegments.map((segment, idx) => (
                                    segment.isDetection && segment.detection ? (
                                        <DetectionTooltip key={idx} detection={segment.detection}>
                                            {segment.text}
                                        </DetectionTooltip>
                                    ) : (
                                        <span key={idx}>{segment.text}</span>
                                    )
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    Redacted
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(redactedText, 'redacted')}
                                >
                                    {copiedText === 'redacted' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap font-mono min-h-[200px]">
                                {redactedText}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Detection Summary */}
            {detections.length > 0 && (
                <Card>
                    <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedDetection(expandedDetection === -1 ? null : -1)}>
                        <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                {detections.length} PII Detection{detections.length > 1 ? 's' : ''}
                            </span>
                            {expandedDetection === -1 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </CardTitle>
                    </CardHeader>
                    {expandedDetection === -1 && (
                        <CardContent className="pt-0">
                            <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                                {sortedDetections.map((d, idx) => {
                                    const colors = getEntityColor(d.entity_type)
                                    return (
                                        <div 
                                            key={idx} 
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded border text-sm",
                                                colors.bg,
                                                colors.border
                                            )}
                                            onMouseEnter={() => setHoveredDetection(d)}
                                            onMouseLeave={() => setHoveredDetection(null)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className={colors.text}>
                                                    {d.entity_type}
                                                </Badge>
                                                <code className="text-xs font-mono truncate max-w-[200px]">
                                                    {d.value || d.text}
                                                </code>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {Math.round(d.confidence * 100)}%
                                                </span>
                                                {onFeedback && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                                                            onClick={() => onFeedback(d, 'correct')}
                                                        >
                                                            <ThumbsUp className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                                                            onClick={() => onFeedback(d, 'incorrect')}
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

