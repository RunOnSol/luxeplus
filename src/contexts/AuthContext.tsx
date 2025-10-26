import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { User } from '@supabase/supabase-js';

import {
  Profile,
  supabase,
} from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // const signUp = async (email: string, password: string, fullName: string) => {
  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       data: { fullName },
  //     },
  //   });

  //   if (error) throw error;

  //   if (data.user) {
  //     const { error: profileError } = await supabase.from("profiles").insert({
  //       id: data.user.id,
  //       email,
  //       full_name: fullName,
  //       role: "customer",
  //     });

  //     if (profileError) throw profileError;
  //   }
  // };

  const signUp = async (email: string, password: string, fullName: string) => {
    // normalize inputs
    const cleanEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    if (!cleanEmail || !password)
      throw new Error("Email and password required");
    if (password.length < 6)
      throw new Error("Password must be at least 6 characters");

    console.log("Attempt signUp payload:", {
      email: cleanEmail,
      passwordLength: password.length,
      fullName,
    });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        // keep options if you need user_metadata; it's optional
        options: { data: { fullName } },
      });
      console.log("supabase.auth.signUp SDK result", { data, error });

      if (error) {
        // If SDK gave an error, log it and throw so caller can show UI
        console.error("SDK signUp error object:", error);
        // If it's a 422/other ambiguous error, fetch raw REST response to see server JSON
        if ((error as any).status === 422 || (error as any).status === 400) {
          try {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`;
            const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: anon,
                Authorization: `Bearer ${anon}`,
              },
              body: JSON.stringify({ email: cleanEmail, password }),
            });
            const text = await res.text();
            let parsed;
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = text;
            }
            console.warn("Raw REST signup response", {
              status: res.status,
              body: parsed,
            });
          } catch (restErr) {
            console.warn("Could not fetch raw REST signup response", restErr);
          }
        }
        throw error;
      }

      // If SDK returns user id, create profile; if not, it's likely email-confirmation flow — don't insert profile yet.
      const userId = (data as any)?.user?.id ?? null;
      if (!userId) {
        console.info(
          "Signup succeeded but no user object returned — likely email confirmation required."
        );
        return;
      }

      // upsert profile (safer than insert)
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: cleanEmail,
          full_name: fullName,
          role: "customer",
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile upsert failed", profileError);
        // If this is a 403, give a clear action hint
        if ((profileError as any).status === 403) {
          throw new Error(
            "Permission denied creating profile. Check your RLS INSERT policy for profiles (should allow auth.uid() = id)."
          );
        }
        throw profileError;
      }
    } catch (err: any) {
      console.error("signUp caught error", err);
      // Helpful mapping for common cases
      const msg = err?.message ?? String(err);
      if (
        msg.includes("User already registered") ||
        msg.toLowerCase().includes("already registered")
      ) {
        // attempt to send reset password email (optional)
        try {
          await supabase.auth.resetPasswordForEmail(cleanEmail);
          throw new Error(
            "User already registered. A password reset email has been sent to that address."
          );
        } catch {
          throw new Error(
            'User already registered. Please sign in or use "forgot password".'
          );
        }
      }

      // If it's 422, instruct to paste raw response (we attempted to fetch it above)
      if (err?.status === 422) {
        throw new Error(
          "Signup rejected (422). Open DevTools → Network → auth/v1/signup and paste the Response JSON here."
        );
      }

      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) throw error;
    await loadProfile(user.id);
  };

  const refetchProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
