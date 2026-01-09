"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Shield,
    Plus,
    Settings,
    Trash2,
    Star,
    FileText,
    Image,
    MessageSquare,
    MoreVertical,
    Copy,
    Loader2
} from "lucide-react"
import type { Policy } from "@/types/auth"

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchPolicies()
    }, [])

    const getAuthHeaders = () => {
        const token = localStorage.getItem('reduxy_auth_token')
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }

    const fetchPolicies = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/policies', {
                headers: getAuthHeaders()
            })
            if (!response.ok) {
                throw new Error('Failed to fetch policies')
            }
            const data = await response.json()
            setPolicies(data.policies || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load policies')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (policyId: string) => {
        if (!confirm('Are you sure you want to delete this policy?')) {
            return
        }

        setDeletingId(policyId)
        try {
            const response = await fetch(`/api/policies/${policyId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete policy')
            }

            // Remove from local state
            setPolicies(policies.filter(p => p.id !== policyId))
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete policy')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSetDefault = async (policyId: string) => {
        try {
            const response = await fetch(`/api/policies/${policyId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isDefault: true })
            })

            if (!response.ok) {
                throw new Error('Failed to set default policy')
            }

            // Refresh policies
            fetchPolicies()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to set default policy')
        }
    }

    const handleDuplicate = async (policy: Policy) => {
        try {
            const response = await fetch('/api/policies', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: `${policy.name} (Copy)`,
                    description: policy.description,
                    piiSettings: policy.piiSettings,
                    documentSettings: policy.documentSettings,
                    imageSettings: policy.imageSettings,
                    textSettings: policy.textSettings,
                    isDefault: false
                })
            })

            if (!response.ok) {
                throw new Error('Failed to duplicate policy')
            }

            // Refresh policies
            fetchPolicies()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to duplicate policy')
        }
    }

    // Count enabled PII types
    const countEnabledPII = (policy: Policy) => {
        if (!policy.piiSettings) return 0
        return Object.values(policy.piiSettings).filter(s => s?.enabled).length
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Shield className="h-8 w-8 text-primary" />
                            Policies
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Configure PII detection and masking policies
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-32 bg-muted rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Policies
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Configure PII detection and masking policies for your API keys
                    </p>
                </div>
                <Link href="/policies/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Policy
                    </Button>
                </Link>
            </div>

            {error && (
                <Card className="border-destructive/50">
                    <CardContent className="p-4">
                        <p className="text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Policies Grid */}
            {policies.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No policies yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first policy to configure PII detection settings
                        </p>
                        <Link href="/policies/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Policy
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {policies.map((policy) => (
                        <Card key={policy.id} className={policy.isDefault ? 'border-primary' : ''}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {policy.name}
                                            {policy.isDefault && (
                                                <Badge variant="default" className="ml-2">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Default
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {policy.description || 'No description'}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <div className="text-lg font-bold">{countEnabledPII(policy)}</div>
                                        <div className="text-xs text-muted-foreground">PII Types</div>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <FileText className="h-4 w-4 mx-auto mb-1" />
                                        <div className="text-xs text-muted-foreground">
                                            {policy.documentSettings?.masking_style || 'token'}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Image className="h-4 w-4 mx-auto mb-1" />
                                        <div className="text-xs text-muted-foreground">
                                            {policy.imageSettings?.masking_style || 'blur'}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Link href={`/policies/${policy.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDuplicate(policy)}
                                        title="Duplicate"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    {!policy.isDefault && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleSetDefault(policy.id)}
                                                title="Set as default"
                                            >
                                                <Star className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(policy.id)}
                                                disabled={deletingId === policy.id}
                                                className="text-destructive hover:text-destructive"
                                                title="Delete"
                                            >
                                                {deletingId === policy.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Created date */}
                                <div className="text-xs text-muted-foreground">
                                    Created {new Date(policy.createdAt).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">About Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        <strong>Policies</strong> define how PII is detected and masked in your data.
                        Each policy can be customized for different use cases.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>PII Types:</strong> Choose which types of sensitive data to detect (names, emails, phone numbers, etc.)</li>
                        <li><strong>Masking Strategy:</strong> Configure how detected PII is masked (token, unique_token, partial, etc.)</li>
                        <li><strong>Format Settings:</strong> Different settings for documents, images, and text</li>
                        <li><strong>API Key Binding:</strong> Bind policies to specific API keys for granular control</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

