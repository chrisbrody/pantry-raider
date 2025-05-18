"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePantries } from "@/hooks/use-pantries"
import { PantryGrid } from "@/components/dashboard/pantry-grid"
import { CreatePantryDialog } from "@/components/dashboard/create-pantry-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth()
    const { ownedPantries, sharedPantries, isLoading: isPantriesLoading } = usePantries()
    const router = useRouter()
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/login")
        }
    }, [isAuthLoading, user, router])
    if (isAuthLoading || !user) {
        return <DashboardSkeleton />
    }
    return (
        <div className="container py-8 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your pantries and shared pantries</p>
                </div>
                <CreatePantryDialog />
            </div>
            <Tabs defaultValue="my-pantries" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="my-pantries">My Pantries ({ownedPantries.length})</TabsTrigger>
                    <TabsTrigger value="shared-pantries">Shared with me ({sharedPantries.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="my-pantries" className="space-y-4">
                    {isPantriesLoading ? (
                        <PantriesLoadingSkeleton />
                    ) : (
                        <PantryGrid
                            pantries={ownedPantries}
                            isOwned={true}
                            emptyMessage="You don't have any pantries yet. Create your first pantry to get started."
                        />
                    )}
                </TabsContent>

                <TabsContent value="shared-pantries" className="space-y-4">
                    {isPantriesLoading ? (
                        <PantriesLoadingSkeleton />
                    ) : (
                        <PantryGrid
                            pantries={sharedPantries}
                            isOwned={false}
                            emptyMessage="No pantries have been shared with you yet."
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
function DashboardSkeleton() {
    return (
        <div className="container py-8 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
        </div>
    )
}
function PantriesLoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
            ))}
        </div>
    )
}
