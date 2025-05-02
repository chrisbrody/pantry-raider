// components/manage-pantry-members.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient as createClientComponentClient } from '@/utils/supabase/client';
import { inviteUserToPantry } from '@/app/actions'; // Import the invite Server Action
import { useSupabaseAuth } from '@/context/AuthContext'; // Import your auth context hook

// Assuming you have generated types, otherwise define manually
// type PantryUserWithAuthUser = {
//     role: string;
//     can_edit: boolean;
//     user_id: string;
//     auth_users: { // This is the joined auth.users data
//         email: string;
//     } | null;
// };

interface ManagePantryMembersProps {
    pantryId: string;
    isOwner: boolean; // Passed from the server component
    // Optional: Pass initial members from the server component for faster initial render
    // initialMembers: PantryUserWithAuthUser[];
}

export default function ManagePantryMembers({ pantryId, isOwner /*, initialMembers */ }: ManagePantryMembersProps) {
    // Use a type that includes the joined auth.users data
    const [members, setMembers] = useState<any[]>([]); // Replace 'any[]' with PantryUserWithAuthUser[] if using types
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    const supabase = createClientComponentClient();
    const { user: currentUser } = useSupabaseAuth(); // Get the current logged-in user from context

    // Fetch members when the component mounts or pantryId changes
    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            setError(null);

            // Fetch PantryUsers entries for this pantry, joining with auth.users to get email
            // RLS on pantryusers should ensure the current user can only see members of pantries they belong to.
            const { data, error } = await supabase
                .from('pantryusers')
                .select('*, auth_users:user_id(email)') // Select PantryUsers fields and join auth.users email
                .eq('pantry_id', pantryId); // Filter by the current pantry ID

            if (error) {
                console.error('Error fetching members:', error);
                setError(error.message);
            } else {
                // Filter out the auth_users object if it's null (shouldn't happen with RLS/FK)
                // Also, ensure we only keep members where the join succeeded and email is available
                setMembers(data.filter(member => member.auth_users?.email));
            }

            setLoading(false);
        };

        fetchMembers();

        // Optional: Set up a real-time listener for PantryUsers changes
        // This would automatically update the member list without needing router.refresh()
        // const subscription = supabase
        //     .channel(`pantry_members:${pantryId}`)
        //     .on('postgres_changes', { event: '*', schema: 'public', table: 'pantryusers', filter: `pantry_id=eq.${pantryId}` }, payload => {
        //         console.log('Pantry member change received!', payload);
        //         // Re-fetch members or update state based on payload
        //         fetchMembers(); // Simple re-fetch
        //     })
        //     .subscribe();

        // return () => {
        //     subscription?.unsubscribe();
        // };

    }, [pantryId, supabase]); // Re-run effect if pantryId or supabase client changes

    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError(null);
        setInviteSuccess(null);

        if (!currentUser?.id) {
            setInviteError("You must be logged in to invite members.");
            setInviteLoading(false);
            return;
        }

        // Call the Server Action to invite the user
        const result = await inviteUserToPantry(pantryId, inviteEmail, currentUser.id);

        if (!result.success) {
            setInviteError(result.error);
        } else {
            setInviteSuccess(result.message || 'User invited successfully.');
            setInviteEmail(''); // Clear input
            // The Server Action handles revalidating the path,
            // which will trigger the parent Server Component to re-fetch members.
        }

        setInviteLoading(false);
    };

    // Function to handle removing a member (Owner only)
    // This would also ideally use a Server Action calling an RPC
    const handleRemoveMember = async (userIdToRemove: string) => {
        // Implement remove logic similar to invite, using a Server Action/RPC
        console.log(`Attempting to remove user ${userIdToRemove} from pantry ${pantryId}`);
        alert("Remove member functionality not fully implemented yet."); // Placeholder
        // You would call a removeMember Server Action here
        // const result = await removePantryMember(pantryId, userIdToRemove, currentUser.id);
        // Handle result and revalidatePath
    };

    if (loading) {
        return <p>Loading members...</p>;
    }

    if (error) {
        return <p className="text-red-500">Error loading members: {error}</p>;
    }

    // Filter out the current user from the list if you don't want to show "Hey, you!"
    const membersToShow = members.filter(member => member.user_id !== currentUser?.id);
    // Find the current user's entry to display their role explicitly if needed
    const currentUserEntry = members.find(member => member.user_id === currentUser?.id);


    return (
        <div className="flex flex-col gap-4">
            {/* List of Members */}
            <h4 className="font-semibold mb-2">Current Members</h4>
            <ul>
                {/* Display current user's entry first */}
                {currentUserEntry && (
                    <li key={currentUserEntry.user_id} className="border p-3 mb-2 rounded flex justify-between items-center bg-blue-50">
                         <span>
                             {currentUserEntry.auth_users?.email || 'You'} ({currentUserEntry.role})
                         </span>
                        {/* No remove button for self here */}
                    </li>
                )}
                {membersToShow.map((member) => (
                    <li key={member.user_id} className="border p-3 mb-2 rounded flex justify-between items-center">
                        <span>
                            {member.auth_users?.email || 'Unknown User'} ({member.role})
                        </span>
                        {/* Show remove button only if current user is owner AND it's not the owner's own entry */}
                        {isOwner && member.role !== 'owner' && ( // Owners cannot remove themselves via this button
                            <button
                                onClick={() => handleRemoveMember(member.user_id)}
                                disabled={loading} // Disable if removing is in progress (optional)
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Remove
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {/* Invite Member Form (Owner only) */}
            {isOwner && (
                <div className="mt-4 border-t pt-4">
                    <h4 className="font-semibold mb-2">Invite Member</h4>
                    <form onSubmit={handleInvite} className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Enter email to invite"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                        <button
                            type="submit"
                            disabled={inviteLoading || !inviteEmail}
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {inviteLoading ? 'Inviting...' : 'Invite'}
                        </button>
                    </form>
                    {inviteError && <p className="text-red-500 text-sm mt-2">{inviteError}</p>}
                    {inviteSuccess && <p className="text-green-500 text-sm mt-2">{inviteSuccess}</p>}
                </div>
            )}
        </div>
    );
}