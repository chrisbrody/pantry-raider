"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Get environment variables with fallbacks for safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file or environment configuration.", {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
  })
}

// Create the Supabase client with proper configuration and error handling
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
  global: {
    fetch: (...args) => {
      return fetch(...args).catch((err) => {
        console.error("Supabase fetch error:", err)
        throw new Error(`Network request failed: ${err.message || "Check your internet connection"}`)
      })
    },
  },
})

// Export a function to get a fresh client instance when needed
export function getSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
    global: {
      fetch: (...args) => {
        return fetch(...args).catch((err) => {
          console.error("Supabase fetch error:", err)
          throw new Error(`Network request failed: ${err.message || "Check your internet connection"}`)
        })
      },
    },
  })
}

// Add a utility function to check if Supabase is reachable
export async function checkSupabaseConnection() {
  try {
    // Try to get the health status of the Supabase instance
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Supabase connection check failed:", error)
    return false
  }
}
