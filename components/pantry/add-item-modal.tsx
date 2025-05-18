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

// Pantry locations based on user's actual pantry
const PANTRY_LOCATIONS = [
  "Can Shelf",
  "Middle Shelf",
  "Baking Shelf",
  "Top Shelf",
  "Bottom Shelf",
  "Household Shelf",
  "Freezer",
  "To Stock Up",
]

// Categories based on user's pantry organization
const FOOD_CATEGORIES = [
  "Canned Goods",
  "Beans & Legumes",
  "Grains & Pasta",
  "Baking Supplies",
  "Snacks",
  "Condiments & Sauces",
  "Household Items",
  "Spices",
  "Dairy",
  "Bread & Bakery",
  "Beverages",
  "Pet Supplies",
  "Canning Supplies",
  "Other",
]

// Units based on user's pantry
const COMMON_UNITS = ["cans", "boxes", "lbs", "oz", "bags", "jars", "bottles", "packages", "rolls", "gallons"]

interface AddItemModalProps {
  pantryId: string
  pantryName: string
  isOpen: boolean
  onClose: () => void
  onItemAdded: () => void
}

export function AddItemModal({ pantryId, pantryName, isOpen, onClose, onItemAdded }: AddItemModalProps) {
  // Form state
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("")
  const [category, setCategory] = useState("")
  const [avgPrice, setAvgPrice] = useState("")
  const [location, setLocation] = useState("")

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setName("")
    setQuantity("")
    setUnit("")
    setCategory("")
    setAvgPrice("")
    setLocation("")
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      // Validate required fields
      if (!name.trim()) {
        throw new Error("Item name is required")
      }

      // Parse numeric values
      const parsedQuantity = quantity ? Number.parseFloat(quantity) : null
      const parsedAvgPrice = avgPrice ? Number.parseFloat(avgPrice.replace(/^\$/, "")) : null

      // Validate numeric values
      if (quantity && isNaN(parsedQuantity!)) {
        throw new Error("Quantity must be a valid number")
      }

      if (avgPrice && isNaN(parsedAvgPrice!)) {
        throw new Error("Price must be a valid number")
      }

      // Prepare item data - using exact column names from the database schema
      const itemData = {
        pantryid: pantryId, // Note: lowercase 'id' to match the schema
        name: name.trim(),
        quantity: parsedQuantity,
        unit: unit || null,
        category: category || null,
        avgprice: parsedAvgPrice, // Note: lowercase 'price' to match the schema
        location: location || null,
      }

      console.log("Inserting item with data:", itemData)

      // Insert into database
      const { error: insertError } = await supabase.from("pantry_items").insert([itemData])

      if (insertError) {
        console.error("Error adding item:", insertError)
        throw new Error(insertError.message || "Failed to add item")
      }

      console.log("Item added successfully")
      setSuccess(true)
      resetForm()

      // Notify parent component
      setTimeout(() => {
        onItemAdded()
        onClose()
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      console.error("Error in handleSubmit:", err)
      setError(err.message || "Failed to add item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Item to {pantryName}</DialogTitle>
          <DialogDescription>Add a new item to your pantry inventory</DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">Item added successfully!</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Item Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Black Beans"
                required
              />
            </div>

            {/* Quantity and Unit - Optional but grouped */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location - Based on user's pantry */}
            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {PANTRY_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category - Optional */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Average Price - Optional */}
            <div className="space-y-2">
              <Label htmlFor="avgPrice">Average Price</Label>
              <Input
                id="avgPrice"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="e.g., $0.89"
              />
            </div>

            <DialogFooter className="sm:justify-start">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Item"}
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
