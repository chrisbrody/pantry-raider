"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Users, Trash2, Share2, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { SharePantryModal } from "@/components/pantry/share-pantry-modal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PantryItemsList } from "@/components/pantry/pantry-items-list"
import { AddItemModal } from "@/components/pantry/add-item-modal"

type PantryMember = {
    user_id: string
    email: string
    role: "view" | "edit"
}

export default function PantryPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { user, isLoading: isAuthLoading } = useAuth()

    // Component state
    const [pantry, setPantry] = useState<any>(null)
    const [members, setMembers] = useState<PantryMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // Use a ref to track if we've already fetched data to prevent infinite loops
    const dataFetchedRef = useRef(false)

    // Check authentication and redirect if needed
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/login")
        }
    }, [isAuthLoading, user, router])

    // Fetch pantry and member data
    useEffect(() => {
        // Skip if no user, still loading auth, or already fetched data
        if (!user || isAuthLoading || dataFetchedRef.current) return

        const fetchData = async () => {
            setIsLoading(true)

            try {
                // Fetch pantry details
                const { data: pantryData, error: pantryError } = await supabase
                    .from("pantries")
                    .select("*")
                    .eq("id", params.id)
                    .single()

                if (pantryError) {
                    console.error("Error fetching pantry:", pantryError)
                    setIsLoading(false)
                    return
                }

                // Determine if user is owner
                const isOwner = pantryData.owner_id === user.id

                // If not owner, check if user is a member
                let role = isOwner ? ("owner" as const) : undefined

                if (!isOwner) {
                    const { data: memberData, error: memberError } = await supabase
                        .from("pantry_members")
                        .select("role")
                        .eq("pantry_id", params.id)
                        .eq("user_id", user.id)
                        .single()

                    if (!memberError && memberData) {
                        role = memberData.role
                    } else if (memberError && memberError.code !== "PGRST116") {
                        console.error("Error checking membership:", memberError)
                    }
                }

                // Get member count
                const { count, error: countError } = await supabase
                    .from("pantry_members")
                    .select("*", { count: "exact", head: true })
                    .eq("pantry_id", params.id)

                if (countError) {
                    console.error("Error getting member count:", countError)
                }

                // Set pantry with additional properties
                setPantry({
                    ...pantryData,
                    isOwner,
                    role,
                    member_count: count || 0,
                })

                // Fetch members if user has access
                if (isOwner || role) {
                    const { data: membersData, error: membersError } = await supabase.rpc("get_pantry_members_with_emails", {
                        pantry_id_arg: params.id,
                    })

                    if (membersError) {
                        console.error("Error fetching members:", membersError)
                    } else {
                        setMembers(membersData || [])
                    }
                }
            } catch (error) {
                console.error("Error in data fetching:", error)
            } finally {
                setIsLoading(false)
                dataFetchedRef.current = true
            }
        }

        fetchData()
    }, [user, isAuthLoading, params.id])

    // Handle member refresh after sharing
    const handleMemberAdded = async () => {
        if (!user || !params.id) return

        try {
            // Only fetch members, not the whole pantry
            const { data, error } = await supabase.rpc("get_pantry_members_with_emails", { pantry_id_arg: params.id })

            if (error) {
                console.error("Error refreshing members:", error)
                return
            }

            setMembers(data || [])

            // Update member count in pantry object
            if (pantry) {
                setPantry((prev) => ({
                    ...prev,
                    member_count: data?.length || 0,
                }))
            }
        } catch (error) {
            console.error("Error in handleMemberAdded:", error)
        }
    }

    // Handle role change
    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from("pantry_members")
                .update({ role: newRole })
                .eq("pantry_id", params.id)
                .eq("user_id", userId)

            if (error) {
                console.error("Error updating role:", error)
                alert("Failed to update role")
                return
            }

            // Update local state
            setMembers((prev) =>
                prev.map((member) => (member.user_id === userId ? { ...member, role: newRole as "view" | "edit" } : member)),
            )
        } catch (error) {
            console.error("Error in handleRoleChange:", error)
            alert("Failed to update role")
        }
    }

    // Handle member deletion
    const handleDeleteMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) {
            return
        }

        try {
            const { error } = await supabase.from("pantry_members").delete().eq("pantry_id", params.id).eq("user_id", userId)

            if (error) {
                console.error("Error deleting member:", error)
                alert("Failed to remove member")
                return
            }

            // Update local state
            setMembers((prev) => prev.filter((member) => member.user_id !== userId))

            // Update member count
            if (pantry) {
                setPantry((prev) => ({
                    ...prev,
                    member_count: Math.max(0, (prev.member_count || 0) - 1),
                }))
            }
        } catch (error) {
            console.error("Error in handleDeleteMember:", error)
            alert("Failed to remove member")
        }
    }

    // Handle pantry deletion
    const handleDeletePantry = async () => {
        if (!pantry) return

        if (!confirm(`Are you sure you want to delete the pantry "${pantry.name}"? This action cannot be undone.`)) {
            return
        }

        setIsDeleting(true)
        setDeleteError(null)

        try {
            const { error } = await supabase.from("pantries").delete().eq("id", params.id).eq("owner_id", user?.id)

            if (error) {
                console.error("Error deleting pantry:", error)
                setDeleteError(error.message || "Failed to delete pantry")
                setIsDeleting(false)
                return
            }

            router.push("/dashboard")
        } catch (error: any) {
            console.error("Error in handleDeletePantry:", error)
            setDeleteError(error.message || "Failed to delete pantry")
            setIsDeleting(false)
        }
    }

    // Show loading state
    if (isAuthLoading || isLoading) {
        return (
            <div className="container py-8 mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-6 w-1/4" />

                    {/* Skeleton for Members Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <Skeleton className="h-8 w-1/4" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center py-4">
                                <div className="animate-pulse h-6 w-24 bg-muted rounded"></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skeleton for Items Card */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-1/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-32 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Show not found state
    if (!pantry) {
        return (
            <div className="container py-8 mx-auto">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>

                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-2">Pantry not found</h2>
                    <p className="text-muted-foreground mb-6">
                        The pantry you're looking for doesn't exist or you don't have access to it.
                    </p>
                    <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
                </div>
            </div>
        )
    }

    // Determine if the current user is the owner
    const isOwner = pantry.isOwner
    const canEdit = isOwner || pantry.role === "edit"

    return (
        <div className="container py-8 mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            {/* Display delete error if any */}
            {deleteError && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold">{pantry.name}</h1>
                {/* Group buttons together */}
                <div className="flex items-center gap-2">
                    {/* Add Item Button (conditional based on role/owner) */}
                    {canEdit && (
                        <Button onClick={() => setIsAddItemModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    )}
                    {/* Share Button (conditional based on owner) */}
                    {isOwner && (
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-1"
                        >
                            <Share2 className="h-4 w-4" />
                            {/* Conditional text based on members count */}
                            {members.length === 0 ? "+ Members" : "Share"}
                        </Button>
                    )}
                    {/* Delete Button (conditional based on owner) */}
                    {isOwner && (
                        <Button variant="destructive" size="default" onClick={handleDeletePantry} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete Pantry"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Members Section - Only render the card if there are members */}
            {members.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Pantry Members
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {members.map((member) => (
                                <div key={member.user_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <div>
                                        <p className="font-medium">{member.email}</p>
                                        {/* Display role as text if not owner or if it's the owner's own entry */}
                                        {!isOwner || member.user_id === user?.id ? (
                                            <p className="text-sm text-muted-foreground">{member.role === "edit" ? "Editor" : "Viewer"}</p>
                                        ) : null}
                                    </div>
                                    {/* Conditional UI for Owner - can manage others but not themselves */}
                                    {isOwner && member.user_id !== user?.id && (
                                        <div className="flex items-center gap-2">
                                            {/* Wrap dropdown and delete button */}
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                className="p-1 text-sm border rounded bg-background"
                                            >
                                                <option value="view">Viewer</option>
                                                <option value="edit">Editor</option>
                                            </select>
                                            {/* Delete Button */}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteMember(member.user_id)}
                                                className="h-8 w-8"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pantry Items List */}
            <PantryItemsList pantryId={pantry.id} pantryName={pantry.name} isOwner={isOwner} canEdit={canEdit} />

            {/* Share Modal */}
            {pantry && isOwner && (
                <SharePantryModal
                    pantryId={pantry.id}
                    pantryName={pantry.name}
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    onMemberAdded={handleMemberAdded}
                />
            )}

            {/* Add Item Modal */}
            <AddItemModal
                pantryId={pantry.id}
                pantryName={pantry.name}
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                onItemAdded={() => {
                    // This will trigger a refresh of the items list
                    setIsAddItemModalOpen(false)
                }}
            />
        </div>
    )
}
