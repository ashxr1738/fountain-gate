import { createAnonClient, createAdminClient, createUserClient } from "../supabase/client";
import { getSupabaseConfig } from "../supabase/config";
import type { Profile, Role } from "../types";

export class AuthService {
  static isConfigured(): boolean {
    return getSupabaseConfig().isConfigured;
  }

  static async signUp(email: string, password: string, name: string) {
    if (!this.isConfigured()) {
      throw new Error("Supabase is not configured on the backend.");
    }
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  static async signIn(email: string, password: string) {
    if (!this.isConfigured()) {
      throw new Error("Supabase is not configured on the backend.");
    }
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    let profile: Profile | null = null;
    if (data.user) {
      profile = await this.getProfile(data.user.id);
    }

    return {
      session: data.session,
      user: data.user,
      profile,
    };
  }

  static async signOut(accessToken?: string) {
    if (!this.isConfigured()) return;
    if (accessToken) {
      const supabase = createUserClient(accessToken);
      await supabase.auth.signOut();
    }
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    if (!this.isConfigured()) return null;
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Could not fetch profile for user:", userId, error.message);
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  }

  static async verifyToken(accessToken: string) {
    if (!this.isConfigured()) return null;
    const supabase = createUserClient(accessToken);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const profile = await this.getProfile(user.id);
    return { user, profile };
  }

  static isAdmin(role?: Role): boolean {
    return role === "ADMIN" || role === "DEVELOPER";
  }
}
