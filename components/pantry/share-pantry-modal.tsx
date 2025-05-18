"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SharePantryModalProps {
  pantryId: string
  pantryName: string
  isOpen: boolean
  onClose: () => void
  onMemberAdded?: () => void
}

export function SharePantryModal({ pantryId, pantryName, isOpen, onClose, onMemberAdded }: SharePantryModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"view" | "edit">("view")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      console.log(`SharePantryModal: Attempting to share pantry ${pantryId} with ${email}`)

      // Try direct database operations
      // First, check if the pantry exists
      const { data: pantry, error: pantryError } = await supabase
        .from("pantries")
        .select("id, owner_id")
        .eq("id", pantryId)
        .single()

      if (pantryError) {
        console.error("Error checking pantry:", pantryError)
        throw new Error("Failed to verify pantry")
      }

      // Find the user by email
      const { data: targetUser, error: userError } = await supabase.rpc("get_user_id_by_email", { email_param: email })

      if (userError || !targetUser) {
        console.error("Error finding user:", userError)
        throw new Error(`No user found with email ${email}`)
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
        throw new Error("Failed to add member")
      }

      console.log("SharePantryModal: Share successful")
      setSuccess(true)
      setEmail("")
      setRole("view")

      // Call the onMemberAdded callback if provided
      if (onMemberAdded) {
        console.log("SharePantryModal: Calling onMemberAdded callback")
        setTimeout(() => {
          onMemberAdded()
        }, 0)
      }

      // Close the modal after a short delay
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      console.error("SharePantryModal: Share pantry error:", err)

      // Display a more user-friendly error message
      let userMessage = "Failed to share pantry. Please try again."

      if (err.message.includes("No user found")) {
        userMessage = `No user found with email ${email}. Make sure they have signed up for an account.`
      } else if (err.message.includes("permission") || err.message.includes("authorized")) {
        userMessage = "You don't have permission to share this pantry."
      } else if (err.message.includes("session")) {
        userMessage = "Your session has expired. Please refresh the page and try again."
      }

      setError(userMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Pantry</DialogTitle>
          <DialogDescription>Share "{pantryName}" with another user by email</DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">Pantry shared successfully!</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Permission</Label>
              <Select value={role} onValueChange={(value: "view" | "edit") => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="sm:justify-start">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sharing..." : "Share pantry"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
