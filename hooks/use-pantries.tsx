"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type Pantry = Database["public"]["Tables"]["pantries"]["Row"]
type PantryWithRole = Pantry & {
  role?: "owner" | "view" | "edit"
  member_count?: number
}

export function usePantries() {
  const { user, session } = useAuth()
  const [ownedPantries, setOwnedPantries] = useState<PantryWithRole[]>([])
  const [sharedPantries, setSharedPantries] = useState<PantryWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setOwnedPantries([])
      setSharedPantries([])
      setIsLoading(false)
      return
    }

    const fetchPantries = async () => {
      setIsLoading(true)

      // Fetch owned pantries with member counts
      const { data: owned, error: ownedError } = await supabase
        .from("pantries")
        .select(`
          *,
          member_count:pantry_members(count)
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (ownedError) {
        console.error("Error fetching owned pantries:", ownedError)
      } else {
        // Format pantries with member counts
        const formattedOwnedPantries =
          owned?.map((pantry) => {
            // Extract and format the member count from the aggregation
            const memberCount = pantry.member_count?.[0]?.count || 0

            return {
              ...pantry,
              role: "owner" as const,
              member_count: memberCount,
            }
          }) || []

        setOwnedPantries(formattedOwnedPantries)
      }

      // Fetch shared pantries
      const { data: members, error: membersError } = await supabase
        .from("pantry_members")
        .select("pantry_id, role")
        .eq("user_id", user.id)

      if (membersError) {
        console.error("Error fetching pantry memberships:", membersError)
      } else if (members && members.length > 0) {
        const pantryIds = members.map((m) => m.pantry_id)

        const { data: shared, error: sharedError } = await supabase
          .from("pantries")
          .select(`
            *,
            member_count:pantry_members(count)
          `)
          .in("id", pantryIds)
          .order("created_at", { ascending: false })

        if (sharedError) {
          console.error("Error fetching shared pantries:", sharedError)
        } else if (shared) {
          // Combine pantry data with role information and member counts
          const sharedWithRoles = shared.map((pantry) => {
            const membership = members.find((m) => m.pantry_id === pantry.id)
            const memberCount = pantry.member_count?.[0]?.count || 0

            return {
              ...pantry,
              role: membership?.role,
              member_count: memberCount,
            }
          })

          setSharedPantries(sharedWithRoles)
        }
      } else {
        setSharedPantries([])
      }

      setIsLoading(false)
    }

    fetchPantries()
  }, [user])

  const createPantry = async (name: string) => {
    if (!user) return null

    const { data, error } = await supabase
      .from("pantries")
      .insert([{ name, owner_id: user.id }])
      .select()
      .single()

    if (error) {
      console.error("Error creating pantry:", error)
      throw error
    }

    // Add member_count property with initial value 0
    const newPantry = {
      ...data,
      role: "owner" as const,
      member_count: 0,
    }

    // Update the owned pantries state with the new pantry at the beginning
    setOwnedPantries((prev) => [newPantry, ...prev])
    return newPantry
  }

  const sharePantry = async (pantryId: string, email: string, role: "view" | "edit") => {
    console.log(`Attempting to share pantry ${pantryId} with ${email} as ${role}`)

    // Try multiple approaches to share the pantry
    const errors = []

    // Approach 1: Try direct database operations first
    try {
      console.log("Approach 1: Using direct database operations")

      // First, check if the pantry exists and the current user is the owner
      const { data: pantry, error: pantryError } = await supabase
        .from("pantries")
        .select("id, owner_id")
        .eq("id", pantryId)
        .single()

      if (pantryError) {
        console.error("Error checking pantry ownership:", pantryError)
        errors.push(`Approach 1 failed: ${pantryError.message}`)
        throw new Error("Failed to verify pantry ownership")
      }

      if (pantry.owner_id !== user?.id) {
        errors.push("Approach 1 failed: Not the pantry owner")
        throw new Error("You don't have permission to share this pantry")
      }

      // Find the user by email
      const { data: targetUser, error: userError } = await supabase.rpc("get_user_id_by_email", { email_param: email })

      if (userError || !targetUser) {
        console.error("Error finding user by email:", userError)
        errors.push(`Approach 1 failed: ${userError?.message || "User not found"}`)
        throw new Error("User not found")
      }

      // Add the user to pantry_members
      const { error: insertError } = await supabase.from("pantry_members").upsert(
        {
          pantry_id: pantryId,
          user_id: targetUser,
          role,
        },
        {
          onConflict: "pantry_id,user_id",
        },
      )

      if (insertError) {
        console.error("Error adding member:", insertError)
        errors.push(`Approach 1 failed: ${insertError.message}`)
        throw new Error("Failed to add member")
      }

      console.log("Approach 1 succeeded: Member added successfully")

      // Update the member count after successful sharing
      setOwnedPantries((prev) =>
        prev.map((pantry) =>
          pantry.id === pantryId ? { ...pantry, member_count: (pantry.member_count || 0) + 1 } : pantry,
        ),
      )

      return { success: true }
    } catch (error1) {
      console.error("Approach 1 failed:", error1)

      // Approach 2: Try using the Supabase Edge Function
      try {
        console.log("Approach 2: Using Supabase Edge Function")

        // Get a fresh session token
        const {
          data: { session: freshSession },
        } = await supabase.auth.getSession()

        if (!freshSession) {
          errors.push("Approach 2 failed: No active session")
          throw new Error("No active session")
        }

        // Use the edge function with the fresh session token
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/share-pantry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshSession.access_token}`,
          },
          body: JSON.stringify({
            pantry_id: pantryId,
            email,
            role,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          errors.push(`Approach 2 failed: ${errorData.error || response.status}`)
          throw new Error(errorData.error || `Failed to share pantry: ${response.status}`)
        }

        console.log("Approach 2 succeeded: Edge function call successful")

        // Update the member count after successful sharing
        setOwnedPantries((prev) =>
          prev.map((pantry) =>
            pantry.id === pantryId ? { ...pantry, member_count: (pantry.member_count || 0) + 1 } : pantry,
          ),
        )

        return await response.json()
      } catch (error2) {
        console.error("Approach 2 failed:", error2)

        // Approach 3: Try using the local API route
        try {
          console.log("Approach 3: Using local API route")

          const response = await fetch("/api/share-pantry", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pantry_id: pantryId,
              email,
              role,
            }),
            credentials: "include",
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
            errors.push(`Approach 3 failed: ${errorData.error || response.status}`)
            throw new Error(errorData.error || `Failed to share pantry: ${response.status}`)
          }

          console.log("Approach 3 succeeded: API route call successful")

          // Update the member count after successful sharing
          setOwnedPantries((prev) =>
            prev.map((pantry) =>
              pantry.id === pantryId ? { ...pantry, member_count: (pantry.member_count || 0) + 1 } : pantry,
            ),
          )

          return await response.json()
        } catch (error3) {
          console.error("Approach 3 failed:", error3)

          // All approaches failed, throw a comprehensive error
          const errorMessage = `Failed to share pantry after multiple attempts. Details: ${errors.join("; ")}`
          console.error(errorMessage)
          throw new Error(errorMessage)
        }
      }
    }
  }

  const getPantryById = async (pantryId: string) => {
    // First, check if it's in our owned pantries
    const ownedPantry = ownedPantries.find((p) => p.id === pantryId)
    if (ownedPantry) return { ...ownedPantry, isOwner: true }

    // Then check shared pantries
    const sharedPantry = sharedPantries.find((p) => p.id === pantryId)
    if (sharedPantry) return { ...sharedPantry, isOwner: false }

    // If not found in state, fetch it from the database
    const { data: pantry, error } = await supabase
      .from("pantries")
      .select(`
        *,
        member_count:pantry_members(count)
      `)
      .eq("id", pantryId)
      .single()

    if (error) {
      throw error
    }

    if (!pantry) {
      throw new Error("Pantry not found")
    }

    // Check if the current user is the owner
    const isOwner = pantry.owner_id === user?.id

    // If not the owner, check if the user is a member
    let role: "owner" | "view" | "edit" | undefined

    if (isOwner) {
      role = "owner"
    } else {
      const { data: membership } = await supabase
        .from("pantry_members")
        .select("role")
        .eq("pantry_id", pantryId)
        .eq("user_id", user?.id)
        .single()

      role = membership?.role
    }

    return {
      ...pantry,
      isOwner,
      role,
      member_count: pantry.member_count?.[0]?.count || 0,
    }
  }

  const getPantryMembers = async (pantryId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_pantry_members_with_emails", { pantry_id_arg: pantryId })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error fetching pantry members:", error)
      throw error
    }
  }

  const updateMemberRole = async (pantryId: string, userId: string, newRole: "view" | "edit") => {
    try {
      const { error } = await supabase
        .from("pantry_members")
        .update({ role: newRole })
        .eq("pantry_id", pantryId)
        .eq("user_id", userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Error updating member role:", error)
      throw error
    }
  }

  const deletePantryMember = async (pantryId: string, userId: string) => {
    try {
      const { error } = await supabase.from("pantry_members").delete().eq("pantry_id", pantryId).eq("user_id", userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Error deleting pantry member:", error)
      throw error
    }
  }

  const deletePantry = async (pantryId: string) => {
    try {
      const { error } = await supabase.from("pantries").delete().eq("id", pantryId).eq("owner_id", user?.id) // Ensure only the owner can delete

      if (error) throw error

      // Update the owned pantries state
      setOwnedPantries((prev) => prev.filter((p) => p.id !== pantryId))

      return true
    } catch (error) {
      console.error("Error deleting pantry:", error)
      throw error
    }
  }

  return {
    ownedPantries,
    sharedPantries,
    isLoading,
    createPantry,
    sharePantry,
    getPantryById,
    getPantryMembers,
    updateMemberRole,
    deletePantryMember,
    deletePantry,
  }
}
