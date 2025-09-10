import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { User, MembershipPlan } from '@/types/auth'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

export interface JWTPayload {
    userId: string
    email: string
    plan: string
    iat?: number
    exp?: number
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as JWTPayload
    } catch (error) {
        console.error('JWT verification failed:', error)
        return null
    }
}

export function generateApiKey(): string {
    const prefix = 'rdk_'
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = prefix
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export function getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function formatPlanName(plan: string): string {
    return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export function isTokenExpired(exp: number): boolean {
    return Date.now() >= exp * 1000
}

// Mock user storage (in production, this would be a database)
const mockUsers: (User & { password: string })[] = [
    {
        id: 'user_1',
        email: 'admin@reduxy.ai',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/Ee.', // password: admin123
        firstName: 'Admin',
        lastName: 'User',
        plan: 'pro',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        company: 'Reduxy Inc.',
        apiKeys: [
            {
                id: 'key_1',
                name: 'Production Key',
                key: 'rdk_prod_abcd1234efgh5678ijkl9012mnop3456',
                lastUsed: new Date(Date.now() - 3600000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                isActive: true
            }
        ],
        preferences: {
            theme: 'system',
            emailNotifications: true,
            securityAlerts: true,
            weeklyReports: true,
            language: 'en'
        },
        billingInfo: {
            plan: 'pro',
            status: 'active',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false
        }
    }
]

export async function findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
    return mockUsers.find(user => user.email === email) || null
}

export async function findUserById(id: string): Promise<User | null> {
    const user = mockUsers.find(user => user.id === id)
    if (!user) return null

    // Remove password from response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
}

export async function createUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    company?: string
    plan: string
}): Promise<User> {
    const hashedPassword = await hashPassword(userData.password)
    const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        plan: userData.plan as MembershipPlan,
        isEmailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        company: userData.company,
        apiKeys: [],
        preferences: {
            theme: 'system' as const,
            emailNotifications: true,
            securityAlerts: true,
            weeklyReports: false,
            language: 'en'
        }
    }

    mockUsers.push(newUser)

    // Return user without password
    const { password, ...userWithoutPassword } = newUser
    return userWithoutPassword
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = mockUsers.findIndex(user => user.id === id)
    if (userIndex === -1) return null

    mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    }

    const { password, ...userWithoutPassword } = mockUsers[userIndex]
    return userWithoutPassword
}

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
    const userIndex = mockUsers.findIndex(user => user.id === id)
    if (userIndex === -1) return false

    const hashedPassword = await hashPassword(newPassword)
    mockUsers[userIndex].password = hashedPassword
    mockUsers[userIndex].updatedAt = new Date().toISOString()

    return true
}

export async function addApiKey(userId: string, name: string): Promise<string | null> {
    const userIndex = mockUsers.findIndex(user => user.id === userId)
    if (userIndex === -1) return null

    const apiKey = generateApiKey()
    const newKey = {
        id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        key: apiKey,
        createdAt: new Date().toISOString(),
        isActive: true
    }

    mockUsers[userIndex].apiKeys.push(newKey)
    mockUsers[userIndex].updatedAt = new Date().toISOString()

    return apiKey
}

export async function deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    const userIndex = mockUsers.findIndex(user => user.id === userId)
    if (userIndex === -1) return false

    const keyIndex = mockUsers[userIndex].apiKeys.findIndex(key => key.id === keyId)
    if (keyIndex === -1) return false

    mockUsers[userIndex].apiKeys.splice(keyIndex, 1)
    mockUsers[userIndex].updatedAt = new Date().toISOString()

    return true
} 