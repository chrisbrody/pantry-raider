"use client"
import { supabase } from "@/lib/supabase"

export async function directSharePantry(pantryId: string, email: string, role: "view" | "edit") {
  // First, check if the pantry exists and the current user is the owner
  const { data: pantry, error: pantryError } = await supabase
    .from("pantries")
    .select("id, owner_id")
    .eq("id", pantryId)
    .single()

  if (pantryError) {
    throw new Error("Pantry not found or you don't have permission to share it")
  }

  // Use a server-side API route to handle the sharing
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
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to share pantry")
  }

  return await response.json()
}
