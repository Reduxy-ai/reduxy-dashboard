"use client"

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react'
import { User, AuthState, LoginCredentials, RegisterData } from '@/types/auth'
import { createJWT, verifyJWT, findUserByEmail, findUserById, createUser, verifyPassword } from '@/lib/auth'

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

            const payload = await verifyJWT(token)
            if (!payload) {
                removeStoredToken()
                dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid token' })
                return
            }

            const user = await findUserById(payload.userId)
            if (!user) {
                removeStoredToken()
                dispatch({ type: 'LOGIN_FAILURE', payload: 'User not found' })
                return
            }

            dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        } catch (error) {
            console.error('Session check failed:', error)
            removeStoredToken()
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Session check failed' })
        }
    }

    const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        dispatch({ type: 'LOGIN_START' })

        try {
            const user = await findUserByEmail(credentials.email)
            if (!user) {
                dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' })
                return { success: false, error: 'Invalid email or password' }
            }

            const isPasswordValid = await verifyPassword(credentials.password, user.password)
            if (!isPasswordValid) {
                dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' })
                return { success: false, error: 'Invalid email or password' }
            }

            // Remove password from user object
            const { password, ...userWithoutPassword } = user

            // Create JWT token
            const token = await createJWT({
                userId: user.id,
                email: user.email,
                plan: user.plan
            })

            // Store token
            storeToken(token)

            dispatch({ type: 'LOGIN_SUCCESS', payload: userWithoutPassword })
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
            // Check if user already exists
            const existingUser = await findUserByEmail(data.email)
            if (existingUser) {
                dispatch({ type: 'LOGIN_FAILURE', payload: 'Email already registered' })
                return { success: false, error: 'Email already registered' }
            }

            // Create new user
            const user = await createUser({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                company: data.company,
                plan: data.plan
            })

            // Create JWT token
            const token = await createJWT({
                userId: user.id,
                email: user.email,
                plan: user.plan
            })

            // Store token
            storeToken(token)

            dispatch({ type: 'LOGIN_SUCCESS', payload: user })
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
            const user = await findUserById(state.user.id)
            if (user) {
                dispatch({ type: 'SET_USER', payload: user })
            }
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