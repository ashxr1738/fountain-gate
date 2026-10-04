import { tokenStorage } from './storage';
import type { Asset, EquipmentRequest, Profile } from './types';

// Default backend URL (adjust via EXPO_PUBLIC_BACKEND_URL or local IP for device testing)
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await tokenStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

export const mobileApi = {
  getBackendUrl(): string {
    return BACKEND_URL;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');

    if (json.session?.access_token) {
      await tokenStorage.setToken(json.session.access_token);
    }
    return json;
  },

  async register(email: string, password: string, name?: string) {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  async logout() {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    } finally {
      await tokenStorage.removeToken();
    }
  },

  async getProfile(): Promise<{ profile: Profile | null; user: any } | null> {
    try {
      const res = await fetchWithAuth('/api/auth/me');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAssets(): Promise<Asset[]> {
    try {
      const res = await fetchWithAuth('/api/assets');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async requestEquipment(data: {
    assetId: string;
    purpose: string;
    requestedFrom: string;
    requestedUntil: string;
  }) {
    const res = await fetchWithAuth('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request submission failed');
    return json;
  },

  async getMyRequests(): Promise<EquipmentRequest[]> {
    try {
      const res = await fetchWithAuth('/api/requests/my-requests');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async verifyQrScan(codeData: string) {
    const res = await fetchWithAuth('/api/requests/verify-scan', {
      method: 'POST',
      body: JSON.stringify({ code: codeData }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'QR Verification failed');
    return json;
  },
};
