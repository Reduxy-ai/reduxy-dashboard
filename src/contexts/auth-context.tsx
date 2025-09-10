"use client"

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth'

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

type AuthAction =
    | { type: 'LOGIN_START' }
    | { type: 'LOGIN_SUCCESS'; payload: User }
    | { type: 'LOGIN_FAILURE'; payload: string }
    | { type: 'LOGOUT' }
    | { type: 'SET_USER'; payload: User }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_ERROR' }

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOGIN_START':
            return { ...state, isLoading: true, error: null }
        case 'LOGIN_SUCCESS':
            return { ...state, isLoading: false, user: action.payload, error: null }
        case 'LOGIN_FAILURE':
            return { ...state, isLoading: false, user: null, error: action.payload }
        case 'LOGOUT':
            return { ...state, user: null, error: null, isLoading: false }
        case 'SET_USER':
            return { ...state, user: action.payload, isLoading: false, error: null }
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false }
        case 'CLEAR_ERROR':
            return { ...state, error: null }
        default:
            return state
    }
}

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        isLoading: true,
        error: null
    })

    // Check for existing session on mount
    useEffect(() => {
        checkExistingSession()
    }, [])

    const checkExistingSession = async () => {
        try {
            const token = getStoredToken()
            if (!token) {
                dispatch({ type: 'LOGIN_FAILURE', payload: 'No token found' })
                return
            }

            // For now, just check if we have a valid token format
            // In production, this would verify the JWT and fetch user data
            if (token.startsWith('mock-jwt-token')) {
                // Mock user data - replace with API call to verify token
                const mockUser = {
                    id: 'user_1',
                    email: 'admin@reduxy.ai',
                    firstName: 'Admin',
                    lastName: 'User',
                    plan: 'pro' as const,
                    isEmailVerified: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    company: 'Reduxy Inc.',
                    apiKeys: [],
                    preferences: {
                        theme: 'system' as const,
                        emailNotifications: true,
                        securityAlerts: true,
                        weeklyReports: true,
                        language: 'en'
                    }
                }
                dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser })
            } else {
                removeStoredToken()
                dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid token' })
            }
        } catch (error) {
            console.error('Session check failed:', error)
            removeStoredToken()
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Session check failed' })
        }
    }

    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        dispatch({ type: 'LOGIN_START' })

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            })

            const data = await response.json()

            if (!response.ok) {
                dispatch({ type: 'LOGIN_FAILURE', payload: data.error })
                return { success: false, error: data.error }
            }

            // Store token
            storeToken(data.token)

            dispatch({ type: 'LOGIN_SUCCESS', payload: data.user })
            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed'
            dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage })
            return { success: false, error: errorMessage }
        }
    }

    const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
        dispatch({ type: 'LOGIN_START' })

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            const responseData = await response.json()

            if (!response.ok) {
                dispatch({ type: 'LOGIN_FAILURE', payload: responseData.error })
                return { success: false, error: responseData.error }
            }

            // Store token
            storeToken(responseData.token)

            dispatch({ type: 'LOGIN_SUCCESS', payload: responseData.user })
            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Registration failed'
            dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage })
            return { success: false, error: errorMessage }
        }
    }

    const logout = () => {
        removeStoredToken()
        dispatch({ type: 'LOGOUT' })
    }

    const refreshUser = async () => {
        if (!state.user) return

        try {
            // For now, just keep the current user data
            // In production, this would make an API call to refresh user data
            console.log('User refresh requested for:', state.user.id)
        } catch (error) {
            console.error('Failed to refresh user:', error)
            dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh user data' })
        }
    }

    const value: AuthContextType = {
        ...state,
        login,
        register,
        logout,
        refreshUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Token storage utilities
const TOKEN_KEY = 'reduxy_auth_token'

function storeToken(token: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token)
    }
}

function getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY)
    }
    return null
}

function removeStoredToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY)
    }
} 