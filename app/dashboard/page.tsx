// app/dashboard/page.tsx
import { protectRoute } from "@/utils/auth-guard";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CreatePantryForm from "@/components/create-pantry-form";
import Link from "next/link"; // Import Link

// Assuming you have generated types, otherwise remove <Database> and use 'any' or define types manually
// import { Database } from '@/types/supabase';
// type Pantry = Database['public']['Tables']['pantries']['Row'];
// type PantryUser = Database['public']['Tables']['pantryusers']['Row'];

// --- Define the expected type for the data returned by the query ---
interface PantryUserWithPantry {
    pantry_id: string; // From pantryusers
    role: string;      // From pantryusers
    can_edit: boolean; // From pantryusers
    pantry: {          // Nested object from the joined 'pantries' table (aliased as 'pantry')
        id: string; // From pantries
        name: string; // From pantries
        description: string | null; // From pantries
        created_at: string; // From pantries (or Date, depending on fetch options)
        user_id: string; // From pantries (the creator's ID)
        // Add any other columns from the 'pantries' table you select with '*'
    } | null; // The joined 'pantry' object could theoretically be null if the join fails
}
// --- End Type Definition ---


export default async function ProtectedPage() {
    const user = await protectRoute(); // User is guaranteed to be logged in here

    const supabase = await createServerClient();

    // Fetch all pantries the user is a member of by querying pantryusers and joining pantries
    const { data, error } = await supabase // Fetch data into a generic 'data' variable first
        .from('pantryusers') // Query the pantryusers table (lowercase)
        .select('pantry_id, role, can_edit, pantry:pantry_id(*)') // Select fields from pantryusers and join related pantry data (lowercase)
        .eq('user_id', user.id); // Filter by the logged-in user's ID

    if (error) {
        console.error("Error fetching pantries:", error);
        return (
            <div className="flex-1 w-full flex flex-col gap-12">
                <p className="text-red-500">Error loading pantries: {error.message}</p>
            </div>
        );
    }

    // --- Explicitly type the data variable ---
    const pantryUsers: PantryUserWithPantry[] | null = data;
    // --- End Type Application ---


    // Check if the user has any pantry memberships
    const hasPantries = pantryUsers && pantryUsers.length > 0;

    return (
        <div className="flex-1 w-full flex flex-col gap-12">
            {/* Optional: Display user details */}
            {/*
            <div className="flex flex-col gap-2 items-start">
                <h2 className="font-bold text-2xl mb-4">Your user details</h2>
                <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>
            */}

            <div className="w-full">
                {hasPantries ? (
                    // --- Render if user HAS pantry memberships ---
                    <div>
                        <h2 className="font-bold text-2xl mb-4">Your Pantries</h2>
                        <ul>
                            {/* Map over pantryUsers entries */}
                            {pantryUsers.map((pantryUser) => (
                                // Use Link to make the list item clickable
                                <li key={pantryUser.pantry_id} className="border p-3 mb-2 rounded hover:bg-gray-100 cursor-pointer">
                                    {/* Link to the specific pantry page */}
                                    <Link href={`/dashboard/pantries/${pantryUser.pantry_id}`} className="block no-underline text-inherit">
                                        {/* Access pantry details from the nested 'pantry' object */}
                                        {/* TypeScript now knows pantryUser has a 'pantry' property */}
                                        <h3 className="font-semibold">{pantryUser.pantry?.name || 'Unnamed Pantry'}</h3>
                                        {pantryUser.pantry?.description && <p className="text-sm text-gray-600">{pantryUser.pantry.description}</p>}
                                        {/* Optionally display the user's role */}
                                        <p className="text-xs text-gray-500">Your role: {pantryUser.role}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {/* Add a section to create another pantry */}
                        <div className="mt-8 border-t pt-8"> {/* Added border-t and pt-8 for separation */}
                            <h3 className="font-bold text-xl mb-4">Create a New Pantry</h3>
                            {/* Render the form component */}
                            <CreatePantryForm userId={user.id} />
                        </div>
                    </div>
                ) : (
                    // --- Render if user DOES NOT HAVE any pantry memberships ---
                    <div className="flex flex-col items-center justify-center gap-6 p-8 border rounded-lg text-center">
                        <h2 className="font-bold text-2xl">Welcome! Let's create your first pantry.</h2>
                        <p className="text-lg text-gray-600">It looks like you don't belong to any pantries yet. Get started by creating one.</p>
                        {/* Render the form component */}
                        <CreatePantryForm userId={user.id} />
                    </div>
                )}
            </div>
        </div>
    );
}