'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout as logoutUser, type User } from '@/lib/storage'

interface AuthContextType {
  user: User | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize from storage on mount
    setUser(getCurrentUser())

    // Listen for auth changes from storage utilities
    const handleAuthChange = () => {
      setUser(getCurrentUser())
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-change', handleAuthChange)
      window.addEventListener('storage', handleAuthChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-change', handleAuthChange)
        window.removeEventListener('storage', handleAuthChange)
      }
    }
  }, [])

  const logout = () => {
    logoutUser()
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
