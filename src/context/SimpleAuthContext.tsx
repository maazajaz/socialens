'use client'

import React, { createContext, useContext, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '../lib/supabase/api'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  checkAuthUser: () => Promise<boolean>
}

const INITIAL_STATE: AuthContextType = {
  user: null,
  supabaseUser: null,
  isAuthenticated: false,
  isLoading: false,
  checkAuthUser: async () => false as boolean,
}

const AuthContext = createContext<AuthContextType>(INITIAL_STATE)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkAuthUser = async () => {
    return false
  }

  const value = {
    user,
    supabaseUser,
    isAuthenticated,
    isLoading,
    checkAuthUser
  }

  console.log('SIMPLE AUTH CONTEXT: Rendering with user:', user?.name, 'isAuthenticated:', isAuthenticated)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useUserContext = () => useContext(AuthContext)
