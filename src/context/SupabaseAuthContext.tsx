'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import { getCurrentUser, User } from '../lib/supabase/api'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
  checkAuthUser: () => Promise<boolean>
}

const INITIAL_STATE: AuthContextType = {
  user: null,
  supabaseUser: null,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
}

const AuthContext = createContext<AuthContextType>(INITIAL_STATE)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use refs to always have current state values in event handlers
  const userRef = useRef<User | null>(null)
  const isAuthenticatedRef = useRef(false)
  
  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user
    isAuthenticatedRef.current = isAuthenticated
  }, [user, isAuthenticated])

  const supabase = createClient()

  // Initialize from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('socialens_user')
      const cachedAuth = localStorage.getItem('socialens_auth')
      
      if (cachedUser && cachedAuth === 'true') {
        try {
          const userData = JSON.parse(cachedUser)
          setUser(userData)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Error parsing cached user:', error)
          localStorage.removeItem('socialens_user')
          localStorage.removeItem('socialens_auth')
        }
      }
    }
  }, [])

  const checkAuthUser = async () => {
    setIsLoading(true)
    try {
      const currentAccount = await getCurrentUser()
      if (currentAccount) {
        setUser(currentAccount)
        setIsAuthenticated(true)
        // Cache user data in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('socialens_user', JSON.stringify(currentAccount))
          localStorage.setItem('socialens_auth', 'true')
        }
        return true
      } else {
        // Only clear user data if we're sure there's no session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setUser(null)
          setIsAuthenticated(false)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('socialens_user')
            localStorage.removeItem('socialens_auth')
          }
        }
      }
      return false
    } catch (error) {
      console.error('Auth check error:', error)
      // Don't clear user data on error - might be temporary network issue
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          setSupabaseUser(session.user)
          await checkAuthUser()
        } else {
          // If no session but we have cached data, keep it but mark as loading
          const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('socialens_user') : null
          if (!cachedUser) {
            setUser(null)
            setIsAuthenticated(false)
          }
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN') {
          if (session?.user) {
            setSupabaseUser(session.user)
            // Use refs to get the current state values, not closure values
            const hasExistingUser = userRef.current?.id && isAuthenticatedRef.current
            console.log('SIGNED_IN event - hasExistingUser:', hasExistingUser, {
              userId: userRef.current?.id,
              userName: userRef.current?.name,
              isAuthenticated: isAuthenticatedRef.current,
              stateUserId: user?.id,
              stateIsAuthenticated: isAuthenticated
            })
            
            if (hasExistingUser) {
              console.log('Already authenticated, skipping loading state')
              // Just silently refresh user data without loading state
              try {
                const currentAccount = await getCurrentUser()
                if (currentAccount) {
                  setUser(currentAccount)
                  setIsAuthenticated(true)
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('socialens_user', JSON.stringify(currentAccount))
                    localStorage.setItem('socialens_auth', 'true')
                  }
                }
              } catch (error) {
                console.error('Silent auth refresh error:', error)
              }
            } else {
              console.log('No existing user data, showing loading')
              // No existing user data, show loading
              await checkAuthUser()
            }
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setSupabaseUser(session.user)
            // Token refresh should never show loading
            try {
              const currentAccount = await getCurrentUser()
              if (currentAccount) {
                setUser(currentAccount)
                setIsAuthenticated(true)
                if (typeof window !== 'undefined') {
                  localStorage.setItem('socialens_user', JSON.stringify(currentAccount))
                  localStorage.setItem('socialens_auth', 'true')
                }
              }
            } catch (error) {
              console.error('Token refresh error:', error)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          setUser(null)
          setIsAuthenticated(false)
          setIsLoading(false)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('socialens_user')
            localStorage.removeItem('socialens_auth')
          }
        }
        // For other events, don't automatically clear state
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Re-check auth when window regains focus
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout

    const handleFocus = async () => {
      clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(async () => {
        if (userRef.current?.id && isAuthenticatedRef.current) {
          console.log('Window focused, refreshing auth silently (user already exists)...')
          try {
            const currentAccount = await getCurrentUser()
            if (currentAccount) {
              setUser(currentAccount)
              setIsAuthenticated(true)
              if (typeof window !== 'undefined') {
                localStorage.setItem('socialens_user', JSON.stringify(currentAccount))
                localStorage.setItem('socialens_auth', 'true')
              }
            }
          } catch (error) {
            console.error('Focus auth refresh error:', error)
          }
        }
      }, 100) // Debounce by 100ms
    }

    const handleVisibilityChange = async () => {
      clearTimeout(refreshTimeout)
      if (!document.hidden) {
        refreshTimeout = setTimeout(async () => {
          if (userRef.current?.id && isAuthenticatedRef.current) {
            console.log('Tab became visible, refreshing auth silently (user already exists)...')
            try {
              const currentAccount = await getCurrentUser()
              if (currentAccount) {
                setUser(currentAccount)
                setIsAuthenticated(true)
                if (typeof window !== 'undefined') {
                  localStorage.setItem('socialens_user', JSON.stringify(currentAccount))
                  localStorage.setItem('socialens_auth', 'true')
                }
              }
            } catch (error) {
              console.error('Visibility auth refresh error:', error)
            }
          }
        }, 100) // Debounce by 100ms
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearTimeout(refreshTimeout)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // No dependencies needed since we're using refs

  const value = {
    user,
    supabaseUser,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useUserContext = () => useContext(AuthContext)
