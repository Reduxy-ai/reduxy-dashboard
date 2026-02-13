"use client"

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { User, AuthState } from '@/types/auth'

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.reduxy.ai'

interface AuthContextType extends AuthState {
    logout: () => void
    refreshUser: () => Promise<void>
    redirectToLogin: () => void
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
            // Check session with auth service
            const response = await fetch(`${AUTH_URL}/api/auth/me`, {
                method: 'GET',
                credentials: 'include', // Important: send cookies
            })

            if (response.ok) {
                const data = await response.json()
                dispatch({ type: 'LOGIN_SUCCESS', payload: data.user })
            } else {
                dispatch({ type: 'LOGIN_FAILURE', payload: 'Not authenticated' })
            }
        } catch (error) {
            console.error('Session check failed:', error)
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Session check failed' })
        }
    }

    const redirectToLogin = () => {
        const currentUrl = window.location.href
        window.location.href = `${AUTH_URL}/login?redirect_uri=${encodeURIComponent(currentUrl)}`
    }

    const logout = async () => {
        dispatch({ type: 'LOGOUT' })

        // Redirect to auth service logout page, which will clear cookie and redirect back
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.reduxy.ai'
        window.location.href = `${AUTH_URL}/logout?redirect_uri=${encodeURIComponent(dashboardUrl)}`
    }

    const refreshUser = async () => {
        try {
            // Fetch fresh user data from auth service
            const response = await fetch(`${AUTH_URL}/api/auth/me`, {
                method: 'GET',
                credentials: 'include',
            })

            if (response.ok) {
                const data = await response.json()
                dispatch({ type: 'LOGIN_SUCCESS', payload: data.user })
            } else {
                console.error('Failed to refresh user data')
            }
        } catch (error) {
            console.error('Failed to refresh user:', error)
            dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh user data' })
        }
    }

    const value: AuthContextType = {
        ...state,
        logout,
        refreshUser,
        redirectToLogin
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