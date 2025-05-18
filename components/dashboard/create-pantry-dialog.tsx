"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CreatePantryForm } from "@/components/pantry/create-pantry-form"
import { Plus } from "lucide-react"

export function CreatePantryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Pantry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new pantry</DialogTitle>
          <DialogDescription>Give your pantry a name to get started</DialogDescription>
        </DialogHeader>
        <CreatePantryForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
