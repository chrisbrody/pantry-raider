"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { supabase, getSupabaseClient, checkSupabaseConnection } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
  isConnected: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const router = useRouter()

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection()
      setIsConnected(connected)
      if (!connected) {
        console.warn("AuthProvider: Unable to connect to Supabase")
      }
    }

    checkConnection()
  }, [])

  useEffect(() => {
    const setData = async () => {
      try {
        console.log("AuthProvider: Getting session...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("AuthProvider: Error getting session:", error)
          setError(error.message)
          setIsLoading(false)
          return
        }

        console.log("AuthProvider: Session result:", session ? "Session found" : "No session")
        setSession(session)
        setUser(session?.user ?? null)
      } catch (err: any) {
        console.error("AuthProvider: Unexpected error getting session:", err)
        setError(err.message || "An unexpected error occurred")
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AuthProvider: Auth state changed:", _event)
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    setData()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleAuthError = (error: AuthError | Error | any) => {
    console.error("Auth error:", error)

    // Check if it's a network error
    if (error.message?.includes("fetch") || error.message?.includes("network") || error.code === "NETWORK_ERROR") {
      setIsConnected(false)
      return "Unable to connect to authentication service. Please check your internet connection and try again."
    }

    // Handle specific auth errors
    if (error.message?.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again."
    }

    if (error.message?.includes("Email not confirmed")) {
      return "Please confirm your email before signing in."
    }

    // Default error message
    return error.message || "An unexpected error occurred"
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    try {
      console.log("AuthProvider: Signing up with email:", email)

      // Check connection first
      if (!isConnected) {
        const connected = await checkSupabaseConnection()
        setIsConnected(connected)
        if (!connected) {
          throw new Error("Unable to connect to authentication service. Please check your internet connection.")
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      const errorMessage = handleAuthError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      console.log("AuthProvider: Signing in with email:", email)

      // Check connection first
      if (!isConnected) {
        const connected = await checkSupabaseConnection()
        setIsConnected(connected)
        if (!connected) {
          throw new Error("Unable to connect to authentication service. Please check your internet connection.")
        }
      }

      // Get a fresh client instance to avoid any stale state
      const freshClient = getSupabaseClient()

      const { data, error } = await freshClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      console.log("AuthProvider: Sign in successful, session:", data.session ? "Session created" : "No session")
      setSession(data.session)
      setUser(data.user)

      router.push("/dashboard")
    } catch (err: any) {
      const errorMessage = handleAuthError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      console.log("AuthProvider: Signing out...")

      // Check connection first
      if (!isConnected) {
        const connected = await checkSupabaseConnection()
        setIsConnected(connected)
        if (!connected) {
          throw new Error("Unable to connect to authentication service. Please check your internet connection.")
        }
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        const errorMessage = handleAuthError(error)
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      console.log("AuthProvider: Sign out successful")
      setSession(null)
      setUser(null)

      router.push("/")
    } catch (err: any) {
      const errorMessage = handleAuthError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    error,
    isConnected,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
