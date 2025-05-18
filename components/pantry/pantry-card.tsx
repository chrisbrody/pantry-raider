"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/supabase"
import { SharePantryModal } from "@/components/pantry/share-pantry-modal"
import { CalendarDays, Share2, Users } from "lucide-react"

type Pantry = Database["public"]["Tables"]["pantries"]["Row"]
type PantryWithRole = Pantry & {
  role?: "owner" | "view" | "edit"
  member_count?: number
}

interface PantryCardProps {
  pantry: PantryWithRole
  isOwner: boolean
}

export function PantryCard({ pantry, isOwner }: PantryCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const router = useRouter()

  const formattedDate = new Date(pantry.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const handleCardClick = () => {
    router.push(`/pantry/${pantry.id}`)
  }

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={handleCardClick}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="truncate">{pantry.name}</span>
            {!isOwner && (
              <span className="text-xs font-normal px-2 py-1 bg-muted rounded-full">
                {pantry.role === "edit" ? "Editor" : "Viewer"}
              </span>
            )}
          </CardTitle>
          <CardDescription className="space-y-1">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>Created {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {pantry.member_count || 0} member{pantry.member_count !== 1 ? "s" : ""}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">{/* Pantry content would go here */}</CardContent>
        <CardFooter className="pt-2">
          <div className="flex w-full justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pantry/${pantry.id}`}>View Pantry</Link>
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation() // Prevent the card click
                  setIsShareModalOpen(true)
                }}
                className="flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {isOwner && (
        <SharePantryModal
          pantryId={pantry.id}
          pantryName={pantry.name}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  )
}
