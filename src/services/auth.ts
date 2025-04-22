
import { supabase } from "@/integrations/supabase/client";
// Removed: import { toast } from "@/hooks/use-toast";

export interface AuthError {
  message: string;
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      user: null, 
      error: { 
        message: "An unexpected error occurred during login" 
      } as AuthError 
    };
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    // Removed toast code here, just return error for the caller to handle toast
    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("Registration error:", error);
    // Removed toast code here, just return error for the caller to handle toast
    return { user: null, error: { message: "An unexpected error occurred" } };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  // Removed toast code here as well
  return { error };
}

