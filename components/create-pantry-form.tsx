// components/create-pantry-form.tsx
'use client';

import { useState } from 'react';
import { createPantryWithOwner } from '@/app/actions'; // Import the Server Action

interface CreatePantryFormProps {
    userId: string; // Pass the user ID from the server component
}

export default function CreatePantryForm({ userId }: CreatePantryFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const result = await createPantryWithOwner(name, description, userId);

        if (!result.success) {
            setError(result.error);
        } else {
            console.log('Pantry created successfully:', result.pantryId);
            setSuccess(true);
            setName('');
            setDescription('');
            // Server Action handles revalidation
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Pantry Name</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">Pantry created successfully!</p>}
            <button
                type="submit"
                disabled={loading || !name}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Creating...' : 'Create Pantry'}
            </button>
        </form>
    );
}