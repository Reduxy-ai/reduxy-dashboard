"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { updateProfileSchema, updatePasswordSchema, createApiKeySchema } from "@/lib/validations"
import { getInitials, formatPlanName } from "@/lib/auth"
import { PLAN_DETAILS, PLAN_LIMITS } from "@/types/auth"
import {
    User,
    Key,
    Shield,
    Settings,
    CreditCard,
    Bell,
    Trash2,
    Plus,
    Copy,
    Check,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react"

export default function ProfilePage() {
    const { user, refreshUser } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [success, setSuccess] = useState<Record<string, string>>({})
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

    // Profile form state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        company: user?.company || ''
    })

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    // API key form state
    const [apiKeyName, setApiKeyName] = useState('')

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName,
                lastName: user.lastName,
                company: user.company || ''
            })
        }
    }, [user])

    const clearMessages = () => {
        setErrors({})
        setSuccess({})
    }

    // Helper function to get auth token
    const getAuthToken = () => {
        return localStorage.getItem('reduxy_auth_token')
    }

    // Helper function to make authenticated API calls
    const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
        const token = getAuthToken()
        if (!token) {
            throw new Error('No authentication token found')
        }

        console.log('Making authenticated request to:', url, 'with token:', token ? 'present' : 'missing')

        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        })
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(prev => ({ ...prev, profile: true }))
        clearMessages()

        try {
            const result = updateProfileSchema.safeParse(profileData)
            if (!result.success) {
                const formErrors: Record<string, string> = {}
                result.error.errors.forEach(error => {
                    formErrors[error.path[0] as string] = error.message
                })
                setErrors(formErrors)
                return
            }

            // Update profile via API
            const response = await makeAuthenticatedRequest('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('Profile update failed:', response.status, data)
                throw new Error(data.error || `Failed to update profile (${response.status})`)
            }

            setSuccess({ profile: data.message || 'Profile updated successfully!' })

            // Refresh user data to reflect changes
            await refreshUser()

            setLoading(prev => ({ ...prev, profile: false }))
        } catch (error) {
            setErrors({ profile: 'Failed to update profile' })
            setLoading(prev => ({ ...prev, profile: false }))
        }
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(prev => ({ ...prev, password: true }))
        clearMessages()

        try {
            const result = updatePasswordSchema.safeParse(passwordData)
            if (!result.success) {
                const formErrors: Record<string, string> = {}
                result.error.errors.forEach(error => {
                    formErrors[error.path[0] as string] = error.message
                })
                setErrors(formErrors)
                return
            }

            // Update password via API
            const response = await makeAuthenticatedRequest('/api/auth/password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password')
            }

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setSuccess({ password: data.message || 'Password updated successfully!' })
            setLoading(prev => ({ ...prev, password: false }))
        } catch (error) {
            setErrors({ password: 'Failed to update password' })
            setLoading(prev => ({ ...prev, password: false }))
        }
    }

    const handleCreateApiKey = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(prev => ({ ...prev, apiKey: true }))
        clearMessages()

        try {
            const result = createApiKeySchema.safeParse({ name: apiKeyName })
            if (!result.success) {
                setErrors({ apiKey: result.error.errors[0].message })
                return
            }

            // Create API key via API
            const response = await makeAuthenticatedRequest('/api/auth/api-keys', {
                method: 'POST',
                body: JSON.stringify({ name: apiKeyName })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create API key')
            }

            setApiKeyName('')
            setSuccess({
                apiKey: `API key created successfully! Save this key: ${data.apiKey}`
            })

            // Refresh user data to show the new API key
            await refreshUser()

            setLoading(prev => ({ ...prev, apiKey: false }))
        } catch (error) {
            setErrors({ apiKey: 'Failed to create API key' })
            setLoading(prev => ({ ...prev, apiKey: false }))
        }
    }

    const handleDeleteApiKey = async (keyId: string) => {
        if (!user || !confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return
        }

        setLoading(prev => ({ ...prev, [`delete_${keyId}`]: true }))

        try {
            // Delete API key via API
            const response = await makeAuthenticatedRequest('/api/auth/api-keys', {
                method: 'DELETE',
                body: JSON.stringify({ keyId })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete API key')
            }

            setSuccess({ apiKey: data.message || 'API key deleted successfully!' })

            // Refresh user data to remove the deleted API key
            await refreshUser()

            setLoading(prev => ({ ...prev, [`delete_${keyId}`]: false }))
        } catch (error) {
            setErrors({ apiKey: 'Failed to delete API key' })
            setLoading(prev => ({ ...prev, [`delete_${keyId}`]: false }))
        }
    }

    const copyToClipboard = async (text: string, keyId: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedKey(keyId)
            setTimeout(() => setCopiedKey(null), 2000)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
        }
    }

    const togglePasswordVisibility = (field: string) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
    }

    if (!user) {
        return (
            <div className="flex-1 space-y-6 p-8">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'api-keys', label: 'API Keys', icon: Key },
        { id: 'plan', label: 'Plan & Billing', icon: CreditCard },
        { id: 'preferences', label: 'Preferences', icon: Settings }
    ]

    const planDetails = PLAN_DETAILS[user.plan]
    const planLimits = PLAN_LIMITS[user.plan]

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3"
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile Information
                                </CardTitle>
                                <CardDescription>
                                    Update your personal information and account details
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Avatar Section */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                                            {getInitials(user.firstName, user.lastName)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                                            <p className="text-muted-foreground">{user.email}</p>
                                            <Badge variant="secondary" className="mt-1">
                                                {formatPlanName(user.plan)} Plan
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Profile Form */}
                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        {errors.profile && (
                                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                                <p className="text-sm text-destructive">{errors.profile}</p>
                                            </div>
                                        )}
                                        {success.profile && (
                                            <div className="p-3 rounded-md bg-green-50 border border-green-200">
                                                <p className="text-sm text-green-800">{success.profile}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name</Label>
                                                <Input
                                                    id="firstName"
                                                    value={profileData.firstName}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                                                    className={errors.firstName ? 'border-destructive' : ''}
                                                />
                                                {errors.firstName && (
                                                    <p className="text-sm text-destructive">{errors.firstName}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName">Last Name</Label>
                                                <Input
                                                    id="lastName"
                                                    value={profileData.lastName}
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                                                    className={errors.lastName ? 'border-destructive' : ''}
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
                                                value={user.email}
                                                disabled
                                                className="bg-muted"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Email cannot be changed. Contact support if you need to update your email.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="company">Company</Label>
                                            <Input
                                                id="company"
                                                value={profileData.company}
                                                onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                                                placeholder="Optional"
                                                className={errors.company ? 'border-destructive' : ''}
                                            />
                                            {errors.company && (
                                                <p className="text-sm text-destructive">{errors.company}</p>
                                            )}
                                        </div>

                                        <Button type="submit" disabled={loading.profile}>
                                            {loading.profile ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Profile'
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Security Settings
                                </CardTitle>
                                <CardDescription>
                                    Manage your password and security preferences
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    {errors.password && (
                                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                            <p className="text-sm text-destructive">{errors.password}</p>
                                        </div>
                                    )}
                                    {success.password && (
                                        <div className="p-3 rounded-md bg-green-50 border border-green-200">
                                            <p className="text-sm text-green-800">{success.password}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                className={errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => togglePasswordVisibility('current')}
                                            >
                                                {showPasswords.current ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.currentPassword && (
                                            <p className="text-sm text-destructive">{errors.currentPassword}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => togglePasswordVisibility('new')}
                                            >
                                                {showPasswords.new ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.newPassword && (
                                            <p className="text-sm text-destructive">{errors.newPassword}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                            >
                                                {showPasswords.confirm ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={loading.password}>
                                        {loading.password ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'api-keys' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    API Keys
                                </CardTitle>
                                <CardDescription>
                                    Manage your API keys for accessing the Reduxy Gateway
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Create New API Key */}
                                <div className="border rounded-lg p-4">
                                    <h4 className="text-sm font-medium mb-3">Create New API Key</h4>
                                    <form onSubmit={handleCreateApiKey} className="flex gap-2">
                                        <Input
                                            placeholder="API Key Name (e.g., Production, Development)"
                                            value={apiKeyName}
                                            onChange={(e) => setApiKeyName(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="submit" disabled={loading.apiKey}>
                                            {loading.apiKey ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Create
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                    {errors.apiKey && (
                                        <p className="text-sm text-destructive mt-2">{errors.apiKey}</p>
                                    )}
                                    {success.apiKey && (
                                        <p className="text-sm text-green-800 mt-2">{success.apiKey}</p>
                                    )}
                                </div>

                                {/* Existing API Keys */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium">Your API Keys</h4>
                                    {user.apiKeys.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No API keys created yet.</p>
                                    ) : (
                                        user.apiKeys.map((apiKey) => (
                                            <div key={apiKey.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h5 className="font-medium">{apiKey.name}</h5>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={apiKey.isActive ? "success" : "secondary"}>
                                                            {apiKey.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteApiKey(apiKey.id)}
                                                            disabled={loading[`delete_${apiKey.id}`]}
                                                        >
                                                            {loading[`delete_${apiKey.id}`] ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                                                        {apiKey.key}
                                                    </code>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                                                    >
                                                        {copiedKey === apiKey.id ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Created on {new Date(apiKey.createdAt).toLocaleDateString()}
                                                    {apiKey.lastUsed && (
                                                        <span> • Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Plan Tab */}
                    {activeTab === 'plan' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Plan & Billing
                                </CardTitle>
                                <CardDescription>
                                    Manage your subscription and billing information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Current Plan */}
                                <div className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-lg font-semibold">{planDetails.name} Plan</h4>
                                            <p className="text-muted-foreground">{planDetails.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{planDetails.price}</div>
                                            {user.billingInfo && (
                                                <Badge variant={user.billingInfo.status === 'active' ? 'success' : 'destructive'}>
                                                    {user.billingInfo.status.charAt(0).toUpperCase() + user.billingInfo.status.slice(1)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Plan Features */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-medium mb-2">Features</h5>
                                            <ul className="space-y-1 text-sm">
                                                {planDetails.features.slice(0, 4).map((feature, index) => (
                                                    <li key={index} className="flex items-center gap-2">
                                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="font-medium mb-2">Limits</h5>
                                            <div className="space-y-1 text-sm">
                                                <div>Requests: {planLimits.requestsPerMonth === 'unlimited' ? 'Unlimited' : `${planLimits.requestsPerMonth}/month`}</div>
                                                <div>Log Retention: {planLimits.logRetentionDays === 'custom' ? 'Custom' : `${planLimits.logRetentionDays} days`}</div>
                                                <div>Support: {planLimits.support}</div>
                                                <div>SLA: {planLimits.sla || 'None'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Information */}
                                {user.billingInfo && (
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">Billing Information</h4>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Current Period</div>
                                                <div>
                                                    {new Date(user.billingInfo.currentPeriodStart).toLocaleDateString()} -{' '}
                                                    {new Date(user.billingInfo.currentPeriodEnd).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Next Billing</div>
                                                <div>
                                                    {user.billingInfo.cancelAtPeriodEnd
                                                        ? 'Plan will be cancelled'
                                                        : new Date(user.billingInfo.currentPeriodEnd).toLocaleDateString()
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button variant="outline">
                                        Upgrade Plan
                                    </Button>
                                    <Button variant="outline">
                                        Billing History
                                    </Button>
                                    <Button variant="outline">
                                        Download Invoice
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Preferences
                                </CardTitle>
                                <CardDescription>
                                    Customize your dashboard experience and notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Notifications */}
                                <div className="space-y-4">
                                    <h4 className="font-medium">Notifications</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Email Notifications</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Receive email updates about your account
                                                </div>
                                            </div>
                                            <Switch
                                                checked={user.preferences.emailNotifications}
                                                onCheckedChange={(checked) => {
                                                    // Update preference logic
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Security Alerts</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Get notified about security events
                                                </div>
                                            </div>
                                            <Switch
                                                checked={user.preferences.securityAlerts}
                                                onCheckedChange={(checked) => {
                                                    // Update preference logic
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Weekly Reports</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Receive weekly usage summaries
                                                </div>
                                            </div>
                                            <Switch
                                                checked={user.preferences.weeklyReports}
                                                onCheckedChange={(checked) => {
                                                    // Update preference logic
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Account Actions */}
                                <div className="space-y-4 pt-6 border-t">
                                    <h4 className="font-medium text-destructive">Danger Zone</h4>
                                    <div className="space-y-3">
                                        <div className="border border-destructive/20 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Delete Account</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Permanently delete your account and all data
                                                    </div>
                                                </div>
                                                <Button variant="destructive" size="sm">
                                                    Delete Account
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
} 