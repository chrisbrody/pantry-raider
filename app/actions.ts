"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from 'next/cache';

interface CreatePantryResult {
  success: boolean;
  error: string | null;
  pantryId?: string;
}

export async function createPantryWithOwner(
    name: string,
    description: string,
    userId: string // Pass the user ID from the component
): Promise<CreatePantryResult> {
  const supabase = await createClient();

  // Call the stored procedure (RPC)
  const { data: newPantryId, error } = await supabase.rpc('create_pantry_with_owner', {
    pantry_name: name,
    pantry_description: description,
    owner_user_id: userId,
  });

  if (error) {
    console.error('Error calling create_pantry_with_owner RPC:', error);
    return { success: false, error: error.message };
  }

  // Revalidate the dashboard path to show the new pantry
  revalidatePath('/dashboard');

  return { success: true, error: null, pantryId: newPantryId as string };
}

interface InviteMemberResult {
  success: boolean;
  error: string | null;
  message?: string;
}

export async function inviteUserToPantry(
    pantryId: string,
    inviteeEmail: string,
    inviterUserId: string // Pass the ID of the user performing the invite
): Promise<InviteMemberResult> {
  const supabase = await createClient();

  // Call the RPC function
  const { data: message, error } = await supabase.rpc('invite_user_to_pantry', {
    pantry_id_input: pantryId,
    invitee_email: inviteeEmail,
    inviter_user_id: inviterUserId,
  });

  if (error) {
    console.error('Error calling invite_user_to_pantry RPC:', error);
    // The RPC raises exceptions with user-friendly messages, return that error message
    return { success: false, error: error.message };
  }

  console.log('Invite RPC success:', message);

  // Revalidate the pantry page path to show the new member in the list
  revalidatePath(`/dashboard/pantries/${pantryId}`);

  return { success: true, error: null, message: message as string };
}

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
