"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, error: authError, isConnected } = useAuth()
  const router = useRouter()

  // Sync with auth context errors
  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log("LoginForm: Submitting login form with email:", email)

      // Check connection status
      if (!isConnected) {
        setError("Unable to connect to authentication service. Please check your internet connection and try again.")
        setIsLoading(false)
        return
      }

      // Basic validation
      if (!email.trim()) {
        setError("Email is required")
        setIsLoading(false)
        return
      }

      if (!password.trim()) {
        setError("Password is required")
        setIsLoading(false)
        return
      }

      // Attempt sign in
      await signIn(email, password)

      // If we get here, sign in was successful
      console.log("LoginForm: Sign in successful, redirecting...")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("LoginForm: Error during sign in:", err)

      // Format error message for display
      let errorMessage = "Failed to sign in"

      if (err.message) {
        if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("connect")) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else if (
          err.message.includes("Invalid login credentials") ||
          err.message.includes("Invalid email or password")
        ) {
          errorMessage = "Invalid email or password"
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your email and password to access your pantries</CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Unable to connect to authentication service. Please check your internet connection.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || !isConnected}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/reset-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || !isConnected}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !isConnected}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
