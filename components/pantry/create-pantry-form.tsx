"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePantries } from "@/hooks/use-pantries"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function CreatePantryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { createPantry } = usePantries()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await createPantry(name)
      setName("")
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Failed to create pantry")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="pantry-name">Pantry Name</Label>
        <Input
          id="pantry-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Kitchen Pantry"
          required
        />
      </div>
      <Button type="submit" disabled={isLoading || !name.trim()}>
        {isLoading ? "Creating..." : "Create Pantry"}
      </Button>
    </form>
  )
}
