// context/AuthContext.tsx
'use client'; // This is a Client Component

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js'; // Import User type
import { createClient } from '@/utils/supabase/client'; // Import the client-side utility

// Define the shape of the context value
interface AuthContextType {
    user: User | null;
    loading: boolean; // Loading state for the initial client-side listener setup
    // You can expose auth methods here if you want to trigger them from components
    // signIn: (options: SignInWithPasswordCredentials) => Promise<AuthResponse>;
    signOut: () => Promise<void>; // Add signOut here
}

// Create the context with a default value (useful for initial state and type inference)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
    children: ReactNode;
    initialUser: User | null; // Prop to receive the user fetched server-side
}

// Step 4: Create Auth Provider Component
export const AuthProvider = ({ children, initialUser }: AuthProviderProps) => {
    // Initialize state with the user passed from the server
    const [user, setUser] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState(true); // Loading state for the listener setup

    // Get the client-side Supabase client
    const supabase = createClient();

    useEffect(() => {
        // Set up the auth state change listener
        // This listener will update the state if the user signs in/out
        // or if the session is refreshed client-side.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            console.log('Session:', session);

            // Update the user state based on the event
            setUser(session?.user ?? null);

            // Once the listener is set up and the initial state is potentially updated
            // by the listener (though initialUser handles the first render),
            // we can set loading to false.
            setLoading(false);
        });

        // Cleanup function for the listener
        return () => {
            subscription?.unsubscribe();
        };
    }, [supabase]); // Re-run effect if supabase client instance changes (unlikely here)

    // Function to handle sign out
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            // Handle error appropriately
        }
        // The onAuthStateChange listener will handle setting user to null
    };

    // The value provided by the context
    const contextValue: AuthContextType = {
        user,
        loading,
        signOut, // Expose the signOut function
        // You could add signIn methods here if you want to manage them via context
        // signIn: supabase.auth.signInWithPassword,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Step 5: Create a Custom Hook
export const useSupabaseAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useSupabaseAuth must be used within an AuthProvider');
    }
    return context;
};