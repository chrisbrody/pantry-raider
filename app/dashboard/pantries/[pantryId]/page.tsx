// app/dashboard/pantries/[pantryId]/page.tsx

import { createClient as createServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

interface PantryPageProps {
    params: Promise<{
        pantryId: string;
    }>;
}

export default async function PantryPage({ params }: PantryPageProps) {
    const resolvedParams = await params;
    const pantryId = resolvedParams.pantryId;

    console.log('Params object AFTER AWAIT:', resolvedParams);
    console.log('Params.pantryId AFTER AWAIT:', pantryId);

    // Basic check if pantryId is missing
    if (!pantryId) {
        console.error("Pantry ID is missing from params. Cannot fetch pantry.");
        // Redirect or throw an error, as we can't proceed without the ID
        redirect('/dashboard?message=Invalid Pantry ID');
    }


    const supabase = await createServerClient();
    const { data: user } = await supabase.auth.getUser(); // Get current user

    if (!user) {
        // Should be caught by middleware/auth-guard, but good fallback
        redirect('/sign-in');
    }

    // --- Access Control Check ---
    // Check if the logged-in user is a member of this pantry
    // This query requires pantryId to be a valid UUID string
    const { data: pantryUser, error: pantryUserError } = await supabase
        .from('pantryusers') // Query lowercase pantryusers
        .select('role, can_edit')
        .eq('pantry_id', pantryId) // Use the correctly obtained pantryId
        .eq('user_id', user.user.id) // Check against current user ID
        .single(); // Expecting zero or one result

    if (!pantryUser) {
        console.error("Error fetching pantry user:", pantryUser);
        // Redirect to dashboard or an access denied page
        redirect('/dashboard?message=Access Denied');
    }

    if (pantryUserError) {
        // If there's an error or the user is not found in PantryUsers for this pantry,
        // they are not a member. Redirect them.
        console.error("Access denied: ", pantryUserError);
        // Redirect to dashboard or an access denied page
        redirect('/dashboard?message=Access Denied');
    }

    // User is a member, fetch pantry details
    const { data: pantry, error: pantryError } = await supabase
        .from('pantries') // Query lowercase pantries
        .select('*')
        .eq('id', pantryId) // Use the correctly obtained pantryId
        .single(); // Expecting one result

    // --- Fetch Items and Members here if needed ---
    // const { data: items, error: itemsError } = await supabase
    //     .from('pantryitems') // Query lowercase pantryitems
    //     .select('*')
    //     .eq('"pantryId"', pantryId) // Use quoted column name if applicable, and the correct pantryId
    //     .order('createdAt', { ascending: true });

    // const { data: members, error: membersError } = await supabase
    //     .from('pantryusers') // Query lowercase pantryusers
    //     .select('*, auth_users:user_id(email)') // Join auth.users for email
    //     .eq('pantry_id', pantryId); // Use the correct pantryId


    if (pantryError) { // Add itemsError || membersError if fetching them
        console.error("Error fetching pantry details:", pantryError);
        return (
            <div className="flex-1 w-full flex flex-col gap-12">
                <p className="text-red-500">Error loading pantry details.</p>
            </div>
        );
    }

    if (!pantry) {
        // Pantry not found (even though user was a member? Should not happen with RLS)
        redirect('/dashboard?message=Pantry not found');
    }

    // Determine user's permissions for this pantry
    const isOwner = pantryUser.role === 'owner';
    const canEdit = pantryUser.can_edit;

    return (
        <div className="flex-1 w-full flex flex-col gap-12">
            {/* Pantry Details */}
            <div className="flex flex-col gap-2 items-start">
                <h2 className="font-bold text-3xl mb-2">{pantry.name}</h2>
                {pantry.description && <p className="text-lg text-gray-600">{pantry.description}</p>}
                <p className="text-sm text-gray-500">Pantry ID: {pantry.id}</p>
                <p className="text-sm text-gray-500">Your Role: {pantryUser.role}</p>
            </div>

            {/* --- Render Items List Here --- */}
            {/* --- Render Add New Item Form Here (if canEdit) --- */}
            {/* --- Render Manage Members Section Here --- */}

        </div>
    );
}