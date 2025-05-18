"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Utensils, Plus, Pencil, Trash2, Filter, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AddItemModal } from "./add-item-modal"
import { formatCurrency } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface PantryItemsListProps {
  pantryId: string
  pantryName: string
  isOwner: boolean
  canEdit: boolean
}

export function PantryItemsList({ pantryId, pantryName, isOwner, canEdit }: PantryItemsListProps) {
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  // Fetch pantry items
  const fetchItems = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.from("pantry_items").select("*").eq("pantryid", pantryId).order("name")

      if (error) {
        console.error("Error fetching pantry items:", error)
        setError("Failed to load pantry items")
        return
      }

      setItems(data || [])

      // Extract unique categories and locations
      const uniqueCategories = Array.from(new Set(data?.map((item) => item.category).filter(Boolean))) as string[]
      const uniqueLocations = Array.from(new Set(data?.map((item) => item.location).filter(Boolean))) as string[]

      setCategories(uniqueCategories)
      setLocations(uniqueLocations)
    } catch (err) {
      console.error("Error in fetchItems:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (pantryId) {
      fetchItems()
    }
  }, [pantryId])

  // Handle item deletion
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return
    }

    try {
      const { error } = await supabase.from("pantry_items").delete().eq("id", itemId)

      if (error) {
        console.error("Error deleting item:", error)
        return
      }

      // Update local state
      setItems(items.filter((item) => item.id !== itemId))
    } catch (err) {
      console.error("Error in handleDeleteItem:", err)
    }
  }

  // Filter items based on search query, location, and category
  const filteredItems = items.filter((item) => {
    const matchesSearch = searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    const matchesLocation = selectedLocation ? item.location === selectedLocation : true
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true

    return matchesSearch && matchesLocation && matchesCategory
  })

  // Group items by location for the location-based view
  const itemsByLocation = PANTRY_LOCATIONS.map((location) => {
    return {
      location,
      items: items.filter((item) => item.location === location),
    }
  }).filter((group) => group.items.length > 0)

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedLocation(null)
    setSelectedCategory(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Pantry Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Pantry Items</span>
            {(isOwner || canEdit) && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {items.length > 0 ? (
            <>
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                  <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>

                {locations.length > 0 && (
                  <select
                    value={selectedLocation || ""}
                    onChange={(e) => setSelectedLocation(e.target.value || null)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">All Locations</option>
                    {PANTRY_LOCATIONS.filter((loc) => locations.includes(loc)).map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                )}

                {categories.length > 0 && (
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                )}

                {(searchQuery || selectedLocation || selectedCategory) && (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>

              <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="location">Location View</TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  {filteredItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            {(isOwner || canEdit) && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.quantity !== null && `${item.quantity} ${item.unit || ""}`}</TableCell>
                              <TableCell>{item.location || "-"}</TableCell>
                              <TableCell>{item.category || "-"}</TableCell>
                              <TableCell>{item.avgprice !== null ? formatCurrency(item.avgprice) : "-"}</TableCell>
                              {(isOwner || canEdit) && (
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No items match your filters</p>
                      <Button variant="link" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="location">
                  {itemsByLocation.length > 0 ? (
                    <div className="space-y-6">
                      {itemsByLocation.map((group) => (
                        <div key={group.location} className="border rounded-lg p-4">
                          <h3 className="text-lg font-medium mb-3">{group.location}</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Price</TableHead>
                                  {(isOwner || canEdit) && <TableHead>Actions</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.items
                                  .filter((item) => {
                                    const matchesSearch = searchQuery
                                      ? item.name.toLowerCase().includes(searchQuery.toLowerCase())
                                      : true
                                    const matchesCategory = selectedCategory ? item.category === selectedCategory : true
                                    return matchesSearch && matchesCategory
                                  })
                                  .map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">{item.name}</TableCell>
                                      <TableCell>
                                        {item.quantity !== null && `${item.quantity} ${item.unit || ""}`}
                                      </TableCell>
                                      <TableCell>
                                        {item.avgprice !== null ? formatCurrency(item.avgprice) : "-"}
                                      </TableCell>
                                      {(isOwner || canEdit) && (
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-destructive"
                                              onClick={() => handleDeleteItem(item.id)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No items match your filters</p>
                      <Button variant="link" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <EmptyState
              icon={<Utensils className="h-8 w-8 text-muted-foreground" />}
              title="No items yet"
              description={
                isOwner || canEdit
                  ? "Add your first item to start tracking your pantry inventory."
                  : "This pantry doesn't have any items yet."
              }
              action={
                (isOwner || canEdit) && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                )
              }
              className="border-none"
            />
          )}
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      <AddItemModal
        pantryId={pantryId}
        pantryName={pantryName}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={fetchItems}
      />
    </>
  )
}
