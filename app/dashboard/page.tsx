// app/dashboard/page.tsx
import { protectRoute } from "@/utils/auth-guard";
import { createClient as createServerClient } from "@/utils/supabase/server"; // Import server client
import { redirect } from "next/navigation"; // Import redirect for potential errors
import CreatePantryForm from "@/components/create-pantry-form"; // We'll create this next

// Assuming you have generated types, otherwise remove <Database>
// import { Database } from '@/types/supabase';

export default async function ProtectedPage() {
    // protectRoute already redirects if no user, so user is guaranteed here
    const user = await protectRoute();

    // Create a server-side Supabase client
    const supabase = await createServerClient(); // Use your server client utility

    // Fetch pantries for the logged-in user
    const { data: pantries, error } = await supabase
        .from('pantries') // Replace 'Pantries' with your actual table name if different
        .select('*')
        .eq('user_id', user.id); // Filter by the logged-in user's ID

    if (error) {
        console.error("Error fetching pantries:", error);
        // Handle the error, maybe redirect to an error page or show a message
        // For simplicity, let's just show an error message for now
        return (
            <div className="flex-1 w-full flex flex-col gap-12">
                <p className="text-red-500">Error loading pantries: {error.message}</p>
            </div>
        );
    }

    // Check if the user has any pantries
    const hasPantries = pantries && pantries.length > 0;

    return (
        <div className="flex-1 w-full flex flex-col gap-12">
            <div className="flex flex-col gap-2 items-start">
                <h2 className="font-bold text-2xl mb-4">Your user details</h2>
                <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                  {/* Display user details as before */}
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>

            <div className="w-full">
                {hasPantries ? (
                    // --- Render if user HAS pantries ---
                    <div>
                        <h2 className="font-bold text-2xl mb-4">Your Pantries</h2>
                        {/* You would list the pantries here */}
                        <ul>
                            {pantries.map((pantry) => (
                                <li key={pantry.id} className="border p-3 mb-2 rounded">
                                    <h3 className="font-semibold">{pantry.name}</h3>
                                    <p className="text-sm text-gray-600">{pantry.description}</p>
                                </li>
                            ))}
                        </ul>
                        {/* Optional: Add a button to create another pantry */}
                        <div className="mt-8">
                            <h3 className="font-bold text-xl mb-4">Create a New Pantry</h3>
                            {/* Render the form component */}
                            <CreatePantryForm userId={user.id} />
                        </div>
                    </div>
                ) : (
                    // --- Render if user DOES NOT HAVE pantries ---
                    <div className="flex flex-col items-center justify-center gap-6 p-8 border rounded-lg text-center">
                        <h2 className="font-bold text-2xl">Welcome! Let's create your first pantry.</h2>
                        <p className="text-lg text-gray-600">It looks like you don't have any pantries yet. Get started by creating one.</p>
                        {/* Render the form component */}
                        <CreatePantryForm userId={user.id} />
                    </div>
                )}
            </div>
        </div>
    );
}