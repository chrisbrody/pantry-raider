// utils/auth-guard.ts
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Checks if the user is authenticated on the server.
 * If not, redirects to the sign-in page.
 * Returns the user object if authenticated.
 */
export async function protectRoute() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // Use redirect() from next/navigation for server-side redirects
        return redirect("/sign-in");
    }

    return user; // Return the user object if needed by the calling page/layout
}