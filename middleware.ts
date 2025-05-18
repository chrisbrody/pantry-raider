import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client configured for the middleware
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh the session if it exists
  await supabase.auth.getSession()

  return res
}

// Specify which routes should trigger this middleware
export const config = {
  matcher: [
    // Apply this middleware to all routes except static files and api routes that handle their own auth
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
