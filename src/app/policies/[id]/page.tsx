"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Shield,
    ArrowLeft,
    Save,
    Loader2,
    FileText,
    Image,
    MessageSquare,
    Info,
    Trash2
} from "lucide-react"
import type { 
    Policy,
    PIIType, 
    PIISetting, 
    MaskingStrategy,
    ImageMaskingStyle,
    DocumentSettings,
    ImageSettings,
    TextSettings
} from "@/types/auth"
import { 
    DEFAULT_PII_SETTINGS, 
    DEFAULT_DOCUMENT_SETTINGS,
    DEFAULT_IMAGE_SETTINGS,
    DEFAULT_TEXT_SETTINGS,
    PII_TYPE_INFO 
} from "@/types/auth"

const MASKING_STRATEGIES: { value: MaskingStrategy; label: string; description: string }[] = [
    { value: 'token', label: 'Token', description: '[EMAIL], [PERSON]' },
    { value: 'unique_token', label: 'Unique Token', description: '[PERSON_1], [PERSON_2]' },
    { value: 'partial', label: 'Partial', description: 'J*** S****' },
    { value: 'full', label: 'Full Redact', description: '**********' },
    { value: 'none', label: 'None', description: 'No masking' },
]

const IMAGE_MASKING_STYLES: { value: ImageMaskingStyle; label: string }[] = [
    { value: 'blur', label: 'Blur (Gaussian)' },
    { value: 'black_box', label: 'Black Box' },
    { value: 'pixelate', label: 'Pixelate' },
]

