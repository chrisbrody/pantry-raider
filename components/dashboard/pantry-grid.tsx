"use client"

import { PantryCard } from "@/components/pantry/pantry-card"
import type { Database } from "@/types/supabase"
import { EmptyState } from "@/components/ui/empty-state"
import { ShoppingBasket } from "lucide-react"

type Pantry = Database["public"]["Tables"]["pantries"]["Row"]
type PantryWithRole = Pantry & { role?: "owner" | "view" | "edit" }

interface PantryGridProps {
  pantries: PantryWithRole[]
  isOwned: boolean
  emptyMessage: string
}

export function PantryGrid({ pantries, isOwned, emptyMessage }: PantryGridProps) {
  if (pantries.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasket className="h-12 w-12 text-muted-foreground" />}
        title="No pantries found"
        description={emptyMessage}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pantries.map((pantry) => (
        <PantryCard key={pantry.id} pantry={pantry} isOwner={isOwned} />
      ))}
    </div>
  )
}
