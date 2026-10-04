import { tokenStorage } from './storage';
import { supabase } from './supabase';
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
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session?.access_token) {
        await tokenStorage.setToken(data.session.access_token);
      }
      let profile: Profile | null = null;
      if (data.user) {
        const { data: prof } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
        profile = prof;
      }
      return { user: data.user, session: data.session, profile };
    }

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
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      return data;
    }

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
      if (supabase) {
        await supabase.auth.signOut();
      } else {
        await fetchWithAuth('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // ignore network errors on logout
    } finally {
      await tokenStorage.removeToken();
    }
  },

  async getProfile(): Promise<{ profile: Profile | null; user: any } | null> {
    try {
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return null;
        const { data: prof } = await supabase.from('users').select('*').eq('id', userData.user.id).maybeSingle();
        return { user: userData.user, profile: prof };
      }
      const res = await fetchWithAuth('/api/auth/me');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAssets(): Promise<Asset[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('assets')
          .select('id,name,asset_code,status,category,description,created_at')
          .order('name');
        if (!error && data) return data as Asset[];
      }
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
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      const { data: reqData, error } = await supabase.from('requests').insert({
        asset_id: data.assetId,
        user_id: userData.user.id,
        purpose: data.purpose,
        requested_from: data.requestedFrom,
        requested_until: data.requestedUntil,
        status: 'PENDING',
      }).select().single();
      if (error) throw error;
      return reqData;
    }

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
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return [];
        const { data, error } = await supabase
          .from('requests')
          .select('*, asset:assets(*)')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        if (!error && data) return data as EquipmentRequest[];
      }
      const res = await fetchWithAuth('/api/requests/my-requests');
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async verifyQrScan(codeData: string) {
    const cleanCode = (codeData || '').trim();
    if (!cleanCode) throw new Error('No barcode or QR code detected.');

    if (supabase) {
      // 1. Lookup asset by code or id
      let { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('id,name,asset_code,status,category,description,created_at')
        .ilike('asset_code', cleanCode)
        .maybeSingle();

      if (!asset && cleanCode.length > 20) {
        const { data: byId } = await supabase
          .from('assets')
          .select('id,name,asset_code,status,category,description,created_at')
          .eq('id', cleanCode)
          .maybeSingle();
        if (byId) asset = byId;
      }

      if (assetError) throw assetError;
      if (!asset) {
        throw new Error(`No equipment matches code "${cleanCode}". Please ensure this asset is registered.`);
      }

      // 2. Check user's active requests for this asset
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return {
          success: true,
          message: `Equipment: ${asset.name} (${asset.asset_code})\nStatus: ${asset.status}`,
          asset,
        };
      }

      const { data: userReq } = await supabase
        .from('requests')
        .select('*')
        .eq('asset_id', asset.id)
        .eq('user_id', userData.user.id)
        .in('status', ['PENDING', 'APPROVED'])
        .maybeSingle();

      if (userReq) {
        if (userReq.status === 'APPROVED' && !userReq.pickup_verified_at) {
          // Verify pickup
          await supabase.rpc('verify_pickup', { p_asset_id: asset.id });
          return {
            success: true,
            message: `Pickup verified for ${asset.name}! Return this equipment by ${new Date(userReq.requested_until).toLocaleDateString()}.`,
            asset,
            request: userReq,
          };
        } else if (userReq.status === 'APPROVED' && userReq.pickup_verified_at) {
          // Return asset
          await supabase.rpc('return_asset', { p_asset_id: asset.id });
          return {
            success: true,
            message: `Equipment "${asset.name}" has been successfully returned!`,
            asset,
            request: userReq,
          };
        } else if (userReq.status === 'PENDING') {
          return {
            success: true,
            message: `Request for ${asset.name} is currently pending admin approval.`,
            asset,
            request: userReq,
          };
        }
      }

      return {
        success: true,
        message: `Equipment: ${asset.name} (${asset.asset_code})\nStatus: ${asset.status}\nCategory: ${asset.category || 'General'}`,
        asset,
      };
    }

    const res = await fetchWithAuth('/api/requests/verify-scan', {
      method: 'POST',
      body: JSON.stringify({ code: cleanCode }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Verification failed');
    return json;
  },
};
