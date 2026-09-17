import type { Profile } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const backendAuthClient = {
  async register(data: { email: string; password: string; name?: string }) {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Registration failed");
    return json;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Login failed");
    return json;
  },

  async logout() {
    const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return res.json();
  },

  async getProfile(token?: string): Promise<{ profile: Profile | null; user: any } | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: "GET",
        headers,
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
