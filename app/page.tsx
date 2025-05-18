import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Utensils } from "lucide-react"

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16 text-center">
            <div className="max-w-3xl space-y-6">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Utensils className="h-12 w-12 text-primary" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Manage your pantry with ease</h1>
                <p className="text-xl text-muted-foreground">
                    Keep track of your pantry items, create shopping lists, and share with family and friends.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/signup">Get Started</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/login">Sign In</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}