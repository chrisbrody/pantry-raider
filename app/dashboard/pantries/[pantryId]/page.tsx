// app/dashboard/pantries/[pantryId]/page.tsx

import { createClient as createServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ManagePantryMembers from "@/components/manage-pantry-members";

interface PantryPageProps {
    params: Promise<{
        pantryId: string;
    }>;
}

export default async function PantryPage({ params }: PantryPageProps) {
    const resolvedParams = await params;
    const pantryId = resolvedParams.pantryId;

    if (!pantryId) {
        console.error("Pantry ID is missing from params AFTER AWAIT. Cannot fetch pantry.");
        redirect('/dashboard?message=Invalid Pantry ID');
    }

    const supabase = await createServerClient();
    const { data: userData, error: getUserError } = await supabase.auth.getUser();
    const user = userData?.user; // This 'user' variable holds the actual User object or null

    if (getUserError) {
        console.error("Error fetching user in PantryPage:", getUserError);
        redirect('/error?message=Failed to fetch user');
    }

    // Check if user is null OR if user is an object but user.id is missing
    if (!user || !user.id) {
        console.warn("User or User ID is missing after getUser() in PantryPage. Redirecting to sign-in.");
        redirect('/sign-in');
    }

    // Now we are confident user is a User object and user.id is valid
    const userId = user.id; // Assign to a variable for clarity if desired

    // --- Access Control Check ---
    // Check if the logged-in user is a member of this pantry
    const { data: pantryUser, error: pantryUserError } = await supabase
        .from('pantryusers') // Query lowercase pantryusers
        .select('role, can_edit')
        .eq('pantry_id', pantryId) // Use the correctly obtained pantryId
        .eq('user_id', userId) // --- FIX: Use user.id (or userId variable) here ---
        .single();

    if (pantryUserError) {
        console.error("Error fetching pantry user:", pantryUserError);
        redirect('/dashboard?message=Error checking membership');
    }

    if (!pantryUser) {
        console.warn(`Access denied: User ${userId} is not a member of pantry ${pantryId}.`);
        redirect('/dashboard?message=Access Denied');
    }

    // If we reach here, pantryUser is not null, meaning the user is a member
    console.log(`Access granted: User ${userId} is a member of pantry ${pantryId} with role ${pantryUser.role}.`);


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

    // --- Fetch Members here to pass as initial data (Optional but good for performance) ---
    // const { data: members, error: membersError } = await supabase
    //     .from('pantryusers')
    //     .select('*, auth_users:user_id(email)') // Join auth.users for email
    //     .eq('pantry_id', pantryId); // Filter by the current pantry ID


    if (pantryError) { // Add itemsError || membersError if fetching them
        console.error("Error fetching pantry details:", pantryError);
        return (
            <div className="flex-1 w-full flex flex-col gap-12">
                <p className="text-red-500">Error loading pantry details.</p>
            </div>
        );
    }

    if (!pantry) {
        console.error(`Pantry ${pantryId} not found despite user ${userId} being a member.`);
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
            <div className="w-full mt-8">
                <ManagePantryMembers
                    pantryId={pantryId}
                    isOwner={isOwner}
                    // Pass initial members if you fetched them above
                    // initialMembers={members || []}
                />
            </div>

        </div>
    );
}