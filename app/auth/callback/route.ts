import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (code) {
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

        try {
            await supabase.auth.exchangeCodeForSession(code)
        } catch (error) {
            console.error("Error exchanging code for session:", error)
            // Redirect to error page or login with error parameter
            return NextResponse.redirect(new URL("/login?error=auth_callback_error", request.url))
        }
    }

    // Redirect to the dashboard or home page
    return NextResponse.redirect(new URL("/dashboard", request.url))
}
