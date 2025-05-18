"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, error: authError, isConnected } = useAuth()

  // Sync with auth context errors
  useEffect(() => {
    if (authError) {
      setError(authError)
    }
  }, [authError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      console.log("SignupForm: Submitting signup form with email:", email)

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

      if (password.length < 6) {
        setError("Password must be at least 6 characters long")
        setIsLoading(false)
        return
      }

      // Attempt sign up
      await signUp(email, password)

      // If we get here, sign up was successful
      console.log("SignupForm: Sign up successful")
      setSuccess(true)
      setEmail("")
      setPassword("")
    } catch (err: any) {
      console.error("SignupForm: Error during sign up:", err)

      // Format error message for display
      let errorMessage = "Failed to sign up"

      if (err.message) {
        if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("connect")) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else if (err.message.includes("already registered")) {
          errorMessage = "This email is already registered. Try signing in instead."
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
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your email and create a password to get started</CardDescription>
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

        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Check your email for a confirmation link to complete your registration.
            </AlertDescription>
          </Alert>
        ) : (
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading || !isConnected}
              />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !isConnected}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