export default function EditPolicyPage() {
    const router = useRouter()
    const params = useParams()
    const policyId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isDefault, setIsDefault] = useState(false)
    const [piiSettings, setPiiSettings] = useState<Record<PIIType, PIISetting>>(DEFAULT_PII_SETTINGS)
    const [documentSettings, setDocumentSettings] = useState<DocumentSettings>(DEFAULT_DOCUMENT_SETTINGS)
    const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS)
    const [textSettings, setTextSettings] = useState<TextSettings>(DEFAULT_TEXT_SETTINGS)

    // Active tab
    const [activeTab, setActiveTab] = useState<'pii' | 'document' | 'image' | 'text'>('pii')

    useEffect(() => {
        fetchPolicy()
    }, [policyId])

    const fetchPolicy = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/policies/${policyId}`)
            if (!response.ok) {
                throw new Error('Policy not found')
            }
            const data = await response.json()
            const policy: Policy = data.policy

            setName(policy.name)
            setDescription(policy.description || '')
            setIsDefault(policy.isDefault)
            setPiiSettings({ ...DEFAULT_PII_SETTINGS, ...policy.piiSettings })
            setDocumentSettings({ ...DEFAULT_DOCUMENT_SETTINGS, ...policy.documentSettings })
            setImageSettings({ ...DEFAULT_IMAGE_SETTINGS, ...policy.imageSettings })
            setTextSettings({ ...DEFAULT_TEXT_SETTINGS, ...policy.textSettings })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load policy')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Policy name is required')
            return
        }

        setSaving(true)
        setError(null)

        try {
            const response = await fetch(`/api/policies/${policyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    piiSettings,
                    documentSettings,
                    imageSettings,
                    textSettings,
                    isDefault,
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update policy')
            }

            router.push('/policies')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update policy')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
            return
        }

        setDeleting(true)
        try {
            const response = await fetch(`/api/policies/${policyId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete policy')
            }

            router.push('/policies')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete policy')
            setDeleting(false)
        }
    }

    const updatePIISetting = (type: PIIType, field: keyof PIISetting, value: any) => {
        setPiiSettings(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }))
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/policies">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Edit Policy
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Modify your PII detection and masking policy
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isDefault && (
                        <Button 
                            variant="outline" 
                            onClick={handleDelete} 
                            disabled={deleting}
                            className="text-destructive hover:text-destructive"
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-destructive/50">
                    <CardContent className="p-4">
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Name and description for this policy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Policy Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., HIPAA Compliance"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 flex items-end">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="default"
                                    checked={isDefault}
                                    onCheckedChange={setIsDefault}
                                />
                                <Label htmlFor="default">Set as default policy</Label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the purpose of this policy..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
                <Button
                    variant={activeTab === 'pii' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('pii')}
                >
                    <Shield className="h-4 w-4 mr-2" />
                    PII Types
                </Button>
                <Button
                    variant={activeTab === 'document' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('document')}
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                </Button>
                <Button
                    variant={activeTab === 'image' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('image')}
                >
                    <Image className="h-4 w-4 mr-2" />
                    Images
                </Button>
                <Button
                    variant={activeTab === 'text' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('text')}
                >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text/Chat
                </Button>
            </div>

            {/* PII Settings Tab */}
            {activeTab === 'pii' && (
                <Card>
                    <CardHeader>
                        <CardTitle>PII Detection Types</CardTitle>
                        <CardDescription>
                            Configure which types of sensitive data to detect and how to mask them
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(Object.keys(PII_TYPE_INFO) as PIIType[]).map((type) => {
                            const info = PII_TYPE_INFO[type]
                            const setting = piiSettings[type]
                            
                            return (
                                <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{info.icon}</span>
                                        <div>
                                            <div className="font-medium">{info.label}</div>
                                            <div className="text-sm text-muted-foreground">{info.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <select
                                            className="border rounded px-3 py-1 text-sm bg-background"
                                            value={setting?.strategy || 'token'}
                                            onChange={(e) => updatePIISetting(type, 'strategy', e.target.value)}
                                            disabled={!setting?.enabled}
                                        >
                                            {MASKING_STRATEGIES.map(s => (
                                                <option key={s.value} value={s.value}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-muted-foreground">Min Conf:</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                className="w-20 text-sm"
                                                value={setting?.min_confidence || 0.8}
                                                onChange={(e) => updatePIISetting(type, 'min_confidence', parseFloat(e.target.value))}
                                                disabled={!setting?.enabled}
                                            />
                                        </div>
                                        <Switch
                                            checked={setting?.enabled || false}
                                            onCheckedChange={(checked) => updatePIISetting(type, 'enabled', checked)}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Document Settings Tab */}
            {activeTab === 'document' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Document Settings</CardTitle>
                        <CardDescription>
                            Settings for PDF, DOCX, XLSX, and PPTX files
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Masking Style</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {MASKING_STRATEGIES.filter(s => s.value !== 'none').map(strategy => (
                                    <Button
                                        key={strategy.value}
                                        variant={documentSettings.masking_style === strategy.value ? 'default' : 'outline'}
                                        className="flex-col h-auto py-3"
                                        onClick={() => setDocumentSettings(prev => ({ ...prev, masking_style: strategy.value }))}
                                    >
                                        <span className="font-medium">{strategy.label}</span>
                                        <span className="text-xs opacity-70">{strategy.description}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Preserve Formatting</Label>
                                <p className="text-sm text-muted-foreground">Keep original document formatting after masking</p>
                            </div>
                            <Switch
                                checked={documentSettings.preserve_formatting}
                                onCheckedChange={(checked) => setDocumentSettings(prev => ({ ...prev, preserve_formatting: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Generate Mapping File</Label>
                                <p className="text-sm text-muted-foreground">Include token-to-original mapping for de-anonymization</p>
                            </div>
                            <Switch
                                checked={documentSettings.generate_mapping}
                                onCheckedChange={(checked) => setDocumentSettings(prev => ({ ...prev, generate_mapping: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Image Settings Tab */}
            {activeTab === 'image' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Image Settings</CardTitle>
                        <CardDescription>
                            Settings for PNG, JPG, and other image formats
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Masking Style</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {IMAGE_MASKING_STYLES.map(style => (
                                    <Button
                                        key={style.value}
                                        variant={imageSettings.masking_style === style.value ? 'default' : 'outline'}
                                        className="h-auto py-3"
                                        onClick={() => setImageSettings(prev => ({ ...prev, masking_style: style.value }))}
                                    >
                                        {style.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {imageSettings.masking_style === 'blur' && (
                            <div className="space-y-2">
                                <Label>Blur Intensity: {imageSettings.blur_intensity}</Label>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={imageSettings.blur_intensity}
                                    onChange={(e) => setImageSettings(prev => ({ ...prev, blur_intensity: parseInt(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Light</span>
                                    <span>Heavy</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Include Bounding Boxes</Label>
                                <p className="text-sm text-muted-foreground">Return PII location coordinates in response</p>
                            </div>
                            <Switch
                                checked={imageSettings.include_bounding_boxes}
                                onCheckedChange={(checked) => setImageSettings(prev => ({ ...prev, include_bounding_boxes: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Text Settings Tab */}
            {activeTab === 'text' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Text/Chat Settings</CardTitle>
                        <CardDescription>
                            Settings for plain text and chat messages
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Masking Style</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {MASKING_STRATEGIES.filter(s => s.value !== 'none').map(strategy => (
                                    <Button
                                        key={strategy.value}
                                        variant={textSettings.masking_style === strategy.value ? 'default' : 'outline'}
                                        className="flex-col h-auto py-3"
                                        onClick={() => setTextSettings(prev => ({ ...prev, masking_style: strategy.value }))}
                                    >
                                        <span className="font-medium">{strategy.label}</span>
                                        <span className="text-xs opacity-70">{strategy.description}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Return Token Mapping</Label>
                                <p className="text-sm text-muted-foreground">Include token-to-original mapping in API response</p>
                            </div>
                            <Switch
                                checked={textSettings.return_mapping}
                                onCheckedChange={(checked) => setTextSettings(prev => ({ ...prev, return_mapping: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

