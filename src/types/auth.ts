export type MembershipPlan = 'starter' | 'pro' | 'enterprise'

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    plan: MembershipPlan
    isEmailVerified: boolean
    createdAt: string
    updatedAt: string
    avatar?: string
    company?: string
    apiKeys: ApiKey[]
    preferences: UserPreferences
    billingInfo?: BillingInfo
}

export interface ApiKey {
    id: string
    name: string
    key: string
    lastUsed?: string
    createdAt: string
    isActive: boolean
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'system'
    emailNotifications: boolean
    securityAlerts: boolean
    weeklyReports: boolean
    language: string
}

export interface BillingInfo {
    plan: MembershipPlan
    status: 'active' | 'cancelled' | 'past_due' | 'trialing'
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialEnd?: string
}

export interface AuthState {
    user: User | null
    isLoading: boolean
    error: string | null
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    email: string
    password: string
    firstName: string
    lastName: string
    company?: string
    plan: MembershipPlan
    agreeToTerms: boolean
}

export interface ResetPasswordData {
    email: string
}

export interface UpdatePasswordData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export interface UpdateProfileData {
    firstName: string
    lastName: string
    company?: string
    avatar?: string
}

export interface PlanLimits {
    requestsPerMonth: number | 'unlimited'
    piiDetectionTypes: number | 'unlimited'
    customRules: boolean
    logRetentionDays: number | 'custom'
    auditExport: boolean
    teamCollaboration: boolean
    apiRateLimit: string
    support: 'community' | 'priority' | 'dedicated'
    sla: string | null
    soc2Compliance: boolean
    onPremiseDeployment: boolean
    samlSSO: boolean
}

export const PLAN_LIMITS: Record<MembershipPlan, PlanLimits> = {
    starter: {
        requestsPerMonth: 1000,
        piiDetectionTypes: 5,
        customRules: false,
        logRetentionDays: 7,
        auditExport: false,
        teamCollaboration: false,
        apiRateLimit: '10/min',
        support: 'community',
        sla: null,
        soc2Compliance: false,
        onPremiseDeployment: false,
        samlSSO: false
    },
    pro: {
        requestsPerMonth: 100000,
        piiDetectionTypes: 15,
        customRules: true,
        logRetentionDays: 30,
        auditExport: true,
        teamCollaboration: true,
        apiRateLimit: '100/min',
        support: 'priority',
        sla: '99.9%',
        soc2Compliance: true,
        onPremiseDeployment: false,
        samlSSO: false
    },
    enterprise: {
        requestsPerMonth: 'unlimited',
        piiDetectionTypes: 'unlimited',
        customRules: true,
        logRetentionDays: 'custom',
        auditExport: true,
        teamCollaboration: true,
        apiRateLimit: 'Custom',
        support: 'dedicated',
        sla: 'Custom',
        soc2Compliance: true,
        onPremiseDeployment: true,
        samlSSO: true
    }
}

export const PLAN_DETAILS = {
    starter: {
        name: 'Starter',
        price: 'Free',
        description: 'Perfect for small projects and prototypes',
        features: [
            '1,000 requests/month',
            'Basic PII detection',
            'Standard support',
            'Community access',
            'Basic audit logs'
        ],
        limitations: [
            'Limited to 2 projects',
            '7-day log retention',
            'No custom rules'
        ]
    },
    pro: {
        name: 'Pro',
        price: '$99/month',
        description: 'Ideal for growing businesses and production workloads',
        features: [
            '100,000 requests/month',
            'Advanced PII detection',
            'Custom detection rules',
            'Priority support',
            'SOC 2 report access',
            '30-day log retention',
            'Audit export (CSV/JSON)',
            'Multiple projects',
            'Team collaboration'
        ],
        limitations: []
    },
    enterprise: {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations with specific requirements',
        features: [
            'Unlimited requests',
            'Enterprise-grade PII detection',
            'Custom detection models',
            '24/7 dedicated support',
            'On-premise deployment',
            'VPC peering',
            'Custom SLAs',
            'SAML/SSO integration',
            'BAA/DPA available',
            'Custom log retention',
            'Real-time compliance reporting',
            'Dedicated customer success'
        ],
        limitations: []
    }
} 