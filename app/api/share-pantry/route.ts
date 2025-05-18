import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function POST(request: Request) {
    try {
        console.log("API Route: /api/share-pantry received POST request")

        // Initialize Supabase client with server-side auth using cookies
        const supabase = createRouteHandlerClient<Database>({ cookies })

        // Get the current user's session
        console.log("API Route: Attempting to get session...")
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
            console.error("API Route: Error getting session:", sessionError)
            return NextResponse.json({ error: "Session error: " + sessionError.message }, { status: 500 })
        }

        console.log("API Route: Session result:", session ? "Session found" : "No session")

        if (!session) {
            console.warn("API Route: No session found, returning 401.")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.log("API Route: Session found for user:", session.user.id)

        // Parse request body
        const { pantry_id, email, role } = await request.json()

        if (!pantry_id || !email || !role) {
            console.warn("API Route: Missing required fields.", { pantry_id, email, role })
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Check if the user owns the pantry
        const { data: pantry, error: pantryError } = await supabase
            .from("pantries")
            .select("id, owner_id")
            .eq("id", pantry_id)
            .single()

        if (pantryError) {
            console.error("API Route: Error fetching pantry:", pantryError)
            return NextResponse.json({ error: "Error fetching pantry: " + pantryError.message }, { status: 500 })
        }

        if (!pantry || pantry.owner_id !== session.user.id) {
            console.warn("API Route: User not authorized to share this pantry.", {
                pantry_id,
                userId: session.user.id,
                ownerId: pantry?.owner_id,
            })
            return NextResponse.json({ error: "Not authorized to share this pantry" }, { status: 403 })
        }

        // Find the user by email using a direct query (or RPC if preferred)
        const { data: targetUser, error: userError } = await supabase.rpc("get_user_id_by_email", {
            email_param: email,
        })

        if (userError) {
            console.error("API Route: Error finding user by email:", userError)
            return NextResponse.json({ error: "Error finding user: " + userError.message }, { status: 500 })
        }

        if (!targetUser) {
            console.warn("API Route: Target user not found for email:", email)
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Add the user to pantry_members (upsert to handle existing members)
        const { error: insertError } = await supabase.from("pantry_members").upsert(
            {
                pantry_id,
                user_id: targetUser, // targetUser is the user_id from the RPC
                role,
            },
            {
                onConflict: "pantry_id,user_id", // Handle cases where the member already exists
            },
        )

        if (insertError) {
            console.error("API Route: Error inserting/upserting pantry member:", insertError)
            return NextResponse.json({ error: "Error adding member: " + insertError.message }, { status: 500 })
        }

        console.log("API Route: Pantry shared successfully.")
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("API Route: Caught error:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
