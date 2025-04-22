
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("Login error:", error);
    toast({
      variant: "destructive",
      title: "Login failed",
      description: "An unexpected error occurred",
    });
    return { user: null, error };
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

    if (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("Registration error:", error);
    toast({
      variant: "destructive",
      title: "Registration failed",
      description: "An unexpected error occurred",
    });
    return { user: null, error };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast({
      variant: "destructive",
      title: "Sign out failed",
      description: error.message,
    });
  }
  return { error };
}
